"use client";

import React, { useState, useEffect } from "react";
import sensorData from "../data/mockSensorData.json";
import {
  Thermometer,
  Droplets,
  Sprout,
  Sun,
  AlertTriangle,
  Activity,
  CheckCircle,
  Wind,
} from "lucide-react";

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("tr-TR"));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("tr-TR"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const data = sensorData.currentStatus;
  const ai = sensorData.aiAnalysis;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
            <Sprout size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              SeraLogix Kokpit
            </h1>
            <p className="text-slate-400 mt-1">
              Mahsul: <span className="text-white font-semibold">Domates (Sera #1)</span>
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 px-6 py-2 bg-slate-800 rounded-full border border-slate-700 shadow-inner flex items-center gap-2">
          <Activity size={18} className="text-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-300">{currentTime}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* AI Health Overview */}
        <section className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                Seranın Genel Sağlığı
              </h2>
              <div className="flex items-end gap-4 mt-4">
                <span className="text-6xl font-black text-emerald-400">{ai.healthScore}</span>
                <span className="text-lg text-slate-400 mb-2">/ 100</span>
              </div>
              <div className="w-full bg-slate-700 h-3 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${ai.healthScore}%` }}
                ></div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-4 items-start">
                <AlertTriangle className="text-red-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-red-400 font-semibold text-lg">Risk Seviyesi: {ai.riskLevel}</h3>
                  <ul className="list-disc list-inside text-sm text-red-200 mt-2 space-y-1">
                    {ai.threats.map((threat, i) => (
                      <li key={i}>{threat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex gap-4 items-start">
              <CheckCircle className="text-emerald-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-emerald-400 font-semibold text-lg">AI Tavsiyeleri</h3>
                <ul className="list-disc list-inside text-sm text-emerald-100 mt-2 space-y-1">
                  {ai.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sensor Data Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-cyan-400" /> Anlık Sensör Verileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Hava Sıcaklığı */}
            <div className="bg-slate-800 border border-slate-700 hover:border-orange-500/50 transition-colors rounded-3xl p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Thermometer className="text-orange-400" size={24} />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-slate-700 rounded-full text-slate-300">İdeal: 18-24°C</span>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">Hava Sıcaklığı</h3>
              <p className="text-4xl font-bold mt-2 text-white">
                {data.temperature}<span className="text-xl text-slate-500 mr-1">°C</span>
              </p>
            </div>

            {/* Hava Nemi */}
            <div className="bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors rounded-3xl p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Wind className="text-cyan-400" size={24} />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Kritik!</span>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">Hava Nemi</h3>
              <p className="text-4xl font-bold mt-2 text-white">
                %{data.humidity}
              </p>
            </div>

            {/* Toprak Nemi */}
            <div className="bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-colors rounded-3xl p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Droplets className="text-blue-400" size={24} />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-slate-700 rounded-full text-slate-300">Odağında</span>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">Toprak Nemi</h3>
              <p className="text-4xl font-bold mt-2 text-white">
                %{data.soilMoisture}
              </p>
            </div>

            {/* Işık Şiddeti */}
            <div className="bg-slate-800 border border-slate-700 hover:border-yellow-500/50 transition-colors rounded-3xl p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Sun className="text-yellow-400" size={24} />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-slate-700 rounded-full text-slate-300">Yeterli</span>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">Işık Şiddeti</h3>
              <p className="text-4xl font-bold mt-2 text-white">
                {data.lightLux.toLocaleString()}<span className="text-xl text-slate-500 ml-1">Lux</span>
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
