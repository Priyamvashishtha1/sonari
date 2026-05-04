import React from "react";
import { Pressable, Text, View } from "react-native";

export function AppHeader({ dark, ownerView, onToggleDark, onToggleOwnerView, onOpenHistory, styles }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brandTitle}>SonariCalc</Text>
        <Text style={styles.brandSub}>Gold Price Engine</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={onToggleOwnerView} style={styles.headerChip}>
          <Text style={styles.headerChipText}>{ownerView ? "Owner" : "Customer"}</Text>
        </Pressable>
        <Pressable onPress={onOpenHistory} style={styles.iconChip}>
          <Text style={styles.iconText}>History</Text>
        </Pressable>
        <Pressable onPress={onToggleDark} style={styles.iconChip}>
          <Text style={styles.iconText}>{dark ? "Light" : "Dark"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
