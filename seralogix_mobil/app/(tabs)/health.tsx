import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Heart, Activity, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HealthScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#121212']} style={styles.header}>
        <Text style={styles.title}>Sera Sağlığı</Text>
        <Text style={styles.subtitle}>Ekinlerinizin genel durumu ve analizler</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: '#10b981' }]}>
            <CheckCircle2 color="#10b981" size={32} />
            <Text style={styles.statValue}>%96</Text>
            <Text style={styles.statLabel}>Genel Sağlık</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#3b82f6' }]}>
            <Activity color="#3b82f6" size={32} />
            <Text style={styles.statValue}>Normal</Text>
            <Text style={styles.statLabel}>Büyüme Hızı</Text>
          </View>
        </View>

        <View style={styles.analysisBox}>
          <View style={styles.analysisHeader}>
            <Heart color="#f43f5e" size={20} />
            <Text style={styles.analysisTitle}>Yapay Zeka Analizi</Text>
          </View>
          <Text style={styles.analysisText}>
            Sıcaklık ve nem değerleri ideal seviyede. Gece saatlerinde toprak nemi %5 oranında artırılması verimi optimize edebilir.
          </Text>
        </View>

        <View style={styles.alertItem}>
          <AlertCircle color="#eab308" size={24} />
          <View>
            <Text style={styles.alertTitle}>Düşük Işık Uyarısı</Text>
            <Text style={styles.alertDesc}>Sera 1'de son 2 saattir ışık seviyesi düşük.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 40, paddingTop: 80 },
  title: { color: 'white', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 16, marginTop: 8 },
  scrollContent: { padding: 20, paddingBottom: 150 },
  statRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  analysisBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  analysisTitle: { color: '#f43f5e', fontWeight: 'bold', fontSize: 16 },
  analysisText: { color: '#94a3b8', fontSize: 15, lineHeight: 22 },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    gap: 15,
  },
  alertTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  alertDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
