import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useAuth } from '../AuthContext';
import { Alert, Button, Field, PasswordField, styles } from '../components/ui';
import { hasErrors, validateLogin } from '../validate';

export default function LoginScreen({ navigation }) {
  const { login, notice } = useAuth(); // notice = "You've been logged out." right after logging out
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({}); // { field: message }
  const [formError, setFormError] = useState(''); // message for the whole form
  const [busy, setBusy] = useState(false);

  // Update a field and clear its error as soon as the user edits it.
  const update = (field) => (value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  async function handleLogin() {
    setFormError('');

    // 1. Check in the app first
    const found = validateLogin(form);
    setErrors(found);
    if (hasErrors(found)) return;

    // 2. Ask Laravel
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      // No navigate() needed: App.js shows the logged-in screens once `user` is set.
    } catch (err) {
      setFormError(err.status === 422 ? 'Email or password is incorrect. Check both and try again.' : err.message);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log in</Text>
        <Text style={[styles.muted, { marginBottom: 20 }]}>Log in to book and manage your appointments.</Text>

        {!formError && <Alert type="success">{notice}</Alert>}
        <Alert>{formError}</Alert>

        <Field
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={errors.email}
        />
        <PasswordField
          label="Password"
          value={form.password}
          onChangeText={update('password')}
          autoComplete="current-password"
          error={errors.password}
        />

        <Button title={busy ? 'Logging in...' : 'Log in'} onPress={handleLogin} disabled={busy} />
        <Button title="Create an account" variant="secondary" onPress={() => navigation.navigate('Register')} />

        <Text style={[styles.muted, { marginTop: 24 }]}>
          Demo account: customer@example.com, password: password
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
