// One booking's details (same as the web app's /my-bookings/:id):
// status, receipt, whether the confirmation email was sent, and Cancel.
// Laravel only returns the booking if it belongs to the logged-in customer.
import { useEffect, useState } from 'react';
import { Alert as NativeAlert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import BookingReceipt from '../components/BookingReceipt';
import { Alert, Button, Loading, StatusBadge, styles } from '../components/ui';
import { formatDate } from '../format';

export default function BookingDetailsScreen({ route, navigation }) {
  const { id } = route.params; // passed from My bookings or the booking confirmation
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api(`/appointments/${id}`)
      .then((res) => setBooking(res.data))
      .catch((err) =>
        setError(err.status === 404 || err.status === 403 ? "This booking doesn't exist or isn't yours." : err.message),
      );
  }, [id]);

  async function cancelBooking() {
    setCancelling(true);
    try {
      const res = await api(`/appointments/${booking.id}/status`, { method: 'PATCH', body: { status: 'cancelled' } });
      setBooking(res.data);
      setMessage('Booking cancelled. The time is free for other customers again.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  function confirmCancel() {
    NativeAlert.alert(
      'Cancel this booking?',
      `${booking.service.name}, ${formatDate(booking.appointment_date)} at ${booking.appointment_time}`,
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: cancelBooking },
      ],
    );
  }

  if (error && !booking) {
    return (
      <View style={styles.screen}>
        <Alert>{error}</Alert>
      </View>
    );
  }
  if (!booking) return <Loading />;

  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>

      <View style={local.head}>
        <Text style={[styles.title, { marginBottom: 0, flexShrink: 1 }]}>{booking.service.name}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text style={[styles.muted, { marginBottom: 16 }]}>
        {formatDate(booking.appointment_date)} at {booking.appointment_time}
      </Text>

      <View style={styles.panel}>
        <BookingReceipt booking={booking} service={booking.service} emailSent={Boolean(booking.notification_sent_at)} />
        {canCancel ? (
          <Button
            title={cancelling ? 'Cancelling...' : 'Cancel booking'}
            variant="secondary"
            onPress={confirmCancel}
            disabled={cancelling}
          />
        ) : null}
        <Button
          title="Book this service again"
          variant="secondary"
          onPress={() => navigation.navigate('Booking', { service: booking.service })}
        />
      </View>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
});
