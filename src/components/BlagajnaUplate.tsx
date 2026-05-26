import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface Partner {
  sifra_partnera: string;
  naziv_partnera: string;
  adresa_partnera: string;
  Naziv_grada: string;
}

interface RacunPartnera {
  id_racuna: number;
  broj_racuna: string;
  datum_racuna: string;
  ukupno_za_naplatu: number;
  vec_placeno: number;
  ostatak: number;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-1.5">
    {children}
  </label>
);

const todayStr = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")}.${t.getFullYear()}`;
};

interface BlagajnaUplateProps {
  onUplataSuccess?: (iznos: number, partner: string) => void;
}

export function BlagajnaUplate({ onUplataSuccess }: BlagajnaUplateProps) {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchPartneri, setSearchPartneri] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const [racuniPartnera, setRacuniPartnera] = useState<RacunPartnera[]>([]);
  const [loadingRacuni, setLoadingRacuni] = useState(false);

  const [checkedRacuni, setCheckedRacuni] = useState<Set<number>>(new Set());
  const [iznosiMap, setIznosiMap] = useState<Map<number, string>>(new Map());
  const [iznosManual, setIznosManual] = useState("");

  const [datum, setDatum] = useState(todayStr);
  const [biljeska, setBiljeska] = useState("");
  const [slanje, setSlanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/partneri`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setPartneri(data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPartneri = partneri.filter((p) =>
    p.naziv_partnera.toLowerCase().includes(searchPartneri.toLowerCase())
  );

  const loadRacuniPartnera = async (p: Partner) => {
    setLoadingRacuni(true);
    setRacuniPartnera([]);
    setCheckedRacuni(new Set());
    setIznosiMap(new Map());
    setIznosManual("");
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/racuni-partnera/${p.sifra_partnera}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setRacuniPartnera(data.racuni);
    } catch {} finally {
      setLoadingRacuni(false);
    }
  };

  const handleSelectPartner = (p: Partner) => {
    setSelectedPartner(p);
    setSearchPartneri(p.naziv_partnera);
    setDropdownOpen(false);
    loadRacuniPartnera(p);
  };

  const handleResetPartner = () => {
    setSelectedPartner(null);
    setSearchPartneri("");
    setRacuniPartnera([]);
    setCheckedRacuni(new Set());
    setIznosiMap(new Map());
    setIznosManual("");
    setGreska(null);
  };

  const handleToggleRacun = (r: RacunPartnera) => {
    const newChecked = new Set(checkedRacuni);
    const newIznosi = new Map(iznosiMap);
    if (newChecked.has(r.id_racuna)) {
      newChecked.delete(r.id_racuna);
      newIznosi.delete(r.id_racuna);
    } else {
      newChecked.add(r.id_racuna);
      newIznosi.set(r.id_racuna, Number(r.ostatak).toFixed(2));
    }
    setCheckedRacuni(newChecked);
    setIznosiMap(newIznosi);
  };

  const handleIznosChange = (id: number, value: string) => {
    setIznosiMap((prev) => new Map(prev).set(id, value));
  };

  // Manual mode: partner selected, no open invoices → free-form amount
  const isManualMode =
    selectedPartner !== null && !loadingRacuni && racuniPartnera.length === 0;

  const showForm =
    checkedRacuni.size > 0 || isManualMode;

  const ukupnoUplata = isManualMode
    ? parseFloat(iznosManual) || 0
    : Array.from(checkedRacuni).reduce(
        (sum, id) => sum + (parseFloat(iznosiMap.get(id) ?? "0") || 0),
        0
      );

  const formatDatum = (dt: string) => {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const handleSnimi = async () => {
    if (!selectedPartner) return;

    let stavke: { racun_id: number | null; iznos: number }[];

    if (isManualMode) {
      const iznos = parseFloat(iznosManual) || 0;
      if (iznos <= 0) {
        setGreska("Iznos mora biti veći od nule");
        return;
      }
      stavke = [{ racun_id: null, iznos }];
    } else {
      if (checkedRacuni.size === 0) return;
      stavke = Array.from(checkedRacuni).map((id) => ({
        racun_id: id,
        iznos: parseFloat(iznosiMap.get(id) ?? "0") || 0,
      }));
      for (const s of stavke) {
        if (s.iznos <= 0) {
          setGreska("Svi iznosi moraju biti veći od nule");
          return;
        }
        const racun = racuniPartnera.find((r) => r.id_racuna === s.racun_id);
        if (racun && s.iznos > Number(racun.ostatak) + 0.005) {
          setGreska(`Iznos za ${racun.broj_racuna} premašuje ostatak duga (${Number(racun.ostatak).toFixed(2)} KM)`);
          return;
        }
      }
    }

    setSlanje(true);
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/uplata`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPartnera: Number(selectedPartner.sifra_partnera),
          nacinPlacanja: "gotovina",
          datum: (() => {
            const p = datum.split(".");
            return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}T00:00:00` : null;
          })(),
          biljeska: biljeska.slice(0, 254),
          stavke,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setGreska(data.message ?? "Greška pri unosu uplate");
        return;
      }
      const iznosZaObavijest = ukupnoUplata;
      const partnerZaObavijest = selectedPartner.naziv_partnera;
      setBiljeska("");
      setDatum(todayStr());
      setIznosManual("");
      loadRacuniPartnera(selectedPartner);
      onUplataSuccess?.(iznosZaObavijest, partnerZaObavijest);
    } catch {
      setGreska("Greška u komunikaciji sa serverom");
    } finally {
      setSlanje(false);
    }
  };

  const checkedRacuniList = Array.from(checkedRacuni)
    .map((id) => racuniPartnera.find((r) => r.id_racuna === id))
    .filter(Boolean) as RacunPartnera[];

  return (
    <div
      className="flex rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
      style={{ height: "calc(100vh - 150px)" }}
    >
      {/* ── LEFT PANEL (65%) ── */}
      <div className="w-[65%] flex-shrink-0 flex flex-col overflow-hidden border-r-2 border-gray-200 dark:border-[#1e4a44]">

        {/* Partner search */}
        <div
          className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
          style={{ background: `${PRIMARY}06` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Building2 size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-[#e6f4f2]">Partner i otvoreni računi</span>
          </div>

          <div ref={dropdownRef} className="relative">
            {selectedPartner ? (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2"
                style={{ borderColor: `${PRIMARY}40`, background: `${PRIMARY}08` }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: PRIMARY }}
                >
                  <Building2 size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: PRIMARY }}>
                    {selectedPartner.naziv_partnera}
                  </p>
                  {selectedPartner.Naziv_grada && (
                    <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] flex items-center gap-1">
                      <MapPin size={9} />
                      {selectedPartner.Naziv_grada}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleResetPartner}
                  className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchPartneri}
                  onChange={(e) => { setSearchPartneri(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Pretraži ili odaberi partnera..."
                  className={inputCls + " pl-9"}
                />
                {dropdownOpen && filteredPartneri.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#0f2320] rounded-xl border border-gray-100 dark:border-[#1a3d38] shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                    {filteredPartneri.map((p) => (
                      <button
                        key={p.sifra_partnera}
                        onClick={() => handleSelectPartner(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-[#0d2b27] transition-colors border-b border-gray-50 dark:border-[#1a3d38] last:border-0"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-[#c5e0db]">{p.naziv_partnera}</p>
                        {p.Naziv_grada && (
                          <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">{p.Naziv_grada}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Invoices table */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPartner ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ opacity: 0.35 }}>
              <Building2 size={36} className="mb-2" style={{ color: PRIMARY }} />
              <p className="text-sm text-gray-500">Odaberite partnera za prikaz otvorenih računa</p>
            </div>
          ) : loadingRacuni ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={22} className="animate-spin" style={{ color: PRIMARY }} />
            </div>
          ) : racuniPartnera.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ opacity: 0.45 }}>
              <CheckCircle2 size={32} className="mb-2" style={{ color: PRIMARY }} />
              <p className="text-sm text-gray-400 dark:text-[#4a7a74]">Nema otvorenih računa</p>
              <p className="text-xs text-gray-300 dark:text-[#2a5a54] mt-1">Unesite uplatu slobodnim iznosom →</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-[#1a3d38] sticky top-0 z-10 bg-white dark:bg-[#0f2320]">
                  <th className="w-10 pl-4 py-3" />
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Broj računa</th>
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Datum</th>
                  <th className="text-right py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Ukupno</th>
                  <th className="text-right py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Plaćeno</th>
                  <th className="text-right py-3 pr-5 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Ostatak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                {racuniPartnera.map((r) => {
                  const checked = checkedRacuni.has(r.id_racuna);
                  return (
                    <tr
                      key={r.id_racuna}
                      onClick={() => handleToggleRacun(r)}
                      className={`cursor-pointer transition-colors ${
                        checked ? "bg-teal-50 dark:bg-[#0d2b27]" : "hover:bg-gray-50 dark:hover:bg-[#0a1e1c]"
                      }`}
                    >
                      <td className="pl-4 py-3 w-10">
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center"
                          style={{
                            borderColor: checked ? PRIMARY : "#d1d5db",
                            background: checked ? PRIMARY : "transparent",
                          }}
                        >
                          {checked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold" style={{ color: checked ? PRIMARY : undefined }}>
                        {r.broj_racuna}
                      </td>
                      <td className="py-3 px-2 text-gray-500 dark:text-[#4a7a74]">
                        {formatDatum(r.datum_racuna)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-[#a8d5cf]">
                        {Number(r.ukupno_za_naplatu).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-400 dark:text-[#4a7a74]">
                        {Number(r.vec_placeno).toFixed(2)}
                      </td>
                      <td className="py-3 pr-5 text-right font-bold" style={{ color: PRIMARY }}>
                        {Number(r.ostatak).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL (wider, flex-1) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <>
            {/* Right header */}
            <div
              className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
              style={{ background: `${ACCENT}06` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                  <ArrowDownCircle size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-[#e6f4f2]">Detalji uplate</span>
                {checkedRacuni.size > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${ACCENT}20`, color: ACCENT }}
                  >
                    {checkedRacuni.size} račun{checkedRacuni.size === 1 ? "" : "a"}
                  </span>
                )}
                {isManualMode && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${PRIMARY}18`, color: PRIMARY }}
                  >
                    slobodni iznos
                  </span>
                )}
              </div>
            </div>

            {!showForm ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center px-8" style={{ opacity: 0.35 }}>
                <ArrowDownCircle size={32} className="mb-2" style={{ color: ACCENT }} />
                <p className="text-sm text-gray-400">Označite račune s lijeve strane</p>
              </div>
            ) : (
              <>
                {/* Form body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                  {/* Iznosi */}
                  <div>
                    <Label>{isManualMode ? "Iznos uplate" : "Iznosi za uplatu"}</Label>
                    {isManualMode ? (
                      <div className="relative">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={iznosManual}
                          onChange={(e) => setIznosManual(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 pr-10 text-lg font-bold text-right border-2 border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                          KM
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {checkedRacuniList.map((r) => {
                          const iznos = iznosiMap.get(r.id_racuna) ?? "";
                          const overLimit = (parseFloat(iznos) || 0) > Number(r.ostatak) + 0.005;
                          return (
                            <div key={r.id_racuna} className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: PRIMARY }}>
                                  {r.broj_racuna}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
                                  ostatak: {Number(r.ostatak).toFixed(2)} KM
                                </p>
                              </div>
                              <div className="relative w-36 flex-shrink-0">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={iznos}
                                  onChange={(e) => handleIznosChange(r.id_racuna, e.target.value)}
                                  className={`w-full px-2 py-1.5 pr-9 text-sm font-bold text-right border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                    overLimit
                                      ? "border-red-400 focus:ring-red-300"
                                      : "border-gray-200 dark:border-[#1e4a44] focus:ring-teal-500/30"
                                  }`}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                  KM
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ukupno */}
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: `${ACCENT}10`, border: `1.5px solid ${ACCENT}30` }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#4a7a74]">
                      Ukupno:
                    </span>
                    <span className="text-xl font-bold" style={{ color: ACCENT }}>
                      {ukupnoUplata.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                    </span>
                  </div>

                  {/* Datum */}
                  <div>
                    <Label>Datum</Label>
                    <div className="relative">
                      <input
                        type="text"
                        value={datum}
                        onChange={(e) => setDatum(e.target.value)}
                        placeholder="dd.mm.yyyy"
                        maxLength={10}
                        className={inputCls + " pr-9"}
                      />
                      <button
                        type="button"
                        onClick={() => datePickerRef.current?.showPicker()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-[#1a3d38] transition-all"
                        title="Odaberi datum"
                      >
                        <CalendarDays size={15} />
                      </button>
                      <input
                        ref={datePickerRef}
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const [y, m, d] = e.target.value.split("-");
                          setDatum(`${d}.${m}.${y}`);
                        }}
                      />
                    </div>
                  </div>

                  {/* Bilješka */}
                  <div>
                    <Label>Bilješka (opciono)</Label>
                    <textarea
                      value={biljeska}
                      onChange={(e) => setBiljeska(e.target.value.slice(0, 254))}
                      rows={4}
                      placeholder="Napomena uz uplatu..."
                      className={inputCls + " resize-none"}
                    />
                    <p className="text-[10px] text-gray-300 dark:text-[#2a5a54] text-right mt-1">
                      {biljeska.length}/254
                    </p>
                  </div>

                  {/* Greška */}
                  {greska && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">{greska}</p>
                    </div>
                  )}
                </div>

                {/* SNIMI footer */}
                <div className="flex-shrink-0 p-5 border-t border-gray-100 dark:border-[#1a3d38]">
                  <button
                    onClick={handleSnimi}
                    disabled={slanje}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ background: PRIMARY }}
                  >
                    {slanje ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownCircle size={15} />}
                    SNIMI UPLATU
                  </button>
                </div>
              </>
            )}
        </>
      </div>

    </div>
  );
}
