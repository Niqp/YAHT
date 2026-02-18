import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Sun, Moon, Smartphone } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import type { ThemeMode } from "../store/themeStore";

export default function ThemeToggle() {
  const { colors, mode, colorScheme, setMode } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun size={20} color={mode === "light" ? colors.textInverse : colors.text} />,
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon size={20} color={mode === "dark" ? colors.textInverse : colors.text} />,
    },
    {
      value: "system",
      label: "System",
      icon: <Smartphone size={20} color={mode === "system" ? colors.textInverse : colors.text} />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Current theme: {colorScheme === "dark" ? "Dark" : "Light"}
      </Text>
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: option.value === mode ? colors.primary : colors.input,
              },
            ]}
            onPress={() => {
              setMode(option.value);
            }}
          >
            {option.icon}
            <Text
              style={[
                styles.optionText,
                {
                  color: option.value === mode ? colors.textInverse : colors.text,
                  marginLeft: 8,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  optionText: {
    fontWeight: "500",
  },
});
