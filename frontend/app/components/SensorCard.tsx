import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    gradient: string;
};

export default function SensorCard({ title, value, icon, trend, trendUp, gradient }: Props) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`glass relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all duration-300 backdrop-blur-md`}
        >
            <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`} />
            
            <div className="flex items-start justify-between">
                <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100/30 text-emerald-600' : 'bg-rose-100/30 text-rose-600'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>

            <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {value}
                </p>
            </div>
        </motion.div>
    );
}