export interface GoalCompletion {
  id: string;
  completed_at: string;
}

export interface Goal {
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
