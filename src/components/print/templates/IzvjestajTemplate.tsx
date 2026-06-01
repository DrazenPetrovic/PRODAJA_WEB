interface Props {
  username: string;
  roleLabel: string;
  printServiceStatus: "checking" | "online" | "offline";
  generatedAt: string;
}

const border = "1px solid #000";

const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
  border,
  padding: "2px 5px",
  ...extra,
});

const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  border,
  padding: "2px 5px",
  fontWeight: "bold",
  textAlign: "left",
  background: "white",
  ...extra,
});

export function IzvjestajTemplate({ username, generatedAt }: Props) {
  const datum = new Date(generatedAt).toLocaleDateString("bs-BA");
  const novcanice = ["200", "100", "50", "20", "10", "5", "2", "1", "0.5", "0.2", "0.1", "0.05", "€"];

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "8mm 12mm",
        boxSizing: "border-box",
        background: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "9px",
        color: "#000",
        lineHeight: 1.3,
      }}
    >
      {/* Naslov */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "11px",
          marginBottom: "6px",
          letterSpacing: "0.5px",
        }}
      >
        IZVJEŠTAJ O NAPLATI K RAČUNA
      </div>

      {/* DATUM / TEREN / RADNIK */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}
      >
        <tbody>
          <tr>
            <td style={th({ width: "45px" })}>DATUM:</td>
            <td style={cell({ width: "90px" })}>{datum}</td>
            <td style={th({ width: "45px" })}>TEREN:</td>
            <td style={cell({ width: "90px" })}>&nbsp;</td>
            <td style={th({ width: "50px" })}>RADNIK:</td>
            <td style={cell()}>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* Glavna tabela računa */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}
      >
        <thead>
          <tr>
            <th style={th({ width: "28px", textAlign: "center" })}>Rb.</th>
            <th style={th()}>Naziv kupca</th>
            <th style={th({ width: "60px" })}>Datum</th>
            <th style={th({ width: "70px" })}>Br.računa</th>
            <th style={th({ width: "70px", textAlign: "right" })}>Ukupno</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => (
            <tr key={i}>
              <td style={cell({ height: "14px", textAlign: "center" })}>{i === 0 ? "1" : ""}</td>
              <td style={cell()}>&nbsp;</td>
              <td style={cell()}>&nbsp;</td>
              <td style={cell()}>&nbsp;</td>
              <td style={cell({ textAlign: "right" })}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rekapitulacija */}
      <table
        style={{ width: "50%", borderCollapse: "collapse", marginBottom: "4px" }}
      >
        <tbody>
          <tr>
            <td colSpan={2} style={cell({ fontWeight: "bold" })}>
              Ukupno računa: 1
            </td>
          </tr>
          {[
            "Ukupno naplata K.računa:",
            "Ukupno naplata G.računa:",
            "Odbitak:",
            "Suma:",
          ].map((label) => (
            <tr key={label}>
              <td style={cell({ width: "160px" })}>{label}</td>
              <td style={cell({ width: "80px" })}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Red novčanica */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}
      >
        <tbody>
          <tr>
            {novcanice.map((v) => (
              <td key={v} style={cell({ textAlign: "center", fontWeight: v === "€" ? "bold" : "normal" })}>
                {v}
              </td>
            ))}
          </tr>
          <tr>
            {novcanice.map((v) => (
              <td key={v} style={cell({ height: "18px" })}>&nbsp;</td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* POVRAT ROBE */}
      <div style={{ fontWeight: "bold", marginBottom: "3px", fontSize: "9px" }}>
        POVRAT ROBE
      </div>
      <table
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th style={th({ width: "45px" })}>Br.ref.</th>
            <th style={th()}>Naziv artikla</th>
            <th style={th({ width: "80px" })}>Vraćena količina</th>
            <th style={th({ width: "100px" })}>Razlog vraćanja</th>
            <th style={th({ width: "110px" })}>Potpis magacionera</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }, (_, i) => (
            <tr key={i}>
              <td
                style={{
                  borderBottom: border,
                  borderLeft: border,
                  borderRight: border,
                  padding: "2px 5px",
                  height: "16px",
                }}
              >&nbsp;</td>
              <td style={{ borderBottom: border, borderRight: border, padding: "2px 5px" }}>&nbsp;</td>
              <td style={{ borderBottom: border, borderRight: border, padding: "2px 5px" }}>&nbsp;</td>
              <td style={{ borderBottom: border, borderRight: border, padding: "2px 5px" }}>&nbsp;</td>
              <td style={{ borderBottom: border, borderRight: border, padding: "2px 5px" }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
