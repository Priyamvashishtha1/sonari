export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function calculatePrice({
  goldRate24K,
  weight,
  karat,
  makingPct,
  discountPct,
  gstPct,
  makingBasis,
}) {
  const numericWeight = Number(weight);
  const numericGoldRate = Number(goldRate24K);

  if (!numericWeight || !numericGoldRate) return null;

  const karatFactor = karat / 24;
  const goldRateForKarat = karatFactor * numericGoldRate;
  const goldValue = goldRateForKarat * numericWeight;
  const makingRate = makingBasis === "goldValue" ? goldRateForKarat : numericGoldRate;
  const makingAmount = numericWeight * (makingPct / 100) * makingRate;
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

export function formatINR(value) {
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

export function clampNumber(value, min, max) {
  if (value === "") return "";

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  if (max == null) return Math.max(min, parsed);

  return Math.min(max, Math.max(min, parsed));
}

export function formatEditableNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return Number.isInteger(value) ? String(value) : String(value);
}
