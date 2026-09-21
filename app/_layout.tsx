import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { COLORS } from "@/constants/colors";
import { useAuth } from "@/lib/auth";

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const path = segments?.[0];
  const inAuthGroup = path === "login" || path === "register";
  const inTabsGroup = path === "(tabs)";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!session && inTabsGroup && <Redirect href="/login" />}
      {session && inAuthGroup && <Redirect href="/(tabs)" />}

      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
