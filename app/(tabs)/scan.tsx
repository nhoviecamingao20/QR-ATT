import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppButton from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { registerAttendance } from "@/lib/attendance";
import { useAuth } from "@/lib/auth";

export default function ScanScreen() {
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Needed</Text>

        <Text style={styles.subtitle}>
          We need access to your camera to scan QR codes.
        </Text>

        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera"
          onPress={() => requestPermission()}
        />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLastData(data);

    const studentId = user?.id ?? "unknown";

    try {
      const result = await registerAttendance(data, studentId);

      setMessage(result.message);
      setSuccess(result.success);
    } catch (err: any) {
      setMessage(err?.message || "Failed to register attendance.");
      setSuccess(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {scanned ? "QR Code detected!" : "Point your camera at a QR code"}
        </Text>

        {scanned && message && (
          <Text
            style={[styles.scanResult, success ? styles.success : styles.error]}
          >
            {message}
          </Text>
        )}

        {scanned && lastData && <Text style={styles.scanData}>{lastData}</Text>}

        {scanned && (
          <AppButton
            theme="primary"
            title="Scan Again"
            icon="refresh"
            onPress={handleScanAgain}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },

  overlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },

  overlayText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },

  scanResult: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },

  success: {
    color: "#2E7D32",
  },

  error: {
    color: "#C62828",
  },

  scanData: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
});
