import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { AppHeader } from "./src/components/AppHeader";
import { HeroSummary } from "./src/components/HeroSummary";
import { HistoryModal } from "./src/components/HistoryModal";
import { JewelleryForm } from "./src/components/JewelleryForm";
import { PriceBreakdown } from "./src/components/PriceBreakdown";
import { createThemedStyles } from "./src/styles/themedStyles";
import { palette } from "./src/theme/palette";
import { calculatePrice, formatINR } from "./src/utils/price";

const DEFAULT_FORM = {
  goldRate: 7200,
  weight: 10,
  karat: 22,
  making: 12,
  discount: 0,
  gst: 3,
  makingBasis: "24k",
};

export default function App() {
  const [dark, setDark] = useState(false);
  const [ownerView, setOwnerView] = useState(true);
  const [makingBasis, setMakingBasis] = useState(DEFAULT_FORM.makingBasis);

  const [goldRate, setGoldRate] = useState(DEFAULT_FORM.goldRate);
  const [weight, setWeight] = useState(DEFAULT_FORM.weight);
  const [karat, setKarat] = useState(DEFAULT_FORM.karat);
  const [making, setMaking] = useState(DEFAULT_FORM.making);
  const [discount, setDiscount] = useState(DEFAULT_FORM.discount);
  const [gst, setGst] = useState(DEFAULT_FORM.gst);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousFinal = useRef(null);

  const colors = useMemo(() => palette(dark), [dark]);
  const styles = useMemo(() => createThemedStyles(colors), [colors]);

  useEffect(() => {
    const nextResult = calculatePrice({
      goldRate24K: goldRate,
      weight,
      karat,
      makingPct: making,
      discountPct: discount,
      gstPct: gst,
      makingBasis,
    });

    setResult(nextResult);

    if (nextResult && previousFinal.current !== nextResult.finalPrice) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      previousFinal.current = nextResult.finalPrice;
    }
  }, [discount, goldRate, gst, karat, making, makingBasis, scaleAnim, weight]);

  const saveCalculation = () => {
    if (!result) return;

    const now = new Date();
    const entry = {
      id: Date.now().toString(),
      karat,
      weight,
      finalPrice: result.finalPrice,
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setHistory((current) => [entry, ...current].slice(0, 20));
    setShowHistory(true);
  };

  const deleteHistoryItem = (id) => {
    setHistory((current) => current.filter((entry) => entry.id !== id));
  };

  const shareCalculation = async () => {
    if (!result) return;

    const text = [
      "Gold Jewellery Price",
      "--------------------",
      `Gold Rate (24K): ${formatINR(goldRate)}/gm`,
      `Gold Rate (${karat}K): ${formatINR(result.goldRateForKarat)}/gm`,
      `Weight: ${weight} gm | Karat: ${karat}K`,
      `Gold Value: ${formatINR(result.goldValue)}`,
      `Making Charges: ${formatINR(result.makingAmount)}`,
      discount > 0 ? `Discount (${discount}%): -${formatINR(result.discountAmount)}` : null,
      `GST (${gst}%): ${formatINR(result.gstAmount)}`,
      "--------------------",
      `Final Price: ${formatINR(result.finalPrice)}`,
      "",
      "Calculated via SonariCalc",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({ message: text, title: "SonariCalc Quote" });
    } catch (error) {
      console.warn("Share failed", error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colors.status === "light" ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <ExpoStatusBar style={colors.status} />

      <View style={styles.root}>
        <AppHeader
          dark={dark}
          ownerView={ownerView}
          onOpenHistory={() => setShowHistory(true)}
          onToggleDark={() => setDark((current) => !current)}
          onToggleOwnerView={() => setOwnerView((current) => !current)}
          styles={styles}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <HeroSummary goldRate={goldRate} ownerView={ownerView} result={result} styles={styles} />

          <JewelleryForm
            colors={colors}
            discount={discount}
            goldRate={goldRate}
            gst={gst}
            karat={karat}
            making={making}
            makingBasis={makingBasis}
            setDiscount={setDiscount}
            setGoldRate={setGoldRate}
            setGst={setGst}
            setKarat={setKarat}
            setMaking={setMaking}
            setMakingBasis={setMakingBasis}
            setWeight={setWeight}
            styles={styles}
            weight={weight}
          />

          <PriceBreakdown
            colors={colors}
            discount={discount}
            gst={gst}
            karat={karat}
            making={making}
            makingBasis={makingBasis}
            ownerView={ownerView}
            result={result}
            scaleAnim={scaleAnim}
            styles={styles}
            weight={weight}
          />

          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} onPress={saveCalculation}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={shareCalculation}>
              <Text style={styles.secondaryButtonText}>Share</Text>
            </Pressable>
          </View>
        </ScrollView>

        {result ? (
          <View style={styles.stickyBar}>
            <View>
              <Text style={styles.stickyMeta}>
                {karat}K - {weight}g
              </Text>
              <Text style={styles.stickySub}>{ownerView ? `Incl. ${gst}% GST` : "Customer view"}</Text>
            </View>
            <Animated.Text style={[styles.stickyPrice, { transform: [{ scale: scaleAnim }] }]}>
              {formatINR(result.finalPrice)}
            </Animated.Text>
          </View>
        ) : null}

        <HistoryModal
          history={history}
          onClear={() => setHistory([])}
          onClose={() => setShowHistory(false)}
          onDelete={deleteHistoryItem}
          styles={styles}
          visible={showHistory}
        />
      </View>
    </SafeAreaView>
  );
}
