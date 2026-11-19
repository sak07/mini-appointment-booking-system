// Starts the notification service.  Run: npm start
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`Notification service running on http://localhost:${PORT}`);
});
