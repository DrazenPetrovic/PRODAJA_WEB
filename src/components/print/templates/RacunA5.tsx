import type { RacunStavka, RacunZaglavlje } from "./RacunA4";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";

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

export function RacunA5({ racun, stavke, nazivPartnera }: Props) {
  const ukupno = stavke.reduce((s, x) => s + Number(x.ukupno), 0);

  return (
    <div
      style={{
        width: "148mm",
        minHeight: "210mm",
        boxSizing: "border-box",
        padding: "8mm 10mm",
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#1a1a1a",
        background: "white",
      }}
    >
      {/* ── Zaglavlje dokumenta ── */}
      <div
        style={{
          textAlign: "center",
          borderBottom: `2px solid ${PRIMARY}`,
          paddingBottom: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: PRIMARY,
            letterSpacing: "0.02em",
          }}
        >
          {racun.broj_racuna}
        </div>
      </div>

      {/* ── Podaci o računu i partneru ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {/* Partner */}
        <div
          style={{
            flex: 1,
            background: `${PRIMARY}0a`,
            border: `1px solid ${PRIMARY}30`,
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
            {nazivPartnera}
          </div>
          <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
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
            padding: "8px 10px",
          }}
        >
          {[
            ["Datum", formatDatum(racun.datum_racuna)],
            ["Ref. broj", racun.referentni_broj],
            ["ID operatera", String(racun.id_operatera)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{ display: "flex", gap: 6, marginBottom: 2 }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: "#888",
                  width: 70,
                  flexShrink: 0,
                }}
              >
                {label}:
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: "#1a1a1a" }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabela stavki ── */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: PRIMARY,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 5,
          }}
        >
          STAVKE
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: PRIMARY }}>
              {[
                { label: "#", right: false, w: "4%" },
                { label: "Artikal", right: false, w: "25%" },
                { label: "Količina", right: true, w: "14%" },
                { label: "Cijena (KM)", right: true, w: "18%" },
                { label: "Ukupno (KM)", right: true, w: "18%" },
              ].map(({ label, right, w }) => (
                <th
                  key={label}
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: 7,
                    padding: "4px 6px",
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
              <tr
                key={s.id_stavke}
                style={{ background: i % 2 === 0 ? "#f0faf9" : "white" }}
              >
                <td style={cell}>{i + 1}</td>
                <td style={{ ...cell, fontWeight: 600, color: PRIMARY }}>
                  {s.naziv_artikla ?? s.id_artikla}
                </td>
                <td style={{ ...cell, textAlign: "right" }}>
                  {Number(s.kolicina_artikla).toLocaleString("bs-BA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td style={{ ...cell, textAlign: "right" }}>
                  {Number(s.maloprodajna_cijena).toFixed(2)}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: "right",
                    fontWeight: 700,
                    color: ACCENT,
                  }}
                >
                  {Number(s.ukupno).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${PRIMARY}` }}>
              <td
                colSpan={4}
                style={{
                  ...cell,
                  fontWeight: 700,
                  fontSize: 10,
                  textAlign: "right",
                  color: "#333",
                }}
              >
                UKUPNO:
              </td>
              <td
                style={{
                  ...cell,
                  fontWeight: 800,
                  fontSize: 12,
                  textAlign: "right",
                  color: ACCENT,
                }}
              >
                {Number(ukupno).toLocaleString("bs-BA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                KM
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
            padding: "7px 10px",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: ACCENT,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Napomena:{" "}
          </span>
          <span style={{ fontSize: 9, color: "#444", fontStyle: "italic" }}>
            {racun.napomena_operatera}
          </span>
        </div>
      )}
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "4px 6px",
  fontSize: 9,
  borderBottom: "1px solid #e8f5f3",
  verticalAlign: "middle",
};
