import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import LandingPage from "./pages/LandingPage";
import { useEffect, useState } from "react";
import { getSession } from "./services/authService";
import { supabase } from "./lib/supabaseClient";

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showLogin, setShowLogin] = useState(false);

  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {

    const visited = localStorage.getItem("gastapp_visited");

    if (visited) {
      setHasVisited(true);
      setShowLogin(true);
    }

    const checkSession = async () => {

      const session = await getSession();

      setIsLoggedIn(!!session);

    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {

      setIsLoggedIn(!!session);

    });

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  const handleStart = () => {

    localStorage.setItem("gastapp_visited", "true");

    setHasVisited(true);

    setShowLogin(true);

  };

  return (
    <div className="antialiased">

      {isLoggedIn ? (

        <Dashboard onLogout={() => setIsLoggedIn(false)} />

      ) : showLogin || hasVisited ? (

        <Login onLogin={() => setIsLoggedIn(true)} />

      ) : (

        <div className="relative">

          <button
            onClick={handleStart}
            className="fixed top-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-2xl shadow-lg transition-all"
          >
            Ingresar
          </button>

          <LandingPage onStart={handleStart} />

        </div>

      )}

    </div>
  );
}