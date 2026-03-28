import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
    alerts: string[];
};

export default function AIComment({ alerts }: Props) {
    const generateComment = () => {
        if (alerts.length === 0) {
            return "Sera koşulları ideal seviyede. Bitkileriniz için her şey yolunda görünüyor! Mevcut parametreleri korumaya devam edebilirsiniz.";
        }

        return `Dikkat: ${alerts.join(" ")} Bu durum bitki gelişimini olumsuz etkileyebilir. Gerekli önlemleri almanız önerilir.`;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass relative overflow-hidden rounded-3xl p-6 shadow-xl backdrop-blur-md"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={120} className="text-brand-500" />
            </div>
            
            <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-brand-500 p-2 text-white shadow-lg">
                        <Sparkles size={20} />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">
                        AI Analizi
                    </h2>
                </div>
                
                <div className="rounded-2xl bg-brand-100/30 p-4 dark:bg-brand-500/10">
                    <p className="text-md leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                        {generateComment()}
                    </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                    Gerçek Zamanlı Analiz Aktif
                </div>
            </div>
        </motion.div>
    );
}