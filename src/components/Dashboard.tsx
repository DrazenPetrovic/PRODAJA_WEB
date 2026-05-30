import ReactDOM from "react-dom";
import { RacunUnos } from "./RacunUnos";
import { RacunPregled } from "./RacunPregled";
import { RacunStorno } from "./RacunStorno";
import { BlagajnaUplate } from "./BlagajnaUplate";
import { BlagajnaIsplate } from "./BlagajnaIsplate";
import { BlagajnaPregledUplata } from "./BlagajnaPregledUplata";
import { BlagajnaPregledIsplata } from "./BlagajnaPregledIsplata";
import { BlagajnaStanje } from "./BlagajnaStanje";
import { KarticaPartnera } from "./KarticaPartnera";
import { PrintModal, type PrintJob } from "./print/PrintModal";
import { IzvjestajTemplate } from "./print/templates/IzvjestajTemplate";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  bytesToBase64,
  getAvailablePrinters,
  mapPrintError,
  sendPrintJob,
} from "../utils/printService";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Landmark,
  LogOut,
  Moon,
  PenLine,
  Receipt,
  RotateCcw,
  Settings,
  Sun,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const PRIMARY = "#0F766E";
const PRIMARY_DARK = "#0A534D";
const ACCENT = "#F97316";

interface DashboardProps {
  username: string;
  vrstaRadnika: number;
  onLogout: () => void;
}

type MenuKey = "file" | "racun" | "blagajna" | "kartica";

type MenuSection =
  | "file-opcije"
  | "racun-unos"
  | "racun-storno"
  | "racun-pregled"
  | "blagajna-stanje"
  | "blagajna-uplate"
  | "blagajna-isplate"
  | "blagajna-pregled-uplata"
  | "blagajna-pregled-isplata"
  | "kartica-partnera"
  | null;

type NotifyTone = "success" | "error";

interface NotifyOptions {
  tone?: NotifyTone;
  durationMs?: number;
}

interface NotifyPayload {
  message: string;
  tone?: NotifyTone;
  durationMs?: number;
}

