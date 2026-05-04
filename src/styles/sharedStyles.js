import { StyleSheet } from "react-native";

export const sharedStyles = StyleSheet.create({
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
