import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, DocumentText, Trash } from "iconsax-react-nativejs";
import dayjs from "dayjs";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { generateJournalPrompts } from "../services/journalPrompts";
import { PointsService } from "../services/points";

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

// --- DESIGN SYSTEM COLORS --- //
const colors = {
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  ttaBlue500: "#3B82F6",
  red500: "#EF4444",
  white: "#FFFFFF",
};

// Default journal prompts (will be replaced by AI-generated ones)
const defaultPrompts = [
  "What made me smile today?",
  "How am I feeling right now?",
  "What am I grateful for?",
];

interface JournalEntryScreenProps {
  navigation?: any;
  route?: {
    params?: {
      existingEntry?: {
        id?: string;
        title?: string;
        content?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}

const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const [entryTitle, setEntryTitle] = useState("");
  const [entryContent, setEntryContent] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [journalPrompts, setJournalPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);

  // Store original values to compare against
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  const existingEntry = route?.params?.existingEntry;
  const isEditMode = !!existingEntry;

  useEffect(() => {
    // Format the timestamp based on whether it's edit mode or new entry
    if (existingEntry) {
      // For editing, show when the entry was created/last updated
      const entryDate = dayjs(
        existingEntry.updated_at || existingEntry.created_at
      );
      const formattedDate = `${entryDate.format(
        "h:mm A"
      )} on ${entryDate.format("dddd, MMMM D, YYYY")}`;
      setCurrentTimestamp(formattedDate);

      // Populate fields for editing
      const title = existingEntry.title || "";
      const content = existingEntry.content || "";
      setEntryTitle(title);
      setEntryContent(content);
      setOriginalTitle(title);
      setOriginalContent(content);
    } else {
      // For new entries, show current time
      const now = dayjs();
      const formattedDate = `It's ${now.format("h:mm A")} on ${now.format(
        "dddd"
      )}`;
      setCurrentTimestamp(formattedDate);

      // For new entries, original values are empty
      setOriginalTitle("");
      setOriginalContent("");
    }

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    // Load AI-generated journal prompts
    const loadDynamicPrompts = async () => {
      if (user?.id) {
        setIsLoadingPrompts(true);
        try {
          const dynamicPrompts = await generateJournalPrompts(user.id);
          if (dynamicPrompts && dynamicPrompts.length > 0) {
            setJournalPrompts(dynamicPrompts);
          }
        } catch (error) {
          console.error("Error loading dynamic prompts:", error);
          // Keep default prompts if there's an error
        } finally {
          setIsLoadingPrompts(false);
        }
      }
    };

    loadDynamicPrompts();

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [existingEntry, user?.id]);

  // Track unsaved changes - compare current values with original values
  useEffect(() => {
    const titleChanged = entryTitle.trim() !== originalTitle.trim();
    const contentChanged = entryContent.trim() !== originalContent.trim();
    const hasChanges = titleChanged || contentChanged;
    setHasUnsavedChanges(hasChanges);
  }, [entryTitle, entryContent, originalTitle, originalContent]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSave = async () => {
    console.log("Save button clicked");
    console.log("User:", user);
    console.log("Entry title:", entryTitle);
    console.log("Entry content:", entryContent);

    if (!user) {
      console.log("No user found");
      Alert.alert("Error", "You must be logged in to save journal entries.");
      return;
    }

    if (!entryTitle.trim() && !entryContent.trim()) {
      console.log("No content to save");
      Alert.alert("Empty Entry", "Please add some content before saving.");
      return;
    }

    setIsSaving(true);
    console.log("Starting save process...");

    try {
      const journalData = {
        user_id: user.id,
        title: entryTitle.trim() || "Untitled",
        content: entryContent.trim(),
      };

      console.log("Journal data to save:", journalData);

      // Add timeout to catch hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error("Request timeout - Supabase took too long to respond")
            ),
          10000
        );
      });

      let result;
      if (isEditMode && existingEntry?.id) {
        console.log("Updating existing entry:", existingEntry.id);
        // Update existing entry
        const updatePromise = supabase
          .from("journal_entries")
          .update(journalData)
          .eq("id", existingEntry.id)
          .eq("user_id", user.id)
          .select();

        result = await Promise.race([updatePromise, timeoutPromise]);
      } else {
        console.log("Creating new entry - always insert, never update");
        // Always create new entry - never overwrite
        const insertPromise = supabase
          .from("journal_entries")
          .insert([journalData])
          .select();

        result = await Promise.race([insertPromise, timeoutPromise]);
      }

      console.log("Supabase result:", result);

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        console.error("Supabase error:", result.error);
        throw result.error;
      }

      console.log("Save successful!");

      // Recalculate points for new journal entries only (not for updates)
      if (!isEditMode) {
        await PointsService.updateUserPoints(user.id);
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Journal entry updated successfully!"
          : "Journal entry saved successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    } catch (error: unknown) {
      console.error("Error saving journal entry:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Error",
        `Failed to save journal entry: ${errorMessage}. Please try again.`,
        [{ text: "OK" }]
      );
    } finally {
      console.log("Resetting save state");
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (existingEntry?.id && user) {
              try {
                const result = await supabase
                  .from("journal_entries")
                  .delete()
                  .eq("id", existingEntry.id)
                  .eq("user_id", user.id);

                if (result.error) {
                  throw result.error;
                }

                Alert.alert("Deleted", "Journal entry deleted successfully.", [
                  { text: "OK", onPress: () => navigation?.goBack() },
                ]);
              } catch (error) {
                console.error("Error deleting journal entry:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete journal entry. Please try again."
                );
              }
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation?.goBack(),
          },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: handleSave },
        ]
      );
    } else {
      navigation?.goBack();
    }
  };

  const handlePromptPress = (prompt: string) => {
    // Set the prompt as the title instead of the content
    setEntryTitle(prompt);
  };

  const wordCount = entryContent
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={"padding"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={10}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.gray800} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit entry" : "New entry"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  !hasUnsavedChanges && styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
            {isEditMode && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
              >
                <Trash size={22} color={colors.red500} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Section */}
          <View style={styles.dateSection}>
            <Text style={styles.greeting}>
              {isEditMode ? "You wrote this" : getGreeting()}
            </Text>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{currentTimestamp}</Text>
            </View>
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            value={entryTitle}
            onChangeText={setEntryTitle}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.gray400}
            autoCapitalize="sentences"
            returnKeyType="next"
            blurOnSubmit={false}
            textAlignVertical="center"
          />

          {/* Content Input */}
          <TextInput
            style={styles.contentInput}
            value={entryContent}
            onChangeText={setEntryContent}
            placeholder="Start writing your thoughts..."
            placeholderTextColor={colors.gray400}
            multiline
            autoCapitalize="sentences"
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Journal Prompts - positioned above footer */}
        {!isKeyboardVisible &&
          !entryContent.trim() &&
          !isLoadingPrompts &&
          journalPrompts.length > 0 && (
            <View style={styles.promptsSection}>
              <View style={styles.promptsContainer}>
                {journalPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptChip}
                    onPress={() => handlePromptPress(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        {/* Footer with word count */}
        {!isKeyboardVisible && (
          <View style={styles.footer}>
            <Text style={styles.wordCount}>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray50,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.ttaBlue500,
  },
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    minHeight: windowHeight - 200, // Ensure content can scroll
  },
  dateSection: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray500,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 2,
    paddingVertical: 4,
    paddingHorizontal: 0,
    lineHeight: 24,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  contentInput: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: colors.gray700,
    lineHeight: 24,
    minHeight: 200,
    padding: 0,
  },
  promptsSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  promptsContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  promptChip: {
    backgroundColor: colors.gray50,
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray500,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  wordCount: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray500,
    textAlign: "center",
    paddingBottom: 8,
  },
});

export default JournalEntryScreen;
