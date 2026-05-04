import React from "react";
import { Text, View } from "react-native";

import { formatINR } from "../utils/price";

export function HeroSummary({ goldRate, ownerView, result, styles }) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTop}>
        <View>
          <Text style={styles.heroEyebrow}>Future Gold Console</Text>
          <Text style={styles.heroTitle}>Professional pricing in a clean glass interface.</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{ownerView ? "Owner Mode" : "Customer Mode"}</Text>
        </View>
      </View>
      <View style={styles.heroMetricRow}>
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricLabel}>24K base</Text>
          <Text style={styles.heroMetricValue}>{formatINR(goldRate)}</Text>
        </View>
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricLabel}>Live estimate</Text>
          <Text style={styles.heroMetricValue}>{result ? formatINR(result.finalPrice) : "--"}</Text>
        </View>
      </View>
    </View>
  );
}
