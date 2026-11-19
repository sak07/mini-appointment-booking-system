// A booking as a small receipt + whether the confirmation email was sent (same as the web app).
// Used right after booking (BookingScreen) and on the booking details screen (BookingDetailsScreen).
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { formatDate, formatPrice } from '../format';
import { colors, fonts } from './ui';

export default function BookingReceipt({ booking, service, emailSent }) {
  const rows = [
    ['Service', service.name],
    ['Date', formatDate(booking.appointment_date)],
    ['Time', booking.appointment_time],
    ['Duration', `${service.duration_minutes} min`],
    ['Price', `${formatPrice(service.price)}, pay at the studio`],
    ['Reference', `#${booking.id}`],
  ];

  return (
    <View>
      <View style={local.receipt}>
        {rows.map(([label, value]) => (
          <View key={label} style={local.row}>
            <Text style={local.label}>{label}</Text>
            <Text style={local.value}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Green when the notification service sent the email, amber when it couldn't */}
      {emailSent ? (
        <View style={[local.email, local.sent]}>
          <Ionicons name="mail-outline" size={20} color={colors.success} />
          <Text style={[local.emailText, { color: colors.success }]}>
            Confirmation email sent to <Text style={local.bold}>{booking.user?.email}</Text>.
          </Text>
        </View>
      ) : (
        <View style={[local.email, local.notSent]}>
          <Ionicons name="warning-outline" size={20} color="#7a4d00" />
          <Text style={[local.emailText, { color: '#7a4d00' }]}>
            <Text style={local.bold}>Confirmation email not sent.</Text> Your booking is saved. Note your reference #
            {booking.id}.
          </Text>
        </View>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  receipt: { borderTopWidth: 1, borderTopColor: colors.line, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  value: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  email: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, borderWidth: 1 },
  sent: { backgroundColor: colors.successBg, borderColor: '#bbe5c8' },
  notSent: { backgroundColor: '#fdf3dc', borderColor: '#f1d9a6' },
  emailText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, flex: 1 },
  bold: { fontFamily: fonts.semibold },
});
