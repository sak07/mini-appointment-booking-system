// Login state for the whole app (same idea as the web app).
// On start-up we read the saved user from AsyncStorage, so the user stays logged in.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while reading storage at start-up
  const [notice, setNotice] = useState(''); // short message for the login screen, e.g. after logging out

  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((saved) => setUser(saved ? JSON.parse(saved) : null))
      .finally(() => setLoading(false));
  }, []);

  async function saveSession({ user, token }) {
    await AsyncStorage.multiSet([
      ['token', token],
      ['user', JSON.stringify(user)],
    ]);
    setNotice('');
    setUser(user);
  }

  async function login(email, password) {
    await saveSession(await api('/login', { method: 'POST', body: { email, password } }));
  }

  async function register(form) {
    await saveSession(await api('/register', { method: 'POST', body: form }));
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      // already invalid: log out locally anyway
    }
    await AsyncStorage.multiRemove(['token', 'user']);
    setNotice("You've been logged out.");
    setUser(null); // App.js now shows the Login screen, which displays the notice
  }

  return (
    <AuthContext.Provider value={{ user, loading, notice, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
