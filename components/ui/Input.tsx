import React from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...rest }: Props) {
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[{ fontSize: 14 }, style]}
        className={`rounded-xl border bg-white px-4 py-3 text-slate-900
          ${error ? 'border-red-400' : 'border-slate-300'}`}
        {...rest}
      />
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
      {!error && hint ? <Text className="text-xs text-slate-400">{hint}</Text> : null}
    </View>
  );
}
