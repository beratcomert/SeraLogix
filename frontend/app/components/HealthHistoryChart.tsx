"use client";

import { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    CartesianGrid,
    Dot,
} from "recharts";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HealthRecord {
    id: number;
    greenhouse_id: number;
    sensor_data_id: number;
    health_score: number;
    anomaly_score: number;
    is_anomaly: boolean;
    created_at: string;
}

type Props = {
    greenhouseId: number | null;
    dark?: boolean;
};

function AnomalyDot(props: any) {
    const { cx, cy, payload } = props;
    if (!payload?.is_anomaly) return null;
    return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />;
}

export default function HealthHistoryChart({ greenhouseId, dark }: Props) {
    const [data, setData] = useState<HealthRecord[]>([]);

    useEffect(() => {
        if (!greenhouseId) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetch = async () => {
            try {
                const res = await axios.get(`${API_BASE}/ai/health/history/${greenhouseId}?limit=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData([...res.data].reverse());
            } catch {
                // sessizce geç
            }
        };

        fetch();
        const interval = setInterval(fetch, 60000);
        return () => clearInterval(interval);
    }, [greenhouseId]);

    if (data.length === 0) return null;

    const chartData = data.map(r => ({
        time: new Date(r.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }),
        health_score: Math.round(r.health_score),
        is_anomaly: r.is_anomaly,
    }));

    return (
        <div className={`glass rounded-3xl p-5 shadow-xl backdrop-blur-md`}>
            <div className="flex items-center gap-2 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h3 className={`text-sm font-black uppercase tracking-wider ${dark ? "text-white" : "text-slate-800"}`}>
                    Bitki Sağlık Geçmişi
                </h3>
                <span className={`ml-auto text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    Son {data.length} ölçüm
                </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#f1f5f9"} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: dark ? "#0f172a" : "#fff",
                            border: "1px solid " + (dark ? "#1e293b" : "#e2e8f0"),
                            borderRadius: 12,
                            fontSize: 12,
                        }}
                        formatter={(val: number) => [`${val}/100`, "Sağlık Skoru"]}
                    />
                    <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Line
                        type="monotone"
                        dataKey="health_score"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={<AnomalyDot />}
                        activeDot={{ r: 6, fill: "#10b981" }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 rounded bg-emerald-500/50 border-t-2 border-dashed border-emerald-500" />
                    <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>İyi (&gt;70)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 rounded bg-red-500/50 border-t-2 border-dashed border-red-500" />
                    <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Kritik (&lt;40)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                    <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Anomali</span>
                </div>
            </div>
        </div>
    );
}
