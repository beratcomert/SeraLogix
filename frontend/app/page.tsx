"use client";

import { useEffect, useState } from "react";
import {
  Thermometer,
  Droplets,
  Sprout,
  Sun,
  RefreshCw,
  Activity,
  PlusCircle,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Moon,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import SensorCard from "./components/SensorCard";
import AlertBox from "./components/AlertBox";
import Chart from "./components/Chart";
import AIComment from "./components/AIComment";
import QRScanner from "./components/QRScanner";
import ThemeToggle from "./components/ThemeToggle";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [greenhouses, setGreenhouses] = useState<any[]>([]);
  const [selectedGid, setSelectedGid] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted ? theme === "dark" : false; // Default to light as per user request

  const checkAuth = () => {
    // ... no change to checkAuth ...
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
      if (res.data.length > 0 && !selectedGid) {
        setSelectedGid(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!selectedGid) return;
    setIsRefreshing(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://localhost:8000/sensor/latest/${selectedGid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sensorData = res.data;
      setData(sensorData);

      setHistory((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          soilMoisture: sensorData.soil_moisture,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleQRScan = async (deviceId: string) => {
    setShowScanner(false);
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:8000/user/greenhouses",
        { name: "Benim Seram", device_id: deviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Cihaz başarıyla eklendi!");
      fetchGreenhouses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Cihaz eklenemedi.");
    }
  };

  useEffect(() => {
    const t = checkAuth();
    if (t) fetchGreenhouses();
  }, []);

  useEffect(() => {
    if (selectedGid) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedGid]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="text-green-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className={`min-h-screen ${dark ? 'bg-[#0a0a0a]' : 'bg-slate-50'} flex transition-colors duration-200 uppercase-none`}>
      <Sidebar dark={dark} onLogout={handleLogout} />

      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
          {/* HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col">
              <h1 className={`text-4xl font-black tracking-tight ${dark ? 'text-white/90' : 'text-slate-900'}`}>
                Analizler
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className={`text-sm font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user?.sub} • {greenhouses.find(g => g.id === selectedGid)?.name || "Sera Seçilmedi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={fetchData}
                disabled={isRefreshing}
                className={`p-3.5 rounded-2xl ${dark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white text-slate-400 hover:text-green-600 shadow-sm'} transition-all hover:rotate-180 duration-500 border border-transparent dark:hover:border-white/10`}
              >
                <RefreshCw size={22} className={isRefreshing ? "animate-spin" : ""} />
              </button>

              {greenhouses.length > 0 && (
                <div className="relative group">
                  <select
                    value={selectedGid || ""}
                    onChange={(e) => setSelectedGid(Number(e.target.value))}
                    className={`appearance-none pl-5 pr-12 py-3.5 rounded-2xl ${dark ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border font-bold focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer min-w-[180px] shadow-sm`}
                  >
                    {greenhouses.map(g => (
                      <option key={g.id} value={g.id} className={dark ? 'bg-slate-900' : 'bg-white'}>{g.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={18} />
                </div>
              )}

              <div className={`hidden md:block h-10 w-[1px] ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />
              
              <ThemeToggle />
            </div>
          </header>

        {greenhouses.length === 0 ? (
          <div className="text-center py-40 space-y-6">
            <div className="inline-flex p-8 rounded-[40px] bg-green-500/10 text-green-500 mb-4">
              <QrCode size={80} />
            </div>
            <h2 className={`text-3xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Henüz Bir Senör Cihazınız Yok</h2>
            <p className="text-gray-500 max-w-md mx-auto">SeraLogix'i kullanmaya başlamak için cihazınızın üzerindeki QR kodunu taratmanız gerekmektedir.</p>
            <button
              onClick={() => setShowScanner(true)}
              className="px-10 py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-green-600/30 hover:scale-105 transition-all"
            >
              Hemen QR Tara
            </button>
          </div>
        ) : !data ? (
          <div className="text-center py-40">
            <Loader2 className="animate-spin text-green-500 mx-auto" size={40} />
            <p className="mt-4 text-gray-500">Cihazdan veriler bekleniyor...</p>
          </div>
        ) : (
          <main className="space-y-8 animate-in fade-in duration-700">
            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SensorCard
                title="Sıcaklık"
                value={data.temperature !== null ? `${data.temperature}°C` : "--"}
                icon={<Thermometer size={24} />}
                gradient="from-orange-400 to-rose-500"
              />
              <SensorCard
                title="Nem"
                value={data.humidity !== null ? `%${data.humidity}` : "--"}
                icon={<Droplets size={24} />}
                gradient="from-blue-400 to-indigo-600"
              />
              <SensorCard
                title="Toprak Nemi"
                value={data.soil_moisture !== null ? `%${data.soil_moisture}` : "--"}
                icon={<Sprout size={24} />}
                gradient="from-emerald-400 to-teal-600"
              />
              <SensorCard
                title="Işık Şiddeti"
                value={data.light !== null ? `${data.light} lx` : "--"}
                icon={<Sun size={24} />}
                gradient="from-yellow-300 to-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Chart data={history} />
              </div>

              <div className="space-y-8">
                <AIComment alerts={alerts} />
                <AlertBox alerts={alerts} />
              </div>
            </div>
          </main>
        )}
        </div>
      </div>

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}

function QrCode({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16V21H16" />
      <path d="M21 9V14" />
      <path d="M9 21H14" />
      <path d="M14 14H15V15H14V14Z" fill="currentColor" />
      <path d="M18 18H19V19H18V18Z" fill="currentColor" />
      <path d="M14 18H15V19H14V18Z" fill="currentColor" />
      <path d="M18 14H19V15H18V14Z" fill="currentColor" />
    </svg>
  );
}