import React from "react";
import { Text, View } from "react-native";

import { sharedStyles as styles } from "../styles/sharedStyles";
import { formatINR } from "../utils/price";

export function BreakdownRow({ label, sub, value, color, colors }) {
  const negative = value < 0;

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownTextBlock}>
        <Text style={[styles.breakdownLabel, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.breakdownSub, { color: colors.muted }]}>{sub}</Text> : null}
      </View>
      <Text style={[styles.breakdownValue, { color: color || colors.text }]}>
        {negative ? `- ${formatINR(Math.abs(value))}` : formatINR(value)}
      </Text>
    </View>
  );
}
