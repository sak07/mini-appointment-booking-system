// One helper for every call to the Laravel API.
// - adds the login token (if we have one)
// - sends and reads JSON
// - on failure throws an Error with:
//     message → text to show the user
//     status  → HTTP status (0 = server not reachable)
//     errors  → Laravel field errors, simplified to { field: "first message" }
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');

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
    // Token no longer valid → forget it, so the user is asked to log in again.
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw apiError(res.status, data.message || 'Something went wrong. Try again.', data.errors);
  }

  return data;
}

function apiError(status, message, errors = {}) {
  const error = new Error(message);
  error.status = status;
  // Laravel sends { email: ["msg1", "msg2"] } → keep the first message per field
  error.errors = Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));
  return error;
}
