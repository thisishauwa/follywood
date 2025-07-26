import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Goal } from '../types/Goal';
import { getRecurrenceText } from '../utils/getRecurrenceText';
import { goalCardStyles } from './goalCardStyles';

interface GoalCardProps {
  item: Goal;
  isCompleted: boolean;
  onToggleComplete: (item: Goal) => void;
  onLongPress?: (item: Goal) => void;
  style?: any;
}

const GoalCard: React.FC<GoalCardProps> = ({ item, isCompleted, onToggleComplete, onLongPress, style }) => {
  const handlePress = () => {
    onToggleComplete(item);
  };

  return (
    <TouchableOpacity
      style={[goalCardStyles.goalItem, style]}
      onPress={handlePress}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={[goalCardStyles.checkbox, isCompleted && goalCardStyles.checkedCheckbox]}>
        {isCompleted && <Text style={goalCardStyles.checkboxTick}>✓</Text>}
      </View>
      <View style={goalCardStyles.goalTextContainer}>
        <Text style={[goalCardStyles.goalName, isCompleted && goalCardStyles.goalNameChecked]}>
          {item.name}
        </Text>
        <View style={goalCardStyles.goalDetailsContainer}>
          <Text style={goalCardStyles.goalDetailTextEffort}>{item.effort_score}</Text>
          <View style={goalCardStyles.dotSeparator} />
          <Text style={goalCardStyles.goalDetailTextTime}>{item.time_of_day}</Text>
        </View>
        <Text style={goalCardStyles.recurrenceText}>{getRecurrenceText(item)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Import the styles from GoalsScreen
import { styles } from '../screens/GoalsScreen';

export default GoalCard;
