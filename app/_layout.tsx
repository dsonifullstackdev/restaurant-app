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
  anchor: '(tabs)',
};

// ── Auth gate — redirects to login + initializes cart after login ────
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // ── Navigation guard ─────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments]);

  // ── Cart init — only after user is logged in ─────────────────────
  // NOT called on login screen, NOT called before auth check completes.
  // Runs when: isLoading=false AND isLoggedIn=true
  // Re-runs automatically if user logs out and back in.
  useEffect(() => {
    if (isLoading) return;   // still checking stored token — wait
    if (!isLoggedIn) return; // on login screen — skip

    const init = async () => {
      try {
        await initializeCart();
        console.log('Cart initialized for logged-in user');
      } catch (error) {
        console.log('Cart initialization failed:', error);
      }
    };

    init();
  }, [isLoggedIn, isLoading]);

  return <>{children}</>;
}

// ── Inner layout ──────────────────────────────────────────────────────
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
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Modal',
              }}
            />
          </Stack>

          <FloatingCartBar />
        </AuthGate>

        <StatusBar style="auto" />
      </ThemeProvider>
    </CartProvider>
  );
}

// ── Root — AuthProvider wraps everything ─────────────────────────────
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
