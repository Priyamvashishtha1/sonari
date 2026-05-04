import React from "react";
import { Text, View } from "react-native";

import { NumberField } from "./NumberField";
import { Pill } from "./Pill";
import { clampNumber } from "../utils/price";

export function JewelleryForm({
  colors,
  discount,
  goldRate,
  gst,
  karat,
  making,
  makingBasis,
  setDiscount,
  setGoldRate,
  setGst,
  setKarat,
  setMaking,
  setMakingBasis,
  setWeight,
  styles,
  weight,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>Jewellery Details</Text>
        <View style={styles.karatRow}>
          {[24, 22, 20, 18].map((option) => (
            <Pill
              key={option}
              label={`${option}K`}
              active={karat === option}
              onPress={() => setKarat(option)}
              activeColor={colors.accent}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.inputGrid}>
        <NumberField
          label="Gold Rate (24K)"
          value={goldRate}
          placeholder="15300"
          prefix="Rs"
          suffix="/gm"
          colors={colors}
          onChange={(text) => setGoldRate(clampNumber(text, 1))}
        />
        <NumberField
          label="Weight"
          value={weight}
          placeholder="10"
          suffix="gm"
          colors={colors}
          onChange={(text) => {
            if (/^\d*\.?\d*$/.test(text)) {
              setWeight(text);
            }
          }}
        />
      </View>

      <NumberField
        label="Making Charges"
        value={making}
        suffix="%"
        colors={colors}
        onChange={(text) => setMaking(clampNumber(text, 0, 50))}
      />
      <NumberField
        label="Discount"
        value={discount}
        suffix="%"
        colors={colors}
        onChange={(text) => setDiscount(clampNumber(text, 0, 30))}
      />
      <NumberField
        label="GST"
        value={gst}
        suffix="%"
        colors={colors}
        onChange={(text) => setGst(clampNumber(text, 0, 18))}
      />

      <View style={styles.segmentCard}>
        <Text style={styles.segmentLabel}>Making charges based on</Text>
        <View style={styles.segmentRow}>
          <Pill
            label="Gold Value"
            active={makingBasis === "goldValue"}
            onPress={() => setMakingBasis("goldValue")}
            activeColor={colors.accent}
            colors={colors}
          />
          <Pill
            label="24K Price"
            active={makingBasis === "24k"}
            onPress={() => setMakingBasis("24k")}
            activeColor={colors.accent}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}
