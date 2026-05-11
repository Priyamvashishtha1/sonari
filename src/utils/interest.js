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

  const totalDays = Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
  const totalMonths = totalDays / 30;

  return {
    years: Math.floor(totalDays / 365),
    months: Math.floor((totalDays % 365) / 30),
    days: (totalDays % 365) % 30,
    totalDays,
    totalMonths,
    totalYears: totalMonths / 12,
  };
}

export function getDurationFromParts({ years, months, days }) {
  const numericYears = toPositiveNumber(years);
  const numericMonths = toPositiveNumber(months);
  const numericDays = toPositiveNumber(days);
  const totalMonths = numericYears * 12 + numericMonths + numericDays / 30;
  const totalDays = numericYears * 365 + numericMonths * 30 + numericDays;

  return {
    years: numericYears,
    months: numericMonths,
    days: numericDays,
    totalDays,
    totalMonths,
    totalYears: totalMonths / 12,
  };
}

export function formatDuration(duration) {
  if (!duration) return "--";

  const parts = [];
  if (duration.years) parts.push(`${trimTrailingZeros(duration.years)}y`);
  if (duration.months) parts.push(`${trimTrailingZeros(duration.months)}m`);
  if (duration.days || parts.length === 0) parts.push(`${trimTrailingZeros(duration.days)}d`);
  return parts.join(" ");
}

export function getInterestRateMeta(interestType) {
  switch (interestType) {
    case "monthlyFlat":
      return {
        title: "Monthly Interest Rate (per ₹100)",
        helper: "₹2 means ₹2 per ₹100 per month, which is 2% flat monthly interest.",
        badge: "₹ per ₹100/month",
      };
    case "yearlySimple":
      return {
        title: "Yearly Simple Rate (%)",
        helper: "Annual simple interest percentage applied across the selected duration.",
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
        helper: "₹1 means ₹1 per ₹100 per day for daily flat interest.",
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
}) {
  const principalAmount = requirePositiveNumber(principal, "Enter a valid principal amount.");
  const rateValue = requirePositiveNumber(rate, "Enter a valid interest rate.");

  if (!duration || duration.totalMonths <= 0 || duration.totalDays <= 0) {
    throw new Error("Enter a valid duration.");
  }

  let monthlyInterest = 0;
  let interestAmount = 0;
  let interestModeLabel = "";

  switch (interestType) {
    case "monthlyFlat":
      monthlyInterest = (principalAmount * rateValue) / 100;
      interestAmount = monthlyInterest * duration.totalMonths;
      interestModeLabel = "Monthly Flat";
      break;
    case "yearlySimple":
      monthlyInterest = (principalAmount * rateValue) / 100 / 12;
      interestAmount = (principalAmount * rateValue * duration.totalYears) / 100;
      interestModeLabel = "Yearly Simple";
      break;
    case "compound": {
      const frequencyMap = {
        monthly: 12,
        quarterly: 4,
        halfYearly: 2,
        yearly: 1,
      };
      const periodsPerYear = frequencyMap[compoundingFrequency] || 12;
      const totalAmount = principalAmount * Math.pow(1 + rateValue / 100 / periodsPerYear, periodsPerYear * duration.totalYears);
      interestAmount = totalAmount - principalAmount;
      monthlyInterest = interestAmount / duration.totalMonths;
      interestModeLabel = "Compound";
      break;
    }
    case "dailyInterest": {
      const dailyInterest = (principalAmount * rateValue) / 100;
      interestAmount = dailyInterest * duration.totalDays;
      monthlyInterest = dailyInterest * 30;
      interestModeLabel = "Daily Interest";
      break;
    }
    default:
      throw new Error("Select a valid interest type.");
  }

  const totalInterest = interestAmount;
  const grandTotal = principalAmount + totalInterest;

  return {
    principalAmount: roundCurrency(principalAmount),
    monthlyInterest: roundCurrency(monthlyInterest),
    interestAmount: roundCurrency(interestAmount),
    totalInterest: roundCurrency(totalInterest),
    grandTotal: roundCurrency(grandTotal),
    totalAmount: roundCurrency(grandTotal),
    totalDurationLabel: formatDuration(duration),
    totalMonthsDisplay: roundRate(duration.totalMonths),
    totalDays: roundRate(duration.totalDays),
    interestType,
    interestModeLabel,
    rateValue: roundRate(rateValue),
    compoundingFrequency,
  };
}

function requirePositiveNumber(value, message) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(message);
  }
  return parsed;
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function trimTrailingZeros(value) {
  return Number.isInteger(value) ? String(value) : String(roundRate(value));
}
