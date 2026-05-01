import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';

const colors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-slate-100', text: 'text-slate-600' },
  blue:    { bg: 'bg-blue-100',  text: 'text-blue-700' },
  green:   { bg: 'bg-green-100', text: 'text-green-700' },
  yellow:  { bg: 'bg-yellow-100',text: 'text-yellow-700' },
  red:     { bg: 'bg-red-100',   text: 'text-red-700' },
  purple:  { bg: 'bg-purple-100',text: 'text-purple-700' },
  indigo:  { bg: 'bg-indigo-100',text: 'text-indigo-700' },
};

export function pipelineColor(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    'Evangelized': 'blue',
    'Contact Exchanged': 'indigo',
    'Bible Study Started': 'purple',
    'Bible Study In Progress': 'purple',
    'Visiting Fellowship': 'yellow',
    'Connected to Chapter': 'green',
    'Discipled / Serving': 'green',
    'Not Interested / Closed': 'red',
  };
  return map[status] ?? 'default';
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const { bg, text } = colors[variant];
  return (
    <View className={`${bg} rounded-full px-2 py-0.5 self-start`}>
      <Text className={`${text} text-xs font-medium`}>{children}</Text>
    </View>
  );
}
