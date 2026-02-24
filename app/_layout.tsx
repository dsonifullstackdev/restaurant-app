import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeCart } from '@/api/services/cart.service';
import { FloatingCartBar } from '@/components/Floatingcartbar';
import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePathname } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname(); // current route
  const showFloatingCart = pathname === '/';

  useEffect(() => {
    const init = async () => {
      try {
        await initializeCart();
        console.log('Cart initialized');
      } catch (error) {
        console.log('Cart initialization failed:', error);
      }
    };
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Modal',
                headerShown: true,
              }}
            />
          </Stack>

          {/* Floating cart bar — shows above all screens when cart has items */}
          {showFloatingCart && <FloatingCartBar />}

          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
