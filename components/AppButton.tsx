import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: "primary";
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({
  title,
  icon,
  theme,
  onPress,
  disabled = false,
}: Props) {
  if (theme === "primary") {
    return (
      <View
        style={[
          styles.buttonOuter,
          styles.primaryOuter,
          disabled && styles.disabled,
        ]}
      >
        <Pressable
          style={styles.primaryInner}
          onPress={onPress}
          disabled={disabled}
        >
          <Ionicons
            name={icon}
            size={22}
            color={COLORS.textOnPrimary}
            style={styles.icon}
          />

          <Text style={styles.primaryLabel}>{title}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.buttonOuter, disabled && styles.disabled]}>
      <Pressable
        style={styles.buttonInner}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.textSecondary}
          style={styles.icon}
        />

        <Text style={styles.label}>{title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonOuter: {
    width: "100%",
    marginBottom: 14,
  },

  primaryOuter: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    overflow: "hidden",
  },

  primaryInner: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: COLORS.primary,
  },

  buttonInner: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  icon: {
    marginRight: 10,
  },

  label: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  primaryLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textOnPrimary,
  },

  disabled: {
    opacity: 0.5,
  },
});