import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { HistoryProvider } from '../components/history-context';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <HistoryProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1E1E1E' },
            headerTintColor: '#FFFFFF',
            contentStyle: { backgroundColor: '#1E1E1E' },
            animation: 'none',
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="timeline-list" options={{ headerShown: false }} />
          <Stack.Screen name="timeline-detail" options={{ headerShown: false }} />
          <Stack.Screen name="timeline-compare" options={{ headerShown: false }} />
          <Stack.Screen name="quiz" options={{ headerShown: false }} />
        </Stack>
      </HistoryProvider>
      <StatusBar style="light" translucent={false} />
    </ThemeProvider>
  );
}

