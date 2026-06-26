import { useEffect, useRef, useState } from "react";
import {
  ArrowUpCircle,
  CalendarDays,
  ClipboardList,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

type Vrsta = "refundacija" | "trosak" | "isplata";

interface Isplata {
  isplata_id: number;
  vrsta: Vrsta;
  datum: string;
  id_partnera: number | null;
  stranka: string | null;
  racun_id: number | null;
  iznos: number;
  nacin_placanja: string;
  biljeska: string | null;
  id_operatera: number;
  naziv_operatera: string | null;
  id_blagajne: number | null;
}

const fmtDatum = (dt: string) => {
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};


const parseDdMmYyyy = (s: string): Date | null => {
  const p = s.split(".");
  if (p.length !== 3 || p[2].length !== 4) return null;
  const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  return isNaN(d.getTime()) ? null : d;
};

const VRSTA_CONFIG: Record<Vrsta, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  refundacija: { label: "Refundacija", icon: <RefreshCw size={11} />, color: ACCENT,   bg: `${ACCENT}18`   },
  trosak:      { label: "Trošak",      icon: <Receipt size={11} />,    color: PRIMARY,  bg: `${PRIMARY}15`  },
  isplata:     { label: "Isplata",     icon: <ArrowUpCircle size={11} />, color: "#6b7280", bg: "#6b728018" },
};

const filterInputCls =
  "w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white dark:bg-[#0a1e1c] text-gray-700 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

