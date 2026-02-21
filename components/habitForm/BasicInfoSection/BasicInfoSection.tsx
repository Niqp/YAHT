import type React from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { styles } from "./BasicInfoSection.styles";

interface BasicInfoSectionProps {
  title: string;
  setTitle: (title: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ title, setTitle, icon, setIcon }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BASIC INFO</Text>
      <View
        style={[
          styles.surface,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.emojiInput,
                {
                  color: colors.text,
                },
              ]}
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
          </View>
          <TextInput
            style={[
              styles.titleInput,
              {
                color: colors.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Habit title..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );
};

export default BasicInfoSection;
