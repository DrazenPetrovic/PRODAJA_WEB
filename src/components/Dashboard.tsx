import ReactDOM from "react-dom";
import { RacunUnos } from "./RacunUnos";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ChevronDown,
  FileText,
  LogOut,
  Moon,
  PenLine,
  Receipt,
  Settings,
  Sun,
  TrendingUp,
} from "lucide-react";

const PRIMARY = "#0F766E";
const PRIMARY_DARK = "#0A534D";
const ACCENT = "#F97316";

interface DashboardProps {
  username: string;
  vrstaRadnika: number;
  onLogout: () => void;
}

type MenuSection = "file-opcije" | "racun-unos" | "racun-pregled" | null;

export function Dashboard({ username, vrstaRadnika, onLogout }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<MenuSection>(null);
  const [openMenu, setOpenMenu] = useState<"file" | "racun" | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [hoveredBtn, setHoveredBtn] = useState<"file" | "racun" | null>(null);

  const fileBtnRef = useRef<HTMLButtonElement>(null);
  const racunBtnRef = useRef<HTMLButtonElement>(null);
  const fileDropRef = useRef<HTMLDivElement>(null);
  const racunDropRef = useRef<HTMLDivElement>(null);

  const isAdministrator = vrstaRadnika === 1;
  const roleLabel = isAdministrator ? "Administrator" : "Korisnik";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inFile = fileBtnRef.current?.contains(t) || fileDropRef.current?.contains(t);
      const inRacun = racunBtnRef.current?.contains(t) || racunDropRef.current?.contains(t);
      if (!inFile && !inRacun) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMenu = (menu: "file" | "racun") => {
    const ref = menu === "file" ? fileBtnRef : racunBtnRef;
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left });
    }
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSectionChange = (section: MenuSection) => {
    setActiveSection(section);
    setOpenMenu(null);
  };

  const navBtnStyle = (menu: "file" | "racun", isActive: boolean): React.CSSProperties => ({
    background: isActive || hoveredBtn === menu ? ACCENT : PRIMARY,
    borderColor: ACCENT,
    color: "#fff",
  });

  const navBtnBase =
    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 whitespace-nowrap";

  const dropdownItemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
      active
        ? "text-white"
        : "text-gray-700 dark:text-[#a8d5cf] hover:bg-teal-50 dark:hover:bg-[#1a3d38]"
    }`;

  const dropBg = "bg-white dark:bg-[#0f2320] border-gray-100 dark:border-[#1a3d38]";
  const dropStripeBg = "bg-[#f0faf9] dark:bg-[#0d2b27]";

  return (
    <div className="min-h-screen bg-[#f0faf9] dark:bg-[#0a1e1c]">
      {/* Header */}
      <header style={{ background: PRIMARY }} className="text-white shadow-lg">
        <div className="mx-[15px] px-[5px] py-3 flex items-center justify-between relative">
          <button
            onClick={() => handleSectionChange(null)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            title="Početna strana"
          >
            <img
              src="/foto/karpas_logo_software.png"
              alt="Karpas logo"
              className="h-10 w-10 object-contain rounded-lg bg-white/40 p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <p className="text-lg font-bold leading-tight tracking-wide" style={{ color: ACCENT }}>
              Prodaja
            </p>
          </button>

          <button
            onClick={() => handleSectionChange(null)}
            className="absolute left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center hover:opacity-80 transition-opacity"
            title="Početna strana"
          >
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">
              Karpas Ambalaže
            </p>
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
              Prodaja
            </p>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-xs text-white/50 font-medium uppercase tracking-wider">
                {roleLabel}:
              </p>
              <p className="text-sm font-semibold uppercase" style={{ color: ACCENT }}>
                {username}
              </p>
            </div>
            <button
              onClick={onLogout}
              style={{ background: PRIMARY_DARK }}
              className="flex items-center gap-2 hover:brightness-110 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow"
            >
              <LogOut size={15} />
              Odjava
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title={theme === "dark" ? "Svjetla tema" : "Tamna tema"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Accent stripe */}
        <div className="h-1" style={{ background: ACCENT }} />
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-[#0d2b27] shadow-sm border-b border-gray-100 dark:border-[#1a3d38]">
        <div className="mx-[5px] px-[5px] flex gap-2 py-3 items-center justify-center">

          {/* FILE */}
          <div>
            <button
              ref={fileBtnRef}
              onClick={() => toggleMenu("file")}
              className={navBtnBase}
              style={navBtnStyle("file", !!(openMenu === "file" || activeSection === "file-opcije"))}
              onMouseEnter={() => setHoveredBtn("file")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg"
                style={{ background: "rgba(255,255,255,0.85)" }}
              >
                <FileText size={13} style={{ color: "#111" }} />
              </span>
              File
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openMenu === "file" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "file" &&
              ReactDOM.createPortal(
                <div
                  ref={fileDropRef}
                  style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
                  className={`w-52 rounded-2xl border ${dropBg} shadow-2xl overflow-hidden`}
                >
                  <div
                    className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${dropStripeBg}`}
                    style={{ color: PRIMARY }}
                  >
                    <FileText size={12} />
                    File
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleSectionChange("file-opcije")}
                      className={dropdownItemClass(activeSection === "file-opcije")}
                      style={activeSection === "file-opcije" ? { background: PRIMARY } : {}}
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "file-opcije" ? "" : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={activeSection === "file-opcije" ? { background: "rgba(255,255,255,0.2)" } : {}}
                      >
                        <Settings
                          size={13}
                          style={{ color: activeSection === "file-opcije" ? "#fff" : PRIMARY }}
                        />
                      </span>
                      Opcije
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {/* RAČUN */}
          <div>
            <button
              ref={racunBtnRef}
              onClick={() => toggleMenu("racun")}
              className={navBtnBase}
              style={navBtnStyle("racun", !!(openMenu === "racun" || activeSection === "racun-pregled"))}
              onMouseEnter={() => setHoveredBtn("racun")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg"
                style={{ background: "rgba(255,255,255,0.85)" }}
              >
                <Receipt size={13} style={{ color: "#111" }} />
              </span>
              Račun
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openMenu === "racun" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "racun" &&
              ReactDOM.createPortal(
                <div
                  ref={racunDropRef}
                  style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
                  className={`w-52 rounded-2xl border ${dropBg} shadow-2xl overflow-hidden`}
                >
                  <div
                    className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2"
                    style={{ background: "#fff7ed", color: ACCENT }}
                  >
                    <Receipt size={12} />
                    Račun
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleSectionChange("racun-unos")}
                      className={dropdownItemClass(activeSection === "racun-unos")}
                      style={activeSection === "racun-unos" ? { background: PRIMARY } : {}}
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "racun-unos" ? "" : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={activeSection === "racun-unos" ? { background: "rgba(255,255,255,0.2)" } : {}}
                      >
                        <PenLine
                          size={13}
                          style={{ color: activeSection === "racun-unos" ? "#fff" : PRIMARY }}
                        />
                      </span>
                      Unos računa
                    </button>

                    <button
                      onClick={() => handleSectionChange("racun-pregled")}
                      className={dropdownItemClass(activeSection === "racun-pregled")}
                      style={activeSection === "racun-pregled" ? { background: PRIMARY } : {}}
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "racun-pregled" ? "" : "bg-[#fff7ed] dark:bg-[#2a1a08]"
                        }`}
                        style={activeSection === "racun-pregled" ? { background: "rgba(255,255,255,0.2)" } : {}}
                      >
                        <TrendingUp
                          size={13}
                          style={{ color: activeSection === "racun-pregled" ? "#fff" : ACCENT }}
                        />
                      </span>
                      Pregled računa
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>

        </div>
      </nav>

      {/* Content */}
      <main className="mx-[5px] px-[5px] py-[5px]">

        {activeSection === "file-opcije" && (
          <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a3d38] p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#e6f7f5] dark:bg-[#0d2b27]">
                <Settings size={20} style={{ color: PRIMARY }} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-[#e6f4f2]">Opcije</h2>
            </div>
            <p className="text-gray-500 dark:text-[#4a7a74]">Podešavanja modula File.</p>
          </div>
        )}

        {activeSection === "racun-unos" && <RacunUnos />}

        {activeSection === "racun-pregled" && (
          <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a3d38] p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#fff7ed] dark:bg-[#2a1a08]">
                <Receipt size={20} style={{ color: ACCENT }} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-[#e6f4f2]">Pregled računa</h2>
            </div>
            <p className="text-gray-500 dark:text-[#4a7a74]">Prikaz i pretraga računa.</p>
          </div>
        )}
      </main>
    </div>
  );
}
