const DAY_MS = 24 * 60 * 60 * 1000;

export const INTEREST_TYPE_OPTIONS = [
  { label: "Monthly Flat", value: "monthlyFlat" },
  { label: "Yearly Simple", value: "yearlySimple" },
  { label: "Compound", value: "compound" },
  { label: "Daily Interest", value: "dailyInterest" },
];

export const COMPOUND_FREQUENCY_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Half-Yearly", value: "halfYearly" },
  { label: "Yearly", value: "yearly" },
];

export function parseDateInput(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function formatDateInput(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function getDurationFromDates(fromValue, toValue) {
  const fromDate = parseDateInput(fromValue);
  const toDate = parseDateInput(toValue);

  if (!fromDate || !toDate || toDate < fromDate) {
    return null;
  }

  return createDurationSnapshot(fromDate, toDate);
}

export function getDurationFromParts({ years, months, days }) {
  const numericYears = toPositiveNumber(years);
  const numericMonths = toPositiveNumber(months);
  const numericDays = toPositiveNumber(days);

  if (hasDecimalPortion(numericYears) || hasDecimalPortion(numericMonths) || hasDecimalPortion(numericDays)) {
    return null;
  }

  const normalizedMonths = Math.floor(numericYears) * 12 + Math.floor(numericMonths);
  const normalizedDays = Math.floor(numericDays);
  const normalizedParts = splitMonths(normalizedMonths);

  return {
    years: normalizedParts.years,
    months: normalizedParts.months,
    days: normalizedDays,
    totalDays: normalizedMonths * 30 + normalizedDays,
    traditionalMonths: normalizedMonths,
    exactMonths: roundDecimal(normalizedMonths + normalizedDays / 30, 4),
    totalYearsTraditional: normalizedMonths / 12,
    totalYearsExact: roundDecimal((normalizedMonths + normalizedDays / 30) / 12, 6),
    labelTraditional: formatDurationParts({ years: normalizedParts.years, months: normalizedParts.months }),
    labelExact: formatDurationParts({
      years: normalizedParts.years,
      months: normalizedParts.months,
      days: normalizedDays,
    }),
    decimalMonthsLabel: `${trimTrailingZeros(roundDecimal(normalizedMonths + normalizedDays / 30, 2))} Months`,
  };
}

export function formatDuration(duration, options = {}) {
  if (!duration) return "--";
  return options.exact ? duration.labelExact : duration.labelTraditional;
}

export function getInterestRateMeta(interestType) {
  switch (interestType) {
    case "monthlyFlat":
      return {
        title: "Monthly Interest Rate (per ₹100)",
        helper: "₹2 means ₹2 per ₹100 per month. Default mode follows traditional Indian calendar-month counting.",
        badge: "₹ per ₹100/month",
      };
    case "yearlySimple":
      return {
        title: "Yearly Simple Rate (%)",
        helper: "Annual simple interest percentage applied over the selected duration.",
        badge: "% per year",
      };
    case "compound":
      return {
        title: "Compound Rate (%)",
        helper: "Annual percentage compounded by the selected frequency.",
        badge: "% compounded",
      };
    case "dailyInterest":
      return {
        title: "Daily Rate (per ₹100)",
        helper: "₹1 means ₹1 per ₹100 per day using exact day counting.",
        badge: "₹ per ₹100/day",
      };
    default:
      return {
        title: "Interest Rate",
        helper: "",
        badge: "",
      };
  }
}

export function calculateInterest({
  principal,
  rate,
  interestType,
  duration,
  compoundingFrequency,
  exactDayBased = false,
}) {
  const principalAmount = requirePositiveNumber(principal, "Enter a valid principal amount.");
  const rateValue = requirePositiveNumber(rate, "Enter a valid interest rate.");

  if (!duration || duration.totalDays < 0) {
    throw new Error("Enter a valid duration.");
  }

  if (duration.totalDays === 0 && duration.traditionalMonths === 0) {
    throw new Error("Enter a valid duration.");
  }

  let periodicInterest = 0;
  let periodicInterestLabel = "Monthly Interest";
  let interestAmount = 0;
  let interestModeLabel = "";
  let durationLabel = exactDayBased ? duration.labelExact : duration.labelTraditional;
  let durationValue = 0;
  let calculationBasisLabel = "";

  switch (interestType) {
    case "monthlyFlat": {
      periodicInterest = (principalAmount * rateValue) / 100;
      periodicInterestLabel = "Monthly Interest";
      durationValue = exactDayBased ? duration.exactMonths : duration.traditionalMonths;
      interestAmount = periodicInterest * durationValue;
      interestModeLabel = "Monthly Flat";
      calculationBasisLabel = exactDayBased
        ? "Exact day-based proration"
        : "Traditional Indian calendar-month system";
      break;
    }
    case "yearlySimple": {
      const annualInterest = (principalAmount * rateValue) / 100;
      periodicInterest = annualInterest / 12;
      periodicInterestLabel = "Monthly Equivalent";
      durationValue = exactDayBased ? duration.totalYearsExact : duration.totalYearsTraditional;
      interestAmount = annualInterest * durationValue;
      interestModeLabel = "Yearly Simple";
      calculationBasisLabel = exactDayBased ? "Exact day-based yearly proration" : "Calendar month conversion";
      break;
    }
    case "compound": {
      const frequencyMap = {
        monthly: 12,
        quarterly: 4,
        halfYearly: 2,
        yearly: 1,
      };
      const periodsPerYear = frequencyMap[compoundingFrequency] || 12;
      const years = exactDayBased ? duration.totalYearsExact : duration.totalYearsTraditional;
      const totalAmount =
        principalAmount * Math.pow(1 + rateValue / 100 / periodsPerYear, periodsPerYear * years);
      interestAmount = totalAmount - principalAmount;
      periodicInterest = duration.exactMonths > 0 ? interestAmount / duration.exactMonths : 0;
      periodicInterestLabel = "Average Monthly Gain";
      durationValue = years;
      interestModeLabel = "Compound";
      calculationBasisLabel = exactDayBased ? "Exact time-period compounding" : "Calendar month conversion";
      break;
    }
    case "dailyInterest": {
      const dailyInterest = (principalAmount * rateValue) / 100;
      periodicInterest = dailyInterest;
      periodicInterestLabel = "Daily Interest";
      durationValue = duration.totalDays;
      interestAmount = dailyInterest * duration.totalDays;
      interestModeLabel = "Daily Interest";
      durationLabel = duration.labelExact;
      calculationBasisLabel = "Exact day count";
      break;
    }
    default:
      throw new Error("Select a valid interest type.");
  }

  const totalInterest = interestAmount;
  const grandTotal = principalAmount + totalInterest;

  return {
    principalAmount: roundCurrency(principalAmount),
    periodicInterest: roundCurrency(periodicInterest),
    periodicInterestLabel,
    monthlyInterest: roundCurrency(periodicInterestLabel === "Monthly Interest" ? periodicInterest : 0),
    interestAmount: roundCurrency(interestAmount),
    totalInterest: roundCurrency(totalInterest),
    grandTotal: roundCurrency(grandTotal),
    totalAmount: roundCurrency(grandTotal),
    totalDurationLabel: `${durationLabel} (${trimTrailingZeros(duration.totalDays)} ${duration.totalDays === 1 ? "Day" : "Days"})`,
    durationValue: roundDecimal(durationValue, 4),
    totalMonthsDisplay: roundDecimal(exactDayBased ? duration.exactMonths : duration.traditionalMonths, 4),
    totalDays: duration.totalDays,
    interestType,
    interestModeLabel,
    rateValue: roundDecimal(rateValue, 4),
    compoundingFrequency,
    exactDayBased,
    calculationBasisLabel,
  };
}

function createDurationSnapshot(fromDate, toDate) {
  const totalDays = getDayDifference(fromDate, toDate);
  const traditionalMonths = getTraditionalMonthCount(fromDate, toDate);
  const anchorDate = addMonthsClamped(fromDate, traditionalMonths);
  const residualDays = getDayDifference(anchorDate, toDate);
  const traditionalParts = splitMonths(traditionalMonths);

  return {
    years: traditionalParts.years,
    months: traditionalParts.months,
    days: residualDays,
    totalDays,
    traditionalMonths,
    exactMonths: roundDecimal(totalDays / 30, 4),
    totalYearsTraditional: traditionalMonths / 12,
    totalYearsExact: roundDecimal(totalDays / 365, 6),
    labelTraditional: formatDurationParts({
      years: traditionalParts.years,
      months: traditionalParts.months,
    }),
    labelExact: formatDurationParts({
      years: traditionalParts.years,
      months: traditionalParts.months,
      days: residualDays,
    }),
    decimalMonthsLabel: `${trimTrailingZeros(roundDecimal(totalDays / 30, 2))} Months`,
  };
}

function getTraditionalMonthCount(fromDate, toDate) {
  let months =
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());

  const endCompletesMonth =
    toDate.getDate() >= fromDate.getDate() || (isLastDayOfMonth(fromDate) && isLastDayOfMonth(toDate));

  if (!endCompletesMonth) {
    months -= 1;
  }

  return Math.max(0, months);
}

function addMonthsClamped(date, monthsToAdd) {
  const sourceYear = date.getFullYear();
  const sourceMonth = date.getMonth();
  const sourceDay = date.getDate();
  const targetBase = new Date(sourceYear, sourceMonth + monthsToAdd, 1);
  const maxDay = getDaysInMonth(targetBase.getFullYear(), targetBase.getMonth());
  return new Date(targetBase.getFullYear(), targetBase.getMonth(), Math.min(sourceDay, maxDay));
}

function getDayDifference(fromDate, toDate) {
  const fromUtc = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isLastDayOfMonth(date) {
  return date.getDate() === getDaysInMonth(date.getFullYear(), date.getMonth());
}

function splitMonths(totalMonths) {
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

function formatDurationParts({ years = 0, months = 0, days = 0 }) {
  const parts = [];

  if (years) {
    parts.push(`${years} ${years === 1 ? "Year" : "Years"}`);
  }

  if (months) {
    parts.push(`${months} ${months === 1 ? "Month" : "Months"}`);
  }

  if (days) {
    parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  }

  if (parts.length === 0) {
    return "0 Months";
  }

  return parts.join(" ");
}

function requirePositiveNumber(value, message) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(message);
  }
  return parsed;
}

function toPositiveNumber(value) {
  if (value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function hasDecimalPortion(value) {
  return Math.floor(value) !== value;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundDecimal(value, precision) {
  const scale = 10 ** precision;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function trimTrailingZeros(value) {
  return Number.isInteger(value) ? String(value) : String(value);
}
