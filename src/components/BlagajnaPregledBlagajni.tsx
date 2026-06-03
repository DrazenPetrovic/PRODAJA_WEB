import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Landmark,
  Loader2,
  Lock,
  LockOpen,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface BlagajnaSesija {
  id: number;
  datum_otvaranja: string;
  datum_zatvaranja: string | null;
  pocetak_gotovine: number;
  kraj_gotovine_obracun: number | null;
  kraj_gotovine_stvarno: number | null;
  razlika: number | null;
  status: "otvorena" | "zatvorena";
  naziv_operatera_otvaranje: string | null;
  naziv_operatera_zatvaranje: string | null;
  uplate_gotovina: number;
  uplate_kartica: number;
  uplate_prenos: number;
  uplate_ukupno: number;
  isplate_ukupno: number;
  isplate_refundacija: number;
  isplate_trosak: number;
  isplate_isplata: number;
  saldo_gotovine: number;
}

interface UplataDetalj {
  id: number;
  datum: string;
  ukupan_iznos: number;
  nacin_placanja: string;
  biljeska: string | null;
  id_partnera: number | null;
  id_operatera: number;
}

interface IsplataDetalj {
  id: number;
  datum: string;
  iznos: number;
  vrsta: string;
  nacin_placanja: string | null;
  stranka: string | null;
  id_partnera: number | null;
  biljeska: string | null;
  racun_id: number | null;
  id_operatera: number;
}

interface Detalj {
  blagajna: BlagajnaSesija | null;
  uplate: UplataDetalj[];
  isplate: IsplataDetalj[];
}

const fmtDatum = (dt: string) => {
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};
const fmtVrijeme = (dt: string) => {
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const fmtKM = (n: number) =>
  Number(n).toLocaleString("bs-BA", { minimumFractionDigits: 2 }) + " KM";

const RazlikaChip = ({ razlika }: { razlika: number | null }) => {
  if (razlika === null) return <span className="text-gray-300 dark:text-[#2a5a54]">—</span>;
  const r = Number(razlika);
  const color = Math.abs(r) < 0.01 ? "#16a34a" : r > 0 ? "#2563eb" : ACCENT;
  const Icon = Math.abs(r) < 0.01 ? CheckCircle2 : r > 0 ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center justify-end gap-1">
      <Icon size={12} style={{ color }} />
      <span className="font-bold tabular-nums" style={{ color }}>
        {r >= 0 ? "+" : ""}{fmtKM(r)}
      </span>
    </div>
  );
};

