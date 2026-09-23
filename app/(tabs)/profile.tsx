import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppButton from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { getProfile, updateProfile, type Profile } from "@/lib/profiles";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut();
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;

    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? "");
    setFetchingProfile(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSaveName = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev,
      );
      setEditing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {/* Role */}
      {profile?.role === "teacher" ? (
        <View style={[styles.roleBadge, styles.roleBadgeColored]}>
          <Text style={styles.roleBadgeText}>Teacher</Text>
        </View>
      ) : (
        <View style={[styles.roleBadge, styles.roleBadgeColored]}>
          <Text style={styles.roleBadgeText}>Student</Text>
        </View>
      )}

      {/* Name */}
      {editing ? (
        <View style={styles.nameEditRow}>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Enter your full name"
            style={styles.nameInput}
          />

          <Pressable
            onPress={handleSaveName}
            style={styles.saveButton}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setEditing(true)} style={styles.nameRow}>
          <Text style={styles.value}>
            {profile?.full_name || "Tap to add your name"}
          </Text>

          <Text style={styles.editHint}>Edit</Text>
        </Pressable>
      )}

      {/* Account Information */}
      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user.id}</Text>
        </View>
      )}

      {/* Sign Out */}
      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  roleBadge: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },

  roleBadgeColored: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  roleBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },

  nameInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  saveButton: {
    marginLeft: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  editHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },

  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },

  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});