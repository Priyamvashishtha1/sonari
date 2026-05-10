import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, ToastAndroid, View, Platform } from "react-native";

import { loadLocalValue, saveLocalValue } from "../services/localStore";
import {
  calculateInterest,
  formatDateInput,
  getDurationFromDates,
  getDurationFromParts,
} from "../utils/interest";
import { formatINR } from "../utils/price";

const STORE_KEY = "sonari.interest.lastCalculation";

const initialForm = {
  interestType: "simple",
  principal: "",
  rateMode: "rupees",
  rate: "",
  durationMode: "dates",
  fromDate: formatDateInput(new Date()),
  toDate: formatDateInput(new Date()),
  years: "",
  months: "",
  days: "",
  compoundingFrequency: "monthly",
};

export function InterestCalculatorScreen({ colors, styles }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const saved = loadLocalValue(STORE_KEY, null);
    if (saved?.form) setForm({ ...initialForm, ...saved.form });
    if (saved?.result) setResult(saved.result);
  }, []);

  useEffect(() => {
    if (!result) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [fadeAnim, result]);

  const rateLabel = form.rateMode === "rupees" ? "Interest Rate (in rupees)" : "Interest Rate (%)";

  const duration = useMemo(() => {
    if (form.durationMode === "dates") {
      return getDurationFromDates(form.fromDate, form.toDate);
    }

    return getDurationFromParts({
      years: form.years,
      months: form.months,
      days: form.days,
    });
  }, [form.days, form.durationMode, form.fromDate, form.months, form.toDate, form.years]);

  const updateForm = (patch) => {
    setError("");
    setForm((current) => ({ ...current, ...patch }));
  };

  const showError = (message) => {
    setError(message);
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const handleNumericChange = (key, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      updateForm({ [key]: value });
    }
  };

  const handleDateChange = (key, value) => {
    if (/^[\d/]*$/.test(value) && value.length <= 10) {
      updateForm({ [key]: value });
    }
  };

  const calculate = () => {
    try {
      const nextResult = calculateInterest({
        principal: form.principal,
        rate: form.rate,
        rateMode: form.rateMode,
        interestType: form.interestType,
        duration,
        compoundingFrequency: form.compoundingFrequency,
      });
      setResult(nextResult);
      saveLocalValue(STORE_KEY, { form, result: nextResult });
    } catch (calculationError) {
      showError(calculationError.message);
    }
  };

  const clear = () => {
    setForm(initialForm);
    setResult(null);
    setError("");
    saveLocalValue(STORE_KEY, null);
  };

  return (
    <ScrollView contentContainerStyle={styles.interestContent} showsVerticalScrollIndicator={false}>
      <View style={styles.interestHeader}>
        <View>
          <Text style={styles.interestTitle}>Interest Calculator</Text>
          <Text style={styles.interestSubtitle}>Simple and compound returns for daily shop use</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Interest Type</Text>
        <RadioRow
          colors={colors}
          options={[
            { label: "Simple Interest", value: "simple" },
            { label: "Compound Interest", value: "compound" },
          ]}
          value={form.interestType}
          onChange={(interestType) => updateForm({ interestType })}
          styles={styles}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Principal Amount</Text>
        <InputRow
          colors={colors}
          label="Principal"
          placeholder="Enter principal amount"
          value={form.principal}
          onChangeText={(value) => handleNumericChange("principal", value)}
          styles={styles}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Interest Rate</Text>
        <View style={styles.segmentRow}>
          <ToggleButton
            active={form.rateMode === "rupees"}
            colors={colors}
            label="Rupees"
            onPress={() => updateForm({ rateMode: "rupees" })}
            styles={styles}
          />
          <ToggleButton
            active={form.rateMode === "percentage"}
            colors={colors}
            label="Percentage"
            onPress={() => updateForm({ rateMode: "percentage" })}
            styles={styles}
          />
        </View>
        <InputRow
          colors={colors}
          label={rateLabel}
          placeholder={form.rateMode === "rupees" ? "Monthly or fixed amount" : "Annual percentage rate"}
          value={form.rate}
          onChangeText={(value) => handleNumericChange("rate", value)}
          styles={styles}
        />
        {form.interestType === "compound" && form.rateMode === "percentage" ? (
          <View style={styles.compoundBlock}>
            <Text style={styles.compoundLabel}>Compounding frequency</Text>
            <View style={styles.segmentRow}>
              {[
                ["Monthly", "monthly"],
                ["Quarterly", "quarterly"],
                ["Half-Yearly", "halfYearly"],
                ["Yearly", "yearly"],
              ].map(([label, value]) => (
                <ToggleButton
                  key={value}
                  active={form.compoundingFrequency === value}
                  colors={colors}
                  label={label}
                  onPress={() => updateForm({ compoundingFrequency: value })}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Date / Duration</Text>
        <RadioRow
          colors={colors}
          options={[
            { label: "Dates", value: "dates" },
            { label: "Duration", value: "duration" },
          ]}
          value={form.durationMode}
          onChange={(durationMode) => updateForm({ durationMode })}
          styles={styles}
        />

        {form.durationMode === "dates" ? (
          <View style={styles.inputGrid}>
            <InputRow
              colors={colors}
              keyboardType="default"
              label="From Date"
              placeholder="dd/MM/yyyy"
              value={form.fromDate}
              onChangeText={(value) => handleDateChange("fromDate", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              keyboardType="default"
              label="To Date"
              placeholder="dd/MM/yyyy"
              value={form.toDate}
              onChangeText={(value) => handleDateChange("toDate", value)}
              styles={styles}
            />
          </View>
        ) : (
          <View style={styles.inputGrid}>
            <InputRow
              colors={colors}
              label="Years"
              placeholder="0"
              value={form.years}
              onChangeText={(value) => handleNumericChange("years", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              label="Months"
              placeholder="0"
              value={form.months}
              onChangeText={(value) => handleNumericChange("months", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              label="Days"
              placeholder="0"
              value={form.days}
              onChangeText={(value) => handleNumericChange("days", value)}
              styles={styles}
            />
          </View>
        )}
      </View>

      {error ? <Text style={styles.interestError}>{error}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={calculate}>
          <Text style={styles.primaryButtonText}>Calculate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={clear}>
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </View>

      {result ? (
        <Animated.View style={[styles.interestResultCard, { opacity: fadeAnim }]}>
          <Text style={styles.resultEyebrow}>Result</Text>
          <Text style={styles.resultAmount}>{formatINR(result.totalAmount)}</Text>
          <ResultRow label="Principal Amount" value={formatINR(result.principalAmount)} colors={colors} styles={styles} />
          <ResultRow label="Interest Earned" value={formatINR(result.interestEarned)} colors={colors} styles={styles} />
          <ResultRow label="Total Duration" value={result.durationLabel} colors={colors} styles={styles} />
          <ResultRow
            label="Interest Type"
            value={result.interestType === "simple" ? "Simple Interest" : "Compound Interest"}
            colors={colors}
            styles={styles}
          />
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

function RadioRow({ colors, options, value, onChange, styles }) {
  return (
    <View style={styles.radioGroup}>
      {options.map((option) => (
        <Pressable key={option.value} onPress={() => onChange(option.value)} style={styles.radioItem}>
          <View style={[styles.radioOuter, { borderColor: value === option.value ? colors.accent : colors.border }]}>
            {value === option.value ? <View style={[styles.radioInner, { backgroundColor: colors.accent }]} /> : null}
          </View>
          <Text style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ToggleButton({ active, colors, label, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.interestToggle,
        {
          backgroundColor: active ? colors.accent : colors.surfaceSoft,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[styles.interestToggleText, { color: active ? "#ffffff" : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

function InputRow({ colors, keyboardType = "decimal-pad", label, onChangeText, placeholder, styles, value }) {
  return (
    <View style={styles.interestInputGroup}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.interestInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
        value={String(value)}
      />
    </View>
  );
}

function ResultRow({ colors, label, styles, value }) {
  return (
    <View style={styles.interestResultRow}>
      <Text style={[styles.interestResultLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.interestResultValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}
