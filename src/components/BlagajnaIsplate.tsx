import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
  CalendarDays,
  Loader2,
  Lock,
  User,
} from "lucide-react";

const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

type Vrsta = "isplata";

interface Nalogodavac {
  id_eksterni: number;
  naziv_radnika: string;
}

interface BlagajnaIsplateProps {
  onIsplataSuccess?: (iznos: number, opis: string) => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-1.5">
    {children}
  </label>
);

const todayStr = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")}.${t.getFullYear()}`;
};

const VRSTA_ISPLATE: Vrsta = "isplata";

export function BlagajnaIsplate({ onIsplataSuccess }: BlagajnaIsplateProps) {
  const [blagajnaOtvorena, setBlagajnaOtvorena] = useState<boolean | null>(null);
  const [blagajnaId, setBlagajnaId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/blagajna/stanje`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setBlagajnaOtvorena(d.success && d.stanje?.status === "otvorena");
        if (d.success && d.stanje?.status === "otvorena") {
          setBlagajnaId(d.stanje.id ?? null);
        }
      })
      .catch(() => setBlagajnaOtvorena(false));
  }, []);

  const [nalogodavci, setNalogodavci] = useState<Nalogodavac[]>([]);
  const [idNalogodavca, setIdNalogodavca] = useState<string>("");
  const [stranka, setStranka] = useState("");
  const [iznos, setIznos] = useState("");
  const [datum, setDatum] = useState(todayStr);
  const [biljeska, setBiljeska] = useState("");
  const [slanje, setSlanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/blagajna/nalogodavci`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setNalogodavci(data.data); })
      .catch(() => {});
  }, []);

  const missingRequiredFields = !idNalogodavca || !stranka.trim();

  useEffect(() => {
    if (!missingRequiredFields && showValidationModal) {
      setShowValidationModal(false);
    }
  }, [missingRequiredFields, showValidationModal]);

  const handleSnimi = async () => {
    if (!idNalogodavca || !stranka.trim()) {
      setValidationMessage("Popunite Nalogodavca i PRIMATELJA prije snimanja.");
      setShowValidationModal(true);
      return;
    }

    const iznosNum = parseFloat(iznos) || 0;
    if (iznosNum <= 0) { setGreska("Iznos mora biti veći od nule"); return; }

    setSlanje(true);
    setGreska(null);
    try {
      const strankaZaSlanje = stranka.trim() || null;

      const res = await fetch(`${API_URL}/api/blagajna/isplata`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vrsta: VRSTA_ISPLATE,
          racunId: null,
          idPartnera: Number(idNalogodavca),
          stranka: strankaZaSlanje,
          iznos: iznosNum,
          datum: (() => {
            const p = datum.split(".");
            return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}T00:00:00` : null;
          })(),
          biljeska: biljeska.slice(0, 254) || null,
          idBlagajne: blagajnaId,
        }),
      });
      const data = await res.json();
      if (!data.success) { setGreska(data.message ?? "Greška pri unosu isplate"); return; }

      const opisZaObavijest = strankaZaSlanje || VRSTA_ISPLATE;
      setIznos("");
      setBiljeska("");
      setDatum(todayStr());
      setStranka("");
      setIdNalogodavca("");
      onIsplataSuccess?.(iznosNum, opisZaObavijest);
    } catch {
      setGreska("Greška u komunikaciji sa serverom");
    } finally {
      setSlanje(false);
    }
  };

  const containerCls = "flex rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]";
  const containerStyle = { height: "calc(100vh - 150px)" };

  if (blagajnaOtvorena === null) {
    return (
      <div className={containerCls} style={containerStyle}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: ACCENT }} />
        </div>
      </div>
    );
  }

  if (!blagajnaOtvorena) {
    return (
      <div className={containerCls} style={containerStyle}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${ACCENT}10` }}>
            <Lock size={24} style={{ color: ACCENT }} />
          </div>
          <p className="text-base font-bold text-gray-700 dark:text-[#c5e0db]">Blagajna je zatvorena</p>
          <p className="text-sm text-gray-400 dark:text-[#4a7a74]">
            Unos isplata nije moguć dok se blagajna ne otvori.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={containerCls}
      style={containerStyle}
    >
      {/* ── LEFT PANEL ── */}
      <div className="w-[35%] flex-shrink-0 flex flex-col overflow-hidden border-r-2 border-gray-200 dark:border-[#1e4a44]">

        {/* Nalogodavac */}
        <div
          className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
          style={{ background: `${ACCENT}06` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
              <ArrowUpCircle size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-[#e6f4f2]">Nalogodavac</span>
          </div>
          <select
            value={idNalogodavca}
            onChange={(e) => setIdNalogodavca(e.target.value)}
            className={inputCls}
          >
            <option value="">Odaberi nalogodavca...</option>
            {nalogodavci.map((n) => (
              <option key={n.id_eksterni} value={String(n.id_eksterni)}>
                {n.naziv_radnika}
              </option>
            ))}
          </select>
        </div>

        {/* Primatelj */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
              <User size={12} style={{ color: ACCENT }} />
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-[#a8d5cf]">PRIMATELJ</span>
          </div>
          <input
            type="text"
            value={stranka}
            onChange={(e) => setStranka(e.target.value)}
            placeholder="Ime ili naziv primatelja..."
            maxLength={254}
            className={inputCls}
          />
          <p className="text-[10px] text-gray-300 dark:text-[#2a5a54] text-right mt-1">
            {stranka.length}/254
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
          style={{ background: `${ACCENT}06` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
              <ArrowUpCircle size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-[#e6f4f2]">Detalji isplate</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${ACCENT}20`, color: ACCENT }}
            >
              Isplata
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Iznos */}
          <div>
            <Label>Iznos isplate</Label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={iznos}
                onChange={(e) => setIznos(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 pr-12 text-xl font-bold text-right border-2 border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ focusRingColor: ACCENT } as React.CSSProperties}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                KM
              </span>
            </div>
            {(parseFloat(iznos) || 0) > 0 && (
              <div
                className="flex items-center justify-between px-4 py-2.5 rounded-xl mt-2"
                style={{ background: `${ACCENT}10`, border: `1.5px solid ${ACCENT}30` }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#4a7a74]">
                  Ukupno:
                </span>
                <span className="text-lg font-bold" style={{ color: ACCENT }}>
                  {(parseFloat(iznos) || 0).toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                </span>
              </div>
            )}
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-[#1a3d38] transition-all"
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
              placeholder="Napomena uz isplatu..."
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
            disabled={slanje || missingRequiredFields}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {slanje ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpCircle size={15} />}
            SNIMI ISPLATU
          </button>
        </div>
      </div>

      {showValidationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#1e4a44] bg-white dark:bg-[#0f2320] shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${ACCENT}14` }}
              >
                <AlertTriangle size={18} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">Obavezna polja</p>
                <p className="text-xs text-gray-500 dark:text-[#9dc8c2] mt-1">{validationMessage}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: ACCENT }}
              >
                U redu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
