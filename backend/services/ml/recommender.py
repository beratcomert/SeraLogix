from typing import List


# (koşul fonksiyonu, öneri metni, şiddet)
RULES = [
    (
        lambda f: f.get("vpd", 0) > 2.5,
        "🌬️ VPD kritik yüksek (%.2f kPa)! Domates ciddi stres altında. Acil serinletme ve havalandırma yapın.",
        "critical",
        "vpd",
    ),
    (
        lambda f: f.get("temp_mean", 20) > 32,
        "🌡️ Sıcaklık kritik seviyede (%.1f°C)! Domates için 30°C üstü verim kaybına yol açar. Gölgeleme ve serinletme yapın.",
        "critical",
        "temp_mean",
    ),
    (
        lambda f: f.get("temp_mean", 20) < 13,
        "❄️ Sıcaklık çok düşük (%.1f°C)! Domates soğuktan zarar görebilir. Isıtma sisteminizi kontrol edin.",
        "critical",
        "temp_mean",
    ),
    (
        lambda f: f.get("humidity_mean", 70) > 88 and f.get("temp_mean", 20) < 27,
        "🍄 Yüksek mantar riski! Nem %.0f%% — havalandırma yapın, yapraklara su değdirmeyin.",
        "warning",
        "humidity_mean",
    ),
    (
        lambda f: f.get("soil_moisture_mean", 50) < 25,
        "💧 Toprak çok kuru (%%%.0f)! Domates kök stresine giriyor. Hemen sulama yapın.",
        "critical",
        "soil_moisture_mean",
    ),
    (
        lambda f: f.get("soil_moisture_mean", 50) > 85,
        "🌊 Toprak aşırı ıslak (%%%.0f)! Kök çürümesi riski var. Sulamayı durdurun, drenajı kontrol edin.",
        "warning",
        "soil_moisture_mean",
    ),
    (
        lambda f: f.get("light_mean", 20000) < 5000,
        "☀️ Işık yetersiz (%.0f lüks)! Domates için en az 8000 lüks önerilir. Yapay ışıklandırma kullanın.",
        "warning",
        "light_mean",
    ),
    (
        lambda f: f.get("vpd", 0) < 0.3,
        "💦 VPD çok düşük (%.2f kPa)! Bitki terleme yapamıyor, besin alımı kısıtlanır. Havalandırmayı artırın.",
        "warning",
        "vpd",
    ),
    (
        lambda f: 18 <= f.get("temp_mean", 20) <= 26 and 65 <= f.get("humidity_mean", 70) <= 75 and f.get("soil_moisture_mean", 50) >= 50,
        "✅ Domates için koşullar çok iyi! Mevcut parametreleri korumaya devam edin.",
        "info",
        None,
    ),
    (
        lambda f: f.get("light_mean", 20000) > 60000,
        "🌤️ Işık aşırı yüksek (%.0f lüks)! Özellikle öğlen saatlerinde gölgeleme yapın.",
        "info",
        "light_mean",
    ),
    (
        lambda f: f.get("humidity_mean", 70) < 45,
        "🏜️ Nem çok düşük (%.0f%%)! Domates için %60-75 arası önerilir. Nemlendiricileri devreye alın.",
        "warning",
        "humidity_mean",
    ),
    (
        lambda f: 0.5 <= f.get("vpd", 0) <= 1.5 and 18 <= f.get("temp_mean", 20) <= 28,
        "🌿 Sıcaklık ve VPD dengede. Bitkiler verimli fotosentez yapıyor.",
        "info",
        None,
    ),
]


class Recommender:
    def generate(
        self,
        features: dict,
        health_score: float,
        is_anomaly: bool,
        max_recommendations: int = 4,
    ) -> List[str]:
        recommendations = []

        if is_anomaly:
            recommendations.append("⚠️ Anormal sensör değerleri tespit edildi! Cihazlarınızı ve sera koşullarını kontrol edin.")

        matched_infos = []
        matched_warnings = []
        matched_criticals = []

        for (condition, template, severity, feature_key) in RULES:
            try:
                if condition(features):
                    value = features.get(feature_key, 0) if feature_key else None
                    if value is not None:
                        try:
                            text = template % value
                        except (TypeError, ValueError):
                            text = template
                    else:
                        text = template
                    if severity == "critical":
                        matched_criticals.append(text)
                    elif severity == "warning":
                        matched_warnings.append(text)
                    else:
                        matched_infos.append(text)
            except Exception:
                continue

        # Öncelik: kritik > uyarı > bilgi
        all_matched = matched_criticals + matched_warnings + matched_infos
        for rec in all_matched:
            if len(recommendations) >= max_recommendations:
                break
            if rec not in recommendations:
                recommendations.append(rec)

        if not recommendations:
            if health_score >= 70:
                recommendations.append("✅ Sera koşulları genel olarak iyi durumda. Domates yetiştirmek için uygun ortam sağlanıyor.")
            elif health_score >= 40:
                recommendations.append("⚡ Bazı parametreler optimal aralığın dışında. Sıcaklık, nem ve sulama değerlerini kontrol edin.")
            else:
                recommendations.append("🔴 Bitki sağlık skoru düşük. Tüm sera parametrelerini gözden geçirin.")

        return recommendations