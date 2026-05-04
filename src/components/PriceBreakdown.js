import React from "react";
import { Animated, Text, View } from "react-native";

import { BreakdownRow } from "./BreakdownRow";
import { formatINR } from "../utils/price";

export function PriceBreakdown({
  colors,
  discount,
  gst,
  karat,
  making,
  makingBasis,
  ownerView,
  result,
  scaleAnim,
  styles,
  weight,
}) {
  if (!result) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>Price Breakdown</Text>
        <Text style={styles.rateTag}>
          {karat}K @ {formatINR(result.goldRateForKarat)}/gm
        </Text>
      </View>

      {ownerView ? (
        <View>
          <BreakdownRow
            label="Gold Value"
            sub={`${weight}g x ${formatINR(result.goldRateForKarat)}/gm`}
            value={result.goldValue}
            colors={colors}
          />
          <BreakdownRow
            label="Making Charges"
            sub={`${making}% on ${makingBasis === "24k" ? "24K price" : "gold value"}`}
            value={result.makingAmount}
            colors={colors}
          />
          <View style={styles.divider} />
          <BreakdownRow label="Subtotal" value={result.subtotal} colors={colors} />
          {discount > 0 ? (
            <BreakdownRow
              label={`Discount (${discount}%)`}
              value={-result.discountAmount}
              color={colors.green}
              colors={colors}
            />
          ) : null}
          {discount > 0 ? (
            <BreakdownRow label="After Discount" value={result.afterDiscount} colors={colors} />
          ) : null}
          <BreakdownRow label={`GST (${gst}%)`} value={result.gstAmount} color={colors.red} colors={colors} />
        </View>
      ) : (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>BIS Hallmarked - GST Included - Certified Quality</Text>
        </View>
      )}

      <Animated.View style={[styles.finalBlock, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.finalLabel}>Final Price</Text>
        <Text style={styles.finalAmount}>{formatINR(result.finalPrice)}</Text>
      </Animated.View>
    </View>
  );
}
