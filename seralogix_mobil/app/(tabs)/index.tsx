import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  RefreshControl, TouchableOpacity, Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Thermometer, Droplets, Sprout, Sun, 
  Activity, RefreshCcw, LogOut, ChevronRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileService, authService } from '../../services/api';

const { width } = Dimensions.get('window');

interface SensorCardProps {
  title: string;
  value: string | null;
  icon: any;
  colors: [string, string];
}

const SensorCard = ({ title, value, icon: Icon, colors }: SensorCardProps) => (
  <TouchableOpacity style={styles.cardContainer}>
    <LinearGradient colors={colors} style={styles.cardGradient}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Icon color="white" size={24} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardValue}>{value || '--'}</Text>
      <View style={styles.cardFooter}>
        <Activity color="rgba(255,255,255,0.6)" size={14} />
        <Text style={styles.cardStatus}>Canlı Veri</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
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
      // Token geçersizse login'e at
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
      <LinearGradient colors={['#0a0a0a', '#121212']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>SeraLogix'e Hoşgeldin</Text>
            <Text style={styles.headerTitle}>Kontrol Paneli</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#64748b" size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sprout size={80} color="#10b981" strokeWidth={1} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>Henüz kayıtlı bir sera bulunmuyor.</Text>
          </View>
        ) : (
          data.map((item) => (
            <View key={item.id} style={styles.greenhouseSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.name}</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{item.device_id}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <SensorCard 
                  title="Sıcaklık" 
                  value={item.latest_stats.temperature ? `${item.latest_stats.temperature}°C` : null}
                  icon={Thermometer} 
                  colors={['#f43f5e', '#fb7185']} 
                />
                <SensorCard 
                  title="Nem" 
                  value={item.latest_stats.humidity ? `%${item.latest_stats.humidity}` : null}
                  icon={Droplets} 
                  colors={['#3b82f6', '#60a5fa']} 
                />
                <SensorCard 
                  title="Toprak" 
                  value={item.latest_stats.soil_moisture ? `%${item.latest_stats.soil_moisture}` : null}
                  icon={Sprout} 
                  colors={['#10b981', '#34d399']} 
                />
                <SensorCard 
                  title="Işık" 
                  value={item.latest_stats.light ? `${item.latest_stats.light} lx` : null}
                  icon={Sun} 
                  colors={['#eab308', '#facc15']} 
                />
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
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  logoutButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  greenhouseSection: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (width - 50) / 2,
    height: 160,
    marginBottom: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  cardValue: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
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
});
