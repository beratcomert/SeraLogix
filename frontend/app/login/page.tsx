"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flower, Lock, User, Loader2 } from "lucide-react";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted ? theme === "dark" : true;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const response = await axios.post("http://localhost:8000/auth/login", params);
      const { access_token } = response.data;
      
      localStorage.setItem("token", access_token);
      
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      
      if (payload.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-[#0a0a0a] to-[#0a0a0a]' : 'bg-slate-50'} p-4`}>
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>
      
      <div className={`w-full max-w-md space-y-8 ${dark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border shadow-2xl transition-all`}>
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-green-500/10 text-green-500 mb-2">
            <Flower size={40} />
          </div>
          <h1 className={`text-3xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>SeraLogix</h1>
          <p className={dark ? 'text-gray-400' : 'text-slate-500'}>Akıllı Sera Yönetim Sistemine Hoş Geldiniz</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500 group-focus-within:text-green-500' : 'text-slate-400 group-focus-within:text-green-600'} transition-colors`} size={20} />
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full ${dark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all`}
                required
              />
            </div>
            <div className="relative group">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500 group-focus-within:text-green-500' : 'text-slate-400 group-focus-within:text-green-600'} transition-colors`} size={20} />
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${dark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all`}
                required
              />
            </div>
          </div>

          {error && (
            <div className={`bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Giriş Yap"}
          </button>
        </form>

        <p className={`text-center ${dark ? 'text-gray-500' : 'text-slate-400'} text-sm`}>
          Sistem admini tarafından tanımlanan bilgilerinizle giriş yapın.
        </p>
      </div>
    </div>
  );
}
