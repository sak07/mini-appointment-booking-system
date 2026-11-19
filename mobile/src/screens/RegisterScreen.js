import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useAuth } from '../AuthContext';
import { Alert, Button, Field, PasswordField, styles } from '../components/ui';
import { hasErrors, validateRegister } from '../validate';

const emptyForm = { name: '', email: '', phone: '', password: '', password_confirmation: '' };

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  async function handleRegister() {
    setFormError('');

    const found = validateRegister(form);
    setErrors(found);
    if (hasErrors(found)) return;

    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim() }); // logged in automatically on success
    } catch (err) {
      // 422 → Laravel's messages (e.g. "The email has already been taken.") under each field
      if (err.status === 422) setErrors(err.errors);
      else setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={[styles.muted, { marginBottom: 20 }]}>{"You'll use it to book and see your appointments."}</Text>

        <Alert>{formError}</Alert>

        <Field label="Full name" value={form.name} onChangeText={update('name')} autoComplete="name" error={errors.name} />
        <Field
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={errors.email}
        />
        <Field
          label="Phone (optional)"
          value={form.phone}
          onChangeText={update('phone')}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <PasswordField
          label="Password"
          hint="At least 8 characters."
          value={form.password}
          onChangeText={update('password')}
          error={errors.password}
        />
        <PasswordField
          label="Confirm password"
          value={form.password_confirmation}
          onChangeText={update('password_confirmation')}
          error={errors.password_confirmation}
        />

        <Button title={busy ? 'Creating account...' : 'Create account'} onPress={handleRegister} disabled={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
