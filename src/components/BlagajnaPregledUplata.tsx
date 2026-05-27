import { useEffect, useRef, useState } from "react";
import {
  ArrowDownCircle,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface UplataStavka {
  stavka_id: number;
  racun_id: number | null;
  iznos: number;
}

interface Uplata {
  uplata_id: number;
  datum: string;
  id_partnera: number | null;
  ukupan_iznos: number;
  nacin_placanja: string;
  biljeska: string | null;
  id_operatera: number;
  naziv_operatera: string | null;
  stavke: UplataStavka[];
}

const fmtDatum = (dt: string) => {
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

const fmtVrijeme = (dt: string) => {
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const parseDdMmYyyy = (s: string): Date | null => {
  const p = s.split(".");
  if (p.length !== 3 || p[2].length !== 4) return null;
  const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  return isNaN(d.getTime()) ? null : d;
};

const filterInputCls =
  "w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white dark:bg-[#0a1e1c] text-gray-700 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

export function BlagajnaPregledUplata() {
  const [uplate, setUplate] = useState<Uplata[]>([]);
  const [partneriMap, setPartneriMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [prosireni, setProsireni] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState("");
  const [od, setOd] = useState("");
  const [do_, setDo_] = useState("");

  const odPickerRef = useRef<HTMLInputElement>(null);
  const doPickerRef = useRef<HTMLInputElement>(null);

  const ucitaj = async () => {
    setLoading(true);
    try {
      const [resUplate, resPartneri] = await Promise.all([
        fetch(`${API_URL}/api/blagajna/pregled-uplata`, { credentials: "include" }),
        fetch(`${API_URL}/api/partneri`, { credentials: "include" }),
      ]);
      const [dU, dP] = await Promise.all([resUplate.json(), resPartneri.json()]);
      if (dU.success) setUplate(dU.uplate);
      if (dP.success) {
        const pm = new Map<number, string>();
        dP.data.forEach((p: { sifra_partnera: string; naziv_partnera: string }) => {
          pm.set(Number(p.sifra_partnera), p.naziv_partnera);
        });
        setPartneriMap(pm);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { ucitaj(); }, []);

  const toggleProsiren = (id: number) =>
    setProsireni((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = uplate.filter((u) => {
    if (search) {
      const term = search.toLowerCase();
      const ime = u.id_partnera ? (partneriMap.get(u.id_partnera) ?? "").toLowerCase() : "";
      const bilj = (u.biljeska ?? "").toLowerCase();
      if (!ime.includes(term) && !bilj.includes(term)) return false;
    }
    if (od) {
      const odD = parseDdMmYyyy(od);
      if (odD && new Date(u.datum) < odD) return false;
    }
    if (do_) {
      const doD = parseDdMmYyyy(do_);
      if (doD) {
        doD.setHours(23, 59, 59, 999);
        if (new Date(u.datum) > doD) return false;
      }
    }
    return true;
  });

  const ukupnoFiltered = filtered.reduce((s, u) => s + Number(u.ukupan_iznos), 0);
  const hasFilters = search !== "" || od !== "" || do_ !== "";

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-white dark:bg-[#0f2320]"
        style={{ height: "calc(100vh - 150px)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: PRIMARY }} />
          <span className="text-sm text-gray-400 dark:text-[#4a7a74]">Učitavanje uplata...</span>
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
        style={{ background: `${PRIMARY}08` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PRIMARY }}>
            <ClipboardList size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">Pregled uplata</h2>
            <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
              {filtered.length} od {uplate.length} uplata
              {filtered.length > 0 && (
                <span className="ml-2 font-semibold" style={{ color: PRIMARY }}>
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
        style={{ background: `${PRIMARY}04` }}
      >
        {/* Tekst pretraga */}
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Partner ili bilješka..."
            className={filterInputCls + " pl-8"}
          />
        </div>

        {/* Od */}
        <div className="relative w-36 flex-shrink-0">
          <input
            type="text"
            value={od}
            onChange={(e) => setOd(e.target.value)}
            placeholder="Od dd.mm.yyyy"
            maxLength={10}
            className={filterInputCls + " pr-8"}
          />
          <button
            type="button"
            onClick={() => odPickerRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
          >
            <CalendarDays size={13} />
          </button>
          <input
            ref={odPickerRef}
            type="date"
            className="absolute inset-0 opacity-0 pointer-events-none"
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-");
              setOd(`${d}.${m}.${y}`);
            }}
          />
        </div>

        {/* Do */}
        <div className="relative w-36 flex-shrink-0">
          <input
            type="text"
            value={do_}
            onChange={(e) => setDo_(e.target.value)}
            placeholder="Do dd.mm.yyyy"
            maxLength={10}
            className={filterInputCls + " pr-8"}
          />
          <button
            type="button"
            onClick={() => doPickerRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
          >
            <CalendarDays size={13} />
          </button>
          <input
            ref={doPickerRef}
            type="date"
            className="absolute inset-0 opacity-0 pointer-events-none"
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-");
              setDo_(`${d}.${m}.${y}`);
            }}
          />
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
            <ClipboardList size={36} className="mb-3 opacity-10 dark:opacity-5" style={{ color: PRIMARY }} />
            <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
              {uplate.length === 0 ? "Nema unesenih uplata" : "Nema rezultata za zadatu pretragu"}
            </p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {filtered.map((u, idx) => {
              const otvoren = prosireni.has(u.uplata_id);
              const partnerNaziv = u.id_partnera
                ? (partneriMap.get(u.id_partnera) ?? `Partner #${u.id_partnera}`)
                : "—";

              const datumDanas = fmtDatum(u.datum);
              const prethodniDatum = idx > 0 ? fmtDatum(filtered[idx - 1].datum) : null;
              const noviDatum = datumDanas !== prethodniDatum;

              return (
                <li key={u.uplata_id}>
                  {noviDatum && (
                    <div className={`flex items-center gap-3 ${idx === 0 ? "mb-2" : "my-3"}`}>
                      <div className="flex-1 h-px" style={{ background: `${ACCENT}40` }} />
                      <span className="text-[10px] font-semibold tracking-wider px-1" style={{ color: ACCENT }}>
                        {datumDanas}
                      </span>
                      <div className="flex-1 h-px" style={{ background: `${ACCENT}40` }} />
                    </div>
                  )}
                  <div
                    className="rounded-xl overflow-hidden border-2"
                    style={{ borderColor: `${PRIMARY}30` }}
                  >
                  <button
                    onClick={() => toggleProsiren(u.uplata_id)}
                    className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#0d2b27] transition-colors"
                  >
                    {/* Ikona */}
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${PRIMARY}12` }}
                    >
                      <ArrowDownCircle size={15} style={{ color: PRIMARY }} />
                    </div>

                    {/* Datum */}
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                        {fmtDatum(u.datum)}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-[#4a7a74]">
                        {fmtVrijeme(u.datum)}
                      </p>
                    </div>

                    {/* Partner + bilješka */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-[#c5e0db] truncate">
                        {partnerNaziv}
                      </p>
                      {u.biljeska && (
                        <p className="text-[11px] text-gray-400 dark:text-[#4a7a74] truncate">
                          {u.biljeska}
                        </p>
                      )}
                    </div>

                    {/* Stavke badge */}
                    {u.stavke.length > 0 && (
                      <span
                        className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${PRIMARY}15`, color: PRIMARY }}
                      >
                        {u.stavke.length} {u.stavke.length === 1 ? "stavka" : "stavki"}
                      </span>
                    )}

                    {/* Iznos + operater */}
                    <div className="w-32 flex-shrink-0 text-right">
                      <p className="text-base font-bold" style={{ color: PRIMARY }}>
                        {Number(u.ukupan_iznos).toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM
                      </p>
                      {u.naziv_operatera && (
                        <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] truncate">
                          {u.naziv_operatera}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 text-gray-300 dark:text-[#2a5a54] transition-transform duration-200 ${
                        otvoren ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Prošireni — stavke */}
                  {otvoren && (
                    <div
                      className="border-t border-gray-100 dark:border-[#1a3d38] px-5 py-3 space-y-3"
                      style={{ background: `${PRIMARY}04` }}
                    >
                      {/* Stavke */}
                      {u.stavke.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-[#4a7a74] italic">
                          Slobodni iznos — nije vezan uz račun
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74]">
                            Stavke uplate
                          </p>
                          {u.stavke.map((s) => (
                            <div
                              key={s.stavka_id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: `${PRIMARY}08` }}
                            >
                              <span className="text-xs font-semibold text-gray-600 dark:text-[#a8d5cf]">
                                {s.racun_id ? `Račun #${s.racun_id}` : "Slobodni iznos"}
                              </span>
                              <span className="text-xs font-bold" style={{ color: PRIMARY }}>
                                {Number(s.iznos).toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
