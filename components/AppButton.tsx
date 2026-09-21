import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: "primary";
  onPress: () => void;
};

export default function AppButton({ title, icon, theme, onPress }: Props) {
  if (theme === "primary") {
    return (
      <View
        style={[
          styles.buttonOuter,
          {
            borderWidth: 1,
            borderColor: COLORS.primary,
            borderRadius: 10,
          },
        ]}
      >
        <Pressable
          style={[styles.buttonInner, { backgroundColor: COLORS.primary }]}
          onPress={onPress}
        >
          <Ionicons
            name={icon}
            size={22}
            color={COLORS.textOnPrimary}
            style={styles.icon}
          />
          <Text style={[styles.primaryLabel, { color: COLORS.textOnPrimary }]}>
            {title}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.buttonOuter}>
      <Pressable style={styles.buttonInner} onPress={onPress}>
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
    paddingRight: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
});
