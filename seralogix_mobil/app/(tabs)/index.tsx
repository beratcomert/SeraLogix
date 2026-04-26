import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  RefreshControl, TouchableOpacity, Dimensions,
  ActivityIndicator, StatusBar
} from 'react-native';
import { 
  Thermometer, Droplets, Sprout, Sun, 
  ArrowUp, ArrowDown, Minus, Bot, 
  Activity, Battery, Wifi, Cpu, 
  LogOut, AlertTriangle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileService, authService } from '../../services/api';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const MiniBarChart = ({ color }: { color: string }) => (
  <View style={styles.miniChartContainer}>
    <View style={[styles.bar, { height: 12, backgroundColor: color, opacity: 0.4 }]} />
    <View style={[styles.bar, { height: 18, backgroundColor: color, opacity: 0.6 }]} />
    <View style={[styles.bar, { height: 26, backgroundColor: color, opacity: 0.8 }]} />
    <View style={[styles.bar, { height: 20, backgroundColor: color, opacity: 1 }]} />
  </View>
);

const HistoryChart = () => {
  return (
    <View style={styles.chartWrapper}>
      <Svg height="150" width="100%" viewBox={`0 0 ${width - 60} 150`}>
        {/* Mock Area underneath */}
        <Path 
          d={`M0,150 L0,120 Q${(width-60)*0.25},100 ${(width-60)*0.5},130 T${width-60},60 L${width-60},150 Z`} 
          fill="rgba(16, 185, 129, 0.1)" 
        />
        {/* Solid Line (Temp) */}
        <Path 
          d={`M0,120 Q${(width-60)*0.25},100 ${(width-60)*0.5},130 T${width-60},60`} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth="2" 
        />
        {/* Dashed Line (Hum) */}
        <Path 
          d={`M0,100 Q${(width-60)*0.25},130 ${(width-60)*0.5},90 T${width-60},110`} 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.5)" 
          strokeWidth="2" 
          strokeDasharray="4 4"
        />
      </Svg>
      {/* Legend below the chart */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Sıcaklık (°C)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.5)', borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>Nem (%)</Text>
        </View>
      </View>
    </View>
  );
};

interface SensorCardProps {
  title: string;
  value: string;
  unit: string;
  icon: any;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  color: string;
}

const FullWidthSensorCard = ({ title, value, unit, icon: Icon, trend, trendValue, color }: SensorCardProps) => (
  <View style={styles.fullCard}>
    <View style={styles.fullCardHeader}>
      <Text style={styles.fullCardTitle}>{title.toUpperCase()}</Text>
      <Icon color={color} size={20} />
    </View>
    
    <View style={styles.fullCardBody}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.fullCardValue}>{value}</Text>
          <Text style={styles.fullCardUnit}>{unit}</Text>
        </View>
        
        <View style={styles.trendRow}>
          {trend === 'up' && <ArrowUp color={color} size={14} />}
          {trend === 'down' && <ArrowDown color="#f43f5e" size={14} />}
          {trend === 'stable' && <Minus color="rgba(255,255,255,0.5)" size={14} />}
          <Text style={[styles.trendText, { color: trend === 'down' ? '#f43f5e' : (trend === 'stable' ? 'rgba(255,255,255,0.5)' : color) }]}>
            {trendValue}
          </Text>
        </View>
      </View>
      
      <MiniBarChart color={trend === 'down' ? '#f43f5e' : color} />
    </View>
  </View>
);

