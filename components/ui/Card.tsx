import React from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className ?? ''}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={`px-4 pt-4 pb-2 ${className ?? ''}`}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text className={`text-base font-semibold text-slate-800 ${className ?? ''}`}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <View className={`px-4 pb-4 ${className ?? ''}`}>
      {children}
    </View>
  );
}
