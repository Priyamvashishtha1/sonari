import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Slider from "@react-native-community/slider";

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calculatePrice({
  goldRate24K,
  weight,
  karat,
  makingPct,
  discountPct,
  gstPct,
  makingBasis,
}) {
  if (!weight || !goldRate24K) return null;

  const karatFactor = karat / 24;
  const goldRateForKarat = karatFactor * goldRate24K;
  const goldValue = goldRateForKarat * weight;
  const makingRate = makingBasis === "goldValue" ? goldRateForKarat : goldRate24K;
  const makingAmount = weight * (makingPct / 100) * makingRate;
  const subtotal = goldValue + makingAmount;
  const discountAmount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = afterDiscount * (gstPct / 100);
  const finalPrice = afterDiscount + gstAmount;

  return {
    goldValue: round2(goldValue),
    makingAmount: round2(makingAmount),
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    afterDiscount: round2(afterDiscount),
    gstAmount: round2(gstAmount),
    finalPrice: round2(finalPrice),
    goldRateForKarat: round2(goldRateForKarat),
  };
}

function formatINR(value) {
  if (value == null || Number.isNaN(value)) return "--";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    const sign = value < 0 ? "-" : "";
    const absolute = Math.abs(value);
    const [wholePart, decimalPart] = absolute.toFixed(2).split(".");
    const lastThree = wholePart.slice(-3);
    const otherNumbers = wholePart.slice(0, -3);
    const groupedWhole = otherNumbers
      ? `${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`
      : lastThree;

    return `${sign}Rs ${groupedWhole}.${decimalPart}`;
  }
}

function clampNumber(value, min, max) {
  if (value === "") return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  if (max == null) return Math.max(min, parsed);
  return Math.min(max, Math.max(min, parsed));
}

function formatEditableNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return Number.isInteger(value) ? String(value) : String(value);
}

function palette(dark) {
  return dark
    ? {
        status: "light",
        bg: "#0b1220",
        bgAlt: "#121b2e",
        surface: "rgba(20, 29, 46, 0.78)",
        surfaceSoft: "rgba(35, 48, 74, 0.56)",
        border: "rgba(173, 198, 255, 0.18)",
        text: "#f5f9ff",
        muted: "#a6b9d7",
        accent: "#76a9ff",
        accentDeep: "#4d76d9",
        accentSoft: "rgba(118, 169, 255, 0.12)",
        green: "#4ade80",
        red: "#f87171",
        overlay: "rgba(3,8,18,0.64)",
        shadow: "rgba(4, 10, 24, 0.28)",
        glow: "rgba(118, 169, 255, 0.24)",
        hero: "rgba(12, 20, 35, 0.86)",
        glassLine: "rgba(255,255,255,0.14)",
      }
    : {
        status: "dark",
        bg: "#eef5ff",
        bgAlt: "#f8fbff",
        surface: "rgba(255, 255, 255, 0.72)",
        surfaceSoft: "rgba(246, 250, 255, 0.86)",
        border: "rgba(122, 156, 214, 0.24)",
        text: "#142033",
        muted: "#61728f",
        accent: "#5b8cff",
        accentDeep: "#3465d9",
        accentSoft: "rgba(91, 140, 255, 0.10)",
        green: "#15803d",
        red: "#dc2626",
        overlay: "rgba(20,32,51,0.24)",
        shadow: "rgba(108, 145, 210, 0.18)",
        glow: "rgba(91, 140, 255, 0.18)",
        hero: "rgba(255, 255, 255, 0.78)",
        glassLine: "rgba(255,255,255,0.54)",
      };
}

