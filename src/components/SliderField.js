import React from "react";
import { Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

import { sharedStyles as styles } from "../styles/sharedStyles";
import { clampNumber, formatEditableNumber } from "../utils/price";

export function SliderField({ label, value, onChange, min, max, step, suffix, colors }) {
  return (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.text }]}>{label}</Text>
        <View
          style={[
            styles.sliderInputShell,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            keyboardType="decimal-pad"
            value={formatEditableNumber(value)}
            onChangeText={(text) => {
              if (text === "") {
                onChange(min);
                return;
              }

              const nextValue = clampNumber(text, min, max);
              if (nextValue !== "") {
                onChange(nextValue);
              }
            }}
            style={[styles.sliderInput, { color: colors.accent }]}
          />
          <Text style={[styles.sliderSuffix, { color: colors.muted }]}>{suffix}</Text>
        </View>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
        value={value}
        onValueChange={onChange}
      />
      <View style={styles.sliderBounds}>
        <Text style={[styles.sliderBoundText, { color: colors.muted }]}>
          {min}
          {suffix}
        </Text>
        <Text style={[styles.sliderBoundText, { color: colors.muted }]}>
          {max}
          {suffix}
        </Text>
      </View>
    </View>
  );
}
