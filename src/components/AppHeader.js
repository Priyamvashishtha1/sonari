import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function AppHeader({ dark, ownerView, onToggleDark, onToggleOwnerView, onOpenHistory, styles }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenHistory = () => {
    setMenuOpen(false);
    onOpenHistory();
  };

  const handleToggleOwnerView = () => {
    setMenuOpen(false);
    onToggleOwnerView();
  };

  const handleToggleDark = () => {
    setMenuOpen(false);
    onToggleDark();
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brandTitle}>SonariCalc</Text>
        <Text style={styles.brandSub}>Gold Price Engine</Text>
      </View>
      <View style={styles.headerMenuWrap}>
        <Pressable onPress={() => setMenuOpen((current) => !current)} style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>≡</Text>
        </Pressable>

        {menuOpen ? (
          <View style={styles.menuDropdown}>
            <Pressable onPress={handleToggleOwnerView} style={styles.menuItem}>
              <Text style={styles.menuItemTitle}>{ownerView ? "Switch to Customer" : "Switch to Owner"}</Text>
              <Text style={styles.menuItemMeta}>{ownerView ? "Owner mode active" : "Customer mode active"}</Text>
            </Pressable>

            <Pressable onPress={handleOpenHistory} style={styles.menuItem}>
              <Text style={styles.menuItemTitle}>History</Text>
              <Text style={styles.menuItemMeta}>Open saved calculations</Text>
            </Pressable>

            <Pressable onPress={handleToggleDark} style={styles.menuItem}>
              <Text style={styles.menuItemTitle}>{dark ? "Light Mode" : "Dark Mode"}</Text>
              <Text style={styles.menuItemMeta}>Change app appearance</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
