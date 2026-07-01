import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  CreditCard,
  Loader2,
  MapPin,
  Printer,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { PrintModal, type PrintJob } from "./print/PrintModal";
import { KarticaTemplate } from "./print/templates/KarticaTemplate";

const PRIMARY = "#0F766E";
const ACCENT = "#F97316";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

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

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#1e4a44] rounded-xl focus:outline-none transition-all bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-300 dark:placeholder:text-[#3d6b65]";

const fmt = (n: number | null | undefined) => {
  if (n == null) return "0,00";
  return Number(n).toLocaleString("bs-BA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fmtDatum = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const vrstaColor = (vrsta: string) => {
  const v = vrsta.toLowerCase();
  if (v.includes("racun") && !v.includes("storno"))
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    };
  if (v.includes("storno"))
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    };
  if (v.includes("uplata"))
    return {
      text: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-900/20",
    };
  if (v.includes("isplata"))
    return {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    };
  return {
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/20",
  };
};

export function KarticaPartnera() {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [loadingPartneri, setLoadingPartneri] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchPartneri, setSearchPartneri] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const partnerInputRef = useRef<HTMLInputElement>(null);

  const [stavke, setStavke] = useState<Stavka[]>([]);
  const [rekapitulacija, setRekapitulacija] = useState<Rekapitulacija | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [prikazano, setPrikazano] = useState(false);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/partneri`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPartneri(d.data ?? []);
      })
      .finally(() => setLoadingPartneri(false));
  }, []);

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
    setStavke([]);
    setRekapitulacija(null);
    setPrikazano(false);
  };

  const handleClearPartner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartner(null);
    setSearchPartneri("");
    setStavke([]);
    setRekapitulacija(null);
    setPrikazano(false);
  };

  const prikaziKarticu = async () => {
    if (!selectedPartner) return;
    setLoading(true);
    setPrikazano(false);
    try {
      const res = await fetch(
        `${API_URL}/api/kartice/${selectedPartner.sifra_partnera}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (data.success) {
        setStavke(data.stavke ?? []);
        setRekapitulacija(data.rekapitulacija ?? null);
        setPrikazano(true);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const saldoPositivan = rekapitulacija
    ? Number(rekapitulacija.saldo) >= 0
    : true;

  return (
    <div className="space-y-4">
      {/* ── Zaglavlje + izbor partnera ────────────────────────── */}
      <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a3d38] overflow-visible">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1a3d38] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e6f7f5] dark:bg-[#0d2b27]">
            <CreditCard size={18} style={{ color: PRIMARY }} />
          </div>
          <h2 className="text-base font-bold text-gray-800 dark:text-[#e6f4f2]">
            Kartica partnera
          </h2>
        </div>

        {/* Partner row */}
        <div
          className="flex items-center justify-center gap-4 px-6 py-5 relative"
          ref={dropdownRef}
        >
          {/* ── Partner combobox ─────────────────────────────── */}
          <div className="relative" style={{ width: 380 }}>
            {selectedPartner ? (
              /* Partner kartica */
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
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: PRIMARY }}
                  >
                    {selectedPartner.naziv_partnera}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin
                      size={11}
                      style={{ color: PRIMARY }}
                      className="opacity-60 flex-shrink-0"
                    />
                    <p className="text-xs text-gray-500 dark:text-[#4a7a74] truncate">
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
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
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
                  </div>
                )}
              </div>
            ) : (
              /* Combobox trigger */
              <>
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
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1a3d38]">
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
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dugmad */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={prikaziKarticu}
              disabled={!selectedPartner || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: PRIMARY }}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Users size={15} />
              )}
              Prikaži karticu
            </button>

            {prikazano && rekapitulacija && selectedPartner && (
              <button
                onClick={() =>
                  setPrintJob({
                    title: `Kartica partnera — ${selectedPartner.naziv_partnera}`,
                    component: (
                      <KarticaTemplate
                        partner={selectedPartner}
                        stavke={stavke}
                        rekapitulacija={rekapitulacija}
                      />
                    ),
                  })
                }
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: ACCENT }}
              >
                <Printer size={15} />
                Štampaj
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rekapitulacija ───────────────────────────────────── */}
      {prikazano && rekapitulacija && (
        <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a3d38] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] mb-4">
            Rekapitulacija — {selectedPartner?.naziv_partnera}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Početno stanje",
                value: rekapitulacija.pocetno_stanje,
                color: "text-gray-700 dark:text-gray-300",
              },
              {
                label: "Računi",
                value: rekapitulacija.ukupno_racuni,
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                label: "Storna",
                value: rekapitulacija.ukupno_storna,
                color: "text-red-600 dark:text-red-400",
              },
              {
                label: "Uplate",
                value: rekapitulacija.ukupno_uplate,
                color: "text-teal-600 dark:text-teal-400",
              },
              {
                label: "Isplate",
                value: rekapitulacija.ukupno_isplate,
                color: "text-orange-600 dark:text-orange-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#f8fffe] dark:bg-[#0d2b27] rounded-xl p-3 border border-gray-100 dark:border-[#1a3d38]"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#4a7a74] mb-1">
                  {item.label}
                </p>
                <p className={`text-sm font-bold ${item.color}`}>
                  {fmt(item.value)}
                </p>
              </div>
            ))}
            <div
              className="rounded-xl p-3 border-2"
              style={{
                background: saldoPositivan ? "#f0faf9" : "#fff7ed",
                borderColor: saldoPositivan ? PRIMARY : ACCENT,
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                {saldoPositivan ? (
                  <TrendingUp size={12} style={{ color: PRIMARY }} />
                ) : (
                  <TrendingDown size={12} style={{ color: ACCENT }} />
                )}
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: saldoPositivan ? PRIMARY : ACCENT }}
                >
                  Saldo
                </p>
              </div>
              <p
                className="text-sm font-bold"
                style={{ color: saldoPositivan ? PRIMARY : ACCENT }}
              >
                {fmt(rekapitulacija.saldo)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela stavki ────────────────────────────────────── */}
      {prikazano && (
        <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a3d38] overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-[#1a3d38] flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74]">
              Stavke kartice
            </p>
            <span className="text-xs text-gray-400 dark:text-[#4a7a74]">
              {stavke.length} stavki
            </span>
          </div>

          {stavke.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-[#4a7a74] text-sm">
              Nema stavki za odabranog partnera.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0faf9] dark:bg-[#0d2b27] border-b border-gray-100 dark:border-[#1a3d38]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] whitespace-nowrap">
                      Datum
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74]">
                      Vrsta
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74]">
                      Opis
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 whitespace-nowrap">
                      Duguje
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      Potražuje
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#4a7a74] whitespace-nowrap">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stavke.map((s, i) => {
                    const vc = vrstaColor(s.vrsta);
                    const saldoNum = Number(s.saldo);
                    return (
                      <tr
                        key={i}
                        className="border-b border-gray-50 dark:border-[#1a3d38] hover:bg-[#f8fffe] dark:hover:bg-[#0d2b27] transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-[#8ab8b3] font-mono text-xs">
                          {fmtDatum(s.datum)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${vc.bg} ${vc.text}`}
                          >
                            {s.vrsta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-[#c4e0db] max-w-xs truncate">
                          {s.opis}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {Number(s.duguje) !== 0 ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {fmt(s.duguje)}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-[#2a4a45]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {Number(s.potrazuje) !== 0 ? (
                            <span className="text-teal-600 dark:text-teal-400 font-semibold">
                              {fmt(s.potrazuje)}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-[#2a4a45]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
                          <span
                            style={{ color: saldoNum >= 0 ? PRIMARY : ACCENT }}
                          >
                            {fmt(s.saldo)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f0faf9] dark:bg-[#0d2b27] border-t-2 border-gray-200 dark:border-[#1a3d38]">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-[#4a7a74] uppercase tracking-wider"
                    >
                      Ukupno
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {fmt(stavke.reduce((s, r) => s + Number(r.duguje), 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                      {fmt(stavke.reduce((s, r) => s + Number(r.potrazuje), 0))}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono text-xs font-bold"
                      style={{ color: saldoPositivan ? PRIMARY : ACCENT }}
                    >
                      {rekapitulacija ? fmt(rekapitulacija.saldo) : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {printJob && (
        <PrintModal job={printJob} onClose={() => setPrintJob(null)} />
      )}
    </div>
  );
}
