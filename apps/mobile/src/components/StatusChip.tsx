import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CANDIDATE_STATUS_LABELS, CandidateFirmStatus } from "@zenith/shared";
import { statusColors } from "../ui/theme";

type StatusChipProps = {
  status: CandidateFirmStatus;
};

export function StatusChip({ status }: StatusChipProps) {
  const palette = statusColors[status];

  return (
    <View style={[styles.chip, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.chipText, { color: palette.text }]}>
        {CANDIDATE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700"
  }
});