export function BlagajnaPregledIsplata() {
  const [isplate, setIsplate] = useState<Isplata[]>([]);
  const [nalogodavciMap, setNalogodavciMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [od, setOd] = useState("");
  const [do_, setDo_] = useState("");

  const odPickerRef = useRef<HTMLInputElement>(null);
  const doPickerRef = useRef<HTMLInputElement>(null);

  const ucitaj = async () => {
    setLoading(true);
    try {
      const [resIsplate, resNalogodavci] = await Promise.all([
        fetch(`${API_URL}/api/blagajna/pregled-isplata`, { credentials: "include" }),
        fetch(`${API_URL}/api/blagajna/nalogodavci`, { credentials: "include" }),
      ]);
      const [dI, dN] = await Promise.all([resIsplate.json(), resNalogodavci.json()]);
      if (dI.success) setIsplate(dI.isplate);
      if (dN.success) {
        const nm = new Map<number, string>();
        dN.data.forEach((n: { id_eksterni: number; naziv_radnika: string }) => {
          nm.set(Number(n.id_eksterni), n.naziv_radnika);
        });
        setNalogodavciMap(nm);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { ucitaj(); }, []);

  const strankaLabel = (i: Isplata) => {
    if (i.id_partnera && nalogodavciMap.has(i.id_partnera))
      return nalogodavciMap.get(i.id_partnera)!;
    return i.stranka ?? "—";
  };

  const filtered = isplate.filter((i) => {
    if (search) {
      const term = search.toLowerCase();
      const ime = strankaLabel(i).toLowerCase();
      const bilj = (i.biljeska ?? "").toLowerCase();
      if (!ime.includes(term) && !bilj.includes(term)) return false;
    }
    if (od) {
      const odD = parseDdMmYyyy(od);
      if (odD && new Date(i.datum) < odD) return false;
    }
    if (do_) {
      const doD = parseDdMmYyyy(do_);
      if (doD) {
        doD.setHours(23, 59, 59, 999);
        if (new Date(i.datum) > doD) return false;
      }
    }
    return true;
  });

  const ukupnoFiltered = filtered.reduce((s, i) => s + Number(i.iznos), 0);
  const hasFilters = search !== "" || od !== "" || do_ !== "";

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-white dark:bg-[#0f2320]"
        style={{ height: "calc(100vh - 150px)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: ACCENT }} />
          <span className="text-sm text-gray-400 dark:text-[#4a7a74]">Učitavanje isplata...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
      style={{ height: "calc(100vh - 150px)" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
        style={{ background: `${ACCENT}08` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: ACCENT }}>
            <ClipboardList size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">Pregled isplata</h2>
            <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
              {filtered.length} od {isplate.length} isplata
              {filtered.length > 0 && (
                <span className="ml-2 font-semibold" style={{ color: ACCENT }}>
                  · {ukupnoFiltered.toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={ucitaj}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-500 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
        >
          <RotateCcw size={12} />
          Osvježi
        </button>
      </div>

      {/* Filteri */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-[#1a3d38]"
        style={{ background: `${ACCENT}04` }}
      >
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Stranka, partner ili bilješka..."
            className={filterInputCls + " pl-8"}
          />
        </div>

        <div className="relative w-36 flex-shrink-0">
          <input
            type="text"
            value={od}
            onChange={(e) => setOd(e.target.value)}
            placeholder="Od dd.mm.yyyy"
            maxLength={10}
            className={filterInputCls + " pr-8"}
          />
          <button type="button" onClick={() => odPickerRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
            <CalendarDays size={13} />
          </button>
          <input ref={odPickerRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none"
            onChange={(e) => { if (!e.target.value) return; const [y, m, d] = e.target.value.split("-"); setOd(`${d}.${m}.${y}`); }} />
        </div>

        <div className="relative w-36 flex-shrink-0">
          <input
            type="text"
            value={do_}
            onChange={(e) => setDo_(e.target.value)}
            placeholder="Do dd.mm.yyyy"
            maxLength={10}
            className={filterInputCls + " pr-8"}
          />
          <button type="button" onClick={() => doPickerRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
            <CalendarDays size={13} />
          </button>
          <input ref={doPickerRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none"
            onChange={(e) => { if (!e.target.value) return; const [y, m, d] = e.target.value.split("-"); setDo_(`${d}.${m}.${y}`); }} />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setOd(""); setDo_(""); }}
            className="flex-shrink-0 px-2 py-1.5 rounded-xl text-xs text-gray-400 hover:text-gray-600 dark:hover:text-[#a8d5cf] hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all"
          >
            Očisti
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <ClipboardList size={36} className="mb-3 opacity-10 dark:opacity-5" style={{ color: ACCENT }} />
            <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
              {isplate.length === 0 ? "Nema unesenih isplata" : "Nema rezultata za zadatu pretragu"}
            </p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {filtered.map((i, idx) => {
              const datumDanas = fmtDatum(i.datum);
              const prethodniDatum = idx > 0 ? fmtDatum(filtered[idx - 1].datum) : null;
              const noviDatum = datumDanas !== prethodniDatum;
              const cfg = VRSTA_CONFIG[i.vrsta] ?? VRSTA_CONFIG.isplata;

              return (
                <li key={i.isplata_id}>
                  {noviDatum && (
                    <div className={`flex items-center gap-3 ${idx === 0 ? "mb-2" : "my-3"}`}>
                      <div className="flex-1 h-0.5 rounded-full" style={{ background: `${PRIMARY}70` }} />
                      <span className="text-sm font-bold tracking-wider px-2" style={{ color: PRIMARY }}>
                        {datumDanas}
                      </span>
                      <div className="flex-1 h-0.5 rounded-full" style={{ background: `${PRIMARY}70` }} />
                    </div>
                  )}
                  <div
                    className="relative rounded-xl overflow-hidden border-2 px-5 py-3.5 flex items-center gap-4"
                    style={{ borderColor: `${ACCENT}30` }}
                  >
                    {/* Ikona */}
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${ACCENT}12` }}
                    >
                      <ArrowUpCircle size={15} style={{ color: ACCENT }} />
                    </div>

                    {/* Datum + vrsta badge */}
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: ACCENT }}>
                        {fmtDatum(i.datum)}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    {/* Stranka + bilješka */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-700 dark:text-[#c5e0db] truncate">
                        {strankaLabel(i)}
                      </p>
                      {i.biljeska && (
                        <p className="text-[12px] text-gray-400 dark:text-[#4a7a74] truncate mt-0.5">
                          {i.biljeska}
                        </p>
                      )}
                    </div>

                    {/* Blagajna */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center">
                      <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] uppercase tracking-wide">Blagajna</p>
                      <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                        {i.id_blagajne != null ? `#${i.id_blagajne}` : "—"}
                      </p>
                    </div>

                    {/* Iznos + operater */}
                    <div className="w-32 flex-shrink-0 text-right">
                      <p className="text-base font-bold" style={{ color: ACCENT }}>
                        {Number(i.iznos).toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM
                      </p>
                      {i.naziv_operatera && (
                        <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] truncate">
                          {i.naziv_operatera}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