export function Dashboard({
  username,
  vrstaRadnika,
  onLogout,
}: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<MenuSection>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [hoveredBtn, setHoveredBtn] = useState<MenuKey | null>(null);
  const [notifKey, setNotifKey] = useState(0);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [notifTone, setNotifTone] = useState<NotifyTone>("success");
  const [notifDurationMs, setNotifDurationMs] = useState(5000);
  const [printServiceStatus, setPrintServiceStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printStatusRef = useRef<"checking" | "online" | "offline">("checking");

  const fileBtnRef = useRef<HTMLButtonElement>(null);
  const racunBtnRef = useRef<HTMLButtonElement>(null);
  const blagajnaBtnRef = useRef<HTMLButtonElement>(null);
  const karticaBtnRef = useRef<HTMLButtonElement>(null);
  const fileDropRef = useRef<HTMLDivElement>(null);
  const racunDropRef = useRef<HTMLDivElement>(null);
  const blagajnaDropRef = useRef<HTMLDivElement>(null);
  const karticaDropRef = useRef<HTMLDivElement>(null);

  const isAdministrator = vrstaRadnika === 1;
  const roleLabel = isAdministrator ? "Administrator" : "Korisnik";
  const printerStorageKey = `printService.printer.${username}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inFile =
        fileBtnRef.current?.contains(t) || fileDropRef.current?.contains(t);
      const inRacun =
        racunBtnRef.current?.contains(t) || racunDropRef.current?.contains(t);
      const inBlagajna =
        blagajnaBtnRef.current?.contains(t) ||
        blagajnaDropRef.current?.contains(t);
      const inKartica =
        karticaBtnRef.current?.contains(t) ||
        karticaDropRef.current?.contains(t);
      if (!inFile && !inRacun && !inBlagajna && !inKartica) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMenu = (menu: MenuKey) => {
    const refs: Record<MenuKey, React.RefObject<HTMLButtonElement>> = {
      file: fileBtnRef,
      racun: racunBtnRef,
      blagajna: blagajnaBtnRef,
      kartica: karticaBtnRef,
    };
    const ref = refs[menu];
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

  const showNotif = (msg: string, options?: NotifyOptions) => {
    const tone = options?.tone ?? "success";
    const durationMs = options?.durationMs ?? 5000;

    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotifMsg(msg);
    setNotifTone(tone);
    setNotifDurationMs(durationMs);
    setNotifKey((k) => k + 1);
    notifTimerRef.current = setTimeout(() => setNotifMsg(null), durationMs);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string | NotifyPayload>;
      const detail = customEvent.detail;

      if (typeof detail === "string" && detail.trim()) {
        showNotif(detail);
        return;
      }

      if (
        detail &&
        typeof detail === "object" &&
        typeof detail.message === "string" &&
        detail.message.trim()
      ) {
        showNotif(detail.message, {
          tone: detail.tone,
          durationMs: detail.durationMs,
        });
      }
    };

    window.addEventListener("app-notify", handler as EventListener);
    return () => {
      window.removeEventListener("app-notify", handler as EventListener);
    };
  }, []);

  const handleRacunKreiran = () => showNotif("USPJEŠNO UNESENO");

  const handleUplataSuccess = (iznos: number, partner: string) =>
    showNotif(
      `${iznos.toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM · ${partner}`,
    );

  const handleIsplataSuccess = (iznos: number, opis: string) =>
    showNotif(
      `${iznos.toLocaleString("bs-BA", { minimumFractionDigits: 2 })} KM · ${opis}`,
    );

  const handleStampajIzvjestaj = () => {
    setOpenMenu(null);
    setPrintJob({
      title: `Izvještaj — ${username}`,
      defaultFormat: "A4",
      orientation: "portrait",
      allowBrowserPrintFallback: true,
      component: (
        <IzvjestajTemplate
          username={username}
          roleLabel={roleLabel}
          printServiceStatus={printServiceStatus}
          generatedAt={new Date().toISOString()}
        />
      ),
      onPrint: async ({ format, orientation }) => {
        if (!selectedPrinter.trim()) {
          showNotif("Odaberi printer u Opcije prije štampe.");
          return;
        }

        try {
          const response = await fetch("/PRIMJER_IZVJESTAJA.pdf", {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            showNotif("Uzorak izvještaja nije pronađen.");
            return;
          }

          const buffer = await response.arrayBuffer();
          const documentBase64 = bytesToBase64(new Uint8Array(buffer));

          await sendPrintJob({
            appId: "prodaja-web",
            mode: "pdf",
            paperSize: format,
            orientation,
            printerName: selectedPrinter.trim(),
            copies: 1,
            documentType: "racun",
            documentBase64,
          });

          showNotif("Dokument je poslan na štampu.");
          setPrintJob(null);
        } catch (error) {
          const code =
            typeof error === "object" && error !== null && "code" in error
              ? String((error as { code: unknown }).code)
              : undefined;
          showNotif(mapPrintError(code));
        }
      },
    });
  };

  const loadPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const list = await getAvailablePrinters();
      setPrinters(list);
    } catch {
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const savePrinter = () => {
    const printer = selectedPrinter.trim();
    if (!printer) {
      showNotif("Unesi ili izaberi printer.");
      return;
    }

    localStorage.setItem(printerStorageKey, printer);
    showNotif(`Sačuvan printer: ${printer}`);
  };

  useEffect(() => {
    if (!username) return;
    const saved = localStorage.getItem(printerStorageKey);
    if (saved) setSelectedPrinter(saved);
    void loadPrinters();
  }, [username]);

  useEffect(() => {
    let mounted = true;
    const healthUrl = "http://127.0.0.1:4567/health";

    const setServiceStatus = (nextStatus: "online" | "offline") => {
      setPrintServiceStatus(nextStatus);

      if (
        printStatusRef.current !== "checking" &&
        printStatusRef.current !== nextStatus
      ) {
        showNotif(
          nextStatus === "online"
            ? "Print servis je ponovo dostupan"
            : "Print servis nije dostupan",
        );
      }

      printStatusRef.current = nextStatus;
    };

    const pingNoCors = async () => {
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(
        () => fallbackController.abort(),
        2500,
      );

      try {
        await fetch(healthUrl, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          signal: fallbackController.signal,
        });
        return true;
      } catch {
        return false;
      } finally {
        clearTimeout(fallbackTimeoutId);
      }
    };

    const checkPrintService = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const response = await fetch(healthUrl, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        let isOnline = response.ok;
        if (!isOnline) {
          isOnline = await pingNoCors();
        }

        if (!mounted) return;

        setServiceStatus(isOnline ? "online" : "offline");
      } catch {
        const isOnline = await pingNoCors();
        if (!mounted) return;

        setServiceStatus(isOnline ? "online" : "offline");
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkPrintService();
    const intervalId = setInterval(checkPrintService, 10000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const navBtnStyle = (
    menu: MenuKey,
    isActive: boolean,
  ): React.CSSProperties => ({
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

  const dropBg =
    "bg-white dark:bg-[#0f2320] border-gray-100 dark:border-[#1a3d38]";
  const dropStripeBg = "bg-[#f0faf9] dark:bg-[#0d2b27]";

  const racunActive = !!(
    openMenu === "racun" ||
    activeSection === "racun-unos" ||
    activeSection === "racun-storno" ||
    activeSection === "racun-pregled"
  );

  const blagajnaActive = !!(
    openMenu === "blagajna" ||
    activeSection === "blagajna-uplate" ||
    activeSection === "blagajna-isplate" ||
    activeSection === "blagajna-pregled-uplata" ||
    activeSection === "blagajna-pregled-isplata"
  );

  const karticaActive = !!(
    openMenu === "kartica" || activeSection === "kartica-partnera"
  );

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
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <p
              className="text-lg font-bold leading-tight tracking-wide"
              style={{ color: ACCENT }}
            >
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
            <p
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: ACCENT }}
            >
              Prodaja
            </p>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/50 font-medium uppercase tracking-wider">
                    {roleLabel}:
                  </p>
                  <p
                    className="text-sm font-semibold uppercase"
                    style={{ color: ACCENT }}
                  >
                    {username}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      background:
                        printServiceStatus === "online"
                          ? "#22c55e"
                          : printServiceStatus === "offline"
                            ? "#ef4444"
                            : "#f59e0b",
                    }}
                  />
                  <p className="text-[10px] uppercase tracking-wide text-white/70 font-medium">
                    Print servis:{" "}
                    {printServiceStatus === "online"
                      ? "online"
                      : printServiceStatus === "offline"
                        ? "offline"
                        : "provjera"}
                  </p>
                </div>
              </div>
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
        <div className="mx-[5px] px-[5px] flex gap-2 py-3 items-center justify-center relative">
          {/* FILE */}
          <div>
            <button
              ref={fileBtnRef}
              onClick={() => toggleMenu("file")}
              className={navBtnBase}
              style={navBtnStyle(
                "file",
                !!(openMenu === "file" || activeSection === "file-opcije"),
              )}
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
                  style={{
                    position: "fixed",
                    top: dropPos.top,
                    left: dropPos.left,
                    zIndex: 9999,
                  }}
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
                      className={dropdownItemClass(
                        activeSection === "file-opcije",
                      )}
                      style={
                        activeSection === "file-opcije"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "file-opcije"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "file-opcije"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <Settings
                          size={13}
                          style={{
                            color:
                              activeSection === "file-opcije"
                                ? "#fff"
                                : PRIMARY,
                          }}
                        />
                      </span>
                      Opcije
                    </button>

                    <button
                      onClick={handleStampajIzvjestaj}
                      className={dropdownItemClass(false)}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 bg-[#e6f7f5] dark:bg-[#0d2b27]">
                        <ClipboardList size={13} style={{ color: PRIMARY }} />
                      </span>
                      Štampaj izvještaj
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
              style={navBtnStyle("racun", racunActive)}
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
                  style={{
                    position: "fixed",
                    top: dropPos.top,
                    left: dropPos.left,
                    zIndex: 9999,
                  }}
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
                      className={dropdownItemClass(
                        activeSection === "racun-unos",
                      )}
                      style={
                        activeSection === "racun-unos"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "racun-unos"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "racun-unos"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <PenLine
                          size={13}
                          style={{
                            color:
                              activeSection === "racun-unos" ? "#fff" : PRIMARY,
                          }}
                        />
                      </span>
                      Unos računa
                    </button>

                    <button
                      onClick={() => handleSectionChange("racun-storno")}
                      className={dropdownItemClass(
                        activeSection === "racun-storno",
                      )}
                      style={
                        activeSection === "racun-storno"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "racun-storno"
                            ? ""
                            : "bg-[#fff7ed] dark:bg-[#2a1a08]"
                        }`}
                        style={
                          activeSection === "racun-storno"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <RotateCcw
                          size={13}
                          style={{
                            color:
                              activeSection === "racun-storno"
                                ? "#fff"
                                : ACCENT,
                          }}
                        />
                      </span>
                      Storniranje računa
                    </button>

                    <button
                      onClick={() => handleSectionChange("racun-pregled")}
                      className={dropdownItemClass(
                        activeSection === "racun-pregled",
                      )}
                      style={
                        activeSection === "racun-pregled"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "racun-pregled"
                            ? ""
                            : "bg-[#fff7ed] dark:bg-[#2a1a08]"
                        }`}
                        style={
                          activeSection === "racun-pregled"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <TrendingUp
                          size={13}
                          style={{
                            color:
                              activeSection === "racun-pregled"
                                ? "#fff"
                                : ACCENT,
                          }}
                        />
                      </span>
                      Pregled računa
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {/* BLAGAJNA */}
          <div>
            <button
              ref={blagajnaBtnRef}
              onClick={() => toggleMenu("blagajna")}
              className={navBtnBase}
              style={navBtnStyle("blagajna", blagajnaActive)}
              onMouseEnter={() => setHoveredBtn("blagajna")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg"
                style={{ background: "rgba(255,255,255,0.85)" }}
              >
                <Wallet size={13} style={{ color: "#111" }} />
              </span>
              Blagajna
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openMenu === "blagajna" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "blagajna" &&
              ReactDOM.createPortal(
                <div
                  ref={blagajnaDropRef}
                  style={{
                    position: "fixed",
                    top: dropPos.top,
                    left: dropPos.left,
                    zIndex: 9999,
                  }}
                  className={`w-52 rounded-2xl border ${dropBg} shadow-2xl overflow-hidden`}
                >
                  <div
                    className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${dropStripeBg}`}
                    style={{ color: PRIMARY }}
                  >
                    <Wallet size={12} />
                    Blagajna
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleSectionChange("blagajna-stanje")}
                      className={dropdownItemClass(
                        activeSection === "blagajna-stanje",
                      )}
                      style={
                        activeSection === "blagajna-stanje"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "blagajna-stanje"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "blagajna-stanje"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <Landmark
                          size={13}
                          style={{
                            color:
                              activeSection === "blagajna-stanje"
                                ? "#fff"
                                : PRIMARY,
                          }}
                        />
                      </span>
                      Stanje blagajne
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-[#1a3d38] my-1" />

                    <button
                      onClick={() => handleSectionChange("blagajna-uplate")}
                      className={dropdownItemClass(
                        activeSection === "blagajna-uplate",
                      )}
                      style={
                        activeSection === "blagajna-uplate"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "blagajna-uplate"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "blagajna-uplate"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <ArrowDownCircle
                          size={13}
                          style={{
                            color:
                              activeSection === "blagajna-uplate"
                                ? "#fff"
                                : PRIMARY,
                          }}
                        />
                      </span>
                      Uplate
                    </button>

                    <button
                      onClick={() => handleSectionChange("blagajna-isplate")}
                      className={dropdownItemClass(
                        activeSection === "blagajna-isplate",
                      )}
                      style={
                        activeSection === "blagajna-isplate"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "blagajna-isplate"
                            ? ""
                            : "bg-[#fff7ed] dark:bg-[#2a1a08]"
                        }`}
                        style={
                          activeSection === "blagajna-isplate"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <ArrowUpCircle
                          size={13}
                          style={{
                            color:
                              activeSection === "blagajna-isplate"
                                ? "#fff"
                                : ACCENT,
                          }}
                        />
                      </span>
                      Isplate
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-[#1a3d38] my-1" />

                    <button
                      onClick={() =>
                        handleSectionChange("blagajna-pregled-uplata")
                      }
                      className={dropdownItemClass(
                        activeSection === "blagajna-pregled-uplata",
                      )}
                      style={
                        activeSection === "blagajna-pregled-uplata"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "blagajna-pregled-uplata"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "blagajna-pregled-uplata"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <ClipboardList
                          size={13}
                          style={{
                            color:
                              activeSection === "blagajna-pregled-uplata"
                                ? "#fff"
                                : PRIMARY,
                          }}
                        />
                      </span>
                      Pregled uplata
                    </button>

                    <button
                      onClick={() =>
                        handleSectionChange("blagajna-pregled-isplata")
                      }
                      className={dropdownItemClass(
                        activeSection === "blagajna-pregled-isplata",
                      )}
                      style={
                        activeSection === "blagajna-pregled-isplata"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "blagajna-pregled-isplata"
                            ? ""
                            : "bg-[#fff7ed] dark:bg-[#2a1a08]"
                        }`}
                        style={
                          activeSection === "blagajna-pregled-isplata"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <ClipboardList
                          size={13}
                          style={{
                            color:
                              activeSection === "blagajna-pregled-isplata"
                                ? "#fff"
                                : ACCENT,
                          }}
                        />
                      </span>
                      Pregled isplata
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {/* KARTICA */}
          <div>
            <button
              ref={karticaBtnRef}
              onClick={() => toggleMenu("kartica")}
              className={navBtnBase}
              style={navBtnStyle("kartica", karticaActive)}
              onMouseEnter={() => setHoveredBtn("kartica")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg"
                style={{ background: "rgba(255,255,255,0.85)" }}
              >
                <CreditCard size={13} style={{ color: "#111" }} />
              </span>
              Kartica
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openMenu === "kartica" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "kartica" &&
              ReactDOM.createPortal(
                <div
                  ref={karticaDropRef}
                  style={{
                    position: "fixed",
                    top: dropPos.top,
                    left: dropPos.left,
                    zIndex: 9999,
                  }}
                  className={`w-52 rounded-2xl border ${dropBg} shadow-2xl overflow-hidden`}
                >
                  <div
                    className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${dropStripeBg}`}
                    style={{ color: PRIMARY }}
                  >
                    <CreditCard size={12} />
                    Kartica
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleSectionChange("kartica-partnera")}
                      className={dropdownItemClass(
                        activeSection === "kartica-partnera",
                      )}
                      style={
                        activeSection === "kartica-partnera"
                          ? { background: PRIMARY }
                          : {}
                      }
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${
                          activeSection === "kartica-partnera"
                            ? ""
                            : "bg-[#e6f7f5] dark:bg-[#0d2b27]"
                        }`}
                        style={
                          activeSection === "kartica-partnera"
                            ? { background: "rgba(255,255,255,0.2)" }
                            : {}
                        }
                      >
                        <Users
                          size={13}
                          style={{
                            color:
                              activeSection === "kartica-partnera"
                                ? "#fff"
                                : PRIMARY,
                          }}
                        />
                      </span>
                      Kartica partnera
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {/* Notifikacija */}
          {notifMsg && (
            <div
              key={notifKey}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg"
              style={{
                background: notifTone === "error" ? "#DC2626" : PRIMARY,
                animation: `fadeInOut ${Math.max(1, notifDurationMs / 1000)}s ease forwards`,
                maxWidth: 360,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.2)" />
                {notifTone === "error" ? (
                  <path
                    d="M8 4.25V8.75"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4.5 8L7 10.5L11.5 5.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {notifTone === "error" && (
                  <circle cx="8" cy="11.5" r="1" fill="white" />
                )}
              </svg>
              <span className="truncate">{notifMsg}</span>
            </div>
          )}
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
              <h2 className="text-xl font-bold text-gray-800 dark:text-[#e6f4f2]">
                Opcije
              </h2>
            </div>

            <div className="max-w-xl rounded-2xl border border-gray-200 dark:border-[#1a3d38] p-4 bg-[#f9fffe] dark:bg-[#0d2b27]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#4a7a74] mb-2">
                Print servis
              </p>

              <label className="block text-sm font-semibold text-gray-700 dark:text-[#c5e0db] mb-1">
                Printer
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2]"
                >
                  <option value="">-- Izaberi printer --</option>
                  {printers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => void loadPrinters()}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#a8d5cf] hover:bg-white dark:hover:bg-[#12332f] transition-colors"
                >
                  {loadingPrinters ? "..." : "Osvježi"}
                </button>
              </div>

              <input
                type="text"
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                placeholder="Naziv printera (ručni unos)"
                className="mt-2 w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2]"
              />

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={savePrinter}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: PRIMARY }}
                >
                  Sačuvaj printer
                </button>
                <span className="text-xs text-gray-500 dark:text-[#4a7a74]">
                  Čuva se za korisnika: {username}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSection === "racun-unos" && (
          <RacunUnos onUspjeh={handleRacunKreiran} />
        )}

        {activeSection === "racun-storno" && <RacunStorno />}

        {activeSection === "racun-pregled" && <RacunPregled />}

        {activeSection === "blagajna-stanje" && <BlagajnaStanje />}

        {activeSection === "blagajna-uplate" && (
          <BlagajnaUplate onUplataSuccess={handleUplataSuccess} />
        )}

        {activeSection === "blagajna-isplate" && (
          <BlagajnaIsplate onIsplataSuccess={handleIsplataSuccess} />
        )}

        {activeSection === "blagajna-pregled-uplata" && (
          <BlagajnaPregledUplata />
        )}

        {activeSection === "blagajna-pregled-isplata" && (
          <BlagajnaPregledIsplata />
        )}

        {activeSection === "kartica-partnera" && <KarticaPartnera />}
      </main>

      {printJob && (
        <PrintModal
          job={printJob}
          onClose={() => setPrintJob(null)}
          onNotify={showNotif}
        />
      )}
    </div>
  );
}
