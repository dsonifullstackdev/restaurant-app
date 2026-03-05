import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeCart } from '@/api/services/cart.service';
import { FloatingCartBar } from '@/components/Floatingcartbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'login',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // still reading AsyncStorage — wait

    const seg = segments[0] as string | undefined;

    // Never redirect away from these screens — they handle their own navigation
    const hands0ffScreens = ['onboarding', 'service-unavailable', 'otp', 'login'];
    if (seg && hands0ffScreens.includes(seg)) return;

    if (!isLoggedIn) {
      // Not logged in and not on a public screen → go to login
      router.replace('/login');
    }
    // Logged-in users are fine wherever they are
  }, [isLoggedIn, isLoading, segments[0]]);

  // Cart init after login
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;
    initializeCart().catch(() => {});
  }, [isLoggedIn, isLoading]);

  return <>{children}</>;
}

function AppLayout() {
  const colorScheme = useColorScheme();

  return (
    <CartProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="order-success" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="service-unavailable" />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', headerShown: true, title: 'Modal' }}
            />
          </Stack>
        </AuthGate>
        {/* FloatingCartBar outside Stack so it overlays all screens properly */}
        <FloatingCartBar />
        <StatusBar style="auto" />
      </ThemeProvider>
    </CartProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
