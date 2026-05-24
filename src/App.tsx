import { useEffect, useState } from "react";
import { LoginPanel } from "./components/LoginPanel";
import { Dashboard } from "./components/Dashboard";
import { verifyAuth, signOut } from "./utils/auth";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [vrstaRadnika, setVrstaRadnika] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await verifyAuth();
      if (user) {
        setUsername(user.username);
        setVrstaRadnika(user.vrstaRadnika);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    const user = await verifyAuth();
    if (user) {
      setUsername(user.username);
      setVrstaRadnika(user.vrstaRadnika);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUsername("");
    setVrstaRadnika(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0faf9] dark:bg-[#0a1e1c]">
        <div className="text-[#0F766E] font-medium">Učitavanje...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {isAuthenticated ? (
        <Dashboard
          username={username}
          vrstaRadnika={vrstaRadnika}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPanel onLoginSuccess={handleLoginSuccess} />
      )}
    </ThemeProvider>
  );
}

export default App;
