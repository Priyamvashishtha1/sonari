import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { formatINR } from "../utils/price";

export function HistoryModal({ history, onClear, onClose, onDelete, styles, visible }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recent Calculations</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>No saved calculations yet.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyTitle}>
                      {item.karat}K - {item.weight}g
                    </Text>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyPrice}>{formatINR(item.finalPrice)}</Text>
                    <Pressable onPress={() => onDelete(item.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {history.length > 0 ? (
            <Pressable onPress={onClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
