import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Cpu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddDeviceScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#121212']} style={styles.header}>
        <Text style={styles.title}>Cihaz Ekle</Text>
        <Text style={styles.subtitle}>Yeni bir sera kontrol ünitesi bağlayın</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity style={styles.addButton}>
          <Plus color="white" size={32} />
          <Text style={styles.buttonText}>QR Kodu Tara</Text>
        </TouchableOpacity>
        
        <View style={styles.infoCard}>
          <Cpu color="#10b981" size={24} />
          <Text style={styles.infoText}>
            Cihazınızın üzerindeki QR kodu okutarak hızlıca kurulum yapabilirsiniz.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 40, paddingTop: 80 },
  title: { color: 'white', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 16, marginTop: 8 },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  addButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold', marginTop: 15, fontSize: 18 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 20,
    marginTop: 50,
    alignItems: 'center',
    gap: 15,
  },
  infoText: { color: '#94a3b8', flex: 1, fontSize: 14, lineHeight: 20 },
});
