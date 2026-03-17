import { UtensilsCrossed, Bus, BookOpen, Gamepad2, HeartPulse, Package } from 'lucide-react';

export const CATEGORIES = [
  { key: 'Food', icon: UtensilsCrossed, color: '#92400E', bg: '#FEF3C7' },
  { key: 'Transport', icon: Bus, color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'Study', icon: BookOpen, color: '#065F46', bg: '#D1FAE5' },
  { key: 'Entertainment', icon: Gamepad2, color: '#9D174D', bg: '#FCE7F3' },
  { key: 'Health', icon: HeartPulse, color: '#6B21A8', bg: '#F3E8FF' },
  { key: 'Other', icon: Package, color: '#374151', bg: '#F3F4F6' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c])
);

export const DEFAULT_BUDGET_PERCENTAGES = {
  Food: 35,
  Transport: 15,
  Study: 10,
  Entertainment: 10,
  Health: 5,
  Other: 5,
};

export const COLOR_MAP = {
  safe: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  spending: '#F97316',
};

export const CHART_COLORS = CATEGORIES.map(c => c.color);
