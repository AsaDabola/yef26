import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label && <Text className="text-xs font-medium text-slate-500 mb-1">{label}</Text>}
      <TextInput
        className={`w-full border border-slate-200 rounded-xl bg-white px-3 py-3 text-sm text-slate-800 ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
