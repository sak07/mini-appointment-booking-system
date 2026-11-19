// Checks done in the browser BEFORE calling the API, so the user gets instant feedback.
// Each function returns { field: "message" } — an empty object means "all good".
// Laravel still validates everything again on the server (that's the real protection).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegister({ name, email, password, password_confirmation }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  if (password_confirmation !== password) errors.password_confirmation = "Passwords don't match.";
  return errors;
}

export function validateService({ name, duration_minutes, price }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter a service name.';
  if (!duration_minutes || Number(duration_minutes) < 5) errors.duration_minutes = 'Enter a duration of at least 5 minutes.';
  if (price === '' || Number(price) < 0) errors.price = 'Enter a price of 0 or more.';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
