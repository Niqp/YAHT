import { useTheme } from "@/hooks/useTheme";
import { ChevronRight } from "lucide-react-native";
import type React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./AppMenuList.styles";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface AppMenuListProps {
  menuItems: MenuItem[];
}

export const AppMenuList: React.FC<AppMenuListProps> = ({ menuItems }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>App</Text>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={[
            styles.menuItem,
            menuItems.indexOf(item) < menuItems.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            },
          ]}
          onPress={item.onPress}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuItemIconContainer}>{item.icon}</View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};