export function BlagajnaPregledBlagajni() {
  const [sesije, setSesije] = useState<BlagajnaSesija[]>([]);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalj, setDetalj] = useState<Detalj | null>(null);
  const [loadingDetalj, setLoadingDetalj] = useState(false);

  const ucitajListu = async () => {
    setLoading(true);
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/pregled-blagajni`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setSesije(d.blagajne ?? []);
      else setGreska(d.message ?? "Greška pri učitavanju");
    } catch {
      setGreska("Greška u komunikaciji sa serverom");
    } finally {
      setLoading(false);
    }
  };

  const ucitajDetalj = async (id: number) => {
    setSelectedId(id);
    setLoadingDetalj(true);
    setDetalj(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/pregled-blagajni/${id}`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setDetalj({ blagajna: d.blagajna, uplate: d.uplate, isplate: d.isplate });
    } finally {
      setLoadingDetalj(false);
    }
  };

  useEffect(() => { ucitajListu(); }, []);

  return (
    <div
      className="flex rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
      style={{ height: "calc(100vh - 150px)" }}
    >
      {/* ── LISTA (lijevo) ── */}
      <div className="flex flex-col w-[55%] flex-shrink-0 border-r-2 border-gray-200 dark:border-[#1e4a44] overflow-hidden">
        {/* Naziv + header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-[#e6f4f2]">Pregled blagajni</h1>
        </div>
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
          style={{ background: `${PRIMARY}08` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Landmark size={13} className="text-white" />
            </div>
            <span className="text-xs text-gray-400 dark:text-[#4a7a74]">
              {loading ? "Učitavanje..." : `${sesije.length} sesija`}
            </span>
          </div>
          <button
            onClick={ucitajListu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-500 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
          >
            <RotateCcw size={12} />
            Osvježi
          </button>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={26} className="animate-spin" style={{ color: PRIMARY }} />
              <span className="text-sm text-gray-400 dark:text-[#4a7a74]">Učitavanje...</span>
            </div>
          ) : greska ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-500">{greska}</p>
            </div>
          ) : sesije.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <Landmark size={36} style={{ color: PRIMARY }} />
              <p className="text-sm text-gray-500">Nema evidentiranih sesija</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-[#1a3d38] sticky top-0 z-10 bg-white dark:bg-[#0f2320]">
                  <th className="text-left py-3 pl-5 w-10 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">#</th>
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Otvorena</th>
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Zatvorena</th>
                  <th className="text-right py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Saldo</th>
                  <th className="text-right py-3 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Razlika</th>
                  <th className="text-center py-3 pr-4 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                {sesije.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => ucitajDetalj(s.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === s.id
                        ? "bg-teal-50 dark:bg-[#0d2b27]"
                        : "hover:bg-gray-50 dark:hover:bg-[#0a1e1c]"
                    }`}
                  >
                    <td className="py-3 pl-5 font-bold text-gray-400 dark:text-[#4a7a74]">{s.id}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-[#a8d5cf]">
                      <p className="font-semibold">{fmtDatum(s.datum_otvaranja)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
                        {fmtVrijeme(s.datum_otvaranja)}
                        {s.naziv_operatera_otvaranje && <> · {s.naziv_operatera_otvaranje}</>}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-[#a8d5cf]">
                      {s.datum_zatvaranja ? (
                        <>
                          <p className="font-semibold">{fmtDatum(s.datum_zatvaranja)}</p>
                          <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
                            {fmtVrijeme(s.datum_zatvaranja)}
                            {s.naziv_operatera_zatvaranje && <> · {s.naziv_operatera_zatvaranje}</>}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-300 dark:text-[#2a5a54]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-bold" style={{ color: PRIMARY }}>
                      {fmtKM(Number(s.saldo_gotovine))}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <RazlikaChip razlika={s.razlika} />
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={
                          s.status === "otvorena"
                            ? { background: "#dcfce7", color: "#16a34a" }
                            : { background: "#f3f4f6", color: "#6b7280" }
                        }
                      >
                        {s.status === "otvorena" ? <LockOpen size={9} /> : <Lock size={9} />}
                        {s.status === "otvorena" ? "OTVORENA" : "ZATVORENA"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── DETALJ (desno) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
          style={{ background: `${PRIMARY}06` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Wallet size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-[#e6f4f2]">
              {detalj ? `Detalj blagajne #${detalj.blagajna?.id}` : "Detalj sesije"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!selectedId && !loadingDetalj ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-35">
              <Wallet size={36} style={{ color: PRIMARY }} />
              <p className="text-sm text-gray-500">Odaberite sesiju s lijeve strane</p>
            </div>
          ) : loadingDetalj ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: PRIMARY }} />
            </div>
          ) : detalj ? (
            <div className="space-y-5">
              {/* Obračun */}
              <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] px-4 py-3">
                <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: PRIMARY }}>
                  Obračun
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Početak gotovine</span>
                    <span className="font-semibold">{fmtKM(Number(detalj.blagajna?.pocetak_gotovine))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Saldo gotovine</span>
                    <span className="font-bold" style={{ color: PRIMARY }}>{fmtKM(Number(detalj.blagajna?.saldo_gotovine))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Trebalo biti</span>
                    <span className="font-semibold">{detalj.blagajna?.kraj_gotovine_obracun !== null ? fmtKM(Number(detalj.blagajna?.kraj_gotovine_obracun)) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Prebrojano</span>
                    <span className="font-semibold">{detalj.blagajna?.kraj_gotovine_stvarno !== null ? fmtKM(Number(detalj.blagajna?.kraj_gotovine_stvarno)) : "—"}</span>
                  </div>
                </div>
                {detalj.blagajna?.razlika !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1a3d38] flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#4a7a74]">Razlika</span>
                    <RazlikaChip razlika={detalj.blagajna?.razlika ?? null} />
                  </div>
                )}
              </div>

              {/* Sažetak uplata */}
              {(() => {
                const s = sesije.find((x) => x.id === selectedId);
                if (!s) return null;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] px-4 py-3">
                      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#16a34a" }}>
                        Uplate ({detalj.uplate.length})
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Gotovina</span>
                          <span className="font-semibold">{fmtKM(Number(s.uplate_gotovina))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Kartica</span>
                          <span className="font-semibold">{fmtKM(Number(s.uplate_kartica))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Prenos</span>
                          <span className="font-semibold">{fmtKM(Number(s.uplate_prenos))}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-[#1a3d38]">
                          <span className="font-bold text-gray-600 dark:text-[#a8d5cf]">Ukupno</span>
                          <span className="font-bold" style={{ color: "#16a34a" }}>{fmtKM(Number(s.uplate_ukupno))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] px-4 py-3">
                      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>
                        Isplate ({detalj.isplate.length})
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Refundacija</span>
                          <span className="font-semibold">{fmtKM(Number(s.isplate_refundacija))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Troškovi</span>
                          <span className="font-semibold">{fmtKM(Number(s.isplate_trosak))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-[#4a7a74]">Isplate</span>
                          <span className="font-semibold">{fmtKM(Number(s.isplate_isplata))}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-[#1a3d38]">
                          <span className="font-bold text-gray-600 dark:text-[#a8d5cf]">Ukupno</span>
                          <span className="font-bold" style={{ color: ACCENT }}>{fmtKM(Number(s.isplate_ukupno))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Transakcije — uplate */}
              {detalj.uplate.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] overflow-hidden">
                  <div
                    className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
                    style={{ background: "#f0fdf4", color: "#16a34a" }}
                  >
                    <ArrowDownCircle size={11} />
                    Uplate
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[#1a3d38]">
                        <th className="text-left py-2 pl-4 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Datum</th>
                        <th className="text-left py-2 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Način</th>
                        <th className="text-right py-2 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Iznos</th>
                        <th className="text-left py-2 pr-4 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Bilješka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {detalj.uplate.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#0a1e1c]">
                          <td className="py-2 pl-4 text-gray-600 dark:text-[#a8d5cf]">
                            {fmtDatum(u.datum)} {fmtVrijeme(u.datum)}
                          </td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 capitalize">
                              {u.nacin_placanja}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold" style={{ color: "#16a34a" }}>
                            {fmtKM(Number(u.ukupan_iznos))}
                          </td>
                          <td className="py-2 pr-4 text-gray-400 dark:text-[#4a7a74] truncate max-w-[120px]">
                            {u.biljeska || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transakcije — isplate */}
              {detalj.isplate.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] overflow-hidden">
                  <div
                    className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
                    style={{ background: "#fff7ed", color: ACCENT }}
                  >
                    <ArrowUpCircle size={11} />
                    Isplate
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[#1a3d38]">
                        <th className="text-left py-2 pl-4 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Datum</th>
                        <th className="text-left py-2 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Vrsta</th>
                        <th className="text-left py-2 px-2 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Stranka</th>
                        <th className="text-right py-2 pr-4 font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74]">Iznos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {detalj.isplate.map((i) => (
                        <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-[#0a1e1c]">
                          <td className="py-2 pl-4 text-gray-600 dark:text-[#a8d5cf]">
                            {fmtDatum(i.datum)} {fmtVrijeme(i.datum)}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold capitalize"
                              style={{ background: `${ACCENT}15`, color: ACCENT }}
                            >
                              {i.vrsta}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-500 dark:text-[#4a7a74] truncate max-w-[100px]">
                            {i.stranka || "—"}
                          </td>
                          <td className="py-2 pr-4 text-right font-bold" style={{ color: ACCENT }}>
                            {fmtKM(Number(i.iznos))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
