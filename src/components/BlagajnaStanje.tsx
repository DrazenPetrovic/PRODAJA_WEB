import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  Loader2,
  Lock,
  LockOpen,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface StanjeData {
  id: number;
  datum_otvaranja: string;
  pocetak_gotovine: number;
  datum_zatvaranja: string | null;
  kraj_gotovine_obracun: number | null;
  kraj_gotovine_stvarno: number | null;
  razlika: number | null;
  id_operatera_otvaranje: number;
  id_operatera_zatvaranje: number | null;
  status: "otvorena" | "zatvorena";
  naziv_operatera_otvaranje: string | null;
  naziv_operatera_zatvaranje: string | null;
  tekuce_uplate?: number;
  tekuce_isplate?: number;
  tekuci_obracun?: number;
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
  n.toLocaleString("bs-BA", { minimumFractionDigits: 2 }) + " KM";

const RedIznos = ({
  label,
  iznos,
  color,
  large,
  separator,
}: {
  label: string;
  iznos: number;
  color?: string;
  large?: boolean;
  separator?: boolean;
}) => (
  <>
    {separator && <div className="h-px bg-gray-100 dark:bg-[#1a3d38] my-2" />}
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`${large ? "text-sm font-bold" : "text-xs text-gray-500 dark:text-[#4a7a74]"}`}
        style={large ? { color } : undefined}
      >
        {label}
      </span>
      <span
        className={`font-bold tabular-nums ${large ? "text-base" : "text-sm"}`}
        style={{ color: color ?? "inherit" }}
      >
        {fmtKM(iznos)}
      </span>
    </div>
  </>
);

