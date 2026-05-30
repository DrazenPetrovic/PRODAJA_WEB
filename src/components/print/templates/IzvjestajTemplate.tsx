interface Props {
  username: string;
  roleLabel: string;
  printServiceStatus: "checking" | "online" | "offline";
  generatedAt: string;
}

export function IzvjestajTemplate(_props: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "white",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <img
        src="/PRIMJER_IZVJESTAJA_page1.png"
        alt="Primjer izvještaja"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
    </div>
  );
}
