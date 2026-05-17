import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, Pressable,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

type Option = { label: string; value: string };

type Props = {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
};

export function Select({ value, onValueChange, options, placeholder = 'Select...', label }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-slate-700">{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3"
        activeOpacity={0.8}
      >
        <Text className={`text-sm ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView className="bg-white rounded-t-3xl max-h-96">
          <View className="px-4 py-3 border-b border-slate-100">
            <Text className="text-base font-semibold text-slate-800 text-center">
              {label ?? placeholder}
            </Text>
          </View>
          <ScrollView className="px-4 py-2">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onValueChange(opt.value); setOpen(false); }}
                className="flex-row items-center justify-between py-3 border-b border-slate-50"
                activeOpacity={0.7}
              >
                <Text className={`text-sm ${opt.value === value ? 'text-blue-600 font-semibold' : 'text-slate-800'}`}>
                  {opt.label}
                </Text>
                {opt.value === value && <Check size={16} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
