// App entry: fonts + login state + screen navigation (React Navigation "native stack").
// Logged out → Login / Register. Logged in → Services, Details, Booking, My bookings.
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, useFonts } from '@expo-google-fonts/figtree';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/AuthContext';
import { colors, fonts, Loading } from './src/components/ui';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import BookingScreen from './src/screens/BookingScreen';
import LoginScreen from './src/screens/LoginScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ServiceDetailsScreen from './src/screens/ServiceDetailsScreen';
import ServicesScreen from './src/screens/ServicesScreen';

const Stack = createNativeStackNavigator();

// White header with navy text, like the web app's header.
const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.navy,
  headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  headerShadowVisible: true,
  contentStyle: { backgroundColor: colors.sand },
};

function HeaderLink({ title, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button">
      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.navy }}>{title}</Text>
    </Pressable>
  );
}

function Screens() {
  const { user, loading, logout } = useAuth();

  // Ask before logging out (native iOS / Android alert with two buttons).
  function confirmLogout() {
    Alert.alert('Log out?', "You'll need to log in again to book or see your bookings.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) return <Loading />;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
        <>
          <Stack.Screen
            name="Services"
            component={ServicesScreen}
            options={({ navigation }) => ({
              title: 'BookEasy',
              headerLeft: () => <HeaderLink title="Log out" onPress={confirmLogout} />,
              headerRight: () => <HeaderLink title="My bookings" onPress={() => navigation.navigate('MyBookings')} />,
            })}
          />
          <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} options={{ title: 'Service' }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Choose a time' }} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My bookings' }} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'BookEasy' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  // Load the fonts before showing anything (same fonts as the web app).
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Screens />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
