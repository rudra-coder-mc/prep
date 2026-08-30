import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from '../src/ui/app-state'
import { colors } from '../src/ui/theme'

/**
 * The shell. Everything below it can assume the database is open, the archive
 * has been read and the session has been restored, because AppProvider does all
 * three before it reports anything but `starting`.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.fg,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'prep' }} />
          <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
          <Stack.Screen name="review" options={{ title: 'Review' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  )
}
