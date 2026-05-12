import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, TextInput, ToastAndroid, View, Platform } from "react-native";

import { loadLocalValue, saveLocalValue } from "../services/localStore";
import {
  calculateInterest,
  COMPOUND_FREQUENCY_OPTIONS,
  formatDateInput,
  getDurationFromDates,
  getInterestRateMeta,
  getDurationFromParts,
  INTEREST_TYPE_OPTIONS,
  parseDateInput,
} from "../utils/interest";
import { formatINR } from "../utils/price";

const STORE_KEY = "sonari.interest.lastCalculation";
const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const initialForm = {
  interestType: "monthlyFlat",
  principal: "",
  rate: "",
  durationMode: "dates",
  exactDayBased: false,
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
  const [datePicker, setDatePicker] = useState({
    visible: false,
    field: "fromDate",
    draft: { day: 1, month: 0, year: new Date().getFullYear() },
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const saved = loadLocalValue(STORE_KEY, null);
    if (saved?.form) setForm({ ...initialForm, ...saved.form });
  }, []);

  const rateMeta = useMemo(() => getInterestRateMeta(form.interestType), [form.interestType]);

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

  const calculation = useMemo(() => {
    try {
      return {
        error: "",
        result: calculateInterest({
          principal: form.principal,
          rate: form.rate,
          interestType: form.interestType,
          duration,
          compoundingFrequency: form.compoundingFrequency,
          exactDayBased: form.exactDayBased,
        }),
      };
    } catch (calculationError) {
      return {
        error: calculationError.message,
        result: null,
      };
    }
  }, [duration, form.compoundingFrequency, form.interestType, form.principal, form.rate]);

  useEffect(() => {
    if (!calculation.result) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [calculation.result, fadeAnim]);

  const updateForm = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const showError = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const handleNumericChange = (key, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      updateForm({ [key]: value });
    }
  };

  const handleWholeNumberChange = (key, value) => {
    if (/^\d*$/.test(value)) {
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

  const saveSnapshot = () => {
    if (!calculation.result) {
      showError(calculation.error || "Enter a valid interest calculation.");
      return;
    }
    saveLocalValue(STORE_KEY, { form, result: calculation.result });
    if (Platform.OS === "android") {
      ToastAndroid.show("Calculation saved", ToastAndroid.SHORT);
    }
  };

  const clear = () => {
    setForm(initialForm);
    saveLocalValue(STORE_KEY, null);
  };

  return (
    <ScrollView contentContainerStyle={styles.interestContent} showsVerticalScrollIndicator={false}>
      <View style={styles.interestHeader}>
        <View>
          <Text style={styles.interestTitle}>Interest Calculator</Text>
          <Text style={styles.interestSubtitle}>Monthly flat, simple, compound, and daily lending calculations for Indian market use.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lending Setup</Text>
        <Text style={styles.fintechSectionLabel}>Interest Mode</Text>
        <View style={styles.interestTypeGrid}>
          {INTEREST_TYPE_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              active={form.interestType === option.value}
              colors={colors}
              label={option.label}
              onPress={() => updateForm({ interestType: option.value })}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.fintechSectionLabel}>Principal Amount</Text>
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
        <View style={styles.rateMetaCard}>
          <Text style={styles.rateMetaBadge}>{rateMeta.badge}</Text>
          <Text style={styles.rateMetaText}>{rateMeta.helper}</Text>
        </View>
        <InputRow
          colors={colors}
          inline={false}
          label={rateMeta.title}
          placeholder="Enter interest value"
          value={form.rate}
          onChangeText={(value) => handleNumericChange("rate", value)}
          styles={styles}
        />
        {form.interestType === "compound" ? (
          <View style={styles.compoundBlock}>
            <Text style={styles.compoundLabel}>Compounding frequency</Text>
            <View style={styles.segmentRow}>
              {COMPOUND_FREQUENCY_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  active={form.compoundingFrequency === option.value}
                  colors={colors}
                  label={option.label}
                  onPress={() => updateForm({ compoundingFrequency: option.value })}
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
              onChangeText={(value) => handleWholeNumberChange("years", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              inline
              label="Months"
              placeholder="0"
              value={form.months}
              onChangeText={(value) => handleWholeNumberChange("months", value)}
              styles={styles}
            />
            <InputRow
              colors={colors}
              inline
              label="Days"
              placeholder="0"
              value={form.days}
              onChangeText={(value) => handleWholeNumberChange("days", value)}
              styles={styles}
            />
          </View>
        )}

        {form.interestType !== "dailyInterest" ? (
          <ExactModeToggle
            enabled={form.exactDayBased}
            helper={
              form.exactDayBased
                ? "Exact day-based mode prorates using the actual day span. Traditional Indian month counting is temporarily off."
                : "Traditional Indian month counting is on. Full calendar months are counted and partial month fractions are ignored."
            }
            onPress={() => updateForm({ exactDayBased: !form.exactDayBased })}
            styles={styles}
          />
        ) : (
          <View style={styles.exactModeCard}>
            <Text style={styles.exactModeLabel}>Exact Day-Based Calculation</Text>
            <Text style={styles.exactModeHelper}>Daily Interest always uses exact day counting automatically.</Text>
          </View>
        )}
      </View>

      {calculation.error ? <Text style={styles.interestError}>{calculation.error}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={saveSnapshot}>
          <Text style={styles.primaryButtonText}>Save Snapshot</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={clear}>
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </View>

      {calculation.result ? (
        <Animated.View style={[styles.interestResultCard, { opacity: fadeAnim }]}>
          <Text style={styles.resultEyebrow}>Result</Text>
          <Text style={styles.resultAmount}>{formatINR(calculation.result.grandTotal)}</Text>
          <Text style={styles.resultHelper}>
            {calculation.result.interestModeLabel} • {calculation.result.calculationBasisLabel}
          </Text>
          <View style={styles.resultHighlightRow}>
            <ResultMetric
              label={calculation.result.periodicInterestLabel}
              value={formatINR(calculation.result.periodicInterest)}
              styles={styles}
            />
            <ResultMetric
              label="Total Interest"
              value={formatINR(calculation.result.totalInterest)}
              styles={styles}
            />
          </View>
          <ResultRow label="Principal Amount" value={formatINR(calculation.result.principalAmount)} styles={styles} />
          <ResultRow label={calculation.result.periodicInterestLabel} value={formatINR(calculation.result.periodicInterest)} styles={styles} />
          <ResultRow label="Interest Amount" value={formatINR(calculation.result.interestAmount)} styles={styles} />
          <ResultRow label="Total Duration" value={calculation.result.totalDurationLabel} styles={styles} />
          <ResultRow label="Total Interest" value={formatINR(calculation.result.totalInterest)} styles={styles} />
          <ResultRow
            label="Grand Total"
            value={formatINR(calculation.result.grandTotal)}
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

function ExactModeToggle({ enabled, helper, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.exactModeCard, enabled ? styles.exactModeCardActive : null]}>
      <View style={styles.exactModeRow}>
        <View style={[styles.exactModeCheckbox, enabled ? styles.exactModeCheckboxActive : null]}>
          {enabled ? <Text style={styles.exactModeCheckboxTick}>✓</Text> : null}
        </View>
        <View style={styles.exactModeTextWrap}>
          <Text style={styles.exactModeLabel}>Exact Day-Based Calculation</Text>
          <Text style={styles.exactModeHelper}>{helper}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ResultMetric({ label, styles, value }) {
  return (
    <View style={styles.resultHighlightCard}>
      <Text style={styles.resultHighlightLabel}>{label}</Text>
      <Text style={styles.resultHighlightValue}>{value}</Text>
    </View>
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
