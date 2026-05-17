import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const container: Record<Variant, string> = {
  primary:     'bg-blue-600 active:bg-blue-700',
  secondary:   'bg-slate-100 active:bg-slate-200',
  outline:     'border border-slate-300 bg-white active:bg-slate-50',
  ghost:       'bg-transparent active:bg-slate-100',
  destructive: 'bg-red-600 active:bg-red-700',
};

const textCls: Record<Variant, string> = {
  primary:     'text-white font-semibold text-sm',
  secondary:   'text-slate-700 font-semibold text-sm',
  outline:     'text-slate-700 font-semibold text-sm',
  ghost:       'text-slate-500 font-semibold text-sm',
  destructive: 'text-white font-semibold text-sm',
};

const spinnerColor: Record<Variant, string> = {
  primary:     '#fff',
  secondary:   '#475569',
  outline:     '#475569',
  ghost:       '#475569',
  destructive: '#fff',
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
  className = '',
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3
        ${container[variant]}
        ${isDisabled ? 'opacity-50' : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}`}
    >
      {loading && <ActivityIndicator size="small" color={spinnerColor[variant]} />}
      {typeof children === 'string' ? (
        <Text className={textCls[variant]}>{children}</Text>
      ) : (
        <View className="flex-row items-center gap-2">{children}</View>
      )}
    </TouchableOpacity>
  );
}
