"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Cpu,
  QrCode,
  Trash2,
  LogOut,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { useTheme } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";

export default function AdminDashboard() {
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, []);

  const dark = mounted ? theme === "dark" : false;

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/admin/devices", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data);
    } catch (err) {
      router.push("/login");
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8000/admin/devices",
        { device_id: deviceId, name: deviceName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Cihaz başarıyla eklendi.");
      setDeviceId("");
      setDeviceName("");
      fetchDevices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Cihaz eklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu cihazı silmek istediğinize emin misiniz?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/admin/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDevices();
    } catch (err) {
      alert("Silme işlemi başarısız.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-600/20 text-white">
            <Cpu size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SeraLogix Admin</h1>
            <p className={dark ? 'text-gray-400 text-sm' : 'text-slate-500 text-sm'}>Donanım Yönetim Paneli</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className={`p-3 rounded-xl ${dark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-white border-slate-200 text-slate-500 hover:text-red-500'} border hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center gap-2`}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add Device Form */}
        <section className={`lg:col-span-1 border-r ${dark ? 'border-white/5' : 'border-slate-200'} pr-0 lg:pr-8 space-y-8`}>
          <div className={`${dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border`}>
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-green-500" />
              Yeni Cihaz Tanımla
            </h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm ${dark ? 'text-gray-400' : 'text-slate-500'} ml-1`}>Cihaz ID (Örn: SERA-001)</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className={`w-full ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} rounded-xl py-3 px-4 outline-none focus:border-green-500/50 transition-all border`}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm ${dark ? 'text-gray-400' : 'text-slate-500'} ml-1`}>Cihaz Adı (Opsiyonel)</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className={`w-full ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} rounded-xl py-3 px-4 outline-none focus:border-green-500/50 transition-all border`}
                  placeholder="Domates Serası Birimi"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/10"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Cihazı Kaydet"}
              </button>
            </form>
          </div>
        </section>

        {/* Right: Device List */}
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"> Kayıtlı Donanımlar <span className={`text-sm font-normal ${dark ? 'text-gray-500 bg-white/5' : 'text-slate-500 bg-slate-200'} px-3 py-1 rounded-full`}>{devices.length}</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div
                key={device.device_id}
                className={`group p-6 rounded-3xl border transition-all ${selectedDevice?.device_id === device.device_id ? 'bg-green-600/10 border-green-500/50' : dark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${dark ? 'bg-white/5 text-green-500' : 'bg-green-500/10 text-green-600'}`}>
                    <QrCode size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="p-2 rounded-lg bg-green-600/20 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(device.device_id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg">{device.device_id}</h3>
                <p className={`${dark ? 'text-gray-400' : 'text-slate-500'} text-sm mb-4`}>{device.name || "İsimsiz Cihaz"}</p>

                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${device.is_assigned ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                  <span className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-slate-400'} uppercase tracking-wider`}>
                    {device.is_assigned ? 'Bir Hesaba Kayıtlı' : 'Beklemede (Atanmamış)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {devices.length === 0 && (
            <div className={`text-center py-20 border-2 border-dashed ${dark ? 'border-white/5 text-gray-500' : 'border-slate-200 text-slate-400'} rounded-3xl`}>
              Henüz tanımlanmış cihaz bulunmuyor.
            </div>
          )}
        </section>
      </main>

      {/* QR Code Modal for Printing */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDevice(null)}></div>
          <div className="relative bg-white text-black p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl print:shadow-none print:p-0">
            <h3 className="text-2xl font-black tracking-tight print:hidden">Cihaz QR Etiketi</h3>
            <div id="printable-qr" className="bg-white p-6 rounded-3xl border-2 border-slate-100 inline-block print:border-0 print:p-0">
              <QRCodeSVG
                value={selectedDevice.device_id}
                size={200}
                level="H"
                includeMargin={true}
              />
              <div className="mt-4 font-mono font-bold text-xl uppercase tracking-widest">{selectedDevice.device_id}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">SeraLogix Intelligent Farming Systems</div>
            </div>
            <div className="flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <Printer size={20} /> Yazdır
              </button>
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-6 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr, #printable-qr * {
            visibility: visible;
          }
          #printable-qr {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