function NumberField({ label, value, onChange, prefix, suffix, placeholder, colors }) {
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

function SliderField({ label, value, onChange, min, max, step, suffix, colors }) {
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

function BreakdownRow({ label, sub, value, color, colors }) {
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

function Pill({ label, active, onPress, activeColor, colors }) {
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

export default function App() {
  const [dark, setDark] = useState(false);
  const [ownerView, setOwnerView] = useState(true);
  const [makingBasis, setMakingBasis] = useState("24k");

  const [goldRate, setGoldRate] = useState(7200);
  const [weight, setWeight] = useState(10);
  const [karat, setKarat] = useState(22);
  const [making, setMaking] = useState(12);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(3);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousFinal = useRef(null);

  const colors = palette(dark);

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

  const stylesWithTheme = themedStyles(colors);

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
    <SafeAreaView style={[stylesWithTheme.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colors.status === "light" ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <ExpoStatusBar style={colors.status} />

      <View style={stylesWithTheme.root}>
        <View style={stylesWithTheme.header}>
          <View>
            <Text style={stylesWithTheme.brandTitle}>SonariCalc</Text>
            <Text style={stylesWithTheme.brandSub}>Gold Price Engine</Text>
          </View>
          <View style={stylesWithTheme.headerActions}>
            <Pressable
              onPress={() => setOwnerView((current) => !current)}
              style={stylesWithTheme.headerChip}
            >
              <Menu>
              <Text style={stylesWithTheme.headerChipText}>
                {ownerView ? "Owner" : "Customer"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowHistory(true)} style={stylesWithTheme.iconChip}>
              <Text style={stylesWithTheme.iconText}>History</Text>
            </Pressable>
            <Pressable onPress={() => setDark((current) => !current)} style={stylesWithTheme.iconChip}>
              <Text style={stylesWithTheme.iconText}>{dark ? "Light" : "Dark"}</Text>
            </Pressable>
            </Menu>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={stylesWithTheme.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={stylesWithTheme.heroCard}>
            <View style={stylesWithTheme.heroTop}>
              <View>
                <Text style={stylesWithTheme.heroEyebrow}>Future Gold Console</Text>
                <Text style={stylesWithTheme.heroTitle}>Professional pricing in a clean glass interface.</Text>
              </View>
              <View style={stylesWithTheme.heroBadge}>
                <Text style={stylesWithTheme.heroBadgeText}>{ownerView ? "Owner Mode" : "Customer Mode"}</Text>
              </View>
            </View>
            <View style={stylesWithTheme.heroMetricRow}>
              <View style={stylesWithTheme.heroMetric}>
                <Text style={stylesWithTheme.heroMetricLabel}>24K base</Text>
                <Text style={stylesWithTheme.heroMetricValue}>{formatINR(goldRate)}</Text>
              </View>
              <View style={stylesWithTheme.heroMetric}>
                <Text style={stylesWithTheme.heroMetricLabel}>Live estimate</Text>
                <Text style={stylesWithTheme.heroMetricValue}>
                  {result ? formatINR(result.finalPrice) : "--"}
                </Text>
              </View>
            </View>
          </View>

          <View style={stylesWithTheme.card}>
            <View style={stylesWithTheme.cardTitleRow}>
              <Text style={stylesWithTheme.cardTitle}>Jewellery Details</Text>
              <View style={stylesWithTheme.karatRow}>
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

            <View style={stylesWithTheme.inputGrid}>
              <NumberField
                label="Gold Rate (24K)"
                value={goldRate}
                placeholder="7200"
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
                onChange={(text) => setWeight(clampNumber(text, 0))}
              />
            </View>

            <NumberField
              label="Making Charges"
              value={making}
              min={0}
              max={50}
              step={0.1}
              suffix="%"
              onChange={setMaking}
              colors={colors}
            />
            <NumberField
              label="Discount"
              value={discount}
              min={0}
              max={30}
              step={0.1}
              suffix="%"
              onChange={setDiscount}
              colors={colors}
            />
            <NumberField
              label="GST"
              value={gst}
              min={0}
              max={18}
              step={0.1}
              suffix="%"
              onChange={setGst}
              colors={colors}
            />

            <View style={stylesWithTheme.segmentCard}>
              <Text style={stylesWithTheme.segmentLabel}>Making charges based on</Text>
              <View style={stylesWithTheme.segmentRow}>
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

          {result ? (
            <View style={stylesWithTheme.card}>
              <View style={stylesWithTheme.cardTitleRow}>
                <Text style={stylesWithTheme.cardTitle}>Price Breakdown</Text>
                <Text style={stylesWithTheme.rateTag}>
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
                  <View style={stylesWithTheme.divider} />
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
                  <BreakdownRow
                    label={`GST (${gst}%)`}
                    value={result.gstAmount}
                    color={colors.red}
                    colors={colors}
                  />
                </View>
              ) : (
                <View style={stylesWithTheme.noteCard}>
                  <Text style={stylesWithTheme.noteText}>
                    BIS Hallmarked • GST Included • Certified Quality
                  </Text>
                </View>
              )}

              <Animated.View
                style={[
                  stylesWithTheme.finalBlock,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Text style={stylesWithTheme.finalLabel}>Final Price</Text>
                <Text style={stylesWithTheme.finalAmount}>{formatINR(result.finalPrice)}</Text>
              </Animated.View>
            </View>
          ) : null}

          <View style={stylesWithTheme.actionRow}>
            <Pressable style={stylesWithTheme.primaryButton} onPress={saveCalculation}>
              <Text style={stylesWithTheme.primaryButtonText}>Save</Text>
            </Pressable>
            <Pressable style={stylesWithTheme.secondaryButton} onPress={shareCalculation}>
              <Text style={stylesWithTheme.secondaryButtonText}>Share</Text>
            </Pressable>
          </View>
        </ScrollView>

        {result ? (
          <View style={stylesWithTheme.stickyBar}>
            <View>
              <Text style={stylesWithTheme.stickyMeta}>
                {karat}K • {weight}g
              </Text>
              <Text style={stylesWithTheme.stickySub}>
                {ownerView ? `Incl. ${gst}% GST` : "Customer view"}
              </Text>
            </View>
            <Animated.Text
              style={[
                stylesWithTheme.stickyPrice,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {formatINR(result.finalPrice)}
            </Animated.Text>
          </View>
        ) : null}

        <Modal visible={showHistory} animationType="slide" transparent onRequestClose={() => setShowHistory(false)}>
          <View style={stylesWithTheme.modalBackdrop}>
            <View style={stylesWithTheme.modalCard}>
              <View style={stylesWithTheme.modalHeader}>
                <Text style={stylesWithTheme.modalTitle}>Recent Calculations</Text>
                <Pressable onPress={() => setShowHistory(false)}>
                  <Text style={stylesWithTheme.modalClose}>Close</Text>
                </Pressable>
              </View>

              {history.length === 0 ? (
                <Text style={stylesWithTheme.emptyText}>No saved calculations yet.</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {history.map((item) => (
                    <View key={item.id} style={stylesWithTheme.historyItem}>
                      <View>
                        <Text style={stylesWithTheme.historyTitle}>
                          {item.karat}K • {item.weight}g
                        </Text>
                        <Text style={stylesWithTheme.historyTime}>{item.time}</Text>
                      </View>
                      <View style={stylesWithTheme.historyRight}>
                        <Text style={stylesWithTheme.historyPrice}>{formatINR(item.finalPrice)}</Text>
                        <Pressable
                          onPress={() =>
                            setHistory((current) => current.filter((entry) => entry.id !== item.id))
                          }
                        >
                          <Text style={stylesWithTheme.deleteText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {history.length > 0 ? (
                <Pressable onPress={() => setHistory([])} style={stylesWithTheme.clearButton}>
                  <Text style={stylesWithTheme.clearButtonText}>Clear All</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  inputShell: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inputAffix: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 12,
    paddingHorizontal: 6,
    outlineWidth: 0,
    outlineStyle: "none",
  },
  sliderGroup: {
    marginBottom: 18,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  sliderInputShell: {
    minWidth: 92,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sliderInput: {
    minWidth: 44,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
    outlineWidth: 0,
    outlineStyle: "none",
  },
  sliderSuffix: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  sliderBounds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderBoundText: {
    fontSize: 11,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 11,
  },
  breakdownTextBlock: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  breakdownSub: {
    fontSize: 12,
    marginTop: 3,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#ffffff",
  },
});

function themedStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgAlt,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 14,
    },
    brandTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
    },
    brandSub: {
      marginTop: 4,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.muted,
    },
    headerActions: {
      alignItems: "flex-end",
      gap: 8,
    },
    headerChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerChipText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    iconChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    iconText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 120,
      gap: 16,
    },
    heroCard: {
      borderRadius: 30,
      padding: 22,
      backgroundColor: colors.hero,
      borderWidth: 1,
      borderColor: colors.glassLine,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 18 },
      elevation: 10,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 14,
    },
    heroEyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.6,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      maxWidth: 260,
    },
    heroBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroBadgeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "800",
    },
    heroMetricRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 22,
    },
    heroMetric: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroMetricLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 10,
    },
    heroMetricValue: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
    },
    card: {
      borderRadius: 28,
      padding: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    cardTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 18,
    },
    cardTitle: {
      flex: 1,
      fontSize: 21,
      fontWeight: "800",
      color: colors.text,
    },
    karatRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: "flex-end",
    },
    inputGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 18,
    },
    segmentCard: {
      marginTop: 6,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      gap: 12,
    },
    segmentLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    segmentRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    rateTag: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      alignSelf: "center",
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
    },
    noteCard: {
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "600",
    },
    finalBlock: {
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 20,
      borderRadius: 22,
      backgroundColor: colors.accentDeep,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: colors.glow,
      shadowOpacity: 1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    finalLabel: {
      color: "#dde9ff",
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: "700",
    },
    finalAmount: {
      color: "#ffffff",
      fontSize: 29,
      fontWeight: "900",
      textAlign: "right",
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 2,
    },
    primaryButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.9,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    primaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 18,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.9,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    secondaryButtonText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "800",
    },
    stickyBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.hero,
    },
    stickyMeta: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "800",
    },
    stickySub: {
      marginTop: 3,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    stickyPrice: {
      color: colors.accent,
      fontSize: 24,
      fontWeight: "900",
      flexShrink: 1,
      textAlign: "right",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalCard: {
      maxHeight: "80%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.surface,
      padding: 20,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
    },
    modalClose: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
    },
    emptyText: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
      paddingVertical: 18,
    },
    historyItem: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      padding: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    historyTitle: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
    },
    historyTime: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
      fontWeight: "600",
    },
    historyRight: {
      alignItems: "flex-end",
      gap: 8,
    },
    historyPrice: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      textAlign: "right",
    },
    deleteText: {
      color: colors.red,
      fontSize: 12,
      fontWeight: "800",
    },
    clearButton: {
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.bgAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearButtonText: {
      color: colors.red,
      fontSize: 14,
      fontWeight: "800",
    },
  });
}
