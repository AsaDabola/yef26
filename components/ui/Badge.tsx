import React from 'react';
import { View, Text } from 'react-native';
import type { PipelineStage } from '../../lib/types';

type Variant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';

const variants: Record<Variant, { bg: string; text: string }> = {
  default: { bg: 'bg-slate-100', text: 'text-slate-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  green: { bg: 'bg-green-100', text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
};

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  const { bg, text } = variants[variant];
  return (
    <View className={`rounded-full px-2 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{children}</Text>
    </View>
  );
}

export function pipelineColor(stage: PipelineStage): Variant {
  const map: Partial<Record<PipelineStage, Variant>> = {
    'Evangelized': 'blue',
    'Contact Exchanged': 'indigo',
    'Bible Study Started': 'purple',
    'Bible Study In Progress': 'yellow',
    'Visiting Fellowship': 'green',
    'Connected to Chapter': 'green',
    'Discipled/Serving': 'green',
    'Not Interested/Closed': 'red',
  };
  return map[stage] ?? 'default';
}
