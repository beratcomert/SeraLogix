import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

export default function AddDeviceScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  
  // Animation for the scanner line
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    };
    
    startAnimation();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScannedData(data);
    Alert.alert("QR Kod Okundu", `Cihaz bilgisi: ${data}`, [
      {
        text: "Tamam",
        onPress: () => {}
      },
      {
        text: "Yeniden Tara",
        onPress: () => setScanned(false)
      }
    ]);
  };

  const handleConnect = () => {
    if (scannedData) {
      Alert.alert("Başarılı", `${scannedData} başarıyla bağlandı!`);
      // Simüle ediyoruz
      setTimeout(() => {
        router.back();
      }, 1500);
    } else {
      Alert.alert("Hata", "Lütfen önce bir QR kod tarayın.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modal Container */}
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Yeni Cihaz Ekle</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#8b949e" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <Text style={styles.label}>QR Kodu Tara</Text>
          
          {/* Scanner Box */}
          <View style={styles.scannerContainer}>
            {!permission ? (
              <View style={styles.permissionContainer} />
            ) : !permission.granted ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Kamera izni gerekiyor</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                  <Text style={styles.permissionButtonText}>İzin Ver</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            )}

            {/* Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Animated Scan Line */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
          </View>

          <Text style={[styles.helperText, scanned && { color: '#10b981' }]}>
            {scanned ? "Kod tarandı, bağlanabilirsiniz." : "Taramak için QR kodunu çerçevenin içine hizalayın"}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.connectButton, !scannedData && styles.connectButtonDisabled]}
              onPress={handleConnect}
            >
              <Text style={[styles.connectButtonText, !scannedData && styles.connectButtonTextDisabled]}>
                Cihazı Bağla
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161b22',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    padding: 24,
  },
  label: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  scannerContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0f1115',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  permissionContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1115',
    padding: 20,
  },
  permissionText: {
    color: '#8b949e',
    fontSize: 14,
    marginBottom: 15,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    zIndex: 10,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  scanLine: {
    width: '85%',
    height: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  helperText: {
    color: '#8b949e',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: 'rgba(167, 243, 208, 0.3)',
  },
  connectButtonText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '700',
  },
  connectButtonTextDisabled: {
    color: 'rgba(6, 95, 70, 0.5)',
  },
});
