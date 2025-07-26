import { Goal } from '../types/Goal';

export function getRecurrenceText(goal: Goal): string {
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
}
