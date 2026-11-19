// Remembers who is logged in, for the whole app.
// The token + user are also saved in localStorage so a page refresh keeps you logged in.
// Any component can call useAuth() to get { user, login, register, logout }.
import { createContext, useContext, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  function saveSession({ user, token }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    saveSession(await api('/login', { method: 'POST', body: { email, password } }));
  }

  async function register(form) {
    saveSession(await api('/register', { method: 'POST', body: form }));
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST' }); // deletes the token on the server
    } catch {
      // token may already be invalid — log out locally anyway
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
