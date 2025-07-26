import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import type { JournalEntry } from "../services/supabase";

interface JournalCardProps {
  journal: JournalEntry;
  onPress?: (journal: JournalEntry) => void;
  onEdit?: (journal: JournalEntry) => void;
  onDelete?: (journal: JournalEntry) => void;
  formatDate: (dateString: string) => string;
  truncateText: (text: string, maxLength?: number) => string;
  style?: any;
  hideTitle?: boolean;
}

const JournalCard: React.FC<JournalCardProps> = ({
  journal,
  onPress,
  onEdit,
  onDelete,
  formatDate,
  truncateText,
  style,
  hideTitle = false,
}) => {
  const handleLongPress = () => {
    Alert.alert(journal.title || "Untitled", undefined, [
      {
        text: "Edit",
        onPress: () => onEdit && onEdit(journal),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete && onDelete(journal),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity
      style={style}
      onPress={() => onPress && onPress(journal)}
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      {!hideTitle && (
        <View style={{ marginBottom: 0 }}>
          <Text
            style={{
              color: "#495766",
              fontFamily: "Larsseit",
              fontSize: 16,
              fontWeight: "700",
              lineHeight: 18,
              letterSpacing: -0.12,
              flex: 1,
              marginRight: 12,
              marginBottom: 6,
            }}
          >
            {journal.title || "Untitled"}
          </Text>
        </View>
      )}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "400",
          fontFamily: "Larsseit",
          color: "#6E8298",
          lineHeight: 24,
          marginTop: -2,
        }}
      >
        {truncateText(journal.content)}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          fontFamily: "Larsseit",
          color: "#94A3B8",
          lineHeight: 12,
          marginTop: 14,
        }}
      >
        {formatDate(journal.created_at)}
      </Text>
    </TouchableOpacity>
  );
};

export default JournalCard;
