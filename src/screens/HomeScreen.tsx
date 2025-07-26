import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  /* Setting2,*/
  Microphone,
  Book1,
  Heart,
  Briefcase,
  Profile,
  Award,
  Bag,
  DocumentText,
  Star,
} from "iconsax-react-nativejs";
import BottomNavBar from "../components/BottomNavBar";
import GoalCard from "../components/GoalCard";
import JournalCard from "../components/JournalCard";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { PointsService } from "../services/points";
import { SexualHappinessService } from "../services/sexualHappinessScore";
import SexualHappinessDetailCard from "../components/SexualHappinessCard";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  // Helper for ordinal suffix
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const dayWithOrdinal = `${day}${getOrdinal(day)}`;
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${weekday}, ${month} ${dayWithOrdinal} at ${time}`;
};

const truncateText = (text: string, maxLength: number = 80) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// --- TYPES --- //

interface TodoItemProps {
  task: string;
  effort: string;
  time: string;
  onCheck?: (isChecked: boolean) => void;
}

interface ExploreCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  isActive?: boolean;
  onPress?: () => void;
}

interface HomeScreenProps {
  navigation?: any;
}

// --- DESIGN SYSTEM COLORS --- //
const colors = {
  // Talk to August Design System
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  ttaGreen500: "#57BD8B",
  ttaGreen400: "#79CAA2",
  ttaYellow500: "#F09235",
  ttaYellow400: "#F3A85D",
  ttaYellow300: "#F6BE86",
  ttaYellow50: "#FDF4EB",
  ttaPink600: "#BE6BC6",
  ttaPink400: "#F4B1FA",
  ttaPink700: "#8B3893",
  black: "#000000",
  gray200: "#E5E5EA",
};

// --- REUSABLE COMPONENTS --- //

const Card: React.FC<{ children: React.ReactNode; onPress?: () => void }> = ({
  children,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={onPress ? 0.8 : 1}
    disabled={!onPress}
  >
    {children}
  </TouchableOpacity>
);

const HeaderSection: React.FC = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  // Format date as, e.g., "Mon, 24 Jun"
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.greeting}>{`Good ${getGreeting()}, babe :)`}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Store" as never)}
        >
          <Bag size={24} color={colors.gray800} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Profile" as never)}
        >
          <Profile size={24} color={colors.gray800} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Sexual Happiness Score Card
const SexualHappinessCard: React.FC<{
  score?: number | null;
  uncompletedGoalsCount: number;
  journalEntriesCount: number;
  userPoints: number;
}> = ({ score, uncompletedGoalsCount, journalEntriesCount, userPoints }) => (
  <ImageBackground
    source={require("../../assets/images/sexualhappinessscorecard.jpg")}
    resizeMode="cover"
    style={styles.sexualCard}
  >
    <View style={styles.sexualCardContent} pointerEvents="none">
      <Text style={styles.sexualScore}>
        {score !== null && score !== undefined ? `${score}%` : "--"}
      </Text>
      <Text style={styles.sexualLabel}>SEXUAL HAPPINESS SCORE</Text>
      {/* Stats Row */}
      <View style={styles.sexualStatsRow}>
        {/* Goals */}
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Award size={16} color={colors.white} />
          </View>
          <Text style={styles.statText}>{`${uncompletedGoalsCount} ${
            uncompletedGoalsCount !== 1 ? "goals" : "goal"
          }`}</Text>
        </View>

        <View style={styles.statSeparator} />

        {/* Entries */}
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <DocumentText size={16} color={colors.white} />
          </View>
          <Text style={styles.statText}>{`${journalEntriesCount} ${
            journalEntriesCount !== 1 ? "entries" : "entry"
          }`}</Text>
        </View>

        <View style={styles.statSeparator} />

        {/* Points */}
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Star size={16} color={colors.white} />
          </View>
          <Text style={styles.statText}>{userPoints} pts</Text>
        </View>
      </View>
    </View>
  </ImageBackground>
);

const TodoItem: React.FC<TodoItemProps> = ({ task, effort, time, onCheck }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheck = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onCheck?.(newCheckedState);
  };

  return (
    <TouchableOpacity
      style={styles.todoItem}
      onPress={handleCheck}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isChecked && styles.checkedCheckbox]}>
        {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <View style={styles.todoTextContainer}>
        <Text style={[styles.todoTask, isChecked && styles.todoTaskChecked]}>
          {task}
        </Text>
        <Text style={styles.todoDetails}>
          {effort} Effort • {time}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ExploreCard: React.FC<ExploreCardProps> = ({
  title,
  description,
  icon,
  onPress,
}) => (
  <Card onPress={onPress}>
    <View style={styles.exploreCardContent}>
      <View style={styles.exploreIconContainer}>{icon}</View>
      <View style={styles.exploreTextContainer}>
        <Text style={styles.exploreTitle}>{title}</Text>
        <Text style={styles.exploreDescription}>{description}</Text>
      </View>
    </View>
  </Card>
);

// --- MAIN HOME SCREEN --- //

// --- DYNAMIC HOME SECTIONS --- //

const GetStartedSection: React.FC<{ title: string; navigation: any }> = ({
  title,
  navigation,
}) => {
  const handleExplorePress = (title: string) => {
    switch (title) {
      case "Journal":
        navigation?.navigate("JournalEntry");
        break;
      case "Create Goals":
        navigation?.navigate("CreateGoal");
        break;
      case "Shop":
        navigation?.navigate("Store");
        break;
      default:
        console.log(`Explore ${title} pressed`);
    }
  };

  const exploreItems = [
    {
      title: "Journal",
      description: "Reflect on your day",
      icon: (
        <Image
          source={require("../../assets/images/journalimg.png")}
          style={[styles.exploreIconImage, { width: 28, height: 28 }]}
        />
      ),
    },
    {
      title: "Create goals",
      description: "Set your personal objectives",
      icon: (
        <Image
          source={require("../../assets/images/trophyimg.png")}
          style={[styles.exploreIconImage, { width: 28, height: 28 }]}
        />
      ),
    },
    {
      title: "Shop",
      description: "Sexual wellness items",
      icon: (
        <Image
          source={require("../../assets/images/shoppingimh.png")}
          style={[styles.exploreIconImage, { width: 28, height: 28 }]}
        />
      ),
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {exploreItems.map((item, index) => (
        <ExploreCard
          key={index}
          {...item}
          onPress={() => handleExplorePress(item.title)}
        />
      ))}
    </View>
  );
};

// Helper to determine if a goal is completed (same logic as GoalsScreen)
function isGoalCompleted(goal: any): boolean {
  const completions = goal.goal_completions || [];
  if (goal.recurrence_type === "one_off") {
    return completions.length > 0;
  }
  // For recurring goals, check for a completion today.
  const today = new Date();
  return completions.some((comp: any) => {
    const d = new Date(comp.completed_at);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
}

const ActiveUserSection: React.FC<{
  goals: any[];
  journalEntries: any[];
  onToggleComplete: (goal: any) => void;
  onLongPress: (goal: any) => void;
  onDeleteJournal: (entry: any) => void;
}> = ({
  goals,
  journalEntries,
  onToggleComplete,
  onLongPress,
  onDeleteJournal,
}) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <View style={styles.sectionContainer}>
      {/* Display goals */}
      {goals && goals.length > 0 && (
        <>
          <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>
            Your goals
          </Text>
          {goals.slice(0, 2).map((goal) => (
            <GoalCard
              key={goal.id}
              item={goal}
              isCompleted={isGoalCompleted(goal)}
              onToggleComplete={onToggleComplete}
              onLongPress={onLongPress}
              style={{ marginBottom: 12 }}
            />
          ))}
        </>
      )}

      {/* Display journal entries */}
      {journalEntries && journalEntries.length > 0 && (
        <>
          <Text style={[styles.sectionSubtitle, { marginTop: 24 }]}>
            Your journal
          </Text>
          {journalEntries.slice(0, 2).map((entry) => (
            <View key={entry.id} style={styles.journalCardContainer}>
              <JournalCard
                journal={entry}
                onPress={() =>
                  navigation.navigate("JournalEntry", {
                    existingEntry: entry,
                    isEditMode: true,
                  })
                }
                onEdit={() =>
                  navigation.navigate("JournalEntry", {
                    existingEntry: entry,
                    isEditMode: true,
                  })
                }
                onDelete={() => onDeleteJournal(entry)}
                formatDate={formatDate}
                truncateText={truncateText}
              />
            </View>
          ))}
        </>
      )}

      {/* Display a message if no content */}
      {goals.length === 0 && journalEntries.length === 0 && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <Text style={{ color: colors.gray500, fontSize: 16 }}>
            No recent activity found
          </Text>
        </View>
      )}
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [uncompletedGoalsCount, setUncompletedGoalsCount] = useState(0);
  const [journalEntriesCount, setJournalEntriesCount] = useState(0);
  const [userStatus, setUserStatus] = useState<
    "loading" | "new" | "returning" | "active"
  >("loading");
  const [userPoints, setUserPoints] = useState(0);
  const [sexualHappinessScore, setSexualHappinessScore] = useState<any>(null);
  const [showDetailedScore, setShowDetailedScore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleDeleteJournal = (entry: any) => {
    Alert.alert(
      "Delete Journal",
      "Are you sure you want to delete this journal entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("journal_entries")
                .delete()
                .eq("id", entry.id);

              if (error) {
                throw error;
              }

              Alert.alert("Success", "Journal entry deleted successfully.", [
                { text: "OK" },
              ]);

              // Update journal entries state immediately
              setJournalEntries((currentEntries) =>
                currentEntries.filter((e) => e.id !== entry.id)
              );

              // Refresh data after deletion
              fetchData();
            } catch (error) {
              console.error("Error deleting journal entry:", error);
              Alert.alert(
                "Error",
                "Failed to delete journal entry. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // --- GOAL MANIPULATION LOGIC ---
  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  const handleToggleComplete = async (goalToUpdate: any) => {
    const originalGoal = goals.find((g) => g.id === goalToUpdate.id);
    if (!originalGoal) return;
    const completions = goalToUpdate.goal_completions || [];
    const isCompleted = isGoalCompleted(goalToUpdate);
    if (isCompleted) {
      // --- UN-COMPLETE ---
      const today = new Date();
      const completionToRemove =
        goalToUpdate.recurrence_type === "one_off"
          ? completions[0]
          : completions.find((c: any) =>
              isSameDay(new Date(c.completed_at), today)
            );
      if (!completionToRemove) return;
      // Optimistic UI update
      const newCompletions = completions.filter(
        (c: any) => c.id !== completionToRemove.id
      );
      setGoals((currentGoals) =>
        currentGoals.map((g) =>
          g.id === goalToUpdate.id
            ? { ...g, goal_completions: newCompletions }
            : g
        )
      );
      // Remove from DB
      const { error } = await supabase
        .from("goal_completions")
        .delete()
        .eq("id", completionToRemove.id);
      if (error) {
        setGoals((currentGoals) =>
          currentGoals.map((g) => (g.id === goalToUpdate.id ? originalGoal : g))
        );
        Alert.alert("Error", "Could not update goal.");
      } else {
        // Recalculate points after uncompleting goal
        if (user) {
          const updatedPoints = await PointsService.updateUserPoints(user.id);
          setUserPoints(updatedPoints);

          // Recalculate sexual happiness score in real time
          const scoreData =
            await SexualHappinessService.calculateSexualHappinessScore(user.id);
          setSexualHappinessScore(scoreData);
        }
      }
    } else {
      // --- COMPLETE ---
      // Optimistic UI update
      const tempCompletion = {
        id: Math.random().toString(),
        completed_at: new Date().toISOString(),
      };
      const newCompletions = [...completions, tempCompletion];
      setGoals((currentGoals) =>
        currentGoals.map((g) =>
          g.id === goalToUpdate.id
            ? { ...g, goal_completions: newCompletions }
            : g
        )
      );
      // Add to DB
      if (!user) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }
      const { data: newCompletionData, error } = await supabase
        .from("goal_completions")
        .insert({
          goal_id: goalToUpdate.id,
          user_id: user.id,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        setGoals((currentGoals) =>
          currentGoals.map((g) => (g.id === goalToUpdate.id ? originalGoal : g))
        );
        Alert.alert("Error", "Could not update goal.");
      } else if (newCompletionData) {
        // Replace temp completion with real one
        const finalCompletions = newCompletions.map((c: any) =>
          c.id === tempCompletion.id ? newCompletionData : c
        );
        setGoals((currentGoals) =>
          currentGoals.map((g) =>
            g.id === goalToUpdate.id
              ? { ...g, goal_completions: finalCompletions }
              : g
          )
        );

        // Recalculate total points after goal completion
        const updatedPoints = await PointsService.updateUserPoints(user.id);
        setUserPoints(updatedPoints);

        // Recalculate sexual happiness score in real time
        const scoreData =
          await SexualHappinessService.calculateSexualHappinessScore(user.id);
        setSexualHappinessScore(scoreData);
      }
    }
  };

  const handleLongPress = (goal: any) => {
    Alert.alert(goal.name, undefined, [
      {
        text: "Edit",
        onPress: () =>
          navigation.navigate("CreateGoal" as never, { goal } as never),
      },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => archiveGoal(goal),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const archiveGoal = async (goalToArchive: any) => {
    const originalGoals = [...goals];
    setGoals((cur) => cur.filter((g) => g.id !== goalToArchive.id));

    const { error } = await supabase
      .from("goals")
      .update({ is_archived: true })
      .eq("id", goalToArchive.id);
    if (error) {
      setGoals(originalGoals);

      Alert.alert("Error", "Failed to remove goal.");
    }
  };

  const fetchData = async () => {
    if (!user) {
      setUserStatus("new");
      return;
    }
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(
          `
          *,
          goal_completions (*)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(3);
      if (goalsError) throw goalsError;
      const { data: journalData, error: journalError } = await supabase
        .from("journal_entries")
        .select(`*`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (journalError) throw journalError;
      setGoals(goalsData || []);
      setJournalEntries(journalData || []);

      const hasActivity =
        (goalsData && goalsData.length > 0) ||
        (journalData && journalData.length > 0);
      if (hasActivity) {
        setUserStatus("active");
      } else {
        const accountAge =
          new Date().getTime() - new Date(user.created_at).getTime();
        const isOldUser = accountAge > 48 * 60 * 60 * 1000; // 48 hours
        setUserStatus(isOldUser ? "returning" : "new");
      }

      // Fetch user points
      const points = await PointsService.getUserPoints(user.id);
      setUserPoints(points);

      // Calculate sexual happiness score
      const scoreData =
        await SexualHappinessService.calculateSexualHappinessScore(user.id);
      setSexualHappinessScore(scoreData);
    } catch (error) {
      console.error("Error fetching home screen data:", error);
      setUserStatus("new");
    }
  };

  // Recalculate uncompleted goals count whenever goals state changes
  useEffect(() => {
    const uncompleted = goals.filter((g) => !isGoalCompleted(g));
    setUncompletedGoalsCount(uncompleted.length);
  }, [goals]);

  // Recalculate journal entries count whenever journalEntries state changes
  useEffect(() => {
    setJournalEntriesCount(journalEntries.length);
  }, [journalEntries]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const renderContent = () => {
    switch (userStatus) {
      case "loading":
        return <ActivityIndicator size="large" color={colors.ttaBlue500} />;
      case "active":
        if (goals.length === 0 && journalEntries.length === 0) {
          return (
            <GetStartedSection title="Get started" navigation={navigation} />
          );
        }
        return (
          <ActiveUserSection
            goals={goals}
            journalEntries={journalEntries}
            onToggleComplete={handleToggleComplete}
            onLongPress={handleLongPress}
            onDeleteJournal={handleDeleteJournal}
          />
        );
      case "returning":
        return (
          <GetStartedSection title="Get started" navigation={navigation} />
        );
      case "new":
      default:
        return (
          <GetStartedSection title="Get started" navigation={navigation} />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.gray100} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gray500}
          />
        }
      >
        <HeaderSection />

        <TouchableOpacity
          onPress={() => setShowDetailedScore(true)}
          activeOpacity={0.8}
        >
          <SexualHappinessCard
            score={sexualHappinessScore?.totalScore || null}
            uncompletedGoalsCount={uncompletedGoalsCount}
            journalEntriesCount={journalEntriesCount}
            userPoints={userPoints}
          />
        </TouchableOpacity>

        {/* Detailed Sexual Happiness Score Modal */}
        {sexualHappinessScore && (
          <SexualHappinessDetailCard
            visible={showDetailedScore}
            score={sexualHappinessScore.totalScore}
            factors={sexualHappinessScore.factors}
            breakdown={sexualHappinessScore.breakdown}
            onClose={() => setShowDetailedScore(false)}
            onRefresh={async () => {
              if (user) {
                const scoreData =
                  await SexualHappinessService.calculateSexualHappinessScore(
                    user.id
                  );
                setSexualHappinessScore(scoreData);
                setShowDetailedScore(false);
              }
            }}
          />
        )}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES --- //

const styles = StyleSheet.create({
  journalCardContainer: {
    backgroundColor: "#F8F8F8", // Match the GoalCard component's background
    borderRadius: 20,
    padding: 16,
    marginTop: 0, // Unified spacing for both sections
    marginBottom: 12, // Added spacing between journal entry cards on Home screen only
  },
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 10, // Minimal padding to avoid content being too close to bottom
  },
  sectionContainer: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 16,
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray700,
    marginBottom: 12, // Unified spacing for both sections
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray800,
    lineHeight: 28,
    marginBottom: 0,
  },
  date: {
    fontSize: 14,
    fontFamily: "Larsseit",
    color: colors.gray500,
    lineHeight: 20,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Sexual card styles
  sexualCard: {
    width: "100%",
    height: 208,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 32,
  },
  sexualCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sexualScore: {
    fontSize: 64,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.white,
    lineHeight: 64,
  },
  sexualLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: "#DCDFEF",
    letterSpacing: 0.18, // 1.5% of 12px ≈ 0.18px
    textTransform: "uppercase",
  },

  // Stats inside Sexual Card
  sexualStatsRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: "Larsseit",
  },
  statSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
    marginHorizontal: 12,
  },

  // Floating Action Button styles are defined in the FloatingAugustButton component

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Todo Items
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
    marginRight: 12,
  },
  checkedCheckbox: {
    backgroundColor: colors.ttaBlue500,
    borderColor: colors.ttaBlue500,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
  todoTextContainer: {
    marginLeft: 0,
    justifyContent: "center",
    flex: 1,
  },
  todoTask: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray800,
    lineHeight: 24,
  },
  todoTaskChecked: {
    textDecorationLine: "line-through",
    color: colors.gray500,
  },
  todoDetails: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray500,
    marginTop: 2,
    lineHeight: 20,
  },

  // Explore Cards
  exploreCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  exploreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F2F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  exploreIconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  exploreTextContainer: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray800,
    lineHeight: 24,
  },
  exploreDescription: {
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: colors.gray500,
    marginTop: 1,
    lineHeight: 20,
  },

  // Bottom Navigation
  navBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 84,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.gray500,
    marginTop: 4,
    lineHeight: 16,
  },
  activeNavText: {
    color: colors.ttaBlue500,
  },
});

export default HomeScreen;
