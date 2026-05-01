import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Newspaper, Plus, Users, User, type LucideIcon } from 'lucide-react-native';
import { useEvangelizing } from '@/hooks/useEvangelizing';

function TabIcon({ Icon, label, focused, isCenter, isEvangelizing }: {
  Icon: LucideIcon;
  label: string;
  focused: boolean;
  isCenter?: boolean;
  isEvangelizing?: boolean;
}) {
  if (isCenter) {
    return (
      <View
        className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
          isEvangelizing ? 'bg-red-500' : 'bg-blue-600'
        }`}
        style={{ marginTop: -20 }}
      >
        <Icon size={24} color="#fff" />
      </View>
    );
  }
  return (
    <View className="items-center gap-0.5">
      <Icon size={22} color={focused ? '#2563eb' : '#94a3b8'} />
      <Text className={`text-xs ${focused ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isEvangelizing } = useEvangelizing();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: '#fff',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Newspaper} label="News" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Plus} label="Add" focused={focused} isCenter isEvangelizing={isEvangelizing} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Users} label="Students" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
