"use client"

import React from "react";
import { View, ViewStyle } from "react-native";

interface ProgressProps {
  value: number;
  max?: number;
  style?: ViewStyle;
  progressColor?: string;
  backgroundColor?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  style,
  progressColor = "#7a98ec",
  backgroundColor = "#e5e7eb",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View
      style={[
        {
          height: 8,
          backgroundColor,
          borderRadius: 4,
          overflow: "hidden",
        },
        style,
      ]}
  >
      <View
        style={{
          height: "100%",
          width: `${percentage}%`,
          backgroundColor: progressColor,
          borderRadius: 4,
        }}
      />
    </View>
  );
};

export { Progress };
