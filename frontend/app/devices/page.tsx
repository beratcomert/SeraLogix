"use client";

import { useEffect, useState } from "react";
import { 
  PlusCircle, 
  Cpu, 
  Trash2, 
  Activity, 
  MapPin, 
  Calendar,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import Sidebar from "../components/Sidebar";
import QRScanner from "../components/QRScanner";

export default function DevicesPage() {
  const [user, setUser] = useState<any>(null);
  const [greenhouses, setGreenhouses] = useState<any[]>([]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted ? theme === "dark" : false;

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser(payload);
    return token;
  };

  const fetchGreenhouses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8000/user/greenhouses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGreenhouses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (deviceId: string) => {
    setShowScanner(false);
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:8000/user/greenhouses",
        { name: "Yeni Sera", device_id: deviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Cihaz başarıyla eklendi!");
      fetchGreenhouses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Cihaz eklenemedi.");
    }
  };

  const deleteGreenhouse = async (gid: number) => {
    if (!confirm("Bu cihazı silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/user/greenhouses/${gid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGreenhouses();
    } catch (err) {
      console.error(err);
      alert("Cihaz silinemedi.");
    }
  };

  useEffect(() => {
    const t = checkAuth();
    if (t) fetchGreenhouses();
  }, []);

  if (loading) return (
    <div className={`min-h-screen ${dark ? 'bg-slate-950' : 'bg-slate-50'} flex items-center justify-center`}>
      <Loader2 className="text-green-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className={`min-h-screen ${dark ? 'bg-[#0a0a0a]' : 'bg-slate-50'} flex transition-colors duration-200`}>
      <Sidebar dark={dark} onLogout={() => {
        localStorage.removeItem("token");
        router.push("/login");
      }} />

      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
          {/* HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col">
              <h1 className={`text-4xl font-black tracking-tight ${dark ? 'text-white/90' : 'text-slate-900'}`}>
                Cihazlarım
              </h1>
              <p className={`text-sm font-bold uppercase tracking-widest mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {greenhouses.length} Aktif Cihaz
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={() => setShowScanner(true)}
                className="px-6 py-3.5 rounded-2xl bg-green-600 text-white font-black shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Yeni Cihaz Ekle
              </button>
              
              <div className={`hidden md:block h-10 w-[1px] ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />
              
              <ThemeToggle />
            </div>
          </header>

          <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {greenhouses.length === 0 ? (
              <div className="text-center py-32 space-y-6">
                <div className={`inline-flex p-10 rounded-[40px] ${dark ? 'bg-white/5 text-white/20' : 'bg-white text-slate-200 shadow-sm'}`}>
                  <Cpu size={80} />
                </div>
                <h2 className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Cihaz Bulunamadı</h2>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">Henüz bir sera cihazı eklememişsiniz. Sağ üstteki butonu kullanarak yeni bir cihaz ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {greenhouses.map((g) => (
                  <div 
                    key={g.id} 
                    className={`group relative p-6 rounded-[32px] ${dark ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'} border transition-all duration-300 overflow-hidden`}
                  >
                    {/* Decorative Background */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
                    
                    <div className="relative space-y-6">
                      <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600 shadow-inner'}`}>
                          <Cpu size={28} />
                        </div>
                        <button 
                          onClick={() => deleteGreenhouse(g.id)}
                          className={`p-2.5 rounded-xl ${dark ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'} transition-all opacity-0 group-hover:opacity-100`}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div>
                        <h3 className={`text-xl font-black ${dark ? 'text-white/90' : 'text-slate-900 group-hover:text-green-600'} transition-colors`}>
                          {g.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            ID: {g.device_id || "Bilinmiyor"}
                          </span>
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${dark ? 'border-white/5' : 'border-slate-50'}`}>
                        <div className="space-y-1">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Konum</p>
                          <div className={`flex items-center gap-1.5 text-sm font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <MapPin size={14} className="text-green-500" />
                            Merkez Bölgesi
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Kurulum</p>
                          <div className={`flex items-center gap-1.5 text-sm font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <Calendar size={14} className="text-green-500" />
                            01.04.2024
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => router.push("/")}
                        className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${dark ? 'bg-white/5 text-white hover:bg-green-600' : 'bg-slate-50 text-slate-900 hover:bg-green-600 hover:text-white'}`}
                      >
                        <Activity size={18} />
                        Verileri İncele
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
