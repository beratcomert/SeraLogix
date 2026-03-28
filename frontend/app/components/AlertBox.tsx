import { Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
    alerts: string[];
};

export default function AlertBox({ alerts }: Props) {
    const hasAlerts = alerts.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass relative overflow-hidden rounded-3xl p-6 shadow-xl backdrop-blur-md border-l-8 ${hasAlerts ? 'border-amber-400' : 'border-emerald-400'}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-white ${hasAlerts ? 'bg-amber-400 shadow-amber-200' : 'bg-emerald-400 shadow-emerald-200'} shadow-lg`}>
                        {hasAlerts ? <Bell size={20} className="animate-bounce" /> : <CheckCircle2 size={20} />}
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">
                        Sistem Durumu
                    </h2>
                </div>
            </div>

            <div className="space-y-3">
                {hasAlerts ? (
                    <AnimatePresence>
                        {alerts.map((alert, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20"
                            >
                                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    {alert}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="bg-emerald-100/50 dark:bg-emerald-900/10 p-6 rounded-full mb-4">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                            Her Şey Yolunda
                        </p>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/40">
                            Sera parametreleri belirlenen aralıklarda.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}