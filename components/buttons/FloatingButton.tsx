import { TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import styles from "./FloatingButton.styles";

interface FloatingButtonProps {
  navigateToAddHabit: () => void;
}

export function FloatingButton({ navigateToAddHabit }: FloatingButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: colors.primary }]}
      onPress={navigateToAddHabit}
      activeOpacity={0.8}
    >
      <Plus size={24} color={colors.textInverse} />
    </TouchableOpacity>
  );
}
