import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Dimensions,
  ActivityIndicator, StatusBar
} from 'react-native';
import {
  Thermometer, Droplets, Sprout, Sun,
  Bot, AlertTriangle, LogOut, Cpu, FlaskConical,
  Activity, Sparkles, CheckCircle2, Bell,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  mobileService, authService, aiService,
  simulationService, sensorService,
} from '../../services/api';

const { width } = Dimensions.get('window');

interface Greenhouse {
  id: number;
  name: string;
  device_id: string;
  latest_stats: {
    temperature: number | null;
    humidity: number | null;
    soil_moisture: number | null;
    light: number | null;
    soil_temperature: number | null;
    last_update: string | null;
  };
}

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

const BREAKDOWN_LABELS: Record<string, string> = {
  sicaklik: 'Sıcaklık',
  nem: 'Nem',
  toprak_nemi: 'Toprak Nemi',
  isik: 'Işık',
  vpd: 'VPD',
};

const SensorCard = ({ title, value, unit, icon: Icon, color }: any) => (
  <View style={styles.sensorCard}>
    <View style={styles.sensorHeader}>
      <Text style={styles.sensorTitle}>{title.toUpperCase()}</Text>
      <Icon color={color} size={20} />
    </View>
    <View style={styles.sensorBody}>
      <Text style={[styles.sensorValue, { color }]}>{value}</Text>
      <Text style={styles.sensorUnit}>{unit}</Text>
    </View>
  </View>
);

