import React, { useState } from "react";
import { motion } from "motion/react";
import { DollarSign } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailNormalizado = email.toLowerCase();

    if (isRegistering) {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Por favor completa todos los campos.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      const storedUsers = JSON.parse(
        localStorage.getItem("gastapp_users") || "[]"
      );

      if (
        storedUsers.find(
          (u: any) => u.email.toLowerCase() === emailNormalizado
        )
      ) {
        setError("Este correo electrónico ya está registrado.");
        return;
      }

      const newUser = {
        fullName,
        email: emailNormalizado,
        password,
      };

      storedUsers.push(newUser);
      localStorage.setItem("gastapp_users", JSON.stringify(storedUsers));

      setSuccess("¡Cuenta creada con éxito! Ya puedes iniciar sesión.");

      setTimeout(() => {
        setIsRegistering(false);
        setSuccess("");
        setPassword("");
        setConfirmPassword("");
      }, 2000);
    } else {
      const storedUsers = JSON.parse(
        localStorage.getItem("gastapp_users") || "[]"
      );

      const user = storedUsers.find(
        (u: any) =>
          u.email.toLowerCase() === emailNormalizado &&
          u.password === password
      );

      const isDefaultUser =
        emailNormalizado === "juan@gmail.com" && password === "12345";

      if (user || isDefaultUser) {
        onLogin();
      } else {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] p-4 font-sans">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-[#3d2b56]/90 backdrop-blur-xl w-full max-w-[400px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center border border-white/10 relative z-10"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-[#6366f1] to-[#a855f7] rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <DollarSign className="text-white w-10 h-10" />
        </div>

        <h1 className="text-white text-3xl font-black mb-1 tracking-tight">
          {isRegistering ? "Crear cuenta" : "Bienvenido"}
        </h1>

        <p className="text-purple-200/60 text-sm mb-8 font-medium text-center">
          {isRegistering
            ? "Únete a GastAPP hoy mismo"
            : "Gestiona tus finanzas con GastAPP"}
        </p>

        {error && (
          <motion.div className="w-full bg-rose-500/20 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-xl text-xs mb-6 text-center font-medium">
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl text-xs mb-6 text-center font-medium">
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isRegistering && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full bg-white rounded-xl px-5 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo"
            className="w-full bg-[#1a1a1a] text-white border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full bg-[#1a1a1a] text-white border border-white/10 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {isRegistering && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              className="w-full bg-white rounded-xl px-5 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            />
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#5c67f2] to-[#cb5eee] text-white font-bold py-4 rounded-2xl transition-all shadow-xl mt-4 text-sm uppercase tracking-wider"
          >
            {isRegistering ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-8 text-xs font-medium">
          <span className="text-purple-200/40">
            {isRegistering
              ? "¿Ya tienes cuenta?"
              : "¿No tienes cuenta?"}
          </span>

          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-purple-200 hover:text-white ml-2 underline"
          >
            {isRegistering
              ? "Inicia sesión aquí"
              : "Regístrate aquí"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

