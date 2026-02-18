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
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
              color: colors.text,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter habit title"
          placeholderTextColor={colors.textTertiary}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Icon/Emoji</Text>
        <TextInput
          style={[
            styles.emojiInput,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
              color: colors.text,
            },
          ]}
          value={icon}
          onChangeText={setIcon}
          maxLength={2}
        />
      </View>
    </View>
  );
};

export default BasicInfoSection;
