import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Add } from 'iconsax-react-nativejs';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

// --- CONSTANTS ---
const colors = {
  white: '#FFFFFF',
  black: '#1E293B',
  primary: '#FB923C',
  stone50: '#F8F8F8',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray300: '#CBD5E1',
  gray500: '#64748B',
  gray600: '#4B5563',
  gray800: '#1F2937',
  slate400: '#94A3B8',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue700: '#1D4ED8',
  orange400: '#FB923C',
};

// --- TYPES ---
interface GoalCompletion {
  id: string;
  completed_at: string;
}

interface Goal {
  id: string;
  name: string;
  effort_score: string;
  time_of_day: string;
  tags: string[];
  created_at: string;
  recurrence_type: 'one_off' | 'daily' | 'weekly';
  recurrence_days: string[] | null;
  goal_completions: GoalCompletion[];
}

// --- HELPERS ---
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getRecurrenceText = (goal: Goal) => {
  switch (goal.recurrence_type) {
    case 'daily':
      return 'Repeats Daily';
    case 'weekly':
      if (goal.recurrence_days && goal.recurrence_days.length > 0) {
        return `Repeats on ${goal.recurrence_days.join(', ')}`;
      }
      return 'Repeats Weekly';
    case 'one_off':
    default:
      return 'One-off Goal';
  }
};

// --- GOAL CARD COMPONENT ---
const GoalCard: React.FC<{ 
  item: Goal; 
  isCompleted: boolean;
  onToggleComplete: (item: Goal) => void;
  onLongPress?: (item: Goal) => void; 
}> = ({ item, isCompleted, onToggleComplete, onLongPress }) => {
  const handlePress = () => {
    onToggleComplete(item);
  };

  return (
    <TouchableOpacity
      style={styles.goalItem}
      onPress={handlePress}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isCompleted && styles.checkedCheckbox]}>
        {isCompleted && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <View style={styles.goalTextContainer}>
        <Text style={[styles.goalName, isCompleted && styles.goalNameChecked]}>
          {item.name}
        </Text>
        <View style={styles.goalDetailsContainer}>
          <Text style={styles.goalDetailTextEffort}>{item.effort_score}</Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.goalDetailTextTime}>{item.time_of_day}</Text>
        </View>
        <Text style={styles.recurrenceText}>{getRecurrenceText(item)}</Text>
      </View>
    </TouchableOpacity>
  );

};

