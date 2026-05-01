import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const containerClasses: Record<Variant, string> = {
  primary:     'bg-blue-600 rounded-xl px-4 py-3 flex-row items-center justify-center',
  secondary:   'bg-slate-100 rounded-xl px-4 py-3 flex-row items-center justify-center',
  outline:     'border border-slate-200 bg-white rounded-xl px-4 py-3 flex-row items-center justify-center',
  ghost:       'rounded-xl px-4 py-3 flex-row items-center justify-center',
  destructive: 'bg-red-500 rounded-xl px-4 py-3 flex-row items-center justify-center',
};

const textClasses: Record<Variant, string> = {
  primary:     'text-white font-semibold text-sm',
  secondary:   'text-slate-700 font-semibold text-sm',
  outline:     'text-slate-700 font-semibold text-sm',
  ghost:       'text-slate-600 text-sm',
  destructive: 'text-white font-semibold text-sm',
};

export default function Button({ onPress, children, variant = 'primary', disabled, loading }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      className={`${containerClasses[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#64748b'} className="mr-2" />}
      {typeof children === 'string'
        ? <Text className={textClasses[variant]}>{children}</Text>
        : children}
    </TouchableOpacity>
  );
}
