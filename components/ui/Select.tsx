import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export default function Select({ value, onValueChange, options, placeholder = 'Select...', label }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="w-full">
      {label && <Text className="text-xs font-medium text-slate-500 mb-1">{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-slate-200 rounded-xl bg-white px-3 py-3 flex-row items-center justify-between"
      >
        <Text className={selected ? 'text-sm text-slate-800' : 'text-sm text-slate-400'}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <SafeAreaView className="bg-white rounded-t-3xl">
            <View className="p-4 border-b border-slate-100">
              <Text className="text-center font-semibold text-slate-800">{label ?? 'Select'}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                  className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50"
                >
                  <Text className="text-sm text-slate-800">{item.label}</Text>
                  {value === item.value && <Check size={16} color="#2563eb" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setOpen(false)} className="p-4">
              <Text className="text-center text-sm text-slate-500">Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
