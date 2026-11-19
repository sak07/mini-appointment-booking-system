import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert as NativeAlert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Alert, Button, colors, Loading, StatusBadge, styles } from '../components/ui';
import { formatDate } from '../format';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Laravel returns only this customer's bookings.
  function load() {
    return api('/appointments')
      .then((res) => {
        setBookings(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        setBookings((current) => current ?? []);
      });
  }

  // Load every time this screen comes into view (e.g. right after booking).
  // useFocusEffect needs a stable function, which is what useCallback provides here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmCancel(booking) {
    const when = `${formatDate(booking.appointment_date)} at ${booking.appointment_time}`;
    NativeAlert.alert('Cancel this booking?', `${booking.service?.name}, ${when}`, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/appointments/${booking.id}/status`, { method: 'PATCH', body: { status: 'cancelled' } });
            setMessage(`Cancelled ${booking.service?.name} on ${formatDate(booking.appointment_date)}.`);
            load();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  }

  if (!bookings) return <Loading />;

  return (
    <FlatList
      contentContainerStyle={styles.screen}
      data={bookings}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
        <>
          <Alert type="success">{message}</Alert>
          <Alert>{error}</Alert>
        </>
      }
      ListEmptyComponent={
        !error ? (
          <View>
            <Text style={[styles.text, { marginBottom: 8 }]}>{"You don't have any bookings yet."}</Text>
            <Button title="Browse services" onPress={() => navigation.navigate('Services')} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={local.row}>
          {/* Tap the booking to open its details screen */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View booking ${item.id}, ${item.service?.name}`}
            onPress={() => navigation.navigate('BookingDetails', { id: item.id })}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <View style={local.rowTop}>
              <Text style={[styles.strong, { flexShrink: 1 }]}>{item.service?.name}</Text>
              <View style={styles.row}>
                <StatusBadge status={item.status} />
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>
            </View>
            <Text style={styles.muted}>
              {formatDate(item.appointment_date)} at {item.appointment_time}, ref #{item.id}
            </Text>
          </Pressable>
          {['pending', 'confirmed'].includes(item.status) ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Button title="Cancel" variant="secondary" onPress={() => confirmCancel(item)} />
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

const local = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 },
});
