"use client";

import { useEffect, useState } from "react";
import { 
  Thermometer, 
  Droplets, 
  Sprout, 
  Sun, 
  Moon, 
  RefreshCw, 
  Activity,
  LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import SensorCard from "./components/SensorCard";
import AlertBox from "./components/AlertBox";
import Chart from "./components/Chart";
import AIComment from "./components/AIComment";

type SensorData = {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
};

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [dark, setDark] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/sensor/analyze");
      const json = await res.json();

      setData(json.data);
      setAlerts(json.alerts);

      setHistory((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temperature: json.data.temperature,
          humidity: json.data.humidity,
          soilMoisture: json.data.soilMoisture,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
              <Sprout size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                SeraLogix
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Canlı Sistem Verisi • {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
               onClick={fetchData}
               className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
              {dark ? "Gündüz Modu" : "Gece Modu"}
            </button>
          </div>
        </header>

        <main className="space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SensorCard 
              title="Sıcaklık" 
              value={data ? `${data.temperature}°C` : "--"} 
              icon={<Thermometer size={24} />} 
              gradient="from-orange-400 to-rose-500"
              trend="2.4"
              trendUp={true}
            />
            <SensorCard 
              title="Nem" 
              value={data ? `%${data.humidity}` : "--"} 
              icon={<Droplets size={24} />} 
              gradient="from-blue-400 to-indigo-600"
              trend="1.2"
              trendUp={false}
            />
            <SensorCard 
              title="Toprak Nemi" 
              value={data ? `%${data.soilMoisture}` : "--"} 
              icon={<Sprout size={24} />} 
              gradient="from-emerald-400 to-teal-600"
              trend="0.5"
              trendUp={true}
            />
            <SensorCard 
              title="Işık Şiddeti" 
              value={data ? `${data.light} lx` : "--"} 
              icon={<Sun size={24} />} 
              gradient="from-yellow-300 to-amber-500"
              trend="120"
              trendUp={false}
            />
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <Chart data={history} />
            </div>

            <div className="space-y-8">
              <AIComment alerts={alerts} />
              <AlertBox alerts={alerts} />
              
              <div className="glass rounded-3xl p-6 relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-4">
                    <Activity size={20} className="text-blue-500" />
                    <h3 className="font-bold dark:text-white">Quick Access</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-brand-500 hover:text-white">
                       Sulama Sistemi
                    </button>
                    <button className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-brand-500 hover:text-white">
                       Havalandırma
                    </button>
                    <button className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-brand-500 hover:text-white">
                       Işıklandırma
                    </button>
                    <button className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-brand-500 hover:text-white">
                       Sistem Ayarları
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-slate-500 dark:text-slate-400 text-sm">
              © 2026 SeraLogix • Tüm Hakları Saklıdır.
           </p>
           <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">Yardım</a>
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">Dökümantasyon</a>
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">Gizlilik</a>
           </div>
        </footer>
      </div>
    </div>
  );
}