export default function DashboardScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchDashboard = async () => {
    try {
      const res = await mobileService.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Genel Bakış</Text>
            {data.length > 0 && (
              <Text style={styles.headerSubtitle}>
                {data[0].name} için gerçek zamanlı telemetri
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#64748b" size={22} />
          </TouchableOpacity>
        </View>

        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sprout size={80} color="#10b981" strokeWidth={1} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>Henüz kayıtlı bir sera bulunmuyor.</Text>
          </View>
        ) : (
          data.map((item) => (
            <View key={item.id} style={styles.greenhouseSection}>
              {/* SENSORS */}
              <View style={styles.cardsContainer}>
                <FullWidthSensorCard 
                  title="Sıcaklık" 
                  value={item.latest_stats.temperature?.toString() || '--'}
                  unit="°C"
                  icon={Thermometer} 
                  trend="up"
                  trendValue="1.2°"
                  color="#10b981" 
                />
                <FullWidthSensorCard 
                  title="Nem" 
                  value={item.latest_stats.humidity?.toString() || '--'}
                  unit="%"
                  icon={Droplets} 
                  trend="stable"
                  trendValue="Stabil"
                  color="#10b981" 
                />
                <FullWidthSensorCard 
                  title="Toprak Nemi" 
                  value={item.latest_stats.soil_moisture?.toString() || '--'}
                  unit="%"
                  icon={Sprout} 
                  trend="down"
                  trendValue="%5"
                  color="#f43f5e" 
                />
                <FullWidthSensorCard 
                  title="Işık Seviyesi" 
                  value={item.latest_stats.light?.toString() || '--'}
                  unit="lx"
                  icon={Sun} 
                  trend="stable"
                  trendValue="Optimal"
                  color="#10b981" 
                />
              </View>

              {/* CHART SECTION */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitleText}>Çevresel Geçmiş</Text>
                  <View style={styles.tabsContainer}>
                    <View style={[styles.tab, styles.activeTab]}>
                      <Text style={[styles.tabText, styles.activeTabText]}>24S</Text>
                    </View>
                    <View style={styles.tab}>
                      <Text style={styles.tabText}>7G</Text>
                    </View>
                  </View>
                </View>
                <HistoryChart />
              </View>

              {/* AI DIAGNOSTICS */}
              <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { justifyContent: 'flex-start', gap: 10, marginBottom: 20 }]}>
                  <Bot color="#10b981" size={24} />
                  <Text style={styles.sectionTitleText}>Yapay Zeka Analizi</Text>
                </View>

                <View style={styles.aiCard}>
                  <View style={styles.aiCardHeader}>
                    <Text style={styles.aiCardTitle}>Yaprak Sağlığı</Text>
                    <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: '#10b981' }]}>OPTİMAL</Text>
                    </View>
                  </View>
                  <Text style={styles.aiCardDesc}>Klorofil seviyeleri, A bölgesinde stabil bir fotosentezi gösteriyor.</Text>
                </View>

                <View style={[styles.aiCard, { borderColor: 'rgba(244, 63, 94, 0.3)', borderWidth: 1 }]}>
                  <View style={styles.aiCardHeader}>
                    <Text style={styles.aiCardTitle}>Azot Seviyesi</Text>
                    <View style={[styles.badge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: '#f43f5e' }]}>DÜŞÜK</Text>
                    </View>
                  </View>
                  <Text style={styles.aiCardDesc}>C bölgesi toprak yataklarında besin eksikliği tespit edildi.</Text>
                  <View style={styles.recommendationBox}>
                    <AlertTriangle color="#10b981" size={14} />
                    <Text style={styles.recommendationText}>Öneri: Damlama hattı 4 üzerinden 2L organik gübre uygulayın.</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.scanButton}>
                  <Text style={styles.scanButtonText}>Tam Tarama Başlat</Text>
                </TouchableOpacity>
              </View>

              {/* CONNECTED MODULES */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitleText, { marginBottom: 20 }]}>Bağlı Modüller</Text>
                
                <View style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                      <Activity color="rgba(255,255,255,0.7)" size={18} />
                      <Text style={styles.moduleName}>Sensör Düğümü 01</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                  </View>
                  <View style={styles.moduleFooter}>
                    <View style={styles.moduleStat}>
                      <Battery color="rgba(255,255,255,0.5)" size={14} />
                      <Text style={styles.moduleStatText}>%90</Text>
                    </View>
                    <View style={styles.moduleStat}>
                      <Wifi color="rgba(255,255,255,0.5)" size={14} />
                      <Text style={styles.moduleStatText}>İyi</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.moduleCard, { borderColor: 'rgba(244, 63, 94, 0.2)', borderWidth: 1 }]}>
                  <View style={styles.moduleHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                      <Activity color="rgba(255,255,255,0.7)" size={18} />
                      <Text style={styles.moduleName}>Sensör Düğümü 02</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: '#f43f5e' }]} />
                  </View>
                  <View style={styles.moduleFooter}>
                    <View style={styles.moduleStat}>
                      <Battery color="#f43f5e" size={14} />
                      <Text style={[styles.moduleStatText, { color: '#f43f5e' }]}>%15</Text>
                    </View>
                    <View style={styles.moduleStat}>
                      <Wifi color="rgba(255,255,255,0.5)" size={14} />
                      <Text style={styles.moduleStatText}>Zayıf</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.hubCard}>
                  <View style={styles.hubHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                      <Cpu color="#10b981" size={22} />
                      <Text style={styles.moduleName}>Ana Kontrol Hub (GH-A)</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#10b981' }]}>
                      <Text style={[styles.badgeText, { color: '#10b981', fontSize: 10 }]}>AKTİF</Text>
                    </View>
                  </View>
                  <View style={styles.hubStats}>
                    <View style={styles.hubStatBox}>
                      <Text style={styles.hubStatLabel}>Çalışma</Text>
                      <Text style={styles.hubStatValue}>4g 12s</Text>
                    </View>
                    <View style={styles.hubStatBox}>
                      <Text style={styles.hubStatLabel}>Yük</Text>
                      <Text style={styles.hubStatValue}>%24</Text>
                    </View>
                    <View style={styles.hubStatBox}>
                      <Text style={styles.hubStatLabel}>Sürüm</Text>
                      <Text style={styles.hubStatValue}>v2.4.1</Text>
                    </View>
                  </View>
                </View>
              </View>

            </View>
          ))
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#8b949e',
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  greenhouseSection: {
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  fullCard: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 20,
  },
  fullCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fullCardTitle: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fullCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fullCardValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  fullCardUnit: {
    color: '#8b949e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 30,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  sectionContainer: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f1115',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#21262d',
  },
  tabText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  chartWrapper: {
    marginTop: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '500',
  },
  aiCard: {
    backgroundColor: '#0f1115',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiCardTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiCardDesc: {
    color: '#8b949e',
    fontSize: 13,
    lineHeight: 20,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 10,
  },
  recommendationText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#a7f3d0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  scanButtonText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '700',
  },
  moduleCard: {
    backgroundColor: '#0f1115',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moduleFooter: {
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 30,
  },
  moduleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleStatText: {
    color: '#8b949e',
    fontSize: 12,
  },
  hubCard: {
    backgroundColor: '#0f1115',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hubStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  hubStatBox: {
    alignItems: 'center',
  },
  hubStatLabel: {
    color: '#8b949e',
    fontSize: 11,
    marginBottom: 4,
  },
  hubStatValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});

