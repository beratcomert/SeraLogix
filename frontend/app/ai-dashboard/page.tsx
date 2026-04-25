"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Brain, Zap, ChevronDown, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import HealthHistoryChart from "../components/HealthHistoryChart";
import AIComment from "../components/AIComment";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ModelStatus {
    greenhouse_id: number;
    model_type: string;
    model_version: number;
    trained_on_rows: number;
    training_score: number | null;
    is_active: boolean;
    created_at: string;
}

interface TrainingEvent {
    id: number;
    greenhouse_id: number;
    trigger_row_count: number;
    duration_seconds: number | null;
    models_updated: string[];
    status: string;
    error_message: string | null;
    created_at: string;
}

const MODEL_TYPE_LABELS: Record<string, string> = {
    health_scorer: "Sağlık Puanlayıcı (K-Means)",
    anomaly_detector: "Anomali Dedektörü (Isolation Forest)",
};

export default function AIDashboard() {
    const [mounted, setMounted] = useState(false);
    const [greenhouses, setGreenhouses] = useState<any[]>([]);
    const [selectedGid, setSelectedGid] = useState<number | null>(null);
    const [modelStatus, setModelStatus] = useState<ModelStatus[]>([]);
    const [trainingEvents, setTrainingEvents] = useState<TrainingEvent[]>([]);
    const [triggeringTraining, setTriggeringTraining] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem("token");
        if (!token) { router.push("/login"); return; }
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || null);
    }, []);

    const dark = mounted ? theme === "dark" : false;

    const fetchGreenhouses = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`${API_BASE}/user/greenhouses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGreenhouses(res.data);
            if (res.data.length > 0 && !selectedGid) {
                setSelectedGid(res.data[0].id);
            }
        } catch { }
        finally { setLoading(false); }
    };

    const fetchStatus = async (gid: number) => {
        const token = localStorage.getItem("token");
        try {
            const [statusRes, eventsRes] = await Promise.all([
                axios.get(`${API_BASE}/ai/status/${gid}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/ai/training/events/${gid}?limit=15`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setModelStatus(statusRes.data);
            setTrainingEvents(eventsRes.data);
        } catch { }
    };

    const triggerTraining = async () => {
        if (!selectedGid) return;
        setTriggeringTraining(true);
        const token = localStorage.getItem("token");
        try {
            await axios.post(`${API_BASE}/ai/training/trigger/${selectedGid}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchStatus(selectedGid);
        } catch (e: any) {
            alert(e.response?.data?.detail || "Eğitim başlatılamadı.");
        } finally {
            setTriggeringTraining(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    useEffect(() => { fetchGreenhouses(); }, []);
    useEffect(() => { if (selectedGid) fetchStatus(selectedGid); }, [selectedGid]);

    const statusColor = (status: string) => {
        if (status === "success") return "text-emerald-500";
        if (status === "skipped") return "text-amber-500";
        return "text-red-500";
    };

    const statusIcon = (status: string) => {
        if (status === "success") return <CheckCircle size={14} className="text-emerald-500" />;
        if (status === "skipped") return <Clock size={14} className="text-amber-500" />;
        return <XCircle size={14} className="text-red-500" />;
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="text-green-500 animate-spin" size={40} />
        </div>
    );
    return (
        <div className={`min-h-screen ${dark ? "bg-[#0a0a0a]" : "bg-slate-50"} flex transition-colors duration-200`}>
            <Sidebar dark={dark} onLogout={handleLogout} />

            <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
                    {/* BAŞLIK */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className={`text-4xl font-black tracking-tight ${dark ? "text-white/90" : "text-slate-900"}`}>
                                AI Dashboard
                            </h1>
                            <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                Makine Öğrenimi · Sürekli Eğitim
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {greenhouses.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedGid || ""}
                                        onChange={e => setSelectedGid(Number(e.target.value))}
                                        className={`appearance-none pl-5 pr-10 py-3 rounded-2xl ${dark ? "bg-white/5 border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"} border font-bold focus:outline-none min-w-[180px] shadow-sm`}
                                    >
                                        {greenhouses.map(g => (
                                            <option key={g.id} value={g.id} className={dark ? "bg-slate-900" : "bg-white"}>{g.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={16} />
                                </div>
                            )}
                            {userRole === "admin" && (
                                <button
                                    onClick={triggerTraining}
                                    disabled={triggeringTraining}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-lg hover:bg-emerald-500 transition-all disabled:opacity-60"
                                >
                                    {triggeringTraining ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                    Eğitimi Başlat
                                </button>
                            )}
                            <ThemeToggle />
                        </div>
                    </header>

                    {/* MODEL DURUM KARTLARI */}
                    {modelStatus.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {modelStatus.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass rounded-3xl p-6 shadow-xl backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-xl bg-emerald-500 p-2 text-white shadow">
                                            <Brain size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-sm ${dark ? "text-white" : "text-slate-800"}`}>
                                                {MODEL_TYPE_LABELS[m.model_type] || m.model_type}
                                            </h3>
                                            <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                                Sürüm v{m.model_version}
                                            </p>
                                        </div>
                                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-black ${m.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}`}>
                                            {m.is_active ? "Aktif" : "Pasif"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Eğitim Verisi", value: `${m.trained_on_rows} pencere` },
                                            { label: "Eğitim Skoru", value: m.training_score !== null ? m.training_score.toFixed(3) : "—" },
                                            { label: "Son Eğitim", value: new Date(m.created_at).toLocaleDateString("tr") },
                                            { label: "Saat", value: new Date(m.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) },
                                        ].map(({ label, value }) => (
                                            <div key={label} className={`rounded-2xl p-3 ${dark ? "bg-white/5" : "bg-slate-50"}`}>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
                                                <p className={`text-sm font-black mt-1 ${dark ? "text-white" : "text-slate-800"}`}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className={`glass rounded-3xl p-8 text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>
                            <Brain size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-bold">Henüz eğitilmiş model yok.</p>
                            <p className="text-sm mt-1">En az 50 sensör verisi toplanınca ilk eğitim otomatik başlar (veya admin manuel tetikleyebilir).</p>
                        </div>
                    )}

                    {/* SAĞLIK GEÇMİŞİ + AI ANALİZİ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <HealthHistoryChart greenhouseId={selectedGid} dark={dark} />
                        </div>
                        <div>
                            <AIComment greenhouseId={selectedGid} dark={dark} />
                        </div>
                    </div>

                    {/* EĞİTİM OLAYI LOGU */}
                    {trainingEvents.length > 0 && (
                        <div className="glass rounded-3xl p-6 shadow-xl backdrop-blur-md">
                            <h3 className={`font-black text-sm uppercase tracking-wider mb-4 ${dark ? "text-white" : "text-slate-800"}`}>
                                Eğitim Geçmişi
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {trainingEvents.map((e) => (
                                    <div
                                        key={e.id}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${dark ? "bg-white/5" : "bg-slate-50"}`}
                                    >
                                        {statusIcon(e.status)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black ${statusColor(e.status)}`}>
                                                    {e.status === "success" ? "Başarılı" : e.status === "skipped" ? "Atlandı" : "Hata"}
                                                </span>
                                                {e.models_updated.length > 0 && (
                                                    <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                                        ({e.models_updated.join(", ")})
                                                    </span>
                                                )}
                                            </div>
                                            {e.error_message && (
                                                <p className="text-[10px] text-red-400 truncate mt-0.5">{e.error_message}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                                {e.trigger_row_count} satır
                                            </p>
                                            {e.duration_seconds !== null && (
                                                <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
                                                    {e.duration_seconds.toFixed(1)}s
                                                </p>
                                            )}
                                        </div>
                                        <p className={`text-[10px] shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                                            {new Date(e.created_at).toLocaleDateString("tr")} {new Date(e.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}