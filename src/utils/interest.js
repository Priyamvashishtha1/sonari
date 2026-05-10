const DAY_MS = 24 * 60 * 60 * 1000;

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
  return {
    years: Math.floor(totalDays / 365),
    months: Math.floor((totalDays % 365) / 30),
    days: (totalDays % 365) % 30,
    totalDays,
    totalYears: totalDays / 365,
    totalMonths: totalDays / 30,
  };
}

export function getDurationFromParts({ years, months, days }) {
  const numericYears = Number(years) || 0;
  const numericMonths = Number(months) || 0;
  const numericDays = Number(days) || 0;
  const totalDays = numericYears * 365 + numericMonths * 30 + numericDays;

  return {
    years: numericYears,
    months: numericMonths,
    days: numericDays,
    totalDays,
    totalYears: totalDays / 365,
    totalMonths: totalDays / 30,
  };
}

export function formatDuration(duration) {
  if (!duration) return "--";

  const parts = [];
  if (duration.years) parts.push(`${duration.years}y`);
  if (duration.months) parts.push(`${duration.months}m`);
  if (duration.days || parts.length === 0) parts.push(`${duration.days}d`);
  return parts.join(" ");
}

export function calculateInterest({
  principal,
  rate,
  rateMode,
  interestType,
  duration,
  compoundingFrequency,
}) {
  const principalAmount = Number(principal);
  const rateValue = Number(rate);

  if (!principalAmount || principalAmount <= 0) {
    throw new Error("Enter a valid principal amount.");
  }

  if (!rateValue || rateValue <= 0) {
    throw new Error("Enter a valid interest rate.");
  }

  if (!duration || duration.totalDays <= 0) {
    throw new Error("Enter a valid duration.");
  }

  let interestEarned = 0;
  let totalAmount = principalAmount;

  if (interestType === "simple") {
    if (rateMode === "percentage") {
      interestEarned = (principalAmount * rateValue * duration.totalYears) / 100;
    } else {
      interestEarned = rateValue * duration.totalMonths;
    }
    totalAmount = principalAmount + interestEarned;
  } else if (rateMode === "percentage") {
    const frequencyMap = {
      monthly: 12,
      quarterly: 4,
      halfYearly: 2,
      yearly: 1,
    };
    const n = frequencyMap[compoundingFrequency] || 12;
    totalAmount = principalAmount * Math.pow(1 + rateValue / 100 / n, n * duration.totalYears);
    interestEarned = totalAmount - principalAmount;
  } else {
    interestEarned = rateValue * duration.totalMonths;
    totalAmount = principalAmount + interestEarned;
  }

  return {
    principalAmount: roundCurrency(principalAmount),
    interestEarned: roundCurrency(interestEarned),
    totalAmount: roundCurrency(totalAmount),
    durationLabel: formatDuration(duration),
    interestType,
    rateMode,
    compoundingFrequency,
  };
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
