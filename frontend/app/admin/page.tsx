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
  Loader2,
  X,
  BarChart3,
  Sparkles,
  Thermometer,
  Droplets,
  Sun,
  Sprout,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Activity,
  TrendingUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { useTheme } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";

const API = "http://localhost:8000";

interface DeviceDetail {
  device: { device_id: string; name: string | null; is_assigned: boolean; created_at: string };
  greenhouse: { id: number; name: string; created_at: string } | null;
  owner: { id: number; username: string } | null;
  sensor_stats: {
    count: number;
    temperature: { min: number; max: number; avg: number } | null;
    humidity: { min: number; max: number; avg: number } | null;
    soil_moisture: { min: number; max: number; avg: number } | null;
    light: { min: number; max: number; avg: number } | null;
  } | null;
  recent_sensors: Array<{
    id: number;
    temperature: number | null;
    humidity: number | null;
    soil_moisture: number | null;
    light: number | null;
    soil_temperature: number | null;
    created_at: string;
  }>;
  health_history: Array<{
    id: number;
    health_score: number;
    anomaly_score: number;
    is_anomaly: boolean;
    score_breakdown: Record<string, number>;
    created_at: string;
  }>;
  ai_analysis: {
    health_score: number;
    anomaly_score: number;
    is_anomaly: boolean;
    score_breakdown: Record<string, number>;
  } | null;
  recommendations: string[];
  model_version: number | null;
  training_events: Array<{
    id: number;
    status: string;
    trigger_row_count: number;
    duration_seconds: number | null;
    models_updated: string[];
    created_at: string;
  }>;
}

