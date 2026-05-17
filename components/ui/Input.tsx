import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...props }: Props) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-slate-700">{label}</Text>}
      <TextInput
        className={`rounded-xl border px-4 py-3 text-slate-900 bg-white text-sm ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
