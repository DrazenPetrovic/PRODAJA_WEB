import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  Loader2,
  MapPin,
  Package,
  Receipt,
  Search,
  Trash2,
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

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  kolicina_proizvoda: number | null;
  mpc: number | null;
  grupa_proizvoda: number | null;
  Naziv_grupe: string | null;
  vrsta: number | null;
}

interface StavkaRacuna {
  artikal: Artikal;
  kolicina: number;
  mpc: number;
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-1.5">
    {children}
  </label>
);

export function RacunUnos() {
  // ── Partneri ──────────────────────────────────────────────
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [loadingPartneri, setLoadingPartneri] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchPartneri, setSearchPartneri] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const partnerInputRef = useRef<HTMLInputElement>(null);

  // ── Artikli ───────────────────────────────────────────────
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [loadingArtikli, setLoadingArtikli] = useState(true);
  const [searchArtikli, setSearchArtikli] = useState("");

  // ── Stavke računa ─────────────────────────────────────────
  const [stavke, setStavke] = useState<StavkaRacuna[]>([]);

  // ── Unos artikla ──────────────────────────────────────────
  const [odabirArtikla, setOdabirArtikla] = useState<Artikal | null>(null);
  const [unosKolicina, setUnosKolicina] = useState("");
  const [unosMpc, setUnosMpc] = useState("");
  const kolicnaRef = useRef<HTMLInputElement>(null);

  // ── Fetch partneri ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/partneri`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPartneri(d.data); })
      .finally(() => setLoadingPartneri(false));
  }, []);

  // ── Fetch artikli ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/artikli`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setArtikli(d.data); })
      .finally(() => setLoadingArtikli(false));
  }, []);

  // ── Zatvori partner dropdown klikom vani ──────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchPartneri("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Fokus na količinu kad se odabere artikal ──────────────
  useEffect(() => {
    if (!odabirArtikla) return;
    const postojeca = stavke.find((s) => s.artikal.sifra_proizvoda === odabirArtikla.sifra_proizvoda);
    setUnosKolicina(postojeca ? String(postojeca.kolicina) : "");
    setUnosMpc(postojeca ? String(postojeca.mpc) : String(odabirArtikla.mpc ?? ""));
    setTimeout(() => kolicnaRef.current?.focus(), 50);
  }, [odabirArtikla]);

  // ── Escape ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOdabirArtikla(null);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Partner helpers ───────────────────────────────────────
  const filteredPartneri = partneri.filter((p) => {
    const q = searchPartneri.toLowerCase();
    return (
      p.naziv_partnera.toLowerCase().includes(q) ||
      p.sifra_partnera.toLowerCase().includes(q) ||
      (p.Naziv_grada ?? "").toLowerCase().includes(q)
    );
  });

  const handleSelectPartner = (p: Partner) => {
    setSelectedPartner(p);
    setDropdownOpen(false);
    setSearchPartneri("");
  };

  const handleClearPartner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartner(null);
    setSearchPartneri("");
    setStavke([]);
    setOdabirArtikla(null);
  };

  // ── Artikli helpers ───────────────────────────────────────
  const artikliFiltrirani = artikli.filter((a) => {
    const q = searchArtikli.toLowerCase();
    return (
      a.naziv_proizvoda.toLowerCase().includes(q) ||
      String(a.sifra_proizvoda).includes(q) ||
      (a.Naziv_grupe ?? "").toLowerCase().includes(q)
    );
  });

  const klikniArtkal = (a: Artikal) => {
    if (odabirArtikla?.sifra_proizvoda === a.sifra_proizvoda) {
      setOdabirArtikla(null);
    } else {
      setOdabirArtikla(a);
    }
  };

  // ── Unos stavke ───────────────────────────────────────────
  const potvrdiUnos = () => {
    if (!odabirArtikla) return;
    const kol = parseFloat(unosKolicina.replace(",", "."));
    if (isNaN(kol) || kol <= 0) return;
    const mpc = parseFloat(unosMpc.replace(",", "."));
    setStavke((prev) => {
      const idx = prev.findIndex((s) => s.artikal.sifra_proizvoda === odabirArtikla.sifra_proizvoda);
      const nova: StavkaRacuna = { artikal: odabirArtikla, kolicina: kol, mpc: isNaN(mpc) ? 0 : mpc };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = nova;
        return updated;
      }
      return [...prev, nova];
    });
    setOdabirArtikla(null);
  };

  const ukloniStavku = (sifra: number) =>
    setStavke((prev) => prev.filter((s) => s.artikal.sifra_proizvoda !== sifra));

  const ukupno = stavke.reduce((s, x) => s + x.kolicina * x.mpc, 0);

  // ─────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
      style={{ height: "calc(100vh - 128px)" }}
    >
      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LIJEVA KOLONA — Lista artikala ────────────────── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-gray-100 dark:border-[#1a3d38]">
          <div className="flex-shrink-0 p-3 border-b border-gray-100 dark:border-[#1a3d38]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchArtikli}
                onChange={(e) => setSearchArtikli(e.target.value)}
                className={`${inputCls} pl-9`}
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e) => (e.target.style.borderColor = "")}
              />
            </div>
            {!loadingArtikli && (
              <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] mt-1.5 px-1">
                {searchArtikli ? `${artikliFiltrirani.length} rezultata` : `${artikli.length} artikala`}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingArtikli ? (
              <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin" style={{ color: PRIMARY }} />
                <span className="text-xs">Učitavanje...</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                {artikliFiltrirani.map((a) => {
                  const jOdabran = odabirArtikla?.sifra_proizvoda === a.sifra_proizvoda;
                  const jUStavkama = stavke.some((s) => s.artikal.sifra_proizvoda === a.sifra_proizvoda);
                  return (
                    <li key={a.sifra_proizvoda}>
                      <button
                        onClick={() => klikniArtkal(a)}
                        className="w-full text-left px-4 py-3 transition-all hover:bg-teal-50 dark:hover:bg-[#1a3d38]"
                        style={
                          jOdabran
                            ? { background: `${PRIMARY}15`, borderLeft: `3px solid ${PRIMARY}` }
                            : jUStavkama
                            ? { background: `${ACCENT}0a`, borderLeft: `3px solid ${ACCENT}55` }
                            : { borderLeft: "3px solid transparent" }
                        }
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: jOdabran ? PRIMARY : jUStavkama ? ACCENT : "#9ca3af" }}
                            >
                              {a.sifra_proizvoda}
                              {a.Naziv_grupe && <span className="ml-1 font-normal normal-case">· {a.Naziv_grupe}</span>}
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2] leading-snug mt-0.5 truncate">
                              {a.naziv_proizvoda}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-gray-400 dark:text-[#4a7a74]">{a.jm}</span>
                              {a.mpc != null && (
                                <span className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                                  {Number(a.mpc).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          {jUStavkama && !jOdabran && (
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 mt-1 flex items-center justify-center"
                              style={{ background: ACCENT }}
                            >
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── CENTRALNI DIO ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Partner sekcija — uvijek vidljiva na vrhu */}
          <div
            className="flex-shrink-0 flex justify-center items-center px-6 py-4 border-b border-gray-100 dark:border-[#1a3d38]"
            ref={dropdownRef}
          >
            {selectedPartner ? (
              /* ── Partner kartica ─────────────────────────── */
              <div
                className="flex items-center gap-4 px-5 py-3 rounded-2xl cursor-pointer transition-all hover:shadow-md"
                style={{ background: `${PRIMARY}10`, border: `2px solid ${PRIMARY}30` }}
                onClick={() => { setDropdownOpen(true); setTimeout(() => partnerInputRef.current?.focus(), 50); }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: PRIMARY }}
                >
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="text-center min-w-0">
                  <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                    {selectedPartner.naziv_partnera}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <MapPin size={11} style={{ color: PRIMARY }} className="opacity-60 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-[#4a7a74]">{selectedPartner.Naziv_grada}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearPartner}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                >
                  <X size={14} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute z-50 top-[calc(100%+8px)] left-1/2 -translate-x-1/2 rounded-xl border border-gray-200 dark:border-[#1e4a44] shadow-2xl bg-white dark:bg-[#0f2320] overflow-hidden"
                    style={{ width: 380 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-[#1a3d38]">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          ref={partnerInputRef}
                          type="text"
                          value={searchPartneri}
                          onChange={(e) => setSearchPartneri(e.target.value)}
                          placeholder="Pretraži..."
                          className={`${inputCls} pl-8`}
                          onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                          onBlur={(e) => (e.target.style.borderColor = "")}
                        />
                      </div>
                    </div>
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {filteredPartneri.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-gray-400 dark:text-[#4a7a74]">Nema rezultata</li>
                      ) : filteredPartneri.map((p) => (
                        <li key={p.sifra_partnera}>
                          <button
                            onClick={() => handleSelectPartner(p)}
                            className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-[#1a3d38] transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2]">{p.naziv_partnera}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                              <p className="text-[11px] text-gray-400 truncate">
                                {[p.adresa_partnera, p.Naziv_grada].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* ── Combobox za odabir partnera ─────────────── */
              <div className="relative" ref={undefined} style={{ width: 380 }}>
                <button
                  onClick={() => { setDropdownOpen(true); setTimeout(() => partnerInputRef.current?.focus(), 50); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left bg-white dark:bg-[#0a1e1c]"
                  style={{ borderColor: dropdownOpen ? PRIMARY : "#e5e7eb" }}
                >
                  <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-400 dark:text-[#4a7a74]">
                    {loadingPartneri ? "Učitavanje partnera..." : "Odaberi partnera..."}
                  </span>
                  <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 rounded-xl border border-gray-200 dark:border-[#1e4a44] shadow-2xl bg-white dark:bg-[#0f2320] overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-[#1a3d38]">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          ref={partnerInputRef}
                          type="text"
                          value={searchPartneri}
                          onChange={(e) => setSearchPartneri(e.target.value)}
                          placeholder="Pretraži..."
                          className={`${inputCls} pl-8`}
                          onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                          onBlur={(e) => (e.target.style.borderColor = "")}
                        />
                      </div>
                    </div>
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {filteredPartneri.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-gray-400">Nema rezultata</li>
                      ) : filteredPartneri.map((p) => (
                        <li key={p.sifra_partnera}>
                          <button
                            onClick={() => handleSelectPartner(p)}
                            className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-[#1a3d38] transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2]">{p.naziv_partnera}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                              <p className="text-[11px] text-gray-400 truncate">
                                {[p.adresa_partnera, p.Naziv_grada].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sadržaj — unos ili stavke */}
          <div className="flex-1 overflow-y-auto">
            {odabirArtikla ? (
              /* ── Forma za unos količine i MPC ────────────── */
              <div className="flex items-center justify-center p-8 min-h-full">
                <div className="w-full max-w-sm">
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold mb-1" style={{ color: PRIMARY }}>
                      {odabirArtikla.sifra_proizvoda}
                      {odabirArtikla.Naziv_grupe && (
                        <span className="text-gray-400 ml-2 font-normal">· {odabirArtikla.Naziv_grupe}</span>
                      )}
                    </p>
                    <h3 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2] leading-snug mb-4">
                      {odabirArtikla.naziv_proizvoda}
                    </h3>
                    <div className="flex gap-2">
                      <div
                        className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center"
                        style={{ background: `${PRIMARY}12` }}
                      >
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#4a7a74] mb-0.5">JM</span>
                        <span className="text-sm font-bold" style={{ color: PRIMARY }}>{odabirArtikla.jm}</span>
                      </div>
                      <div
                        className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center"
                        style={{ background: `${ACCENT}12` }}
                      >
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#4a7a74] mb-0.5">MPC cijena</span>
                        <span className="text-sm font-bold" style={{ color: ACCENT }}>
                          {odabirArtikla.mpc != null ? Number(odabirArtikla.mpc).toFixed(2) : "—"} KM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label>Količina ({odabirArtikla.jm})</Label>
                    <input
                      ref={kolicnaRef}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unosKolicina}
                      onChange={(e) => setUnosKolicina(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") potvrdiUnos();
                        if (e.key === "Escape") setOdabirArtikla(null);
                      }}
                      className={`${inputCls} text-center text-lg font-bold`}
                      style={{ borderColor: PRIMARY, borderWidth: 2 }}
                    />
                  </div>

                  <div className="mb-5">
                    <Label>MPC (KM)</Label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unosMpc}
                      onChange={(e) => setUnosMpc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") potvrdiUnos();
                        if (e.key === "Escape") setOdabirArtikla(null);
                      }}
                      className={`${inputCls} text-center text-lg font-bold`}
                      style={{ borderColor: ACCENT, borderWidth: 2, color: ACCENT }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setOdabirArtikla(null)}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Odustani
                    </button>
                    <button
                      onClick={potvrdiUnos}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:brightness-110"
                      style={{ background: PRIMARY }}
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              </div>
            ) : stavke.length === 0 ? (
              /* ── Placeholder ──────────────────────────────── */
              <div className="flex items-center justify-center h-full text-center px-8">
                {selectedPartner ? (
                  <div>
                    <Package size={32} className="mx-auto mb-3 opacity-20 dark:opacity-10" style={{ color: PRIMARY }} />
                    <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
                      Kliknite na artikal iz liste za dodavanje
                    </p>
                  </div>
                ) : (
                  <div>
                    <Building2 size={36} className="mx-auto mb-3 opacity-10 dark:opacity-5 text-gray-600" />
                    <p className="text-sm text-gray-300 dark:text-[#2a5a54]">Odaberite partnera za početak</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Lista stavki ─────────────────────────────── */
              <div className="p-5 space-y-3">
                {stavke.map((s) => (
                  <div
                    key={s.artikal.sifra_proizvoda}
                    className="rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-gray-50 dark:bg-[#0d2b27] overflow-hidden"
                  >
                    <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-[10px] font-bold font-mono block"
                          style={{ color: PRIMARY }}
                        >
                          {s.artikal.sifra_proizvoda}
                        </span>
                        <p className="text-sm font-bold leading-snug text-gray-800 dark:text-[#e6f4f2]">
                          {s.artikal.naziv_proizvoda}
                        </p>
                      </div>
                      <button
                        onClick={() => ukloniStavku(s.artikal.sifra_proizvoda)}
                        className="flex-shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="px-4 pb-3 flex items-center justify-between gap-3">
                      <div className="flex gap-2 text-[11px]">
                        <div className="rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f2320] border border-gray-100 dark:border-[#1a3d38]">
                          <span className="text-gray-400">Kol. </span>
                          <span className="font-bold" style={{ color: PRIMARY }}>
                            {s.kolicina} {s.artikal.jm}
                          </span>
                        </div>
                        <div className="rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f2320] border border-gray-100 dark:border-[#1a3d38]">
                          <span className="text-gray-400">MPC </span>
                          <span className="font-bold" style={{ color: ACCENT }}>
                            {s.mpc.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: ACCENT }}>
                        {(s.kolicina * s.mpc).toFixed(2)} KM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DONJA TRAKA ───────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center px-6 py-3 border-t-2"
        style={{ borderColor: `${PRIMARY}40`, background: "rgba(15,118,110,0.04)" }}
      >
        <div className="flex-1" />
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74]">
            Ukupno
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: ukupno > 0 ? ACCENT : "#d1d5db" }}
          >
            {ukupno > 0
              ? ukupno.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " KM"
              : "—"}
          </span>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            disabled={stavke.length === 0 || !selectedPartner}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: PRIMARY }}
          >
            <Receipt size={15} />
            NAPRAVI RAČUN
          </button>
        </div>
      </div>
    </div>
  );
}