export function BlagajnaStanje() {
  const [stanje, setStanje] = useState<StanjeData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [zatvaranjeMode, setZatvaranjeMode] = useState(false);
  const [krajStvarno, setKrajStvarno] = useState("");

  const ucitaj = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/stanje`, { credentials: "include" });
      const d = await res.json();
      setStanje(d.success ? d.stanje : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ucitaj();
  }, []);

  const handleOtvori = async () => {
    setSubmitting(true);
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/otvori`, {
        method: "POST",
        credentials: "include",
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      await ucitaj();
    } catch (e: unknown) {
      setGreska(e instanceof Error ? e.message : "Greška pri otvaranju");
    } finally {
      setSubmitting(false);
    }
  };

  const handleZatvori = async () => {
    const iznos = parseFloat(krajStvarno.replace(",", "."));
    if (isNaN(iznos) || iznos < 0) {
      setGreska("Unesite ispravno prebrojano stanje gotovine");
      return;
    }
    setSubmitting(true);
    setGreska(null);
    try {
      const res = await fetch(`${API_URL}/api/blagajna/zatvori`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krajStvarno: iznos }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      setZatvaranjeMode(false);
      setKrajStvarno("");
      await ucitaj();
    } catch (e: unknown) {
      setGreska(e instanceof Error ? e.message : "Greška pri zatvaranju");
    } finally {
      setSubmitting(false);
    }
  };

  const razlikaPreview =
    zatvaranjeMode && stanje?.tekuci_obracun !== undefined && krajStvarno !== ""
      ? parseFloat(krajStvarno.replace(",", ".")) - stanje.tekuci_obracun
      : null;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-white dark:bg-[#0f2320]"
        style={{ height: "calc(100vh - 150px)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: PRIMARY }} />
          <span className="text-sm text-gray-400 dark:text-[#4a7a74]">Učitavanje stanja...</span>
        </div>
      </div>
    );
  }

  const isOtvorena = stanje?.status === "otvorena";
  const isZatvorena = stanje?.status === "zatvorena";

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
            <Landmark size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-[#e6f4f2]">Stanje blagajne</h2>
            <p className="text-[10px] text-gray-400 dark:text-[#4a7a74]">
              {stanje === null ? "Nema evidencije" : isOtvorena ? "Aktivna sesija" : "Zadnja sesija"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stanje !== null && stanje !== undefined && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={
                isOtvorena
                  ? { background: "#dcfce7", color: "#16a34a" }
                  : { background: "#f3f4f6", color: "#6b7280" }
              }
            >
              {isOtvorena ? <LockOpen size={11} /> : <Lock size={11} />}
              {isOtvorena ? "OTVORENA" : "ZATVORENA"}
            </span>
          )}
          <button
            onClick={ucitaj}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-500 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
          >
            <RotateCcw size={12} />
            Osvježi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
        {/* Greška */}
        {greska && (
          <div className="w-full max-w-lg mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span className="flex-1">{greska}</span>
            <button onClick={() => setGreska(null)}><X size={13} /></button>
          </div>
        )}

        {/* Nikad nije otvorena */}
        {(stanje === null || stanje === undefined) && (
          <div className="w-full max-w-lg text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${PRIMARY}12` }}>
              <Landmark size={28} style={{ color: PRIMARY }} />
            </div>
            <p className="text-sm text-gray-400 dark:text-[#4a7a74] mb-6">
              Blagajna nikad nije bila otvorena.
            </p>
            <button
              onClick={handleOtvori}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <LockOpen size={15} />}
              Otvori blagajnu
            </button>
          </div>
        )}

        {/* Otvorena — prikaz + zatvaranje */}
        {isOtvorena && stanje && (
          <div className="w-full max-w-lg space-y-4">
            {/* Info o sesiji */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] overflow-hidden">
              <div className="px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase" style={{ background: `${PRIMARY}0a`, color: PRIMARY }}>
                Aktivna sesija
              </div>
              <div className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-[#4a7a74]">Otvorena</span>
                <span className="font-semibold text-gray-700 dark:text-[#c5e0db]">
                  {fmtDatum(stanje.datum_otvaranja)} u {fmtVrijeme(stanje.datum_otvaranja)}
                </span>
              </div>
              {stanje.naziv_operatera_otvaranje && (
                <div className="px-4 pb-3 flex items-center justify-between text-sm border-t border-gray-50 dark:border-[#1a3d38] pt-2">
                  <span className="text-gray-500 dark:text-[#4a7a74]">Operater</span>
                  <span className="font-semibold text-gray-700 dark:text-[#c5e0db]">
                    {stanje.naziv_operatera_otvaranje}
                  </span>
                </div>
              )}
            </div>

            {/* Obračun */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] px-4 py-3">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: PRIMARY }}>
                Tekući obračun
              </div>
              <RedIznos label="Početak gotovine" iznos={Number(stanje.pocetak_gotovine)} />
              <RedIznos
                label="+ Uplate od otvaranja"
                iznos={stanje.tekuce_uplate ?? 0}
                color="#16a34a"
              />
              <RedIznos
                label="− Isplate od otvaranja"
                iznos={stanje.tekuce_isplate ?? 0}
                color={ACCENT}
              />
              <RedIznos
                label="Obračunato stanje"
                iznos={stanje.tekuci_obracun ?? 0}
                color={PRIMARY}
                large
                separator
              />
            </div>

            {/* Forma zatvaranja */}
            {!zatvaranjeMode ? (
              <button
                onClick={() => { setZatvaranjeMode(true); setGreska(null); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-90"
                style={{ borderColor: ACCENT, color: ACCENT, background: `${ACCENT}08` }}
              >
                <Lock size={15} />
                Zatvori blagajnu
              </button>
            ) : (
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `${ACCENT}40` }}>
                <div className="px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase" style={{ background: `${ACCENT}0a`, color: ACCENT }}>
                  Zatvaranje blagajne
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Obračunato stanje</span>
                    <span className="font-bold" style={{ color: PRIMARY }}>
                      {fmtKM(stanje.tekuci_obracun ?? 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-[#4a7a74] mb-1">
                      Prebrojano gotovine (KM)
                    </label>
                    <input
                      type="text"
                      value={krajStvarno}
                      onChange={(e) => setKrajStvarno(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white dark:bg-[#0a1e1c] text-gray-700 dark:text-[#e6f4f2] text-right font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                  </div>

                  {razlikaPreview !== null && !isNaN(razlikaPreview) && (
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold"
                      style={
                        Math.abs(razlikaPreview) < 0.01
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : razlikaPreview > 0
                          ? { background: "#eff6ff", color: "#2563eb" }
                          : { background: "#fff7ed", color: ACCENT }
                      }
                    >
                      <span>Razlika</span>
                      <span>
                        {razlikaPreview >= 0 ? "+" : ""}
                        {fmtKM(razlikaPreview)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setZatvaranjeMode(false); setKrajStvarno(""); setGreska(null); }}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-500 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Otkaži
                    </button>
                    <button
                      onClick={handleZatvori}
                      disabled={submitting || krajStvarno === ""}
                      className="flex-2 flex-grow flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: ACCENT }}
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      Potvrdi zatvaranje
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zatvorena — pregled zadnje sesije + otvori */}
        {isZatvorena && stanje && (
          <div className="w-full max-w-lg space-y-4">
            {/* Info o sesiji */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] overflow-hidden">
              <div className="px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-[#4a7a74]" style={{ background: "#f9fafb" }}>
                Zadnja sesija
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#4a7a74]">Otvorena</span>
                  <span className="font-semibold text-gray-700 dark:text-[#c5e0db]">
                    {fmtDatum(stanje.datum_otvaranja)} {fmtVrijeme(stanje.datum_otvaranja)}
                    {stanje.naziv_operatera_otvaranje && (
                      <span className="text-gray-400 dark:text-[#4a7a74] font-normal"> · {stanje.naziv_operatera_otvaranje}</span>
                    )}
                  </span>
                </div>
                {stanje.datum_zatvaranja && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#4a7a74]">Zatvorena</span>
                    <span className="font-semibold text-gray-700 dark:text-[#c5e0db]">
                      {fmtDatum(stanje.datum_zatvaranja)} {fmtVrijeme(stanje.datum_zatvaranja)}
                      {stanje.naziv_operatera_zatvaranje && (
                        <span className="text-gray-400 dark:text-[#4a7a74] font-normal"> · {stanje.naziv_operatera_zatvaranje}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Zaključni obračun */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1a3d38] px-4 py-3">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-2 text-gray-400 dark:text-[#4a7a74]">
                Zaključni obračun
              </div>
              <RedIznos label="Početak gotovine" iznos={Number(stanje.pocetak_gotovine)} />
              <RedIznos label="+ Ukupno uplaćeno" iznos={0} color="#16a34a" />
              <RedIznos label="− Ukupno isplaćeno" iznos={0} color={ACCENT} />
              {stanje.kraj_gotovine_obracun !== null && (
                <RedIznos
                  label="Trebalo biti"
                  iznos={Number(stanje.kraj_gotovine_obracun)}
                  color={PRIMARY}
                  large
                  separator
                />
              )}
              {stanje.kraj_gotovine_stvarno !== null && (
                <RedIznos label="Prebrojano" iznos={Number(stanje.kraj_gotovine_stvarno)} />
              )}
              {stanje.razlika !== null && (
                <div className="flex items-center justify-between py-1.5 mt-1">
                  <span className="text-sm font-bold" style={{ color: Math.abs(Number(stanje.razlika)) < 0.01 ? "#16a34a" : ACCENT }}>
                    Razlika
                  </span>
                  <div className="flex items-center gap-1.5">
                    {Math.abs(Number(stanje.razlika)) < 0.01 ? (
                      <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                    ) : Number(stanje.razlika) > 0 ? (
                      <TrendingUp size={14} style={{ color: "#2563eb" }} />
                    ) : (
                      <TrendingDown size={14} style={{ color: ACCENT }} />
                    )}
                    <span
                      className="font-bold tabular-nums text-base"
                      style={{ color: Math.abs(Number(stanje.razlika)) < 0.01 ? "#16a34a" : Number(stanje.razlika) > 0 ? "#2563eb" : ACCENT }}
                    >
                      {Number(stanje.razlika) >= 0 ? "+" : ""}
                      {fmtKM(Number(stanje.razlika))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Nova sesija */}
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#1e4a44] px-4 py-3 text-center">
              <p className="text-xs text-gray-400 dark:text-[#4a7a74] mb-3">
                Početni iznos nove sesije:{" "}
                <span className="font-bold" style={{ color: PRIMARY }}>
                  {fmtKM(Number(stanje.kraj_gotovine_stvarno ?? 0))}
                </span>
                {" "}(preuzeto iz zadnjeg zatvaranja)
              </p>
              <button
                onClick={handleOtvori}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: PRIMARY }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <LockOpen size={15} />}
                Otvori blagajnu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
