// Checks done in the app BEFORE calling the API (same rules and wording as the web app).
// Each function returns { field: "message" }; an empty object means everything is fine.
// Laravel validates everything again on the server.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegister({ name, email, password, password_confirmation }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address, like name@example.com.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  if (password_confirmation !== password) errors.password_confirmation = "Passwords don't match.";
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
