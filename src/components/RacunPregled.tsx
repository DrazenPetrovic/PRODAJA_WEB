import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
} from "lucide-react";
import { PrintModal, type PrintJob } from "./print/PrintModal";
import { RacunTemplate } from "./print/templates/RacunTemplate";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface Zaglavlje {
  id_racuna: number;
  broj_racuna: string;
  referentni_broj: string;
  datum_racuna: string;
  id_partnera: number;
  ukupno_za_naplatu: number;
  napomena_operatera: string | null;
  id_operatera: number;
  vrsta_racuna: string; // "Racun" | "Storno racun"
  status_racuna: string; // "Aktivan" | "Storniran"
  id_originalnog_racuna: number | null;
  created_at: string;
  updated_at: string;
}

interface StavkaPregleda {
  id_stavke: number;
  id_racuna: number;
  referentni_broj: string;
  id_artikla: number;
  naziv_artikla?: string | null;
  kolicina_artikla: number;
  maloprodajna_cijena: number;
  ukupno: number;
}

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
}

export function RacunPregled() {
  const [zaglavlja, setZaglavlja] = useState<Zaglavlje[]>([]);
  const [stavkeMap, setStavkeMap] = useState<Map<number, StavkaPregleda[]>>(
    new Map(),
  );
  const [partneriMap, setPartneriMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [artikliMap, setArtikliMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [prosireni, setProsireni] = useState<Set<number>>(new Set());
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const ucitaj = async () => {
    setLoading(true);
    try {
      const [resRacuni, resPartneri, resArtikli] = await Promise.all([
        fetch(`${API_URL}/api/racun/pregled`, { credentials: "include" }),
        fetch(`${API_URL}/api/partneri`, { credentials: "include" }),
        fetch(`${API_URL}/api/artikli`, { credentials: "include" }),
      ]);
      const [dRacuni, dPartneri, dArtikli] = await Promise.all([
        resRacuni.json(),
        resPartneri.json(),
        resArtikli.json(),
      ]);

      if (dRacuni.success) {
        setZaglavlja(dRacuni.zaglavlja);
        const map = new Map<number, StavkaPregleda[]>();
        (dRacuni.stavke as StavkaPregleda[]).forEach((s) => {
          const arr = map.get(s.id_racuna) ?? [];
          arr.push(s);
          map.set(s.id_racuna, arr);
        });
        setStavkeMap(map);
      }
      if (dPartneri.success) {
        const pm = new Map<number, string>();
        dPartneri.data.forEach(
          (p: { sifra_partnera: string; naziv_partnera: string }) => {
            pm.set(Number(p.sifra_partnera), p.naziv_partnera);
          },
        );
        setPartneriMap(pm);
      }

      if (dArtikli.success) {
        const am = new Map<number, string>();
        dArtikli.data.forEach((a: Artikal) => {
          am.set(Number(a.sifra_proizvoda), a.naziv_proizvoda);
        });
        setArtikliMap(am);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ucitaj();
  }, []);

  const toggleProsiren = (id: number) =>
    setProsireni((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const formatDatum = (dt: string) => {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatDatumVrijeme = (dt: string) => {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy}  ${hh}:${min}`;
  };

  const isStorno = (r: Zaglavlje) => r.vrsta_racuna === "Storno racun";
  const isStorniran = (r: Zaglavlje) => r.status_racuna === "Storniran";

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-white dark:bg-[#0f2320]"
        style={{ height: "calc(100vh - 150px)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: PRIMARY }}
          />
          <span className="text-sm text-gray-400 dark:text-[#4a7a74]">
            Učitavanje računa...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
      style={{ height: "calc(100vh - 150px)" }}
    >
      {/* Zaglavlje preglednika */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
        style={{ background: `${PRIMARY}08` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: PRIMARY }}
          >
            <FileText size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">
              Pregled računa
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
              {zaglavlja.length} računa ukupno
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={ucitaj}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-500 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
          >
            <RotateCcw size={12} />
            Osvježi
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {zaglavlja.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <FileText
              size={36}
              className="mb-3 opacity-10 dark:opacity-5"
              style={{ color: PRIMARY }}
            />
            <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
              Nema unesenih računa
            </p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {zaglavlja.map((r) => {
              const otvoren = prosireni.has(r.id_racuna);
              const stavke = stavkeMap.get(r.id_racuna) ?? [];
              const storno = isStorno(r);
              const storniran = isStorniran(r);

              return (
                <li
                  key={r.id_racuna}
                  className={`rounded-xl overflow-hidden border-2 ${storniran ? "opacity-60" : ""}`}
                  style={{
                    borderColor: storno ? `${ACCENT}55` : `${PRIMARY}40`,
                  }}
                >
                  {/* Redak — osnvoni podaci */}
                  <button
                    onClick={() => toggleProsiren(r.id_racuna)}
                    className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#0d2b27] transition-colors group"
                  >
                    {/* Ikona / indikator */}
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: storno ? `${ACCENT}18` : `${PRIMARY}12`,
                      }}
                    >
                      <FileText
                        size={15}
                        style={{ color: storno ? ACCENT : PRIMARY }}
                      />
                    </div>

                    {/* Broj računa + referentni + datum */}
                    <div className="w-52 flex-shrink-0">
                      <p
                        className={`text-sm font-bold leading-snug ${storniran ? "line-through" : ""}`}
                        style={{ color: storno ? ACCENT : PRIMARY }}
                      >
                        {r.broj_racuna}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-[#4a7a74] mt-0.5">
                        {r.referentni_broj !== r.broj_racuna && (
                          <span className="mr-2">{r.referentni_broj}</span>
                        )}
                        {formatDatum(r.datum_racuna)}
                      </p>
                    </div>

                    {/* Partner naziv — sredina */}
                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] uppercase tracking-wider">
                        Partner
                      </p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-[#c5e0db] truncate">
                        {partneriMap.get(r.id_partnera) ??
                          `ID ${r.id_partnera}`}
                      </p>
                    </div>

                    {/* Stavki */}
                    <div className="w-16 text-center flex-shrink-0">
                      <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] uppercase tracking-wider">
                        Stavki
                      </p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-[#c5e0db]">
                        {stavke.length}
                      </p>
                    </div>

                    {/* Ukupno */}
                    <div className="w-28 text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] uppercase tracking-wider">
                        Ukupno
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: ACCENT }}
                      >
                        {Number(r.ukupno_za_naplatu).toLocaleString("bs-BA", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        KM
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col gap-1 w-24 flex-shrink-0 items-end">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={
                          storno
                            ? { background: `${ACCENT}18`, color: ACCENT }
                            : { background: `${PRIMARY}18`, color: PRIMARY }
                        }
                      >
                        {r.vrsta_racuna}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={
                          storniran
                            ? { background: "#fee2e2", color: "#ef4444" }
                            : { background: "#dcfce7", color: "#16a34a" }
                        }
                      >
                        {r.status_racuna}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 text-gray-300 transition-transform duration-200 ${otvoren ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Detalji — prosireni prikaz */}
                  {otvoren && (
                    <div
                      className="border-t-2 dark:border-[#1a3d38] bg-gray-50 dark:bg-[#0a1e1c]"
                      style={{
                        borderColor: storno ? `${ACCENT}55` : `${PRIMARY}40`,
                      }}
                    >
                      <div className="px-5 py-4 grid grid-cols-2 gap-4">
                        {/* Lijevo: stavke */}
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-2"
                            style={{ color: PRIMARY }}
                          >
                            Stavke računa
                          </p>
                          {stavke.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-[#4a7a74]">
                              Nema stavki
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-[#1a3d38]">
                                  <th className="text-left pb-1.5 text-gray-400 dark:text-[#4a7a74] font-semibold">
                                    Artikal
                                  </th>
                                  <th className="text-right pb-1.5 text-gray-400 dark:text-[#4a7a74] font-semibold">
                                    Kol.
                                  </th>
                                  <th className="text-right pb-1.5 text-gray-400 dark:text-[#4a7a74] font-semibold">
                                    Cijena
                                  </th>
                                  <th className="text-right pb-1.5 text-gray-400 dark:text-[#4a7a74] font-semibold">
                                    Ukupno
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-[#1a3d38]">
                                {stavke.map((s) => (
                                  <tr key={s.id_stavke}>
                                    <td
                                      className="py-1.5 font-mono font-semibold"
                                      style={{ color: PRIMARY }}
                                    >
                                      {s.naziv_artikla ??
                                        artikliMap.get(Number(s.id_artikla)) ??
                                        s.id_artikla}
                                    </td>
                                    <td className="py-1.5 text-right text-gray-700 dark:text-[#c5e0db]">
                                      {Number(s.kolicina_artikla)}
                                    </td>
                                    <td className="py-1.5 text-right text-gray-700 dark:text-[#c5e0db]">
                                      {Number(s.maloprodajna_cijena).toFixed(2)}
                                    </td>
                                    <td
                                      className="py-1.5 text-right font-bold"
                                      style={{ color: ACCENT }}
                                    >
                                      {Number(s.ukupno).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-gray-200 dark:border-[#1e4a44]">
                                  <td
                                    colSpan={3}
                                    className="pt-2 text-right font-bold text-gray-600 dark:text-[#a8d5cf]"
                                  >
                                    Ukupno:
                                  </td>
                                  <td
                                    className="pt-2 text-right font-bold"
                                    style={{ color: ACCENT }}
                                  >
                                    {Number(r.ukupno_za_naplatu).toFixed(2)} KM
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          )}
                        </div>

                        {/* Desno: meta podaci */}
                        <div className="space-y-2 pl-4 border-l border-gray-200 dark:border-[#1a3d38]">
                          <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-2"
                            style={{ color: PRIMARY }}
                          >
                            Detalji
                          </p>
                          {[
                            ["Referentni broj", r.referentni_broj],
                            ["ID operatera", String(r.id_operatera)],
                            ["Kreiran", formatDatumVrijeme(r.created_at)],
                            ...(r.id_originalnog_racuna
                              ? [
                                  [
                                    "Originalni račun ID",
                                    String(r.id_originalnog_racuna),
                                  ],
                                ]
                              : []),
                          ].map(([label, value]) => (
                            <div key={label} className="flex items-start gap-2">
                              <span className="text-[11px] text-gray-400 dark:text-[#4a7a74] w-32 flex-shrink-0">
                                {label}:
                              </span>
                              <span className="text-[11px] font-semibold text-gray-700 dark:text-[#c5e0db]">
                                {value}
                              </span>
                            </div>
                          ))}
                          {r.napomena_operatera && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#1a3d38]">
                              <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] mb-0.5">
                                Napomena:
                              </p>
                              <p className="text-[11px] text-gray-700 dark:text-[#c5e0db] italic">
                                "{r.napomena_operatera}"
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() =>
                              setPrintJob({
                                title: `${r.vrsta_racuna} — ${r.broj_racuna}`,
                                orientation: "portrait",
                                defaultFormat: "A5",
                                lockOrientation: true,
                                lockFormat: true,
                                component: (
                                  <RacunTemplate
                                    racun={r}
                                    stavke={stavke.map((s) => ({
                                      ...s,
                                      naziv_artikla:
                                        s.naziv_artikla ??
                                        artikliMap.get(Number(s.id_artikla)) ??
                                        null,
                                    }))}
                                    nazivPartnera={
                                      partneriMap.get(r.id_partnera) ??
                                      `ID ${r.id_partnera}`
                                    }
                                  />
                                ),
                              })
                            }
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                            style={{ background: PRIMARY }}
                          >
                            <Printer size={12} />
                            Štampaj / PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {printJob && (
        <PrintModal job={printJob} onClose={() => setPrintJob(null)} />
      )}
    </div>
  );
}
