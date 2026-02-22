import React from "react";

import NumberStepperInput from "./NumberStepperInput";

interface GoalStepperInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  presets: number[];
  unit?: string;
}

export default function GoalStepperInput({ label, value, onChange, min, max, presets, unit }: GoalStepperInputProps) {
  return (
    <NumberStepperInput
      label={label}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      presets={presets}
      unit={unit}
    />
  );
}
