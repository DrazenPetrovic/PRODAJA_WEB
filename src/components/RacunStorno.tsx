import ReactDOM from "react-dom";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";
import { PrintModal, type PrintJob } from "./print/PrintModal";
import {
  RacunTemplate,
  type RacunZaglavlje,
  type RacunStavka,
} from "./print/templates/RacunTemplate";

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
  vrsta_racuna: string;
  status_racuna: string;
  id_originalnog_racuna: number | null;
  created_at: string;
  updated_at: string;
}

interface StavkaPregleda {
  id_stavke: number;
  id_racuna: number;
  referentni_broj: string;
  id_artikla: number;
  kolicina_artikla: number;
  maloprodajna_cijena: number;
  ukupno: number;
}

interface StornoResult {
  idStornoRacuna: number;
  brojStornoRacuna: string;
  datumStorna: string;
  originalRacun: Zaglavlje;
  stavke: StavkaPregleda[];
  nazivPartnera: string;
  napomena: string;
}

export function RacunStorno() {
  const [zaglavlja, setZaglavlja] = useState<Zaglavlje[]>([]);
  const [stavkeMap, setStavkeMap] = useState<Map<number, StavkaPregleda[]>>(
    new Map(),
  );
  const [partneriMap, setPartneriMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [selectedRacun, setSelectedRacun] = useState<Zaglavlje | null>(null);
  const [napomena, setNapomena] = useState("");
  const [slanje, setSlanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [kreiraniStorno, setKreiraniStorno] = useState<StornoResult | null>(
    null,
  );
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const ucitaj = async () => {
    setLoading(true);
    try {
      const [resRacuni, resPartneri] = await Promise.all([
        fetch(`${API_URL}/api/racun/pregled`, { credentials: "include" }),
        fetch(`${API_URL}/api/partneri`, { credentials: "include" }),
      ]);
      const [dRacuni, dPartneri] = await Promise.all([
        resRacuni.json(),
        resPartneri.json(),
      ]);

      if (dRacuni.success) {
        const aktivni = (dRacuni.zaglavlja as Zaglavlje[]).filter(
          (r) => r.vrsta_racuna === "Racun" && r.status_racuna === "Aktivan",
        );
        setZaglavlja(aktivni);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ucitaj();
  }, []);

  const formatDatum = (dt: string) => {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const otvoriModal = (r: Zaglavlje) => {
    setSelectedRacun(r);
    setNapomena("");
    setGreska(null);
    setKreiraniStorno(null);
  };

  const zatvoriModal = () => {
    setSelectedRacun(null);
    setNapomena("");
    setGreska(null);
    setKreiraniStorno(null);
  };

  const handleStorniraj = async () => {
    if (!selectedRacun) return;
    setSlanje(true);
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/racun/storno`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idOriginalnog: selectedRacun.id_racuna,
          napomena: napomena.slice(0, 254),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setGreska(data.message ?? "Greška pri storniranju");
        return;
      }
      const stavke = stavkeMap.get(selectedRacun.id_racuna) ?? [];
      const nazivPartnera =
        partneriMap.get(selectedRacun.id_partnera) ??
        `ID ${selectedRacun.id_partnera}`;
      setKreiraniStorno({
        idStornoRacuna: data.idStornoRacuna,
        brojStornoRacuna: data.brojStornoRacuna,
        datumStorna: data.datumStorna,
        originalRacun: selectedRacun,
        stavke,
        nazivPartnera,
        napomena: napomena.slice(0, 254),
      });
      setZaglavlja((prev) =>
        prev.filter((r) => r.id_racuna !== selectedRacun.id_racuna),
      );
    } catch {
      setGreska("Greška u komunikaciji sa serverom");
    } finally {
      setSlanje(false);
    }
  };

  const handleStampajStorno = () => {
    if (!kreiraniStorno) return;
    const racunZaPrint: RacunZaglavlje = {
      id_racuna: kreiraniStorno.idStornoRacuna,
      broj_racuna: kreiraniStorno.brojStornoRacuna,
      referentni_broj: kreiraniStorno.originalRacun.referentni_broj,
      datum_racuna: kreiraniStorno.datumStorna,
      id_partnera: kreiraniStorno.originalRacun.id_partnera,
      ukupno_za_naplatu: -Math.abs(
        Number(kreiraniStorno.originalRacun.ukupno_za_naplatu),
      ),
      napomena_operatera: kreiraniStorno.napomena || null,
      id_operatera: kreiraniStorno.originalRacun.id_operatera,
      vrsta_racuna: "Storno racun",
      status_racuna: "Aktivan",
    };
    const stavkeZaPrint: RacunStavka[] = kreiraniStorno.stavke.map((s) => ({
      ...s,
      kolicina_artikla: -Math.abs(Number(s.kolicina_artikla)),
      ukupno: -Math.abs(Number(s.ukupno)),
    }));
    setPrintJob({
      title: `Storno račun — ${kreiraniStorno.brojStornoRacuna}`,
      orientation: "portrait",
      component: (
        <RacunTemplate
          racun={racunZaPrint}
          stavke={stavkeZaPrint}
          nazivPartnera={kreiraniStorno.nazivPartnera}
        />
      ),
      lockOrientation: true,
    });
  };

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

  const selectedStavke = selectedRacun
    ? (stavkeMap.get(selectedRacun.id_racuna) ?? [])
    : [];

  return (
    <>
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
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <RotateCcw size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">
                Storniranje računa
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
                {zaglavlja.length} aktivnih računa
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

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {zaglavlja.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <RotateCcw
                size={36}
                className="mb-3 opacity-10 dark:opacity-5"
                style={{ color: ACCENT }}
              />
              <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
                Nema aktivnih računa za storniranje
              </p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {zaglavlja.map((r) => {
                const stavke = stavkeMap.get(r.id_racuna) ?? [];
                return (
                  <li
                    key={r.id_racuna}
                    className="rounded-xl overflow-hidden border-2"
                    style={{ borderColor: `${PRIMARY}40` }}
                  >
                    <button
                      onClick={() => otvoriModal(r)}
                      className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-[#2a1a08] transition-colors"
                    >
                      {/* Ikona */}
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{ background: `${PRIMARY}12` }}
                      >
                        <FileText size={15} style={{ color: PRIMARY }} />
                      </div>

                      {/* Broj + datum */}
                      <div className="w-52 flex-shrink-0">
                        <p
                          className="text-sm font-bold leading-snug"
                          style={{ color: PRIMARY }}
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

                      {/* Partner */}
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

                      {/* Badge */}
                      <div className="flex-shrink-0">
                        <span
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-xl"
                          style={{
                            background: `${ACCENT}15`,
                            color: ACCENT,
                            border: `1.5px solid ${ACCENT}40`,
                          }}
                        >
                          Storniraj
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedRacun &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={(e) => e.target === e.currentTarget && zatvoriModal()}
          >
            <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl w-[640px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ background: kreiraniStorno ? PRIMARY : ACCENT }}
              >
                <div className="flex items-center gap-3 text-white">
                  {kreiraniStorno ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                  <span className="font-bold text-sm">
                    {kreiraniStorno
                      ? `STORNIRAN: ${selectedRacun.broj_racuna}`
                      : `Storniranje: ${selectedRacun.broj_racuna}`}
                  </span>
                </div>
                <button
                  onClick={zatvoriModal}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-6">
                {kreiraniStorno ? (
                  /* SUCCESS VIEW */
                  <div className="flex flex-col items-center text-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: `${PRIMARY}15` }}
                    >
                      <CheckCircle2 size={32} style={{ color: PRIMARY }} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-1"
                        style={{ color: PRIMARY }}
                      >
                        Račun uspješno storniran
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: ACCENT }}
                      >
                        {kreiraniStorno.brojStornoRacuna}
                      </p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-3 mt-2">
                      <div
                        className="rounded-xl p-3 text-left"
                        style={{
                          background: `${PRIMARY}0a`,
                          border: `1px solid ${PRIMARY}25`,
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: PRIMARY }}
                        >
                          Partner
                        </p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-[#e6f4f2]">
                          {kreiraniStorno.nazivPartnera}
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3 text-left"
                        style={{
                          background: `${ACCENT}0a`,
                          border: `1px solid ${ACCENT}25`,
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: ACCENT }}
                        >
                          Storno iznos
                        </p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: ACCENT }}
                        >
                          -
                          {Math.abs(
                            Number(
                              kreiraniStorno.originalRacun.ukupno_za_naplatu,
                            ),
                          ).toLocaleString("bs-BA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          KM
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-[#4a7a74]">
                      Originalni račun{" "}
                      <strong>{selectedRacun.broj_racuna}</strong> je označen
                      kao storniran i uklonjen iz liste.
                    </p>
                  </div>
                ) : (
                  /* FORMA ZA STORNO */
                  <>
                    {/* Info o računu */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: `${PRIMARY}0a`,
                          border: `1px solid ${PRIMARY}25`,
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: PRIMARY }}
                        >
                          Partner
                        </p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-[#e6f4f2]">
                          {partneriMap.get(selectedRacun.id_partnera) ??
                            `ID ${selectedRacun.id_partnera}`}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] mt-1">
                          {formatDatum(selectedRacun.datum_racuna)}
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{
                          background: `${ACCENT}0a`,
                          border: `1px solid ${ACCENT}25`,
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: ACCENT }}
                        >
                          Iznos za storno
                        </p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: ACCENT }}
                        >
                          -
                          {Math.abs(
                            Number(selectedRacun.ukupno_za_naplatu),
                          ).toLocaleString("bs-BA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          KM
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] mt-1">
                          {selectedStavke.length} stavki
                        </p>
                      </div>
                    </div>

                    {/* Stavke — negativne */}
                    {selectedStavke.length > 0 && (
                      <div className="mb-5">
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-2"
                          style={{ color: ACCENT }}
                        >
                          Stavke koje se storniraju
                        </p>
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
                            {selectedStavke.map((s) => (
                              <tr key={s.id_stavke}>
                                <td
                                  className="py-1.5 font-mono font-semibold"
                                  style={{ color: PRIMARY }}
                                >
                                  {s.id_artikla}
                                </td>
                                <td
                                  className="py-1.5 text-right font-bold"
                                  style={{ color: ACCENT }}
                                >
                                  -{Math.abs(Number(s.kolicina_artikla))}
                                </td>
                                <td className="py-1.5 text-right text-gray-600 dark:text-[#a8d5cf]">
                                  {Number(s.maloprodajna_cijena).toFixed(2)}
                                </td>
                                <td
                                  className="py-1.5 text-right font-bold"
                                  style={{ color: ACCENT }}
                                >
                                  -{Math.abs(Number(s.ukupno)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 dark:border-[#1e4a44]">
                              <td
                                colSpan={3}
                                className="pt-2 text-right font-bold text-gray-500 dark:text-[#a8d5cf]"
                              >
                                Ukupno storno:
                              </td>
                              <td
                                className="pt-2 text-right font-bold"
                                style={{ color: ACCENT }}
                              >
                                -
                                {Math.abs(
                                  Number(selectedRacun.ukupno_za_naplatu),
                                ).toFixed(2)}{" "}
                                KM
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* Napomena */}
                    <div className="mb-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-gray-400 dark:text-[#4a7a74]">
                        Napomena (opciono)
                      </label>
                      <textarea
                        value={napomena}
                        onChange={(e) =>
                          setNapomena(e.target.value.slice(0, 254))
                        }
                        rows={3}
                        placeholder="Razlog storniranja..."
                        className="w-full rounded-xl border border-gray-200 dark:border-[#1e4a44] px-3 py-2.5 text-sm bg-white dark:bg-[#0a1e1c] text-gray-700 dark:text-[#c5e0db] placeholder-gray-300 dark:placeholder-[#2a5a54] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-900"
                      />
                      <p className="text-[10px] text-gray-300 dark:text-[#2a5a54] text-right mt-1">
                        {napomena.length}/254
                      </p>
                    </div>

                    {/* Greška */}
                    {greska && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertTriangle
                          size={14}
                          className="text-red-500 flex-shrink-0"
                        />
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {greska}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#1a3d38]">
                {kreiraniStorno ? (
                  <>
                    <button
                      onClick={zatvoriModal}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-[#4a7a74] border border-gray-200 dark:border-[#1e4a44] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Zatvori
                    </button>
                    <button
                      onClick={handleStampajStorno}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: PRIMARY }}
                    >
                      <Printer size={14} />
                      Štampaj storno račun
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={zatvoriModal}
                      disabled={slanje}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-[#4a7a74] border border-gray-200 dark:border-[#1e4a44] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all disabled:opacity-50"
                    >
                      Otkaži
                    </button>
                    <button
                      onClick={handleStorniraj}
                      disabled={slanje}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                      style={{ background: ACCENT }}
                    >
                      {slanje ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RotateCcw size={14} />
                      )}
                      Potvrdi storniranje
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {printJob && (
        <PrintModal job={printJob} onClose={() => setPrintJob(null)} />
      )}
    </>
  );
}
