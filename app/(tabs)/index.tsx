import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" />
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          Scan QR Codes to record attendance during school activities.
        </Text>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Scan QR Code"
          icon="qr-code"
          onPress={() => router.push('/scan')}
        />
        <AppButton
          title="Attendance History"
          icon="time"
          onPress={() => router.push('/history')}
        />
        <AppButton
          title="Profile"
          icon="person"
          onPress={() => router.push('/profile')}
        />
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  headerContainer: { flex: 1, justifyContent: 'center' },
  bodyContainer: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 16 },
  mainTitle: { fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  footerContainer: { flex: 1 / 3, alignItems: 'center', paddingHorizontal: 24, width: '100%' },
});