// One helper for every Laravel API call (same behaviour as the web app's api.js).
// The token is kept in AsyncStorage (the phone's version of localStorage).
// On failure it throws an Error with:
//   message → text to show
//   status  → HTTP status (0 = server not reachable)
//   errors  → Laravel field errors simplified to { field: "first message" }
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

export async function api(path, { method = 'GET', body } = {}) {
  const token = await AsyncStorage.getItem('token');

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw apiError(0, "Can't connect to the booking server. Check that it's running and try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw apiError(res.status, data.message || 'Something went wrong. Try again.', data.errors);
  }

  return data;
}

function apiError(status, message, errors = {}) {
  const error = new Error(message);
  error.status = status;
  error.errors = Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));
  return error;
}
