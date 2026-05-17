import React from 'react';
import { Text, View } from 'react-native';

type BoxProps = { children: React.ReactNode; className?: string };

export function Card({ children, className = '' }: BoxProps) {
  return (
    <View className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }: BoxProps) {
  return <View className={`px-4 pb-2 pt-4 ${className}`}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text className="text-base font-semibold text-slate-800">{children}</Text>;
}

export function CardContent({ children, className = '' }: BoxProps) {
  return <View className={`px-4 pb-4 ${className}`}>{children}</View>;
}
