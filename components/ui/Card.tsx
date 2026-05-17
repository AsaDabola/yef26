import React from 'react';
import { View, Text } from 'react-native';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`px-4 pt-4 pb-2 ${className}`}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text className="text-base font-semibold text-slate-800">{children}</Text>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`px-4 pb-4 ${className}`}>{children}</View>;
}
