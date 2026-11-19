import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import BookingReceipt from '../components/BookingReceipt';
import { Alert, Button, colors, fonts, styles } from '../components/ui';
import { formatDate, formatPrice, toIsoDate } from '../format';

// The next 7 days: { value: "2026-11-20", label: "Today" / "Fri 20 Nov" }
function nextSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = toIsoDate(d);
    return { value, label: i === 0 ? 'Today' : formatDate(value) };
  });
}

export default function BookingScreen({ route, navigation }) {
  const { service } = route.params; // passed from the details screen
  const days = nextSevenDays();
  const [date, setDate] = useState(days[0].value);
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({}); // { appointment_date, appointment_time }
  const [formError, setFormError] = useState('');
  const [booked, setBooked] = useState(null); // the created appointment → shows the confirmation
  const [busy, setBusy] = useState(false);
  const [reloadSlots, setReloadSlots] = useState(0); // change to fetch times again

  // Load free/taken times whenever the date changes (or after a failed booking).
  useEffect(() => {
    api(`/services/${service.id}/availability?date=${date}`)
      .then((res) => setSlots(res.slots))
      .catch((err) => setFormError(err.message));
  }, [service.id, date, reloadSlots]);

  function chooseDate(value) {
    setDate(value);
    setTime('');
    setErrors({});
  }

  async function handleBook() {
    setFormError('');
    if (!time) {
      setErrors({ appointment_time: 'Choose a time.' });
      return;
    }

    setBusy(true);
    try {
      const res = await api('/appointments', {
        method: 'POST',
        body: { service_id: service.id, appointment_date: date, appointment_time: time },
      });
      setBooked({ ...res.data, notificationSent: res.notification_sent });
    } catch (err) {
      if (err.status === 409) {
        setErrors({ appointment_time: 'This time was just booked by someone else. Choose another time.' });
        setTime('');
        setReloadSlots((n) => n + 1);
      } else if (err.status === 422) {
        setErrors(err.errors);
      } else {
        setFormError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function bookAnother() {
    setBooked(null);
    setTime('');
    setReloadSlots((n) => n + 1);
  }

  // ---------- Confirmation after booking ----------
  if (booked) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.panel}>
          <View style={local.bookedHead}>
            <View style={local.tick}>
              <Ionicons name="checkmark" size={22} color={colors.success} />
            </View>
            <Text style={[styles.subtitle, { marginBottom: 0 }]}>{"You're booked"}</Text>
          </View>
          <BookingReceipt booking={booked} service={service} emailSent={booked.notificationSent} />
          <Button title="View booking" onPress={() => navigation.navigate('BookingDetails', { id: booked.id })} />
          <Button title="Book another time" variant="secondary" onPress={bookAnother} />
        </View>
      </ScrollView>
    );
  }

  // ---------- Booking form ----------
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.subtitle}>{service.name}</Text>
      <Text style={[styles.muted, { marginBottom: 20 }]}>
        {service.duration_minutes} min, {formatPrice(service.price)}
      </Text>

      <Alert>{formError}</Alert>

      <Text style={styles.label}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, flexGrow: 0 }}>
        {days.map((d) => (
          <Chip key={d.value} label={d.label} selected={date === d.value} onPress={() => chooseDate(d.value)} />
        ))}
      </ScrollView>
      {errors.appointment_date ? <Text style={styles.fieldError}>{errors.appointment_date}</Text> : null}

      <Text style={styles.label}>Time</Text>
      <Text style={styles.hint}>Crossed-out times are already booked or have passed.</Text>
      <View style={local.slots}>
        {slots.map((slot) => (
          <Chip
            key={slot.time}
            label={slot.time}
            selected={time === slot.time}
            disabled={!slot.available}
            onPress={() => {
              setTime(slot.time);
              setErrors({});
            }}
          />
        ))}
      </View>
      {errors.appointment_time ? <Text style={styles.fieldError}>{errors.appointment_time}</Text> : null}

      <View style={{ marginTop: 16 }}>
        <Button
          title={busy ? 'Booking...' : time ? `Book ${time} on ${formatDate(date)}` : 'Book appointment'}
          onPress={handleBook}
          disabled={busy}
        />
      </View>
    </ScrollView>
  );
}

// A selectable pill for dates and times. Taken times are disabled and crossed out.
function Chip({ label, selected, disabled, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[local.chip, selected && local.chipSelected, disabled && local.chipDisabled]}
    >
      <Text style={[local.chipText, selected && { color: '#fff' }, disabled && local.chipTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  bookedHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  tick: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: colors.surface,
    minWidth: 72,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipDisabled: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  chipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.navy },
  chipTextDisabled: { color: '#a39d93', textDecorationLine: 'line-through' },
});
