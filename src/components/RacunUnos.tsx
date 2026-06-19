import ReactDOM from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PrintModal, type PrintJob } from "./print/PrintModal";
import { RacunTemplate } from "./print/templates/RacunTemplate";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

interface Partner {
  sifra_partnera: string;
  naziv_partnera: string;
  adresa_partnera: string;
  Naziv_grada: string;
}

interface RazniPartner {
  sifra_partnera: string;
  naziv_partnera: string;
}

interface Grad {
  id_grada: number;
  naziv_grada: string;
}

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  kolicina_proizvoda: number | null;
  mpc: number | null;
  grupa_proizvoda: number | null;
  Naziv_grupe: string | null;
  vrsta: number | null;
}

interface StavkaRacuna {
  artikal: Artikal;
  kolicina: number;
  mpc: number;
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-1.5">
    {children}
  </label>
);

interface RacunUnosProps {
  onUspjeh?: () => void;
}

export function RacunUnos({ onUspjeh }: RacunUnosProps) {
  // ── Partneri ──────────────────────────────────────────────
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [loadingPartneri, setLoadingPartneri] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchPartneri, setSearchPartneri] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const partnerInputRef = useRef<HTMLInputElement>(null);

  // ── Razni kupac (sifra 300) ───────────────────────────────
  const [razniPartneri, setRazniPartneri] = useState<RazniPartner[]>([]);
  const [loadingRazni, setLoadingRazni] = useState(false);
  const [selectedRazni, setSelectedRazni] = useState<RazniPartner | null>(null);
  const [razniDropdownOpen, setRazniDropdownOpen] = useState(false);
  const [searchRazni, setSearchRazni] = useState("");
  const razniDropdownRef = useRef<HTMLDivElement>(null);
  const razniInputRef = useRef<HTMLInputElement>(null);

  // ── Dodaj novog partnera ──────────────────────────────────
  const [showDodajPartnera, setShowDodajPartnera] = useState(false);
  const [gradovi, setGradovi] = useState<Grad[]>([]);
  const [loadingGradovi, setLoadingGradovi] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [noviPartner, setNoviPartner] = useState({
    sifra: "",
    naziv: "",
    adresa: "",
    id_grada: "",
  });
  const [errorDodaj, setErrorDodaj] = useState("");

  // ── Artikli ───────────────────────────────────────────────
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [loadingArtikli, setLoadingArtikli] = useState(true);
  const [searchArtikli, setSearchArtikli] = useState("");

  // ── Stavke računa ─────────────────────────────────────────
  const [stavke, setStavke] = useState<StavkaRacuna[]>([]);

  // ── Potvrda računa ────────────────────────────────────────
  const [pokaziPotvrdu, setPokaziPotvrdu] = useState(false);
  const [napomena, setNapomena] = useState("");
  const [slanjePodataka, setSlanjePodataka] = useState(false);
  const [kreiraniRacun, setKreiraniRacun] = useState<{
    idRacuna: number;
    brojRacuna: string;
    referentniBroj: string;
    datumRacuna: string;
    partner: Partner;
    stavkeSnimak: StavkaRacuna[];
    napomena: string;
    ukupno: number;
  } | null>(null);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  // ── Unos artikla ──────────────────────────────────────────
  const [odabirArtikla, setOdabirArtikla] = useState<Artikal | null>(null);
  const [unosKolicina, setUnosKolicina] = useState("");
  const [unosMpc, setUnosMpc] = useState("");
  const kolicnaRef = useRef<HTMLInputElement>(null);

  // ── Fetch partneri ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/partneri`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPartneri(d.data);
      })
      .finally(() => setLoadingPartneri(false));
  }, []);

  // ── Fetch razni partneri kad se odabere sifra 300 ─────────
  useEffect(() => {
    if (String(selectedPartner?.sifra_partnera) !== "300") {
      setSelectedRazni(null);
      setRazniPartneri([]);
      return;
    }
    setLoadingRazni(true);
    fetch(`${API_URL}/api/partneri/razni`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRazniPartneri(d.data);
      })
      .finally(() => setLoadingRazni(false));
  }, [selectedPartner]);

  // ── Zatvori razni dropdown klikom vani ────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        razniDropdownRef.current &&
        !razniDropdownRef.current.contains(e.target as Node)
      ) {
        setRazniDropdownOpen(false);
        setSearchRazni("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Fetch artikli ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/artikli`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setArtikli(d.data);
      })
      .finally(() => setLoadingArtikli(false));
  }, []);

  // ── Zatvori partner dropdown klikom vani ──────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setSearchPartneri("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Popuni napomenu raznim kupcem kad se otvori modal ────────
  useEffect(() => {
    if (pokaziPotvrdu && selectedRazni) {
      setNapomena(
        `${selectedRazni.naziv_partnera}#${String(selectedRazni.sifra_partnera)}#`,
      );
    }
  }, [pokaziPotvrdu]);

  // ── Fokus na količinu kad se odabere artikal ──────────────
  useEffect(() => {
    if (!odabirArtikla) return;
    const postojeca = stavke.find(
      (s) => s.artikal.sifra_proizvoda === odabirArtikla.sifra_proizvoda,
    );
    setUnosKolicina(postojeca ? String(postojeca.kolicina) : "");
    setUnosMpc(
      postojeca ? String(postojeca.mpc) : String(odabirArtikla.mpc ?? ""),
    );
    setTimeout(() => kolicnaRef.current?.focus(), 50);
  }, [odabirArtikla]);

  // ── Escape ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOdabirArtikla(null);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Partner helpers ───────────────────────────────────────
  const filteredPartneri = partneri.filter((p) => {
    const q = searchPartneri.toLowerCase();
    return (
      (p.naziv_partnera ?? "").toLowerCase().includes(q) ||
      String(p.sifra_partnera ?? "")
        .toLowerCase()
        .includes(q) ||
      (p.Naziv_grada ?? "").toLowerCase().includes(q)
    );
  });

  const handleSelectPartner = (p: Partner) => {
    setSelectedPartner(p);
    setDropdownOpen(false);
    setSearchPartneri("");
  };

  const handleClearPartner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartner(null);
    setSearchPartneri("");
    setStavke([]);
    setOdabirArtikla(null);
    setSelectedRazni(null);
    setRazniPartneri([]);
  };

  const isRazni = String(selectedPartner?.sifra_partnera) === "300";
  const filteredRazni = razniPartneri.filter(
    (p) =>
      p.naziv_partnera.toLowerCase().includes(searchRazni.toLowerCase()) ||
      String(p.sifra_partnera).includes(searchRazni),
  );

  // ── Dodaj novog partnera helpers ──────────────────────────
  const openDodajPartnera = () => {
    setDropdownOpen(false);
    const nextSifra =
      partneri.length > 0
        ? String(
            Math.max(...partneri.map((p) => Number(p.sifra_partnera) || 0)) + 1,
          )
        : "1";
    setNoviPartner({ sifra: nextSifra, naziv: "", adresa: "", id_grada: "" });
    setErrorDodaj("");
    if (gradovi.length === 0) {
      setLoadingGradovi(true);
      fetch(`${API_URL}/api/partneri/gradovi`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setGradovi(d.data);
        })
        .finally(() => setLoadingGradovi(false));
    }
    setShowDodajPartnera(true);
  };

  const submitNoviPartner = async () => {
    if (
      !noviPartner.sifra.trim() ||
      !noviPartner.naziv.trim() ||
      !noviPartner.id_grada
    ) {
      setErrorDodaj("Šifra, naziv i grad su obavezni");
      return;
    }
    setSavingPartner(true);
    setErrorDodaj("");
    try {
      const res = await fetch(`${API_URL}/api/partneri`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sifra_partnera: noviPartner.sifra.trim(),
          naziv_partnera: noviPartner.naziv.trim(),
          adresa_partnera: noviPartner.adresa.trim(),
          id_grada: Number(noviPartner.id_grada),
        }),
      });
      const d = await res.json();
      if (!d.success) {
        setErrorDodaj(d.message ?? "Greška");
        return;
      }
      const partner: Partner = d.data;
      setPartneri((prev) =>
        [...prev, partner].sort((a, b) =>
          a.naziv_partnera.localeCompare(b.naziv_partnera),
        ),
      );
      setShowDodajPartnera(false);
      handleSelectPartner(partner);
    } catch {
      setErrorDodaj("Greška pri slanju podataka");
    } finally {
      setSavingPartner(false);
    }
  };

  // ── Artikli helpers ───────────────────────────────────────
  const artikliFiltrirani = artikli.filter((a) => {
    const q = searchArtikli.toLowerCase();
    return (
      a.naziv_proizvoda.toLowerCase().includes(q) ||
      String(a.sifra_proizvoda).includes(q) ||
      (a.Naziv_grupe ?? "").toLowerCase().includes(q)
    );
  });

  const klikniArtkal = (a: Artikal) => {
    if (odabirArtikla?.sifra_proizvoda === a.sifra_proizvoda) {
      setOdabirArtikla(null);
    } else {
      setOdabirArtikla(a);
    }
  };

  // ── Unos stavke ───────────────────────────────────────────
  const potvrdiUnos = () => {
    if (!odabirArtikla) return;
    const kol = parseFloat(unosKolicina.replace(",", "."));
    if (isNaN(kol) || kol <= 0) return;
    const mpc = parseFloat(unosMpc.replace(",", "."));
    setStavke((prev) => {
      const idx = prev.findIndex(
        (s) => s.artikal.sifra_proizvoda === odabirArtikla.sifra_proizvoda,
      );
      const nova: StavkaRacuna = {
        artikal: odabirArtikla,
        kolicina: kol,
        mpc: isNaN(mpc) ? 0 : mpc,
      };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = nova;
        return updated;
      }
      return [nova, ...prev];
    });
    setOdabirArtikla(null);
  };

  const ukloniStavku = (sifra: number) =>
    setStavke((prev) =>
      prev.filter((s) => s.artikal.sifra_proizvoda !== sifra),
    );

  const ukupno = stavke.reduce((s, x) => s + x.kolicina * x.mpc, 0);

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="flex rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1a3d38] shadow-sm bg-white dark:bg-[#0f2320]"
        style={{ height: "calc(100vh - 150px)" }}
      >
        {/* ── LIJEVA KOLONA — Lista artikala ────────────────── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col border-r-2 border-gray-200 dark:border-[#1e4a44]">
          <div className="flex-shrink-0 p-3 border-b border-gray-100 dark:border-[#1a3d38]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchArtikli}
                onChange={(e) => setSearchArtikli(e.target.value)}
                className={`${inputCls} pl-9`}
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e) => (e.target.style.borderColor = "")}
              />
            </div>
            {!loadingArtikli && (
              <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] mt-1.5 px-1">
                {searchArtikli
                  ? `${artikliFiltrirani.length} rezultata`
                  : `${artikli.length} artikala`}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingArtikli ? (
              <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: PRIMARY }}
                />
                <span className="text-xs">Učitavanje...</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-[#1a3d38]">
                {artikliFiltrirani.map((a) => {
                  const jOdabran =
                    odabirArtikla?.sifra_proizvoda === a.sifra_proizvoda;
                  const jUStavkama = stavke.some(
                    (s) => s.artikal.sifra_proizvoda === a.sifra_proizvoda,
                  );
                  return (
                    <li key={a.sifra_proizvoda}>
                      <button
                        onClick={() => klikniArtkal(a)}
                        className="w-full text-left px-4 py-3 transition-all hover:bg-teal-50 dark:hover:bg-[#1a3d38]"
                        style={
                          jOdabran
                            ? {
                                background: `${PRIMARY}15`,
                                borderLeft: `3px solid ${PRIMARY}`,
                              }
                            : jUStavkama
                              ? {
                                  background: `${ACCENT}0a`,
                                  borderLeft: `3px solid ${ACCENT}55`,
                                }
                              : { borderLeft: "3px solid transparent" }
                        }
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                color: jOdabran
                                  ? PRIMARY
                                  : jUStavkama
                                    ? ACCENT
                                    : "#9ca3af",
                              }}
                            >
                              {a.sifra_proizvoda}
                              {a.Naziv_grupe && (
                                <span className="ml-1 font-normal normal-case">
                                  · {a.Naziv_grupe}
                                </span>
                              )}
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2] leading-snug mt-0.5 truncate">
                              {a.naziv_proizvoda}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-gray-400 dark:text-[#4a7a74]">
                                {a.jm}
                              </span>
                              {a.mpc != null && (
                                <span
                                  className="text-[11px] font-semibold"
                                  style={{ color: ACCENT }}
                                >
                                  {Number(a.mpc).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          {jUStavkama && !jOdabran && (
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 mt-1 flex items-center justify-center"
                              style={{ background: ACCENT }}
                            >
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M1.5 5L4 7.5L8.5 2.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── CENTRALNI DIO ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Partner sekcija — uvijek vidljiva na vrhu */}
          <div
            className="flex-shrink-0 flex justify-center items-center px-6 py-4 border-b border-gray-100 dark:border-[#1a3d38]"
            ref={dropdownRef}
          >
            {selectedPartner ? (
              /* ── Partner kartica ─────────────────────────── */
              <div
                className="flex items-center gap-4 px-5 py-3 rounded-2xl cursor-pointer transition-all hover:shadow-md"
                style={{
                  background: `${PRIMARY}10`,
                  border: `2px solid ${PRIMARY}30`,
                }}
                onClick={() => {
                  setDropdownOpen(true);
                  setTimeout(() => partnerInputRef.current?.focus(), 50);
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: PRIMARY }}
                >
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="text-center min-w-0">
                  <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                    {selectedPartner.naziv_partnera}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <MapPin
                      size={11}
                      style={{ color: PRIMARY }}
                      className="opacity-60 flex-shrink-0"
                    />
                    <p className="text-xs text-gray-500 dark:text-[#4a7a74]">
                      {selectedPartner.Naziv_grada}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearPartner}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                >
                  <X size={14} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute z-50 top-[calc(100%+8px)] left-1/2 -translate-x-1/2 rounded-xl border border-gray-200 dark:border-[#1e4a44] shadow-2xl bg-white dark:bg-[#0f2320] overflow-hidden"
                    style={{ width: 380 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-[#1a3d38]">
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          ref={partnerInputRef}
                          type="text"
                          value={searchPartneri}
                          onChange={(e) => setSearchPartneri(e.target.value)}
                          placeholder="Pretraži..."
                          className={`${inputCls} pl-8`}
                          onFocus={(e) =>
                            (e.target.style.borderColor = PRIMARY)
                          }
                          onBlur={(e) => (e.target.style.borderColor = "")}
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {filteredPartneri.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-gray-400 dark:text-[#4a7a74]">
                          Nema rezultata
                        </li>
                      ) : (
                        filteredPartneri.map((p) => (
                          <li key={p.sifra_partnera}>
                            <button
                              onClick={() => handleSelectPartner(p)}
                              className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-[#1a3d38] transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2]">
                                {p.naziv_partnera}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin
                                  size={10}
                                  className="text-gray-400 flex-shrink-0"
                                />
                                <p className="text-[11px] text-gray-400 truncate">
                                  {[p.adresa_partnera, p.Naziv_grada]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="border-t border-gray-100 dark:border-[#1a3d38] p-2">
                      <button
                        onClick={openDodajPartnera}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-teal-50 dark:hover:bg-[#1a3d38]"
                        style={{ color: PRIMARY }}
                      >
                        <Plus size={14} />
                        Dodaj novog partnera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Combobox za odabir partnera ─────────────── */
              <div className="relative" ref={undefined} style={{ width: 380 }}>
                <button
                  onClick={() => {
                    setDropdownOpen(true);
                    setTimeout(() => partnerInputRef.current?.focus(), 50);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left bg-white dark:bg-[#0a1e1c]"
                  style={{ borderColor: dropdownOpen ? PRIMARY : "#e5e7eb" }}
                >
                  <Building2
                    size={16}
                    className="text-gray-400 flex-shrink-0"
                  />
                  <span className="flex-1 text-sm text-gray-400 dark:text-[#4a7a74]">
                    {loadingPartneri
                      ? "Učitavanje partnera..."
                      : "Odaberi partnera..."}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 rounded-xl border border-gray-200 dark:border-[#1e4a44] shadow-2xl bg-white dark:bg-[#0f2320] overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-[#1a3d38]">
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          ref={partnerInputRef}
                          type="text"
                          value={searchPartneri}
                          onChange={(e) => setSearchPartneri(e.target.value)}
                          placeholder="Pretraži..."
                          className={`${inputCls} pl-8`}
                          onFocus={(e) =>
                            (e.target.style.borderColor = PRIMARY)
                          }
                          onBlur={(e) => (e.target.style.borderColor = "")}
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {filteredPartneri.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-gray-400">
                          Nema rezultata
                        </li>
                      ) : (
                        filteredPartneri.map((p) => (
                          <li key={p.sifra_partnera}>
                            <button
                              onClick={() => handleSelectPartner(p)}
                              className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-[#1a3d38] transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2]">
                                {p.naziv_partnera}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin
                                  size={10}
                                  className="text-gray-400 flex-shrink-0"
                                />
                                <p className="text-[11px] text-gray-400 truncate">
                                  {[p.adresa_partnera, p.Naziv_grada]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="border-t border-gray-100 dark:border-[#1a3d38] p-2">
                      <button
                        onClick={openDodajPartnera}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-teal-50 dark:hover:bg-[#1a3d38]"
                        style={{ color: PRIMARY }}
                      >
                        <Plus size={14} />
                        Dodaj novog partnera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RAZNI KUPAC panel ─────────────────────────────── */}
          {isRazni && (
            <div
              className="flex-shrink-0 px-6 py-3 border-b border-gray-100 dark:border-[#1a3d38]"
              style={{ background: `${ACCENT}08` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: ACCENT }}
              >
                Razni kupac — odaberi iz liste
              </p>
              <div className="relative" ref={razniDropdownRef}>
                <button
                  onClick={() => {
                    setRazniDropdownOpen(true);
                    setTimeout(() => razniInputRef.current?.focus(), 50);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-left bg-white dark:bg-[#0a1e1c]"
                  style={{
                    borderColor: razniDropdownOpen
                      ? ACCENT
                      : selectedRazni
                        ? `${ACCENT}80`
                        : "#e5e7eb",
                  }}
                >
                  <Search
                    size={14}
                    className="flex-shrink-0"
                    style={{ color: selectedRazni ? ACCENT : "#9ca3af" }}
                  />
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: selectedRazni ? ACCENT : "#9ca3af" }}
                  >
                    {loadingRazni
                      ? "Učitavanje..."
                      : selectedRazni
                        ? selectedRazni.naziv_partnera
                        : "Odaberi raznog kupca..."}
                  </span>
                  {selectedRazni && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRazni(null);
                      }}
                      className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${razniDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {razniDropdownOpen && (
                  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 rounded-xl border border-gray-200 dark:border-[#1e4a44] shadow-2xl bg-white dark:bg-[#0f2320] overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-[#1a3d38]">
                      <div className="relative">
                        <Search
                          size={12}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          ref={razniInputRef}
                          type="text"
                          value={searchRazni}
                          onChange={(e) => setSearchRazni(e.target.value)}
                          placeholder="Pretraži..."
                          className={`${inputCls} pl-8`}
                          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                          onBlur={(e) => (e.target.style.borderColor = "")}
                        />
                      </div>
                    </div>
                    <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
                      {filteredRazni.length === 0 ? (
                        <li className="px-4 py-5 text-center text-xs text-gray-400">
                          Nema rezultata
                        </li>
                      ) : (
                        filteredRazni.map((p) => (
                          <li key={p.sifra_partnera}>
                            <button
                              onClick={() => {
                                setSelectedRazni(p);
                                setRazniDropdownOpen(false);
                                setSearchRazni("");
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-[#2a1a0a] transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-[#e6f4f2]">
                                {p.naziv_partnera}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Šifra: {p.sifra_partnera}
                              </p>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sadržaj — unos ili stavke */}
          <div className="flex-1 overflow-y-auto">
            {odabirArtikla ? (
              /* ── Forma za unos količine i MPC ────────────── */
              <div className="flex items-center justify-center p-8 min-h-full">
                <div className="w-full max-w-sm">
                  <div className="mb-5">
                    <p
                      className="text-[11px] font-semibold mb-1"
                      style={{ color: PRIMARY }}
                    >
                      {odabirArtikla.sifra_proizvoda}
                      {odabirArtikla.Naziv_grupe && (
                        <span className="text-gray-400 ml-2 font-normal">
                          · {odabirArtikla.Naziv_grupe}
                        </span>
                      )}
                    </p>
                    <h3 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2] leading-snug mb-4">
                      {odabirArtikla.naziv_proizvoda}
                    </h3>
                    <div className="flex gap-2">
                      <div
                        className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center"
                        style={{ background: `${PRIMARY}12` }}
                      >
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#4a7a74] mb-0.5">
                          JM
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: PRIMARY }}
                        >
                          {odabirArtikla.jm}
                        </span>
                      </div>
                      <div
                        className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center"
                        style={{ background: `${ACCENT}12` }}
                      >
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#4a7a74] mb-0.5">
                          MPC cijena
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: ACCENT }}
                        >
                          {odabirArtikla.mpc != null
                            ? Number(odabirArtikla.mpc).toFixed(2)
                            : "—"}{" "}
                          KM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label>Količina ({odabirArtikla.jm})</Label>
                    <input
                      ref={kolicnaRef}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unosKolicina}
                      onChange={(e) => setUnosKolicina(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") potvrdiUnos();
                        if (e.key === "Escape") setOdabirArtikla(null);
                      }}
                      className={`${inputCls} text-center text-lg font-bold`}
                      style={{ borderColor: PRIMARY, borderWidth: 2 }}
                    />
                  </div>

                  <div className="mb-5">
                    <Label>MPC (KM)</Label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unosMpc}
                      onChange={(e) => setUnosMpc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") potvrdiUnos();
                        if (e.key === "Escape") setOdabirArtikla(null);
                      }}
                      className={`${inputCls} text-center text-lg font-bold`}
                      style={{
                        borderColor: ACCENT,
                        borderWidth: 2,
                        color: ACCENT,
                      }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setOdabirArtikla(null)}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Odustani
                    </button>
                    <button
                      onClick={potvrdiUnos}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:brightness-110"
                      style={{ background: PRIMARY }}
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              </div>
            ) : stavke.length === 0 ? (
              /* ── Placeholder ──────────────────────────────── */
              <div className="flex items-center justify-center h-full text-center px-8">
                {selectedPartner ? (
                  <div>
                    <Package
                      size={32}
                      className="mx-auto mb-3 opacity-20 dark:opacity-10"
                      style={{ color: PRIMARY }}
                    />
                    <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
                      Kliknite na artikal iz liste za dodavanje
                    </p>
                  </div>
                ) : (
                  <div>
                    <Building2
                      size={36}
                      className="mx-auto mb-3 opacity-10 dark:opacity-5 text-gray-600"
                    />
                    <p className="text-sm text-gray-300 dark:text-[#2a5a54]">
                      Odaberite partnera za početak
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Lista stavki ─────────────────────────────── */
              <div className="p-5 space-y-3">
                {stavke.map((s) => (
                  <div
                    key={s.artikal.sifra_proizvoda}
                    className="rounded-2xl border border-gray-100 dark:border-[#1a3d38] bg-gray-50 dark:bg-[#0d2b27] overflow-hidden"
                  >
                    <div className="flex items-stretch">
                      {/* Naziv + šifra — lijevo */}
                      <div className="flex-1 min-w-0 px-4 pt-3 pb-3 flex flex-col justify-between">
                        <div className="min-w-0">
                          <span
                            className="text-[10px] font-bold font-mono block"
                            style={{ color: PRIMARY }}
                          >
                            {s.artikal.sifra_proizvoda}
                          </span>
                          <p className="text-sm font-bold leading-snug text-gray-800 dark:text-[#e6f4f2]">
                            {s.artikal.naziv_proizvoda}
                          </p>
                        </div>
                        <div className="rounded-lg px-2.5 py-1 mt-2 self-start bg-white dark:bg-[#0f2320] border border-gray-100 dark:border-[#1a3d38] text-[11px]">
                          <span className="text-gray-400">MPC </span>
                          <span className="font-bold" style={{ color: ACCENT }}>
                            {s.mpc.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Količina — sredina */}
                      <div
                        className="flex-shrink-0 flex flex-col items-center justify-center px-6 py-3 border-x border-gray-100 dark:border-[#1a3d38]"
                        style={{ minWidth: 90, background: `${PRIMARY}0c` }}
                      >
                        <span
                          className="text-2xl font-extrabold leading-none"
                          style={{ color: PRIMARY }}
                        >
                          {s.kolicina}
                        </span>
                        {s.artikal.jm && (
                          <span
                            className="text-[11px] font-semibold mt-0.5 uppercase tracking-wide"
                            style={{ color: `${PRIMARY}99` }}
                          >
                            {s.artikal.jm}
                          </span>
                        )}
                      </div>

                      {/* Iznos + brisanje — desno */}
                      <div className="flex-shrink-0 flex flex-col items-end justify-between px-4 pt-3 pb-3">
                        <button
                          onClick={() =>
                            ukloniStavku(s.artikal.sifra_proizvoda)
                          }
                          className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <span
                          className="text-sm font-bold"
                          style={{ color: ACCENT }}
                        >
                          {(s.kolicina * s.mpc).toFixed(2)} KM
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── DONJA TRAKA — samo u desnoj koloni ────────────── */}
          <div
            className="flex-shrink-0 flex items-center px-6 py-1.5 border-t-2"
            style={{
              borderColor: `${PRIMARY}40`,
              background: "rgba(15,118,110,0.04)",
            }}
          >
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74]">
                Stavke
              </span>
              <span
                className="text-base font-bold"
                style={{ color: stavke.length > 0 ? PRIMARY : "#d1d5db" }}
              >
                {stavke.length > 0 ? stavke.length : "—"}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74]">
                Ukupno
              </span>
              <span
                className="text-base font-bold"
                style={{ color: ukupno > 0 ? ACCENT : "#d1d5db" }}
              >
                {ukupno > 0
                  ? ukupno.toLocaleString("bs-BA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " KM"
                  : "—"}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                disabled={stavke.length === 0 || !selectedPartner}
                onClick={() => setPokaziPotvrdu(true)}
                className="flex items-center gap-2 px-6 py-1.5 rounded-xl text-sm font-bold text-white transition-all shadow hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: PRIMARY }}
              >
                <Receipt size={15} />
                NAPRAVI RAČUN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODAL POTVRDA RAČUNA ══════════════════════════════ */}
      {pokaziPotvrdu &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => {
              if (!kreiraniRacun) {
                setPokaziPotvrdu(false);
                setNapomena("");
              }
            }}
          >
            <div
              className="relative bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1a3d38] w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {kreiraniRacun ? (
                /* ── Success view ─────────────────────────────── */
                <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${PRIMARY}15` }}
                  >
                    <CheckCircle2 size={32} style={{ color: PRIMARY }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2]">
                      Račun uspješno kreiran
                    </h3>
                    <p
                      className="text-2xl font-extrabold mt-1"
                      style={{ color: PRIMARY }}
                    >
                      {kreiraniRacun.brojRacuna}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-[#4a7a74] mt-1">
                      {kreiraniRacun.partner.naziv_partnera}
                    </p>
                    <p
                      className="text-sm font-bold mt-0.5"
                      style={{ color: ACCENT }}
                    >
                      {kreiraniRacun.ukupno.toLocaleString("bs-BA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      KM
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <button
                      onClick={() => {
                        setPokaziPotvrdu(false);
                        setKreiraniRacun(null);
                        setNapomena("");
                      }}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Zatvori
                    </button>
                    <button
                      onClick={() => {
                        const kr = kreiraniRacun;
                        setPrintJob({
                          title: `Račun ${kr.brojRacuna}`,
                          defaultFormat: "A5",
                          lockFormat: true,
                          component: (
                            <RacunTemplate
                              racun={{
                                id_racuna: kr.idRacuna,
                                broj_racuna: kr.brojRacuna,
                                referentni_broj: kr.referentniBroj,
                                datum_racuna: kr.datumRacuna,
                                id_partnera: Number(kr.partner.sifra_partnera),
                                ukupno_za_naplatu: kr.ukupno,
                                napomena_operatera: kr.napomena || null,
                                id_operatera: 0,
                                vrsta_racuna: "Racun",
                                status_racuna: "Aktivan",
                              }}
                              stavke={kr.stavkeSnimak.map((s, i) => ({
                                id_stavke: i + 1,
                                id_artikla: s.artikal.sifra_proizvoda,
                                naziv_artikla: s.artikal.naziv_proizvoda,
                                kolicina_artikla: s.kolicina,
                                maloprodajna_cijena: s.mpc,
                                ukupno: +(s.kolicina * s.mpc).toFixed(2),
                              }))}
                              nazivPartnera={kr.partner.naziv_partnera}
                            />
                          ),
                        });
                      }}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
                      style={{ background: PRIMARY }}
                    >
                      <Printer size={15} />
                      Štampaj
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Zaglavlje */}
                  <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${PRIMARY}15` }}
                    >
                      <AlertCircle size={24} style={{ color: PRIMARY }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2]">
                        Zaključivanje računa
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-[#4a7a74] mt-1">
                        Račun će biti kreiran za kupca:
                      </p>
                      <div
                        className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: `${PRIMARY}10`,
                          border: `1px solid ${PRIMARY}30`,
                        }}
                      >
                        <Building2
                          size={16}
                          style={{ color: PRIMARY }}
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p
                            className="text-sm font-bold truncate"
                            style={{ color: PRIMARY }}
                          >
                            {selectedPartner?.naziv_partnera}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-[#4a7a74]">
                            {selectedPartner?.Naziv_grada}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-gray-400 dark:text-[#4a7a74]">
                          {stavke.length}{" "}
                          {stavke.length === 1 ? "stavka" : "stavki"}
                        </span>
                        <span className="font-bold" style={{ color: ACCENT }}>
                          {ukupno.toLocaleString("bs-BA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          KM
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPokaziPotvrdu(false);
                        setNapomena("");
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="h-px mx-6 bg-gray-100 dark:bg-[#1a3d38]" />

                  {/* Napomena + pitanje */}
                  <div className="px-6 py-4 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-1.5">
                        Napomena
                      </label>
                      <textarea
                        value={napomena}
                        onChange={(e) =>
                          setNapomena(e.target.value.slice(0, 254))
                        }
                        placeholder="Opcionalna napomena uz račun..."
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none resize-none transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]"
                        onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                        onBlur={(e) => (e.target.style.borderColor = "")}
                      />
                      <p className="text-right text-[10px] text-gray-300 dark:text-[#2a5a54] mt-0.5">
                        {napomena.length}/254
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#a8d5cf]">
                      Da li želite nastaviti sa zaključivanjem računa?
                    </p>
                  </div>

                  {/* Dugmad */}
                  <div className="px-6 pb-6 flex gap-3">
                    <button
                      onClick={() => {
                        setPokaziPotvrdu(false);
                        setNapomena("");
                      }}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                    >
                      Odustani
                    </button>
                    <button
                      disabled={slanjePodataka}
                      onClick={async () => {
                        setSlanjePodataka(true);
                        try {
                          const res = await fetch(`${API_URL}/api/racun`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              idPartnera: selectedPartner?.sifra_partnera,
                              ukupnoZaNaplatu: ukupno,
                              napomena,
                              stavke: stavke.map((s) => ({
                                id_artikla: s.artikal.sifra_proizvoda,
                                kolicina: s.kolicina,
                                cijena: s.mpc,
                                ukupno: +(s.kolicina * s.mpc).toFixed(2),
                              })),
                            }),
                          });
                          const d = await res.json();
                          if (d.success) {
                            const snapshot = stavke.slice();
                            const partnerSnapshot = selectedPartner!;
                            setKreiraniRacun({
                              idRacuna: d.idRacuna,
                              brojRacuna: d.brojRacuna,
                              referentniBroj: d.referentniBroj,
                              datumRacuna: d.datumRacuna,
                              partner: partnerSnapshot,
                              stavkeSnimak: snapshot,
                              napomena: napomena,
                              ukupno: ukupno,
                            });
                            setStavke([]);
                            setSelectedPartner(null);
                            setSelectedRazni(null);
                            onUspjeh?.();
                          } else {
                            alert(d.message ?? "Greška pri kreiranju računa");
                          }
                        } catch {
                          alert("Greška pri slanju podataka");
                        } finally {
                          setSlanjePodataka(false);
                        }
                      }}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: PRIMARY }}
                    >
                      {slanjePodataka ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />{" "}
                          Kreiranje...
                        </>
                      ) : (
                        <>
                          <Receipt size={15} /> Potvrdi
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      {printJob && (
        <PrintModal
          job={printJob}
          onClose={() => {
            setPrintJob(null);
            setPokaziPotvrdu(false);
            setKreiraniRacun(null);
            setNapomena("");
          }}
        />
      )}

      {/* ══ MODAL DODAJ NOVOG PARTNERA ════════════════════════ */}
      {showDodajPartnera &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowDodajPartnera(false)}
          >
            <div
              className="relative bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1a3d38] w-full max-w-sm mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zaglavlje */}
              <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${PRIMARY}15` }}
                >
                  <Plus size={20} style={{ color: PRIMARY }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2]">
                    Novi partner
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-[#4a7a74]">
                    Unesi podatke novog partnera
                  </p>
                </div>
                <button
                  onClick={() => setShowDodajPartnera(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="h-px mx-6 bg-gray-100 dark:bg-[#1a3d38]" />

              <div className="px-6 py-4 space-y-3">
                <div>
                  <Label>Šifra partnera *</Label>
                  <input
                    type="text"
                    placeholder="npr. 100123"
                    value={noviPartner.sifra}
                    onChange={(e) =>
                      setNoviPartner((p) => ({ ...p, sifra: e.target.value }))
                    }
                    className={inputCls}
                    onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                </div>
                <div>
                  <Label>Naziv partnera *</Label>
                  <input
                    type="text"
                    placeholder="Puno ime / naziv firme"
                    value={noviPartner.naziv}
                    onChange={(e) =>
                      setNoviPartner((p) => ({ ...p, naziv: e.target.value }))
                    }
                    className={inputCls}
                    onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                </div>
                <div>
                  <Label>Adresa</Label>
                  <input
                    type="text"
                    placeholder="Ulica i broj"
                    value={noviPartner.adresa}
                    onChange={(e) =>
                      setNoviPartner((p) => ({ ...p, adresa: e.target.value }))
                    }
                    className={inputCls}
                    onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                </div>
                <div>
                  <Label>Grad *</Label>
                  <select
                    value={noviPartner.id_grada}
                    onChange={(e) =>
                      setNoviPartner((p) => ({
                        ...p,
                        id_grada: e.target.value,
                      }))
                    }
                    className={inputCls}
                    style={noviPartner.id_grada ? { borderColor: PRIMARY } : {}}
                    disabled={loadingGradovi}
                  >
                    <option value="">
                      {loadingGradovi ? "Učitavanje..." : "Odaberi grad..."}
                    </option>
                    {gradovi.map((g) => (
                      <option key={g.id_grada} value={g.id_grada}>
                        {g.naziv_grada}
                      </option>
                    ))}
                  </select>
                </div>
                {errorDodaj && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle size={13} /> {errorDodaj}
                  </p>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowDodajPartnera(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#1e4a44] text-gray-600 dark:text-[#4a7a74] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
                >
                  Odustani
                </button>
                <button
                  disabled={savingPartner}
                  onClick={submitNoviPartner}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: PRIMARY }}
                >
                  {savingPartner ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Snimanje...
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Dodaj partnera
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
