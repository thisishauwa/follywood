import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Add, Edit, Trash } from "iconsax-react-nativejs";
import { Image } from "react-native";
import BottomNavBar from "../components/BottomNavBar";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";
import JournalCard from "../components/JournalCard";
import type { JournalEntry } from "../services/supabase";
import dayjs from "dayjs";

// Import colors from your design system
const colors = {
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  stone50: "#F8F8F8",
  slate400: "#94A3B8",
  ttaBlue500: "#3B82F6",
  red500: "#EF4444",
};

interface JournalListScreenProps {
  navigation: any;
}

const JournalListScreen: React.FC<JournalListScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(
    null
  );

  const fetchJournals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching journals:", error);
        Alert.alert("Error", "Failed to load journal entries");
        return;
      }

      setJournals(data || []);
    } catch (error) {
      console.error("Error fetching journals:", error);
      Alert.alert("Error", "Failed to load journal entries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchJournals();
      // No cleanup needed
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJournals();
  };

  const handleCreateNew = () => {
    navigation.navigate("JournalEntry");
  };

  const handleJournalPress = (journal: JournalEntry) => {
    navigation.navigate("JournalEntry", {
      existingEntry: journal,
      isEditMode: true,
    });
  };

  const handleDeleteJournal = async (journal: JournalEntry) => {
    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", journal.id);

      if (error) {
        console.error("Error deleting journal:", error);
        Alert.alert("Error", "Failed to delete journal entry");
        return;
      }

      setJournals(journals.filter((j) => j.id !== journal.id));
    } catch (error) {
      console.error("Error deleting journal:", error);
      Alert.alert("Error", "Failed to delete journal entry");
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("MMM D, YYYY • h:mm A");
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderJournalItem = (journal: JournalEntry) => (
    <JournalCard
      key={journal.id}
      journal={journal}
      onPress={handleJournalPress}
      onEdit={handleJournalPress}
      onDelete={handleDeleteJournal}
      formatDate={formatDate}
      truncateText={truncateText}
      style={styles.journalItem}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={require("../../assets/images/journalimg.png")}
        style={{ width: 64, height: 64, resizeMode: "contain" }}
      />
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptyDescription}>Write like no one is watching</Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
        <Text style={styles.createButtonText}>Create your first entry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              handleJournalPress(selectedJournal as JournalEntry);
              setModalVisible(false);
            }}
          >
            <Edit size={24} color={colors.gray800} />
            <Text style={styles.modalButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              handleDeleteJournal(selectedJournal as JournalEntry);
              setModalVisible(false);
            }}
          >
            <Trash size={24} color={colors.red500} />
            <Text style={styles.modalButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />

        <Text style={styles.headerTitle}>Journal</Text>

        <TouchableOpacity onPress={handleCreateNew} style={styles.addButton}>
          <Add size={24} color={colors.ttaBlue500} />
        </TouchableOpacity>
      </View>

      {/* Journal List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <View key={idx} style={styles.skeletonCard} />
            ))}
          </View>
        ) : journals.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.journalList}>
            {journals.map(renderJournalItem)}
          </View>
        )}
      </ScrollView>
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Add space for the nav bar
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    display: "none",
  },
  skeletonContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  skeletonCard: {
    height: 100,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: "Larsseit",
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: "#2154E0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.white,
  },
  journalList: {
    padding: 20,
  },
  journalItem: {
    backgroundColor: colors.stone50,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: "transparent",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  journalContent: {
    marginBottom: 16,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray900,
    flex: 1,
    marginRight: 12,
    lineHeight: 28,
  },
  threeDotMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray600,
  },
  journalDate: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.slate400,
    lineHeight: 12,
  },
  journalPreview: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray600,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: "80%",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginLeft: 12,
  },
});

export default JournalListScreen;
