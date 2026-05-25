const PRIMARY = "#0F766E";
const ACCENT = "#F97316";

export interface RacunZaglavlje {
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
}

export interface RacunStavka {
  id_stavke: number;
  id_artikla: number;
  kolicina_artikla: number;
  maloprodajna_cijena: number;
  ukupno: number;
}

interface Props {
  racun: RacunZaglavlje;
  stavke: RacunStavka[];
  nazivPartnera: string;
}

function formatDatum(dt: string) {
  const d = new Date(dt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function RacunTemplate({ racun, stavke, nazivPartnera }: Props) {
  const datumStampe = formatDatum(new Date().toISOString());
  const isStorno = racun.vrsta_racuna === "Storno racun";
  const isStorniran = racun.status_racuna === "Storniran";

  const ukupno = stavke.reduce((s, x) => s + Number(x.ukupno), 0);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#1a1a1a",
        padding: "14mm 14mm",
        boxSizing: "border-box",
        minHeight: "100%",
        background: "white",
      }}
    >
      {/* ── Zaglavlje dokumenta ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: `3px solid ${PRIMARY}`,
          paddingBottom: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: PRIMARY }}>
            Karpas Ambalaže
          </div>
          <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
            Prodaja — sistem za upravljanje
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: isStorno ? ACCENT : PRIMARY,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {racun.vrsta_racuna}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: isStorno ? ACCENT : PRIMARY,
              marginTop: 2,
              letterSpacing: "0.02em",
            }}
          >
            {racun.broj_racuna}
          </div>
          {isStorniran && (
            <div
              style={{
                display: "inline-block",
                marginTop: 4,
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              STORNIRAN
            </div>
          )}
        </div>
      </div>

      {/* ── Podaci o računu i partneru ── */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>

        {/* Partner */}
        <div
          style={{
            flex: 1,
            background: `${PRIMARY}0a`,
            border: `1px solid ${PRIMARY}30`,
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 8, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Kupac
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
            {nazivPartnera}
          </div>
          <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
            ID partnera: {racun.id_partnera}
          </div>
        </div>

        {/* Detalji računa */}
        <div
          style={{
            flex: 1,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 8, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Podaci o računu
          </div>
          {[
            ["Datum računa", formatDatum(racun.datum_racuna)],
            ["Referentni broj", racun.referentni_broj],
            ["ID operatera", String(racun.id_operatera)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: "#888", width: 100, flexShrink: 0 }}>{label}:</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#1a1a1a" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabela stavki ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Stavke računa
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: PRIMARY }}>
              {[
                { label: "#", right: false, w: "4%" },
                { label: "Šifra artikla", right: false, w: "15%" },
                { label: "Količina", right: true, w: "14%" },
                { label: "Cijena (KM)", right: true, w: "18%" },
                { label: "Ukupno (KM)", right: true, w: "18%" },
              ].map(({ label, right, w }) => (
                <th
                  key={label}
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: 8,
                    padding: "5px 8px",
                    textAlign: right ? "right" : "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    width: w,
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stavke.map((s, i) => (
              <tr key={s.id_stavke} style={{ background: i % 2 === 0 ? "#f0faf9" : "white" }}>
                <td style={cell}>{i + 1}</td>
                <td style={{ ...cell, fontWeight: 600, color: PRIMARY }}>{s.id_artikla}</td>
                <td style={{ ...cell, textAlign: "right" }}>
                  {Number(s.kolicina_artikla).toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ ...cell, textAlign: "right" }}>
                  {Number(s.maloprodajna_cijena).toFixed(2)}
                </td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: ACCENT }}>
                  {Number(s.ukupno).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${PRIMARY}` }}>
              <td colSpan={4} style={{ ...cell, fontWeight: 700, fontSize: 11, textAlign: "right", color: "#333" }}>
                UKUPNO ZA NAPLATU:
              </td>
              <td style={{ ...cell, fontWeight: 800, fontSize: 13, textAlign: "right", color: ACCENT }}>
                {Number(ukupno).toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Napomena ── */}
      {racun.napomena_operatera && (
        <div
          style={{
            background: `${ACCENT}0d`,
            border: `1px solid ${ACCENT}40`,
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Napomena:{" "}
          </span>
          <span style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>
            {racun.napomena_operatera}
          </span>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 8,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 8,
          color: "#aaa",
        }}
      >
        <span>Karpas Ambalaže — Prodaja</span>
        <span>Datum štampe: {datumStampe}</span>
      </div>
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "5px 8px",
  fontSize: 10,
  borderBottom: "1px solid #e8f5f3",
  verticalAlign: "middle",
};
