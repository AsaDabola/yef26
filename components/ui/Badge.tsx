import React from 'react';
import { Text, View } from 'react-native';
import type { PipelineStage } from '../../lib/types';

type Color = 'slate' | 'blue' | 'indigo' | 'purple' | 'yellow' | 'green' | 'red';

const COLORS: Record<Color, { bg: string; text: string }> = {
  slate:  { bg: 'bg-slate-100',  text: 'text-slate-700' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700' },
};

export function Badge({
  children,
  color = 'slate',
}: {
  children: React.ReactNode;
  color?: Color;
}) {
  const { bg, text } = COLORS[color];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{children}</Text>
    </View>
  );
}

export function pipelineBadgeColor(stage: PipelineStage): Color {
  const map: Record<PipelineStage, Color> = {
    'Evangelized':           'blue',
    'Contact Exchanged':     'indigo',
    'Bible Study Started':   'purple',
    'Bible Study In Progress': 'yellow',
    'Visiting Fellowship':   'green',
    'Connected to Chapter':  'green',
    'Discipled/Serving':     'green',
    'Not Interested/Closed': 'red',
  };
  return map[stage] ?? 'slate';
}
