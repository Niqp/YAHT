import { CheckSquare, Clock, RotateCcw } from "lucide-react-native";
import type React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { CompletionType } from "../../../types/habit";
import RepetitionControls from "../../controls/RepetitionControls";
import TimedControls from "../../controls/TimedControls";
import { styles } from "./CompletionTypeSection.styles";

interface CompletionTypeSectionProps {
  completionType: CompletionType;
  setCompletionType: (type: CompletionType) => void;
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
  isEditMode: boolean;
}

const CompletionTypeSection: React.FC<CompletionTypeSectionProps> = ({
  completionType,
  setCompletionType,
  completionGoal,
  setCompletionGoal,
  isEditMode,
}) => {
  const { colors } = useTheme();

  const renderCompletionOptions = () => {
    switch (completionType) {
      case "simple":
        return (
          <View style={styles.completionTypeDescription}>
            <CheckSquare size={24} color={colors.primary} />
            <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
              Simple completion (done or not done)
            </Text>
          </View>
        );
      case "repetitions":
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <RotateCcw size={24} color={colors.primary} />
              <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
                Track repetitions (e.g., number of exercises)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <RepetitionControls value={completionGoal} onChange={setCompletionGoal} min={1} max={100} />
            </View>
          </View>
        );
      case "timed":
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <Clock size={24} color={colors.primary} />
              <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
                Track time (e.g., minutes of exercise)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <TimedControls
                value={completionGoal}
                onChange={setCompletionGoal}
                min={60} // 1 minute minimum
                max={7200} // 2 hours maximum
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Type</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
            },
            completionType === "simple" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            isEditMode && { opacity: 0.6 },
          ]}
          onPress={() => !isEditMode && setCompletionType(CompletionType.SIMPLE)}
          disabled={isEditMode}
        >
          <Text
            style={[
              styles.optionText,
              { color: colors.textSecondary },
              completionType === "simple" && {
                color: colors.textInverse,
              },
              isEditMode &&
                completionType !== "simple" && {
                  color: colors.textTertiary,
                },
            ]}
          >
            Simple
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
            },
            completionType === "repetitions" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            isEditMode && { opacity: 0.6 },
          ]}
          onPress={() => !isEditMode && setCompletionType(CompletionType.REPETITIONS)}
          disabled={isEditMode}
        >
          <Text
            style={[
              styles.optionText,
              { color: colors.textSecondary },
              completionType === "repetitions" && {
                color: colors.textInverse,
              },
              isEditMode &&
                completionType !== "repetitions" && {
                  color: colors.textTertiary,
                },
            ]}
          >
            Repetitions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
            },
            completionType === "timed" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            isEditMode && { opacity: 0.6 },
          ]}
          onPress={() => !isEditMode && setCompletionType(CompletionType.TIMED)}
          disabled={isEditMode}
        >
          <Text
            style={[
              styles.optionText,
              { color: colors.textSecondary },
              completionType === "timed" && { color: colors.textInverse },
              isEditMode &&
                completionType !== "timed" && {
                  color: colors.textTertiary,
                },
            ]}
          >
            Timed
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.completionOptionsContainer}>{renderCompletionOptions()}</View>
      {isEditMode && (
        <Text style={[styles.editNotice, { color: colors.error }]}>
          Note: Completion type cannot be changed after a habit is created.
        </Text>
      )}
    </View>
  );
};

export default CompletionTypeSection;
