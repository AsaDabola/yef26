import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

type Option = { label: string; value: string };

type Props = {
  label?: string;
  placeholder?: string;
  value?: string;
  options: Option[];
  onValueChange: (v: string) => void;
};

export function Select({ label, placeholder = 'Select…', value, options, onValueChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3"
      >
        <Text className={`text-sm ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <View className="bg-white rounded-t-3xl">
          {label ? (
            <View className="border-b border-slate-100 px-4 py-3">
              <Text className="text-center text-base font-semibold text-slate-800">{label}</Text>
            </View>
          ) : null}
          <ScrollView className="max-h-80 px-4 py-2">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onValueChange(opt.value); setOpen(false); }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between border-b border-slate-50 py-3"
              >
                <Text
                  className={`text-sm ${opt.value === value ? 'font-semibold text-blue-600' : 'text-slate-800'}`}
                >
                  {opt.label}
                </Text>
                {opt.value === value && <Check size={16} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="h-6" />
        </View>
      </Modal>
    </View>
  );
}