const HealthRing = ({ score }: { score: number }) => {
  const size = 110;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderWidth: stroke }]} />
      <View
        style={[
          styles.ringFg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: color,
            transform: [{ rotate: `${(score / 100) * 360 - 90}deg` }],
            opacity: 0.0001,
          },
        ]}
      />
      <View style={styles.ringInner}>
        <Text style={[styles.ringScore, { color }]}>{Math.round(score)}</Text>
        <Text style={styles.ringLabel}>SAĞLIK</Text>
      </View>
      <View style={[styles.ringTick, { backgroundColor: color }]} />
    </View>
  );
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{Math.round(value)}</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [analysis, setAnalysis] = useState<Record<number, AIAnalysis>>({});
  const [simStatus, setSimStatus] = useState<Record<number, any>>({});
  const [dataMode, setDataMode] = useState<'real' | 'simulation'>('real');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const lastModeSync = useRef<string>('');

  const fetchAll = useCallback(async () => {
    try {
      const dash: Greenhouse[] = await mobileService.getDashboard();
      setGreenhouses(dash);

      // Tüm seralar için paralel AI analizi
      const aiPairs = await Promise.all(
        dash.map(async (g) => {
          try {
            const a = await aiService.getAnalysis(g.id);
            return [g.id, a] as const;
          } catch {
            return [g.id, null] as const;
          }
        })
      );
      const aiMap: Record<number, AIAnalysis> = {};
      for (const [id, a] of aiPairs) if (a) aiMap[id] = a;
      setAnalysis(aiMap);

      // Simülasyon durumları (yalnızca simülasyon modunda)
      if (dataMode === 'simulation') {
        const simPairs = await Promise.all(
          dash.map(async (g) => {
            try {
              const s = await simulationService.status(g.id);
              return [g.id, s] as const;
            } catch {
              return [g.id, null] as const;
            }
          })
        );
        const simMap: Record<number, any> = {};
        for (const [id, s] of simPairs) if (s) simMap[id] = s;
        setSimStatus(simMap);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dataMode, router]);

  // Mod değiştiğinde her sera için sim start/stop
  const syncMode = useCallback(async (mode: 'real' | 'simulation', list: Greenhouse[]) => {
    const key = `${mode}:${list.map((g) => g.id).join(',')}`;
    if (lastModeSync.current === key) return;
    lastModeSync.current = key;
    for (const g of list) {
      try {
        if (mode === 'simulation') {
          await simulationService.start(g.id, 2, true);
        } else {
          await simulationService.stop(g.id);
        }
      } catch {}
    }
  }, []);

  // Sekme her odaklandığında modu tekrar oku (login'de değişmiş olabilir)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      authService.getDataMode().then((m) => {
        if (active) setDataMode(m);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  // İlk yükleme + mode değişimi → senkronize et
  useEffect(() => {
    fetchAll();
  }, [dataMode]);

  // Greenhouse listesi değiştiğinde mod senkronu yap
  useEffect(() => {
    if (greenhouses.length > 0) {
      syncMode(dataMode, greenhouses);
    }
  }, [dataMode, greenhouses, syncMode]);

  // Canlı polling: 3 saniyede bir
  useEffect(() => {
    const i = setInterval(fetchAll, 3000);
    return () => clearInterval(i);
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const handleLogout = async () => {
    // Simülasyon açıksa durdur
    if (dataMode === 'simulation') {
      for (const g of greenhouses) {
        try { await simulationService.stop(g.id); } catch {}
      }
    }
    await authService.logout();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Genel Bakış</Text>
            <View style={styles.headerSub}>
              <View style={[styles.dot, { backgroundColor: dataMode === 'simulation' ? '#f59e0b' : '#10b981' }]} />
              <Text style={styles.headerSubtitle}>
                {dataMode === 'simulation' ? 'Simülasyon Modu' : 'Gerçek Veri Modu'}
              </Text>
              <View
                style={[
                  styles.modeBadge,
                  {
                    backgroundColor:
                      dataMode === 'simulation' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  },
                ]}
              >
                {dataMode === 'simulation' ? (
                  <FlaskConical size={11} color="#f59e0b" />
                ) : (
                  <Cpu size={11} color="#10b981" />
                )}
                <Text style={[styles.modeBadgeText, { color: dataMode === 'simulation' ? '#f59e0b' : '#10b981' }]}>
                  {dataMode === 'simulation' ? 'SİMÜLASYON' : 'GERÇEK VERİ'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#64748b" size={22} />
          </TouchableOpacity>
        </View>

        {greenhouses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sprout size={80} color="#10b981" strokeWidth={1} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>Henüz kayıtlı bir sera bulunmuyor.</Text>
            <TouchableOpacity
              style={styles.addCta}
              onPress={() => router.push('/(tabs)/add-device')}
              activeOpacity={0.85}
            >
              <Text style={styles.addCtaText}>QR ile Cihaz Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          greenhouses.map((g) => {
            const a = analysis[g.id];
            const sim = simStatus[g.id];
            return (
              <View key={g.id} style={styles.greenhouseSection}>
                {/* Greenhouse başlık */}
                <View style={styles.ghHeader}>
                  <View>
                    <Text style={styles.ghName}>{g.name}</Text>
                    <Text style={styles.ghDevice}>{g.device_id}</Text>
                  </View>
                  {dataMode === 'simulation' && sim && (
                    <View style={styles.simChip}>
                      <Activity size={11} color="#f59e0b" />
                      <Text style={styles.simChipText}>
                        {sim.phase || '...'} • {sim.fed_rows ?? 0}/{sim.total_rows ?? 0}
                      </Text>
                    </View>
                  )}
                </View>

                {/* SENSOR GRID */}
                <View style={styles.sensorGrid}>
                  <SensorCard
                    title="Sıcaklık"
                    value={g.latest_stats.temperature?.toFixed(1) ?? '--'}
                    unit="°C"
                    icon={Thermometer}
                    color="#f97316"
                  />
                  <SensorCard
                    title="Nem"
                    value={g.latest_stats.humidity?.toFixed(0) ?? '--'}
                    unit="%"
                    icon={Droplets}
                    color="#3b82f6"
                  />
                  <SensorCard
                    title="Toprak Nemi"
                    value={g.latest_stats.soil_moisture?.toFixed(0) ?? '--'}
                    unit="%"
                    icon={Sprout}
                    color="#10b981"
                  />
                  <SensorCard
                    title="Işık"
                    value={g.latest_stats.light?.toFixed(0) ?? '--'}
                    unit="lx"
                    icon={Sun}
                    color="#eab308"
                  />
                </View>

                {/* AI ANALYSIS */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Bot color="#10b981" size={22} />
                      <Text style={styles.sectionTitleText}>Yapay Zeka Analizi</Text>
                    </View>
                    {a?.model_version ? (
                      <Text style={styles.modelTag}>Model v{a.model_version}</Text>
                    ) : (
                      <Text style={styles.modelTagAlt}>KURAL BAZLI</Text>
                    )}
                  </View>

                  <View style={styles.healthRow}>
                    <HealthRing score={a?.health_score ?? 0} />
                    <View style={{ flex: 1, gap: 6 }}>
                      {Object.entries(a?.score_breakdown ?? {}).map(([k, v]) => (
                        <ScoreBar key={k} label={BREAKDOWN_LABELS[k] || k} value={v as number} />
                      ))}
                      {a?.is_anomaly && (
                        <View style={styles.anomalyChip}>
                          <Sparkles size={12} color="#ef4444" />
                          <Text style={styles.anomalyText}>Anomali Tespit Edildi</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* TAVSİYELER */}
                  {a?.recommendations && a.recommendations.length > 0 && (
                    <View style={styles.recList}>
                      {a.recommendations.map((rec, i) => (
                        <View key={`${g.id}-rec-${i}`} style={styles.recCard}>
                          <Text style={styles.recText}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* SİSTEM UYARILARI (rule_alerts) */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleRow}>
                    {a?.rule_alerts && a.rule_alerts.length > 0 ? (
                      <Bell color="#f59e0b" size={20} />
                    ) : (
                      <CheckCircle2 color="#10b981" size={20} />
                    )}
                    <Text style={styles.sectionTitleText}>Sistem Durumu</Text>
                  </View>
                  {a?.rule_alerts && a.rule_alerts.length > 0 ? (
                    <View style={{ gap: 8, marginTop: 12 }}>
                      {a.rule_alerts.map((al, i) => (
                        <View key={`${g.id}-al-${i}`} style={styles.alertCard}>
                          <AlertTriangle size={16} color="#f59e0b" />
                          <Text style={styles.alertText}>{al}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.okText}>Her şey yolunda — sera parametreleri optimal aralıkta.</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
  },
  headerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  headerSubtitle: { color: '#8b949e', fontSize: 13 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { color: '#64748b', marginTop: 16, fontSize: 15, fontWeight: '600' },
  addCta: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCtaText: { color: 'white', fontWeight: '700' },

  greenhouseSection: { marginBottom: 26 },
  ghHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  ghName: { color: 'white', fontSize: 18, fontWeight: '800' },
  ghDevice: { color: '#64748b', fontSize: 11, marginTop: 2, letterSpacing: 1 },
  simChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  simChipText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },

  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  sensorCard: {
    width: (width - 20 * 2 - 10) / 2,
    backgroundColor: '#161b22',
    borderRadius: 14,
    padding: 14,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorTitle: { color: '#8b949e', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  sensorBody: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  sensorValue: { fontSize: 26, fontWeight: '800' },
  sensorUnit: { color: '#8b949e', fontSize: 13, fontWeight: '600' },

  sectionContainer: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { color: 'white', fontSize: 16, fontWeight: '700' },
  modelTag: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modelTagAlt: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  ringBg: { position: 'absolute', borderColor: '#21262d' },
  ringFg: { position: 'absolute' },
  ringInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 26, fontWeight: '800' },
  ringLabel: { color: '#8b949e', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  ringTick: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 4 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: '#8b949e', fontSize: 10, fontWeight: '700', width: 76 },
  barTrack: { flex: 1, height: 5, backgroundColor: '#21262d', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  barValue: { fontSize: 10, fontWeight: '800', width: 28, textAlign: 'right' },

  anomalyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  anomalyText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },

  recList: { gap: 8, marginTop: 4 },
  recCard: {
    backgroundColor: '#0f1115',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  recText: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  alertText: { color: '#fbbf24', fontSize: 13, flex: 1, fontWeight: '600' },
  okText: { color: '#10b981', fontSize: 13, marginTop: 10, fontWeight: '600' },
});
