import React from "react";
import { Pressable, Text } from "react-native";

import { sharedStyles as styles } from "../styles/sharedStyles";

export function Pill({ label, active, onPress, activeColor, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? activeColor : colors.surface,
          borderColor: active ? activeColor : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: active ? "#ffffff" : colors.muted },
          active ? styles.pillTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
