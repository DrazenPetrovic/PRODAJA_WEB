const PRIMARY = "#0F766E";
const ACCENT = "#F97316";

interface Partner {
  sifra_partnera: string;
  naziv_partnera: string;
  adresa_partnera: string;
  Naziv_grada: string;
}

interface Stavka {
  datum: string;
  vrsta: string;
  opis: string;
  duguje: number;
  potrazuje: number;
  saldo: number;
}

interface Rekapitulacija {
  pocetno_stanje: number;
  ukupno_racuni: number;
  ukupno_storna: number;
  ukupno_uplate: number;
  ukupno_isplate: number;
  saldo: number;
}

interface Props {
  partner: Partner;
  stavke: Stavka[];
  rekapitulacija: Rekapitulacija;
}

const fmt = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDatum = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const vrstaStyle = (vrsta: string): React.CSSProperties => {
  const v = vrsta.toLowerCase();
  if (v.includes("racun") && !v.includes("storno")) return { color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe" };
  if (v.includes("storno")) return { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  if (v.includes("uplata")) return { color: "#0f766e", background: "#f0fdf9", border: `1px solid ${PRIMARY}40` };
  if (v.includes("isplata")) return { color: "#ea580c", background: "#fff7ed", border: "1px solid #fed7aa" };
  return { color: "#374151", background: "#f9fafb", border: "1px solid #e5e7eb" };
};

export function KarticaTemplate({ partner, stavke, rekapitulacija }: Props) {
  const datumStampe = fmtDatum(new Date().toISOString());
  const saldoPositivan = Number(rekapitulacija.saldo) >= 0;

  const prvaStavkaDatum = stavke.length > 0 ? fmtDatum(stavke[0].datum) : "—";
  const zadnjaStavkaDatum = stavke.length > 0 ? fmtDatum(stavke[stavke.length - 1].datum) : "—";

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 10,
        color: "#1a1a1a",
        padding: "14mm 14mm",
        boxSizing: "border-box",
        background: "white",
      }}
    >
      {/* ── Zaglavlje ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: `3px solid ${PRIMARY}`,
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY }}>Karpas Ambalaže</div>
          <div style={{ fontSize: 8, color: "#888", marginTop: 2 }}>Prodaja — sistem za upravljanje</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
            Dokument
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Kartica partnera
          </div>
          <div style={{ fontSize: 8, color: "#888", marginTop: 3 }}>
            Period: {prvaStavkaDatum} — {zadnjaStavkaDatum}
          </div>
        </div>
      </div>

      {/* ── Partner info ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div
          style={{
            flex: 2,
            background: `${PRIMARY}0a`,
            border: `1px solid ${PRIMARY}30`,
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 7, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Partner
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{partner.naziv_partnera}</div>
          <div style={{ fontSize: 8, color: "#666", marginTop: 3 }}>
            {[partner.adresa_partnera, partner.Naziv_grada].filter(Boolean).join(", ")}
          </div>
          <div style={{ fontSize: 8, color: "#999", marginTop: 1 }}>Šifra: {partner.sifra_partnera}</div>
        </div>

        {/* Rekapitulacija */}
        <div
          style={{
            flex: 3,
            border: `1px solid #e5e7eb`,
            borderRadius: 6,
            padding: "10px 14px",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontSize: 7, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Rekapitulacija
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 16px" }}>
            {[
              { label: "Početno stanje", value: rekapitulacija.pocetno_stanje, color: "#374151" },
              { label: "Ukupno računi", value: rekapitulacija.ukupno_racuni, color: "#1d4ed8" },
              { label: "Ukupno storna", value: rekapitulacija.ukupno_storna, color: "#dc2626" },
              { label: "Ukupno uplate", value: rekapitulacija.ukupno_uplate, color: PRIMARY },
              { label: "Ukupno isplate", value: rekapitulacija.ukupno_isplate, color: "#ea580c" },
              { label: "SALDO", value: rekapitulacija.saldo, color: saldoPositivan ? PRIMARY : ACCENT, bold: true },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 7, color: "#888", marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: item.bold ? 11 : 9, fontWeight: item.bold ? 800 : 600, color: item.color }}>
                  {fmt(item.value)} KM
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabela stavki ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 7, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          Stavke kartice ({stavke.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: PRIMARY }}>
              {[
                { label: "#",          right: false, w: "3%"  },
                { label: "Datum",      right: false, w: "10%" },
                { label: "Vrsta",      right: false, w: "22%" },
                { label: "Opis",       right: false, w: "33%" },
                { label: "Duguje",     right: true,  w: "12%" },
                { label: "Potražuje",  right: true,  w: "12%" },
                { label: "Saldo",      right: true,  w: "12%" },
              ].map(({ label, right, w }) => (
                <th
                  key={label}
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: 7,
                    padding: "5px 6px",
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
            {stavke.map((s, i) => {
              const saldoNum = Number(s.saldo);
              const vs = vrstaStyle(s.vrsta);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f9fffe" : "white" }}>
                  <td style={cell}>{i + 1}</td>
                  <td style={{ ...cell, fontFamily: "monospace", fontSize: 8, color: "#555", whiteSpace: "nowrap" }}>
                    {fmtDatum(s.datum)}
                  </td>
                  <td style={cell}>
                    <span
                      style={{
                        ...vs,
                        fontSize: 7,
                        fontWeight: 600,
                        padding: "1px 5px",
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.vrsta}
                    </span>
                  </td>
                  <td style={{ ...cell, color: "#444", maxWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.opis}
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: Number(s.duguje) !== 0 ? "#1d4ed8" : "#ccc" }}>
                    {Number(s.duguje) !== 0 ? fmt(s.duguje) : "—"}
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: Number(s.potrazuje) !== 0 ? PRIMARY : "#ccc" }}>
                    {Number(s.potrazuje) !== 0 ? fmt(s.potrazuje) : "—"}
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: saldoNum >= 0 ? PRIMARY : ACCENT, whiteSpace: "nowrap" }}>
                    {fmt(s.saldo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${PRIMARY}`, background: `${PRIMARY}0a` }}>
              <td colSpan={4} style={{ ...cell, fontWeight: 700, fontSize: 9, textAlign: "right", color: "#333" }}>
                UKUPNO:
              </td>
              <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 9, color: "#1d4ed8" }}>
                {fmt(stavke.reduce((s, r) => s + Number(r.duguje), 0))}
              </td>
              <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 9, color: PRIMARY }}>
                {fmt(stavke.reduce((s, r) => s + Number(r.potrazuje), 0))}
              </td>
              <td style={{ ...cell, textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: 10, color: saldoPositivan ? PRIMARY : ACCENT }}>
                {fmt(rekapitulacija.saldo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 7,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 7,
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
  padding: "4px 6px",
  fontSize: 9,
  borderBottom: "1px solid #e8f5f3",
  verticalAlign: "middle",
};
