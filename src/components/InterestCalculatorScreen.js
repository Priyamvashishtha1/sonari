import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, TextInput, ToastAndroid, View, Platform } from "react-native";

import { loadLocalValue, saveLocalValue } from "../services/localStore";
import {
  calculateInterest,
  formatDateInput,
  getDurationFromDates,
  getDurationFromParts,
  parseDateInput,
} from "../utils/interest";
import { formatINR } from "../utils/price";

const STORE_KEY = "sonari.interest.lastCalculation";
const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function InterestCalculatorScreen({ colors, styles }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [datePicker, setDatePicker] = useState({
    visible: false,
    field: "fromDate",
    draft: { day: 1, month: 0, year: new Date().getFullYear() },
  });
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

  const openDatePicker = (field) => {
    const parsed = parseDateInput(form[field]) || new Date();
    setDatePicker({
      visible: true,
      field,
      draft: {
        day: parsed.getDate(),
        month: parsed.getMonth(),
        year: parsed.getFullYear(),
      },
    });
  };

  const closeDatePicker = () => {
    setDatePicker((current) => ({ ...current, visible: false }));
  };

  const setDateDraft = (patch) => {
    setDatePicker((current) => {
      const nextDraft = { ...current.draft, ...patch };
      const maxDay = getDaysInMonth(nextDraft.year, nextDraft.month);
      if (nextDraft.day > maxDay) {
        nextDraft.day = maxDay;
      }

      return {
        ...current,
        draft: nextDraft,
      };
    });
  };

  const confirmDatePicker = () => {
    const pickedDate = new Date(datePicker.draft.year, datePicker.draft.month, datePicker.draft.day);
    updateForm({ [datePicker.field]: formatDateInput(pickedDate) });
    closeDatePicker();
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
          inline={false}
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
          inline={false}
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
            <DateField
              label="From Date"
              onPress={() => openDatePicker("fromDate")}
              styles={styles}
              value={form.fromDate}
            />
            <DateField
              label="To Date"
              onPress={() => openDatePicker("toDate")}
              styles={styles}
              value={form.toDate}
            />
          </View>
        ) : (
          <View style={styles.inputGrid}>
            <InputRow
              colors={colors}
              inline
              label="Years"
              placeholder="0"
              value={form.years}
              onChangeText={(value) => handleNumericChange("years", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              inline
              label="Months"
              placeholder="0"
              value={form.months}
              onChangeText={(value) => handleNumericChange("months", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              inline
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

      <DatePickerModal
        draft={datePicker.draft}
        onCancel={closeDatePicker}
        onConfirm={confirmDatePicker}
        onChangeDraft={setDateDraft}
        styles={styles}
        visible={datePicker.visible}
      />
    </ScrollView>
  );
}

function DateField({ label, onPress, styles, value }) {
  return (
    <Pressable onPress={onPress} style={styles.dateFieldWrap}>
      <Text style={styles.dateFieldLabel}>{label}</Text>
      <View style={styles.dateFieldShell}>
        <Text style={styles.dateFieldValue}>{value}</Text>
        <Text style={styles.dateFieldIcon}>📅</Text>
      </View>
    </Pressable>
  );
}

function DatePickerModal({ draft, onCancel, onConfirm, onChangeDraft, styles, visible }) {
  const maxDay = getDaysInMonth(draft.year, draft.month);
  const years = [draft.year - 1, draft.year, draft.year + 1];
  const days = [Math.max(1, draft.day - 1), draft.day, Math.min(maxDay, draft.day + 1)];
  const months = [MONTH_LABELS[(draft.month + 11) % 12], MONTH_LABELS[draft.month], MONTH_LABELS[(draft.month + 1) % 12]];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.datePickerBackdrop}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>Select date</Text>

          <View style={styles.datePickerColumns}>
            <WheelColumn
              centerValue={months[1]}
              nextValue={months[2]}
              prevValue={months[0]}
              onNext={() => onChangeDraft({ month: (draft.month + 1) % 12, year: draft.month === 11 ? draft.year + 1 : draft.year })}
              onPrev={() => onChangeDraft({ month: (draft.month + 11) % 12, year: draft.month === 0 ? draft.year - 1 : draft.year })}
              styles={styles}
            />
            <WheelColumn
              centerValue={String(days[1]).padStart(2, "0")}
              nextValue={String(days[2]).padStart(2, "0")}
              prevValue={String(days[0]).padStart(2, "0")}
              onNext={() => onChangeDraft({ day: draft.day >= maxDay ? 1 : draft.day + 1 })}
              onPrev={() => onChangeDraft({ day: draft.day <= 1 ? maxDay : draft.day - 1 })}
              styles={styles}
            />
            <WheelColumn
              centerValue={String(years[1])}
              nextValue={String(years[2])}
              prevValue={String(years[0])}
              onNext={() => onChangeDraft({ year: draft.year + 1 })}
              onPrev={() => onChangeDraft({ year: draft.year - 1 })}
              styles={styles}
            />
          </View>

          <View style={styles.datePickerActions}>
            <Pressable onPress={onCancel} style={styles.datePickerButtonGhost}>
              <Text style={styles.datePickerButtonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.datePickerButtonPrimary}>
              <Text style={styles.datePickerButtonPrimaryText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WheelColumn({ centerValue, nextValue, onNext, onPrev, prevValue, styles }) {
  return (
    <View style={styles.dateWheelColumn}>
      <Pressable onPress={onPrev} style={styles.dateWheelOption}>
        <Text style={styles.dateWheelTextMuted}>{prevValue}</Text>
      </Pressable>
      <View style={styles.dateWheelSelected}>
        <Text style={styles.dateWheelTextStrong}>{centerValue}</Text>
      </View>
      <Pressable onPress={onNext} style={styles.dateWheelOption}>
        <Text style={styles.dateWheelTextMuted}>{nextValue}</Text>
      </Pressable>
    </View>
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

function InputRow({
  colors,
  inline = false,
  keyboardType = "decimal-pad",
  label,
  onChangeText,
  placeholder,
  styles,
  value,
}) {
  return (
    <View style={inline ? styles.interestInputGroupInline : styles.interestInputGroup}>
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

function ResultRow({ label, styles, value }) {
  return (
    <View style={styles.interestResultRow}>
      <Text style={styles.interestResultLabel}>{label}</Text>
      <Text style={styles.interestResultValue}>{value}</Text>
    </View>
  );
}
