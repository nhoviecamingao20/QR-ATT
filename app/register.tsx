import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import Header from "@/components/Header";
import { COLORS } from "@/constants/colors";
import { signUp } from "@/lib/auth";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        full_name: fullName.trim(),
        role,
      });

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace("/(tabs)");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Register to start recording attendance
            </Text>

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Check your email!</Text>

                <Text style={styles.successText}>
                  We sent a confirmation link to {email}. Click the link to
                  verify your account, then come back and sign in.
                </Text>

                <Link href="./login" style={styles.link}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <Text style={styles.label}>Email</Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@school.edu"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <Text style={styles.label}>Password</Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={styles.label}>Confirm Password</Text>

                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={styles.label}>Role</Text>

                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === "student" && styles.selectedRoleButton,
                    ]}
                    onPress={() => setRole("student")}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "student" && styles.selectedRoleButtonText,
                      ]}
                    >
                      Student
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === "teacher" && styles.selectedRoleButton,
                    ]}
                    onPress={() => setRole("teacher")}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "teacher" && styles.selectedRoleButtonText,
                      ]}
                    >
                      Teacher
                    </Text>
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                    style={styles.loader}
                  />
                ) : (
                  <AppButton
                    theme="primary"
                    title="Sign Up"
                    icon="person-add-outline"
                    onPress={handleRegister}
                  />
                )}
              </View>
            )}

            {!success && (
              <Link href="./login" style={styles.link}>
                Already have an account? Sign In
              </Link>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "left",
    lineHeight: 21,
    marginBottom: 32,
  },

  form: {
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  roleContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },

  roleButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedRoleButton: {
    backgroundColor: COLORS.primary + "14",
    borderColor: COLORS.primary,
  },

  roleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  selectedRoleButtonText: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  error: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: "left",
    marginTop: 12,
    marginBottom: 4,
  },

  loader: {
    marginVertical: 16,
  },

  link: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "600",
  },

  successContainer: {
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  successText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
});
