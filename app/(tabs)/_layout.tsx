import { Tabs } from 'expo-router';
import { Home, Newspaper, Plus, Users, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useEvangelizing } from '../../lib/store';

export default function TabsLayout() {
  const isEvangelizing = useEvangelizing((s) => s.isEvangelizing);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#e2e8f0',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-14 h-14 rounded-full items-center justify-center -mt-4 shadow-lg ${
                isEvangelizing ? 'bg-red-500' : 'bg-blue-600'
              }`}
            >
              <Plus size={28} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