// --- GOALS SCREEN COMPONENT ---
const GoalsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isGoalCompleted = (goal: Goal): boolean => {
    const completions = goal.goal_completions || [];
    if (goal.recurrence_type === 'one_off') {
      return completions.length > 0;
    }

    // For recurring goals, check for a completion today.
    const today = new Date();
    return completions.some(comp => 
      isSameDay(new Date(comp.completed_at), today)
    );
  };

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          goal_completions (*)
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to fetch goals.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, [fetchGoals]);

  const handleToggleComplete = async (goalToUpdate: Goal) => {
    const originalGoal = goals.find(g => g.id === goalToUpdate.id);
    if (!originalGoal) return;

    const completions = goalToUpdate.goal_completions || [];
    const isCompleted = isGoalCompleted(goalToUpdate);

    if (isCompleted) {
      // --- UN-COMPLETE ---
      const today = new Date();
      const completionToRemove = (goalToUpdate.recurrence_type === 'one_off')
        ? completions[0]
        : completions.find(c => isSameDay(new Date(c.completed_at), today));

      if (!completionToRemove) return;

      // Optimistic UI update
      const newCompletions = completions.filter(c => c.id !== completionToRemove.id);
      setGoals(currentGoals => currentGoals.map(g => g.id === goalToUpdate.id ? { ...g, goal_completions: newCompletions } : g));

      // DB operation
      const { error } = await supabase.from('goal_completions').delete().eq('id', completionToRemove.id);

      if (error) {
        console.error('Error deleting completion:', error);
        setGoals(currentGoals => currentGoals.map(g => g.id === goalToUpdate.id ? originalGoal : g));
        Alert.alert('Error', 'Could not update goal.');
      }
    } else {
      // --- COMPLETE ---
      // Optimistic UI update with a temporary completion
      const tempCompletion = { id: `temp-${Date.now()}`, completed_at: new Date().toISOString() };
      const newCompletions = [...completions, tempCompletion];
      setGoals(currentGoals => currentGoals.map(g => g.id === goalToUpdate.id ? { ...g, goal_completions: newCompletions } : g));

      // DB operation
      const { data: newCompletionData, error } = await supabase
        .from('goal_completions')
        .insert({ goal_id: goalToUpdate.id, user_id: user!.id })
        .select()
        .single();

      if (error) {
        console.error('Error creating completion:', error);
        setGoals(currentGoals => currentGoals.map(g => g.id === goalToUpdate.id ? originalGoal : g));
        Alert.alert('Error', 'Could not update goal.');
      } else if (newCompletionData) {
        // Replace temporary completion with real one from DB
        const finalCompletions = newCompletions.map(c => c.id === tempCompletion.id ? newCompletionData : c);
        setGoals(currentGoals => currentGoals.map(g => g.id === goalToUpdate.id ? { ...g, goal_completions: finalCompletions } : g));
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  const handleCreateNew = () => {
    navigation.navigate('CreateGoal');
  };

  const archiveGoal = async (goalToArchive: Goal) => {
    const originalGoals = [...goals];
    // Optimistic UI removal
    setGoals(cur => cur.filter(g => g.id !== goalToArchive.id));

    const { error } = await supabase.from('goals').update({ is_archived: true }).eq('id', goalToArchive.id);
    if (error) {
      console.error('Error archiving goal:', error);
      setGoals(originalGoals); // revert
      Alert.alert('Error', 'Failed to remove goal.');
    }
  };

  const handleLongPress = (goal: Goal) => {
    Alert.alert(goal.name, undefined, [
      {
        text: 'Edit',
        onPress: () => navigation.navigate('CreateGoal', { goal }),
      },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => archiveGoal(goal),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image source={require('../../assets/images/trophyimg.png')} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
      <Text style={styles.emptyTitle}>No goals yet</Text>
      <Text style={styles.emptyDescription}>Create a goal to start your journey</Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
        <Text style={styles.createButtonText}>Create your first goal</Text>
      </TouchableOpacity>
    </View>
  );

  // Render function for skeleton loaders
  const renderSkeletonLoaders = () => (
    <ScrollView contentContainerStyle={styles.skeletonContainer}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <View key={idx} style={styles.skeletonCard} />
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return renderSkeletonLoaders();
    }

    if (goals.length === 0) {
  return (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center' }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray500} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      );
    }

    return (
        <FlatList
          data={goals}
          renderItem={({ item }) => (
            <GoalCard 
              item={item} 
              isCompleted={isGoalCompleted(item)}
              onToggleComplete={handleToggleComplete}
              onLongPress={handleLongPress} 
            />
          )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray500} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
          <Add size={24} color={colors.blue500} />
        </TouchableOpacity>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.stone50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginTop: 2, // Align with text
  },
  checkedCheckbox: {
    backgroundColor: colors.blue700,
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalTextContainer: {
    flex: 1,
    gap: 2,
  },
  goalName: {
    fontSize: 16,
    fontFamily: 'Larsseit',
    fontWeight: '500',
    color: colors.gray600,
    lineHeight: 22.4, // leading-normal
  },
  goalNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.gray500,
  },
  goalDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalDetailTextEffort: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    fontWeight: '500',
    color: colors.orange400,
    lineHeight: 19.6, // leading-tight
  },
  goalDetailTextTime: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    fontWeight: '500',
    color: colors.slate400,
    lineHeight: 19.6, // leading-tight
  },
  dotSeparator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray300,
  },
  recurrenceText: {
    fontSize: 12,
    fontFamily: 'Larsseit',
    fontWeight: '500',
    color: colors.gray500,
    marginTop: 4,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#2154E0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.white,
  },
  skeletonContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
});

export default GoalsScreen;
