// Shared building blocks + styles, so every screen looks the same as the web app.
// React Native has no CSS: styles are JavaScript objects made with StyleSheet.create().
import { Ionicons } from '@expo/vector-icons'; // Expo's icon set (eye / eye-off)
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Same navy + sand palette as the web app and WordPress site.
export const colors = {
  sand: '#f5f3ee', // screen background
  surface: '#ffffff', // panels, inputs
  ink: '#0f172a', // main text
  muted: '#5b6474', // secondary text
  line: '#e4ded3', // borders
  inputBorder: '#cfc8bb',
  navy: '#1e3a8a', // buttons, header, selected time
  navyTint: '#e8ecf7',
  error: '#b42318',
  errorBg: '#fef3f2',
  success: '#166534',
  successBg: '#f0fdf4',
};

// Font names = the keys loaded with useFonts() in App.js.
// (With custom fonts each weight is its own font file, so we pick the file instead of using fontWeight.)
export const fonts = {
  heading: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
};

export function Button({ title, onPress, disabled, variant = 'primary' }) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.navy }]}>{title}</Text>
    </Pressable>
  );
}

// Label + input + error under it. Red border while there is an error.
export function Field({ label, hint, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Password input with an eye icon on the right.
// secureTextEntry hides the characters; the eye flips it (crossed-out eye = tap to hide).
export function PasswordField({ label, hint, error, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View>
        <TextInput
          style={[styles.input, { paddingRight: 52 }, error && styles.inputError]}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          {...inputProps}
        />
        <Pressable
          onPress={() => setVisible(!visible)}
          style={styles.passwordToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={visible ? colors.navy : colors.muted} />
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Box for messages that aren't about one field (wrong password, server down, success).
export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const isError = type === 'error';
  return (
    <View style={[styles.alert, isError ? styles.alertError : styles.alertSuccess]} accessibilityRole="alert">
      <Text style={[styles.alertText, { color: isError ? colors.error : colors.success }]}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

const STATUS = {
  pending: ['Pending', '#fdf3dc', '#8a5a00'],
  confirmed: ['Confirmed', colors.navyTint, colors.navy],
  completed: ['Completed', colors.successBg, colors.success],
  cancelled: ['Cancelled', '#efebe4', colors.muted],
};

export function StatusBadge({ status }) {
  const [label, bg, fg] = STATUS[status] || [status, '#efebe4', colors.muted];
  return <Text style={[styles.badge, { backgroundColor: bg, color: fg }]}>{label}</Text>;
}

export const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 20, backgroundColor: colors.sand },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sand },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 18 },

  title: { fontFamily: fonts.heading, fontSize: 28, color: colors.ink, marginBottom: 6 },
  subtitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, marginBottom: 6 },
  text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.muted },
  strong: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },

  field: { marginBottom: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginBottom: 6 },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: -2, marginBottom: 6 },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: { borderColor: colors.error, borderWidth: 2 },
  fieldError: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: 6 },
  passwordToggle: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10 },

  alert: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 16 },
  alertError: { backgroundColor: colors.errorBg, borderColor: '#f5c2bd' },
  alertSuccess: { backgroundColor: colors.successBg, borderColor: '#bbe5c8' },
  alertText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },

  button: { backgroundColor: colors.navy, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.navy },
  buttonText: { fontFamily: fonts.semibold, color: '#fff', fontSize: 16 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', fontFamily: fonts.semibold, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
});
