import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import AppButton from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { getProfile, updateProfile, type Profile } from "@/lib/profiles";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setProfile(null);
        return;
      }

      let active = true;

      const loadProfile = async () => {
        const data = await getProfile(user.id);

        if (active) {
          setProfile(data);
          setDraftName(data?.full_name ?? "");
        }
      };

      loadProfile();

      return () => {
        active = false;
      };
    }, [user]),
  );

  const handleSaveName = async () => {
    if (!user) return;

    const name = draftName.trim();

    if (!name) {
      Alert.alert("Error", "Full name is required.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await updateProfile(user.id, {
        full_name: name,
      });

      if (error) {
        Alert.alert("Error", error);
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              full_name: name,
            }
          : current,
      );

      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut();
      router.replace("/login" as any);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Full Name</Text>

          {editing ? (
            <TextInput
              style={styles.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          ) : (
            <Text style={styles.value}>
              {profile?.full_name || "No name set"}
            </Text>
          )}

          <Text style={styles.label}>Role</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile?.role === "teacher" ? "Teacher" : "Student"}
            </Text>
          </View>

          <Text style={styles.label}>Email</Text>

          <Text style={styles.value}>{profile?.email || user.email}</Text>

          <Text style={styles.label}>User ID</Text>

          <Text style={styles.valueSmall}>{user.id}</Text>

          {editing ? (
            <View style={styles.editButtons}>
              <AppButton
                title="Save"
                icon="checkmark-outline"
                onPress={handleSaveName}
              />

              <AppButton
                title="Cancel"
                icon="close-outline"
                onPress={() => {
                  setDraftName(profile?.full_name ?? "");
                  setEditing(false);
                }}
              />
            </View>
          ) : (
            <AppButton
              title="Edit Name"
              icon="create-outline"
              onPress={() => setEditing(true)}
            />
          )}
        </View>
      )}

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
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

  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  editButtons: {
    gap: 10,
    marginTop: 16,
  },
});
