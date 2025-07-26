import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "iconsax-react-nativejs";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";

// --- DESIGN SYSTEM COLORS --- //
const colors = {
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  ttaGreen500: "#57BD8B",
  ttaYellow500: "#F09235",
  ttaPink600: "#BE6BC6",
  black: "#000000",
  gray200: "#E5E5EA",
};

// Card component removed to flatten the layout.

const PillButton = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.pillButton,
      isActive ? styles.pillButtonActive : styles.pillButtonInactive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={isActive ? styles.pillTextActive : styles.pillTextInactive}>
      {label}
    </Text>
  </TouchableOpacity>
);

const EffortPillButton = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.effortPillButton,
      isActive
        ? styles.effortPillButtonActive
        : styles.effortPillButtonInactive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={
        isActive ? styles.effortPillTextActive : styles.effortPillTextInactive
      }
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const DayPill = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.dayPill, isActive && styles.dayPillActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={isActive ? styles.dayPillTextActive : styles.dayPillTextInactive}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const TagPill = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.tagPill,
      isActive ? styles.tagPillActive : styles.tagPillInactive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={isActive ? styles.tagPillTextActive : styles.tagPillTextInactive}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const CreateGoalScreen = ({ navigation }: { navigation?: any }) => {
  const route = useRoute<any>();
  const editingGoal = (route.params as any)?.goal; // undefined if creating new
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [goalName, setGoalName] = useState(editingGoal?.name ?? "");
  const [selectedEffort, setSelectedEffort] = useState(
    editingGoal?.effort_score ?? "Low"
  );
  const [selectedTime, setSelectedTime] = useState(
    editingGoal?.time_of_day ?? "Mornings"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    editingGoal?.tags ?? ["Confidence"]
  );
  const [recurrenceType, setRecurrenceType] = useState(
    editingGoal
      ? editingGoal.recurrence_type === "one_off"
        ? "One-off"
        : editingGoal.recurrence_type.charAt(0).toUpperCase() +
          editingGoal.recurrence_type.slice(1)
      : "One-off"
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    editingGoal?.recurrence_days ?? []
  );

  const effortOptions = ["Low", "Medium", "High", "Extra High"];
  const timeOptions = ["Mornings", "Afternoons", "Before bed"];
  const tagOptions = [
    "Confidence",
    "Communication",
    "Pleasure",
    "Connection",
    "Education",
    "Healing",
    "Routine",
    "Self-love",
  ];
  const recurrenceOptions = ["One-off", "Daily", "Weekly"];
  const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveGoal = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a goal.");
      return;
    }

    if (!goalName.trim()) {
      Alert.alert("Validation Error", "Please enter a name for your goal.");
      return;
    }

    setLoading(true);
    try {
      let opError;
      if (editingGoal) {
        const { error: err } = await supabase
          .from("goals")
          .update({
            name: goalName.trim(),
            effort_score: selectedEffort,
            time_of_day: selectedTime,
            tags: selectedTags,
            recurrence_type:
              recurrenceType === "One-off"
                ? "one_off"
                : recurrenceType.toLowerCase(),
            recurrence_days: recurrenceType === "Weekly" ? selectedDays : null,
          })
          .eq("id", editingGoal.id);
        opError = err;
      } else {
        const { error: err } = await supabase.from("goals").insert([
          {
            user_id: user.id,
            name: goalName.trim(),
            effort_score: selectedEffort,
            time_of_day: selectedTime,
            tags: selectedTags,
            recurrence_type:
              recurrenceType === "One-off"
                ? "one_off"
                : recurrenceType.toLowerCase(),
            recurrence_days: recurrenceType === "Weekly" ? selectedDays : null,
          },
        ]);
        opError = err;
      }

      if (opError) throw opError;

      Alert.alert("Success!", "Your new goal has been created.", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Database Error", error.message || "Failed to create goal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a goal</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          <TextInput
            style={styles.input}
            value={goalName}
            onChangeText={setGoalName}
            placeholder="Name your goal here..."
            placeholderTextColor={colors.gray500} // Using a darker placeholder
            autoCapitalize="sentences"
            returnKeyType="next"
            blurOnSubmit={false}
            textAlignVertical="center"
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Effort score</Text>
          <Text style={styles.subLabel}>
            How difficult will performing this task be?
          </Text>
          <View style={styles.effortPillsRow}>
            {effortOptions.map((effort) => (
              <EffortPillButton
                key={effort}
                label={effort}
                isActive={selectedEffort === effort}
                onPress={() => setSelectedEffort(effort)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Recurrence</Text>
          <Text style={styles.subLabel}>
            Set how often this goal should repeat.
          </Text>
          <View style={styles.recurrencePillsRow}>
            {recurrenceOptions.map((type) => (
              <EffortPillButton
                key={type}
                label={type}
                isActive={recurrenceType === type}
                onPress={() => setRecurrenceType(type)}
              />
            ))}
          </View>
          {recurrenceType === "Weekly" && (
            <View style={styles.daySelectorContainer}>
              {dayOptions.map((day) => (
                <DayPill
                  key={day}
                  label={day}
                  isActive={selectedDays.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Time of day</Text>
          <Text style={styles.subLabel}>
            Sticking to a schedule is sexy. Pick a time period.
          </Text>
          <View style={styles.effortPillsRow}>
            {timeOptions.map((time) => (
              <EffortPillButton
                key={time}
                label={time}
                isActive={selectedTime === time}
                onPress={() => setSelectedTime(time)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Tags</Text>
          <Text style={styles.subLabel}>These help keep things organised.</Text>
          <View style={styles.pillsRow}>
            {tagOptions.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                isActive={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <DisablablePrimaryButton
          title={
            loading
              ? editingGoal
                ? "Updating Goal..."
                : "Creating Goal..."
              : editingGoal
              ? "Save changes"
              : "Create goal"
          }
          onPress={handleSaveGoal}
          disabled={!goalName.trim() || loading}
        />
      </View>
    </SafeAreaView>
  );
};

// Utility for DP conversion (used in button padding)
const toDp = (value: number) => value * 4;

interface DisablablePrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const DisablablePrimaryButton = ({
  title,
  onPress,
  disabled = false,
}: DisablablePrimaryButtonProps) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
    style={[
      styles.primaryButtonOuter,
      disabled && { shadowOpacity: 0, elevation: 0 },
    ]}
  >
    <View
      style={[
        styles.primaryButtonInner,
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          disabled && styles.primaryButtonTextDisabled,
        ]}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray800,
    fontFamily: "Larsseit",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // Padding at the bottom of the scrollable list
  },
  sectionContainer: {
    marginBottom: 32, // Increased vertical spacing
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Handle safe area
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 18, // Updated from 15px
    fontWeight: "500",
    color: colors.gray700,
    marginBottom: 4, // Adjusted for sublabel
    fontFamily: "Larsseit",
  },
  subLabel: {
    color: "#6E8298",
    fontSize: 14,
    fontFamily: "Larsseit",
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 12, // Space before the pills
  },
  input: {
    fontSize: 18,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: "#64748B", // gray600
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  effortPillsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  effortPillButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  effortPillButtonActive: {
    backgroundColor: colors.ttaBlue500,
  },
  effortPillButtonInactive: {
    backgroundColor: "#FDF4EB", // Light orange, as per request
  },
  effortPillTextActive: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
  },
  effortPillTextInactive: {
    color: colors.ttaBlue500,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
  },
  daySelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray100,
  },
  dayPillActive: {
    backgroundColor: colors.ttaBlue500,
  },
  dayPillTextActive: {
    color: colors.white,
    fontWeight: "600",
    fontFamily: "Larsseit",
  },
  dayPillTextInactive: {
    color: colors.gray700,
    fontWeight: "500",
    fontFamily: "Larsseit",
  },
  recurrencePillsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  pillButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  pillButtonActive: {
    backgroundColor: colors.ttaBlue500,
    borderColor: colors.ttaBlue500,
  },
  pillButtonInactive: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: "600",
    fontFamily: "Larsseit",
  },
  pillTextInactive: {
    color: colors.gray500,
    fontWeight: "400",
    fontFamily: "Larsseit",
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    // Spacing is now handled by the 'gap' property in 'pillsRow'
  },
  tagPillActive: {
    borderColor: colors.ttaBlue500, // #2154E0
  },
  tagPillInactive: {
    borderColor: colors.gray500, // #A1AEBC
  },
  tagPillTextActive: {
    color: colors.ttaBlue500,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 20,
  },
  tagPillTextInactive: {
    color: colors.gray500,
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Larsseit",
    lineHeight: 20,
  },
  primaryButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(189,95,2,1)", // Custom orange shadow color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    // Margins are now handled by the button's container
  },
  primaryButtonInner: {
    flex: 1,
    paddingHorizontal: toDp(4), // 16px
    paddingVertical: toDp(3), // 12px
    backgroundColor: "#FB923C", // orange-400 from CreateAccountScreen
    borderRadius: 12,
    borderColor: "#FB923C", // orange-400
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(2), // 8px
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#FFFFFF", // white
    fontSize: 16,
    fontWeight: "700", // Bold as requested
    fontFamily: "Larsseit",
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  primaryButtonDisabled: {
    backgroundColor: "#D1D5DB", // gray-300 for disabled state
    borderColor: "#D1D5DB",
  },
  primaryButtonTextDisabled: {
    color: "#9CA3AF", // gray-400 for disabled text
  },
});
export default CreateGoalScreen;
