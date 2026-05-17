"use client";


import { useEffect, useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle, Info, Thermometer, Droplets, Sun, Sprout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AIAnalysis {
    health_score: number;
    anomaly_score: number;
    is_anomaly: boolean;
    score_breakdown: Record<string, number>;
    recommendations: string[];
    rule_alerts: string[];
    model_version: number | null;
    last_trained_at: string | null;
}

type Props = {
    greenhouseId: number | null;
    dark?: boolean;
};

function HealthRing({ score, dark }: { score: number; dark?: boolean }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const fill = circumference - (score / 100) * circumference;

    const color =
        score >= 70 ? "#10b981" :
            score >= 40 ? "#f59e0b" :
                "#ef4444";

    return (
        <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
            <svg width="100" height="100" className="rotate-[-90deg] absolute inset-0">
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={dark ? "#1e293b" : "#e2e8f0"}
                    strokeWidth="10"
                />
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={fill}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div className="relative flex flex-col items-center">
                <span className="text-2xl font-black leading-none" style={{ color }}>{Math.round(score)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Sağlık</span>
            </div>
        </div>
    );
}

function ScoreBar({ label, value, dark }: { label: string; value: number; dark?: boolean }) {
    const color =
        value >= 70 ? "bg-emerald-500" :
            value >= 40 ? "bg-amber-400" :
                "bg-red-400";

    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold w-20 truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
            <div className={`flex-1 h-1.5 rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                <div
                    className={`h-1.5 rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
            <span className={`text-[10px] w-8 text-right font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{Math.round(value)}</span>
        </div>
    );
}

function getRecIcon(text: string) {
    if (text.includes("💧") || text.includes("sulam") || text.includes("Toprak")) return <Droplets size={16} />;
    if (text.includes("🌡️") || text.includes("ısı") || text.includes("sıcak")) return <Thermometer size={16} />;
    if (text.includes("☀️") || text.includes("Işık") || text.includes("ışık")) return <Sun size={16} />;
    return <Sprout size={16} />;
}

function getRecColor(text: string) {
    if (text.startsWith("🔴") || text.includes("kritik") || text.includes("acil")) return "text-red-500";
    if (text.startsWith("⚠️") || text.includes("uyar") || text.includes("risk")) return "text-amber-500";
    if (text.startsWith("✅") || text.includes("iyi") || text.includes("ideal")) return "text-emerald-500";
    return "text-blue-500";
}

export default function AIComment({ greenhouseId, dark }: Props) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState<Set<number>>(new Set());

    const fetchAnalysis = async () => {
        if (!greenhouseId) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE}/ai/analysis/${greenhouseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnalysis(res.data);
        } catch {
            // Backend hazır değilse eski görünüm korunur
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAnalysis();
        const interval = setInterval(fetchAnalysis, 30000);
        return () => clearInterval(interval);
    }, [greenhouseId]);

    const sendFeedback = async (index: number, useful: boolean) => {
        if (!greenhouseId || feedbackSent.has(index)) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            await axios.post(
                `${API_BASE}/ai/feedback/${greenhouseId}`,
                { feedback_type: "alert_useful", payload: { index, useful } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFeedbackSent(prev => new Set(prev).add(index));
        } catch {
            // sessizce geç
        }
    };

    const breakdown = analysis?.score_breakdown || {};
    const BREAKDOWN_LABELS: Record<string, string> = {
        sicaklik: "Sıcaklık",
        nem: "Nem",
        toprak_nemi: "Toprak Nemi",
        isik: "Işık",
        vpd: "VPD",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass relative overflow-hidden rounded-3xl p-6 shadow-xl backdrop-blur-md"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} className="text-brand-500" />
            </div>

            <div className="relative flex flex-col gap-4">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand-500 p-2 text-white shadow-lg">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-black ${dark ? "text-white" : "text-slate-800"}`}>AI Analizi</h2>
                            {analysis?.model_version && (
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                    Model v{analysis.model_version} · {analysis.last_trained_at ? new Date(analysis.last_trained_at).toLocaleDateString("tr") : ""}
                                </p>
                            )}
                            {!analysis?.model_version && (
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                    Kural Bazlı (Veri Toplanıyor...)
                                </p>
                            )}
                        </div>
                    </div>
                    {analysis?.is_anomaly && (
                        <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5"
                        >
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-[11px] font-black text-red-500">Anomali!</span>
                        </motion.div>
                    )}
                </div>

                {loading && !analysis && (
                    <div className={`text-sm font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>Analiz yükleniyor...</div>
                )}

                {analysis && (
                    <>
                        {/* Sağlık Skoru + Detay Çubukları */}
                        <div className="flex items-center gap-6">
                            <HealthRing score={analysis.health_score} dark={dark} />
                            <div className="flex-1 flex flex-col gap-2">
                                {Object.entries(breakdown).map(([key, val]) => (
                                    <ScoreBar
                                        key={key}
                                        label={BREAKDOWN_LABELS[key] || key}
                                        value={val}
                                        dark={dark}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Öneriler */}
                        <div className="flex flex-col gap-2">
                            <AnimatePresence mode="popLayout">
                                {analysis.recommendations.map((rec, i) => (
                                    <motion.div
                                        key={rec}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className={`flex items-start gap-3 rounded-2xl p-3 ${dark ? "bg-white/5" : "bg-slate-50/70"}`}
                                    >
                                        <span className={`mt-0.5 ${getRecColor(rec)}`}>{getRecIcon(rec)}</span>
                                        <p className={`flex-1 text-sm leading-snug font-medium ${dark ? "text-slate-200" : "text-slate-700"}`}>{rec}</p>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => sendFeedback(i, true)}
                                                disabled={feedbackSent.has(i)}
                                                className={`rounded-lg p-1.5 transition-colors ${feedbackSent.has(i) ? "opacity-40" : "hover:bg-emerald-500/20"}`}
                                            >
                                                <ThumbsUp size={12} className={feedbackSent.has(i) ? "text-emerald-400" : (dark ? "text-slate-500" : "text-slate-400")} />
                                            </button>
                                            <button
                                                onClick={() => sendFeedback(i, false)}
                                                disabled={feedbackSent.has(i)}
                                                className={`rounded-lg p-1.5 transition-colors ${feedbackSent.has(i) ? "opacity-40" : "hover:bg-red-500/20"}`}
                                            >
                                                <ThumbsDown size={12} className={dark ? "text-slate-500" : "text-slate-400"} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {/* Durum göstergesi */}
                <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                    Gerçek Zamanlı Analiz Aktif
                </div>
            </div>
        </motion.div>
    );
}
