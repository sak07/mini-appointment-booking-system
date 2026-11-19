// Where the Laravel API lives.
// - iOS simulator: 127.0.0.1 is your Mac, so the default works.
// - Android emulator: use http://10.0.2.2:8000/api
// - Real phone (Expo Go): use your Mac's network IP, e.g. http://192.168.1.20:8000/api,
//   and start Laravel with: php artisan serve --host=0.0.0.0 --port=8000
// Set it in mobile/.env as EXPO_PUBLIC_API_URL (Expo exposes EXPO_PUBLIC_* variables to the app).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
