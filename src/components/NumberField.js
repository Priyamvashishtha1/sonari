import React from "react";
import { Text, TextInput, View } from "react-native";

import { sharedStyles as styles } from "../styles/sharedStyles";

export function NumberField({ label, value, onChange, prefix, suffix, placeholder, colors }) {
  const displayValue = value === "" ? "" : String(value);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
          },
        ]}
      >
        {prefix ? <Text style={[styles.inputAffix, { color: colors.muted }]}>{prefix}</Text> : null}
        <TextInput
          keyboardType="decimal-pad"
          value={displayValue}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        {suffix ? <Text style={[styles.inputAffix, { color: colors.muted }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}
