import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type Props = {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const base = 'flex-row items-center justify-center rounded-xl px-4 py-3 gap-2';

const styles: Record<Variant, string> = {
  primary: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-slate-100 active:bg-slate-200',
  outline: 'border border-slate-300 bg-white active:bg-slate-50',
  ghost: 'bg-transparent active:bg-slate-100',
  destructive: 'bg-red-600 active:bg-red-700',
};

const textStyles: Record<Variant, string> = {
  primary: 'text-white font-semibold text-sm',
  secondary: 'text-slate-700 font-semibold text-sm',
  outline: 'text-slate-700 font-semibold text-sm',
  ghost: 'text-slate-600 font-semibold text-sm',
  destructive: 'text-white font-semibold text-sm',
};

export function Button({ onPress, children, variant = 'primary', disabled, loading, className }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(base, styles[variant], (disabled || loading) && 'opacity-50', className)}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#fff' : '#475569'}
        />
      )}
      {typeof children === 'string' ? (
        <Text className={textStyles[variant]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
