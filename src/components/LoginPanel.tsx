import { useState, useEffect } from "react";
import { signIn } from "../utils/auth";
import { CheckCircle } from "lucide-react";

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

const PRIMARY = "#0F766E";
const PRIMARY_HOVER = "#0D6560";
const PRIMARY_ACTIVE = "#0A534D";
const ACCENT = "#F97316";

export function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loggedName, setLoggedName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loginSuccess) return;
    const t1 = setTimeout(() => setProgress(100), 50);
    const t2 = setTimeout(() => onLoginSuccess(), 5300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loginSuccess, onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError, data } = await signIn(
        username.trim(),
        password.trim(),
      );

      if (signInError) {
        setError(signInError.message || "Pogrešno korisničko ime ili lozinka");
        setLoading(false);
      } else {
        setLoggedName(data?.username ?? username);
        setLoading(false);
        setLoginSuccess(true);
        setProgress(0);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Greška: ${errorMsg}`);
      setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen login-soft-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-7 text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/foto/karpas_logo_software.png"
                  alt="Karpas Logo"
                  className="h-24 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <CheckCircle className="w-14 h-14 mx-auto mb-3" style={{ color: ACCENT }} />
              <p className="text-xl font-bold mb-1 dark:text-[#e6f4f2]" style={{ color: PRIMARY }}>
                Pristup odobren
              </p>
              {loggedName && (
                <p className="text-base font-semibold mb-1 uppercase" style={{ color: ACCENT }}>
                  {loggedName}
                </p>
              )}
              <p className="text-sm text-gray-400 dark:text-[#4a7a74] mb-6">Učitavanje aplikacije...</p>
              <div className="w-full bg-gray-100 dark:bg-[#0a1e1c] rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${progress}%`,
                    transition: "width 5s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen login-soft-bg flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl p-8 md:p-10 lg:p-12 border-2 border-transparent dark:border-[#1a3d38]">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <img
                src="/foto/karpas_logo_software.png"
                alt="Karpas Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div style="background:${PRIMARY}" class="p-5 md:p-6 rounded-full"><svg class="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>`;
                  }
                }}
              />
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-800 dark:text-[#e6f4f2] mb-2">
            Prodaja
          </h1>
          <p className="text-center mb-8" style={{ color: PRIMARY }}>
            Karpas Ambalaže
          </p>

          <form onSubmit={handleLogin} autoComplete="on" className="space-y-5 md:space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-base md:text-lg font-medium text-gray-700 dark:text-[#a8d5cf] mb-3"
              >
                Korisničko ime
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unesite korisničko ime"
                className="w-full px-5 py-4 md:px-6 md:py-5 text-base md:text-lg border-2 border-gray-300 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-4 transition bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-400 dark:placeholder:text-[#3d6b65]"
                style={{ "--tw-ring-color": `${PRIMARY}55` } as React.CSSProperties}
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e) => (e.target.style.borderColor = "")}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-base md:text-lg font-medium text-gray-700 dark:text-[#a8d5cf] mb-3"
              >
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesite lozinku"
                className="w-full px-5 py-4 md:px-6 md:py-5 text-base md:text-lg border-2 border-gray-300 dark:border-[#1e4a44] rounded-xl focus:outline-none focus:ring-4 transition bg-white dark:bg-[#0a1e1c] text-gray-800 dark:text-[#e6f4f2] placeholder:text-gray-400 dark:placeholder:text-[#3d6b65]"
                style={{ "--tw-ring-color": `${PRIMARY}55` } as React.CSSProperties}
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e) => (e.target.style.borderColor = "")}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl text-base md:text-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-4 md:py-5 text-lg md:text-xl rounded-xl transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ backgroundColor: PRIMARY }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
              onMouseDown={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_ACTIVE)}
              onMouseUp={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_HOVER)}
            >
              {loading ? "Prijava u toku..." : "Prijava"}
            </button>

            <div className="h-1 w-full rounded-full" style={{ background: ACCENT }} />
          </form>
        </div>
      </div>
    </div>
  );
}
