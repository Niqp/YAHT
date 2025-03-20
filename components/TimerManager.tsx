import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { View } from "react-native";

export default function TimerManager() {
  useTimerManager();
  return <View></View>;
}