function HealthRing({ score, dark }: { score: number; dark: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 90, height: 90 }}>
      <svg width="90" height="90" className="rotate-[-90deg]">
        <circle cx="45" cy="45" r={r} fill="none" stroke={dark ? "#1e293b" : "#e2e8f0"} strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black" style={{ color }}>{Math.round(score)}</span>
        <span className={`text-[9px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>SAĞLIK</span>
      </div>
    </div>
  );
}

function StatBar({ label, value, dark }: { label: string; value: number; dark: boolean }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold w-20 truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <div className={`flex-1 h-1.5 rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`}>
        <div className={`h-1.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className={`text-[10px] w-7 text-right font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{Math.round(value)}</span>
    </div>
  );
}

const BREAKDOWN_LABELS: Record<string, string> = {
  sicaklik: "Sıcaklık", nem: "Nem", toprak_nemi: "Toprak Nemi", isik: "Işık", vpd: "VPD",
};

function getRecColor(text: string) {
  if (text.startsWith("🔴") || text.includes("kritik")) return "text-red-500";
  if (text.startsWith("⚠️") || text.includes("uyar")) return "text-amber-500";
  if (text.startsWith("✅") || text.includes("iyi")) return "text-emerald-500";
  return "text-blue-500";
}

function getRecIcon(text: string) {
  if (text.includes("💧") || text.includes("sulam")) return <Droplets size={14} />;
  if (text.includes("🌡️") || text.includes("ısı") || text.includes("sıcak")) return <Thermometer size={14} />;
  if (text.includes("☀️") || text.includes("Işık")) return <Sun size={14} />;
  return <Sprout size={14} />;
}

function statusIcon(status: string) {
  if (status === "success") return <CheckCircle size={13} className="text-emerald-500" />;
  if (status === "skipped") return <Clock size={13} className="text-amber-500" />;
  return <XCircle size={13} className="text-red-500" />;
}

function DeviceDetailModal({ device, dark, onClose }: { device: any; dark: boolean; onClose: () => void }) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "sensors" | "ai">("overview");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API}/admin/devices/${device.device_id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setDetail(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [device.device_id]);

  const bg = dark ? "bg-[#111]" : "bg-white";
  const border = dark ? "border-white/10" : "border-slate-200";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const cardBg = dark ? "bg-white/5" : "bg-slate-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${bg} rounded-3xl border ${border} w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-xl text-white">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg">{device.device_id}</h2>
              <p className={`text-xs ${textMuted}`}>{device.name || "İsimsiz Cihaz"}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 px-6 py-3 border-b ${border}`}>
          {[
            { id: "overview", label: "Genel Bakış", icon: <Activity size={14} /> },
            { id: "sensors", label: "Sensör Verileri", icon: <BarChart3 size={14} /> },
            { id: "ai", label: "AI Analizi", icon: <Sparkles size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-green-600 text-white"
                  : `${dark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100"}`
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
          ) : !detail ? (
            <div className="text-center text-red-400 py-20">Veri yüklenemedi.</div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {tab === "overview" && (
                <div className="space-y-6">
                  {/* Cihaz + Sera + Sahip bilgileri */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${cardBg} rounded-2xl p-4`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-2`}>Cihaz</p>
                      <p className="font-black">{detail.device.device_id}</p>
                      <p className={`text-sm ${textMuted}`}>{detail.device.name || "—"}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`h-2 w-2 rounded-full ${detail.device.is_assigned ? "bg-blue-500" : "bg-orange-500"}`} />
                        <span className={`text-xs font-medium ${textMuted}`}>{detail.device.is_assigned ? "Atanmış" : "Beklemede"}</span>
                      </div>
                    </div>

                    <div className={`${cardBg} rounded-2xl p-4`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-2`}>Sera</p>
                      {detail.greenhouse ? (
                        <>
                          <p className="font-black">{detail.greenhouse.name}</p>
                          <p className={`text-sm ${textMuted}`}>ID: {detail.greenhouse.id}</p>
                          <p className={`text-xs ${textMuted} mt-1`}>{new Date(detail.greenhouse.created_at).toLocaleDateString("tr")}</p>
                        </>
                      ) : (
                        <p className={`text-sm ${textMuted}`}>Henüz atanmamış</p>
                      )}
                    </div>

                    <div className={`${cardBg} rounded-2xl p-4`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-2`}>Kullanıcı</p>
                      {detail.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <User size={14} className="text-blue-500" />
                          </div>
                          <span className="font-black">{detail.owner.username}</span>
                        </div>
                      ) : (
                        <p className={`text-sm ${textMuted}`}>—</p>
                      )}
                    </div>
                  </div>

                  {/* İstatistik Özeti */}
                  {detail.sensor_stats && (
                    <div>
                      <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-green-500" /> Sensör İstatistikleri
                        <span className={`text-xs font-normal ${textMuted}`}>({detail.sensor_stats.count} kayıt)</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Sıcaklık (°C)", stat: detail.sensor_stats.temperature, icon: <Thermometer size={14} /> },
                          { label: "Nem (%)", stat: detail.sensor_stats.humidity, icon: <Droplets size={14} /> },
                          { label: "Toprak Nem (%)", stat: detail.sensor_stats.soil_moisture, icon: <Sprout size={14} /> },
                          { label: "Işık (lux)", stat: detail.sensor_stats.light, icon: <Sun size={14} /> },
                        ].map(({ label, stat, icon }) => (
                          <div key={label} className={`${cardBg} rounded-2xl p-4`}>
                            <div className={`flex items-center gap-1.5 mb-2 ${textMuted}`}>{icon}<span className="text-[10px] font-bold">{label}</span></div>
                            {stat ? (
                              <>
                                <p className="text-lg font-black">{stat.avg}</p>
                                <p className={`text-[10px] ${textMuted}`}>min {stat.min} · max {stat.max}</p>
                              </>
                            ) : <p className={`text-sm ${textMuted}`}>—</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Son AI Analizi Özeti */}
                  {detail.ai_analysis && (
                    <div className={`${cardBg} rounded-2xl p-4`}>
                      <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500" /> Son AI Analizi
                        {detail.model_version && <span className={`text-xs font-normal ${textMuted}`}>Model v{detail.model_version}</span>}
                      </h3>
                      <div className="flex items-center gap-6">
                        <HealthRing score={detail.ai_analysis.health_score} dark={dark} />
                        <div className="flex-1 space-y-2">
                          {Object.entries(detail.ai_analysis.score_breakdown).map(([key, val]) => (
                            <StatBar key={key} label={BREAKDOWN_LABELS[key] || key} value={val} dark={dark} />
                          ))}
                        </div>
                        {detail.ai_analysis.is_anomaly && (
                          <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5">
                            <AlertTriangle size={13} className="text-red-500" />
                            <span className="text-[11px] font-black text-red-500">Anomali</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!detail.greenhouse && (
                    <div className={`text-center py-12 border-2 border-dashed ${dark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400"} rounded-2xl`}>
                      Bu cihaz henüz bir seraya atanmamış, analiz verisi bulunmuyor.
                    </div>
                  )}
                </div>
              )}

              {/* SENSORS TAB */}
              {tab === "sensors" && (
                <div className="space-y-4">
                  {detail.recent_sensors.length === 0 ? (
                    <div className={`text-center py-16 ${textMuted}`}>Sensör verisi bulunamadı.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>
                            <th className="text-left pb-3 pr-4">Tarih / Saat</th>
                            <th className="text-right pb-3 pr-4">Sıcaklık</th>
                            <th className="text-right pb-3 pr-4">Nem</th>
                            <th className="text-right pb-3 pr-4">Toprak Nem</th>
                            <th className="text-right pb-3 pr-4">Işık</th>
                            <th className="text-right pb-3">Toprak Sıc.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {detail.recent_sensors.map((row) => (
                            <tr key={row.id} className={`${dark ? "hover:bg-white/5" : "hover:bg-slate-50"} transition-colors`}>
                              <td className={`py-3 pr-4 ${textMuted} text-xs`}>
                                {new Date(row.created_at).toLocaleDateString("tr")}{" "}
                                {new Date(row.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-3 pr-4 text-right font-bold">{row.temperature != null ? `${row.temperature}°C` : "—"}</td>
                              <td className="py-3 pr-4 text-right font-bold">{row.humidity != null ? `${row.humidity}%` : "—"}</td>
                              <td className="py-3 pr-4 text-right font-bold">{row.soil_moisture != null ? `${row.soil_moisture}%` : "—"}</td>
                              <td className="py-3 pr-4 text-right font-bold">{row.light != null ? `${Math.round(row.light)} lx` : "—"}</td>
                              <td className="py-3 text-right font-bold">{row.soil_temperature != null ? `${row.soil_temperature}°C` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* AI TAB */}
              {tab === "ai" && (
                <div className="space-y-6">
                  {/* Sağlık Skoru */}
                  {detail.ai_analysis ? (
                    <div className={`${cardBg} rounded-2xl p-5`}>
                      <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500" /> Güncel AI Değerlendirmesi
                        {detail.model_version && <span className={`text-xs font-normal ${textMuted}`}>Model v{detail.model_version}</span>}
                      </h3>
                      <div className="flex items-center gap-8">
                        <HealthRing score={detail.ai_analysis.health_score} dark={dark} />
                        <div className="flex-1 space-y-2.5">
                          {Object.entries(detail.ai_analysis.score_breakdown).map(([key, val]) => (
                            <StatBar key={key} label={BREAKDOWN_LABELS[key] || key} value={val} dark={dark} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <div className={`rounded-xl p-3 flex-1 ${dark ? "bg-white/5" : "bg-slate-100"}`}>
                          <p className={`text-[10px] font-bold uppercase ${textMuted}`}>Anomali Skoru</p>
                          <p className="text-lg font-black mt-1">{detail.ai_analysis.anomaly_score.toFixed(3)}</p>
                        </div>
                        <div className={`rounded-xl p-3 flex-1 ${detail.ai_analysis.is_anomaly ? "bg-red-500/10 border border-red-500/20" : dark ? "bg-white/5" : "bg-slate-100"}`}>
                          <p className={`text-[10px] font-bold uppercase ${textMuted}`}>Durum</p>
                          <p className={`text-sm font-black mt-1 ${detail.ai_analysis.is_anomaly ? "text-red-500" : "text-emerald-500"}`}>
                            {detail.ai_analysis.is_anomaly ? "⚠️ Anomali Tespit Edildi" : "✅ Normal"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${textMuted}`}>Henüz AI analizi yok.</div>
                  )}

                  {/* Öneriler */}
                  {detail.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-3">AI Önerileri</h3>
                      <div className="space-y-2">
                        {detail.recommendations.map((rec, i) => (
                          <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${cardBg}`}>
                            <span className={`mt-0.5 ${getRecColor(rec)}`}>{getRecIcon(rec)}</span>
                            <p className={`text-sm leading-snug ${dark ? "text-slate-200" : "text-slate-700"}`}>{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sağlık Skoru Geçmişi */}
                  {detail.health_history.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-3">Sağlık Skoru Geçmişi</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detail.health_history.map((h) => {
                          const color = h.health_score >= 70 ? "text-emerald-500" : h.health_score >= 40 ? "text-amber-500" : "text-red-500";
                          const barColor = h.health_score >= 70 ? "bg-emerald-500" : h.health_score >= 40 ? "bg-amber-400" : "bg-red-400";
                          return (
                            <div key={h.id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${cardBg}`}>
                              <span className={`text-sm font-black w-10 ${color}`}>{Math.round(h.health_score)}</span>
                              <div className={`flex-1 h-1.5 rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                                <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${h.health_score}%` }} />
                              </div>
                              {h.is_anomaly && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                              <span className={`text-[10px] ${textMuted} shrink-0`}>
                                {new Date(h.created_at).toLocaleDateString("tr")} {new Date(h.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Eğitim Olayları */}
                  {detail.training_events.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-3">Model Eğitim Geçmişi</h3>
                      <div className="space-y-2">
                        {detail.training_events.map((e) => (
                          <div key={e.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${cardBg}`}>
                            {statusIcon(e.status)}
                            <div className="flex-1">
                              <span className={`text-xs font-black ${e.status === "success" ? "text-emerald-500" : e.status === "skipped" ? "text-amber-500" : "text-red-500"}`}>
                                {e.status === "success" ? "Başarılı" : e.status === "skipped" ? "Atlandı" : "Hata"}
                              </span>
                              {e.models_updated.length > 0 && (
                                <span className={`text-[10px] ml-2 ${textMuted}`}>({e.models_updated.join(", ")})</span>
                              )}
                            </div>
                            <span className={`text-xs font-bold ${textMuted}`}>{e.trigger_row_count} satır</span>
                            {e.duration_seconds != null && (
                              <span className={`text-[10px] ${textMuted}`}>{e.duration_seconds.toFixed(1)}s</span>
                            )}
                            <span className={`text-[10px] ${textMuted}`}>
                              {new Date(e.created_at).toLocaleDateString("tr")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrDevice, setQrDevice] = useState<any>(null);
  const [detailDevice, setDetailDevice] = useState<any>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, []);

  const dark = mounted ? theme === "dark" : false;

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch {
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
      await axios.post(
        `${API}/admin/devices`,
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
      await axios.delete(`${API}/admin/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDevices();
    } catch {
      alert("Silme işlemi başarısız.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
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
            <p className={dark ? "text-gray-400 text-sm" : "text-slate-500 text-sm"}>Donanım Yönetim Paneli</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className={`p-3 rounded-xl ${dark ? "bg-white/5 border-white/10 text-gray-400" : "bg-white border-slate-200 text-slate-500 hover:text-red-500"} border hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center gap-2`}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Cihaz Ekle */}
        <section className={`lg:col-span-1 border-r ${dark ? "border-white/5" : "border-slate-200"} pr-0 lg:pr-8 space-y-8`}>
          <div className={`${dark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"} p-6 rounded-3xl border`}>
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-green-500" />
              Yeni Cihaz Tanımla
            </h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm ${dark ? "text-gray-400" : "text-slate-500"} ml-1`}>Cihaz ID (Örn: SERA-001)</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className={`w-full ${dark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} rounded-xl py-3 px-4 outline-none focus:border-green-500/50 transition-all border`}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm ${dark ? "text-gray-400" : "text-slate-500"} ml-1`}>Cihaz Adı (Opsiyonel)</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className={`w-full ${dark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} rounded-xl py-3 px-4 outline-none focus:border-green-500/50 transition-all border`}
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

        {/* Sağ: Cihaz Listesi */}
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Kayıtlı Donanımlar
            <span className={`text-sm font-normal ${dark ? "text-gray-500 bg-white/5" : "text-slate-500 bg-slate-200"} px-3 py-1 rounded-full`}>
              {devices.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div
                key={device.device_id}
                onClick={() => setDetailDevice(device)}
                className={`group p-6 rounded-3xl border transition-all cursor-pointer ${
                  dark
                    ? "bg-white/5 border-white/10 hover:border-green-500/40 hover:bg-green-500/5"
                    : "bg-white border-slate-200 hover:border-green-400 hover:shadow-md shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${dark ? "bg-white/5 text-green-500" : "bg-green-500/10 text-green-600"}`}>
                    <QrCode size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQrDevice(device); }}
                      className="p-2 rounded-lg bg-green-600/20 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="QR Kodu Göster"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(device.device_id); }}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg">{device.device_id}</h3>
                <p className={`${dark ? "text-gray-400" : "text-slate-500"} text-sm mb-4`}>{device.name || "İsimsiz Cihaz"}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${device.is_assigned ? "bg-blue-500" : "bg-orange-500"}`} />
                    <span className={`text-xs font-medium ${dark ? "text-gray-500" : "text-slate-400"} uppercase tracking-wider`}>
                      {device.is_assigned ? "Bir Hesaba Kayıtlı" : "Beklemede (Atanmamış)"}
                    </span>
                  </div>
                  <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"} flex items-center gap-1`}>
                    <BarChart3 size={10} /> Detay
                  </span>
                </div>
              </div>
            ))}
          </div>

          {devices.length === 0 && (
            <div className={`text-center py-20 border-2 border-dashed ${dark ? "border-white/5 text-gray-500" : "border-slate-200 text-slate-400"} rounded-3xl`}>
              Henüz tanımlanmış cihaz bulunmuyor.
            </div>
          )}
        </section>
      </main>

      {/* Device Detail Modal */}
      {detailDevice && (
        <DeviceDetailModal device={detailDevice} dark={dark} onClose={() => setDetailDevice(null)} />
      )}

      {/* QR Code Modal */}
      {qrDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setQrDevice(null)} />
          <div className="relative bg-white text-black p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl print:shadow-none print:p-0">
            <h3 className="text-2xl font-black tracking-tight print:hidden">Cihaz QR Etiketi</h3>
            <div id="printable-qr" className="bg-white p-6 rounded-3xl border-2 border-slate-100 inline-block print:border-0 print:p-0">
              <QRCodeSVG value={qrDevice.device_id} size={200} level="H" includeMargin={true} />
              <div className="mt-4 font-mono font-bold text-xl uppercase tracking-widest">{qrDevice.device_id}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">SeraLogix Intelligent Farming Systems</div>
            </div>
            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <Printer size={20} /> Yazdır
              </button>
              <button
                onClick={() => setQrDevice(null)}
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
          body * { visibility: hidden; }
          #printable-qr, #printable-qr * { visibility: visible; }
          #printable-qr { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}
