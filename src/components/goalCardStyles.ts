import { StyleSheet, Platform } from 'react-native';
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
export const goalCardStyles = StyleSheet.create({
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.stone50,
    padding: 16,
    borderRadius: 20,
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
});
