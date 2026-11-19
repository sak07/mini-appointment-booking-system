import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Alert, Button, colors, fonts, Loading, styles } from '../components/ui';
import { formatPrice } from '../format';

export default function ServiceDetailsScreen({ route, navigation }) {
  const { id } = route.params; // passed from the services list
  const [service, setService] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/services/${id}`)
      .then((res) => setService(res.data))
      .catch((err) => setError(err.status === 404 ? "This service doesn't exist or is no longer offered." : err.message));
  }, [id]);

  if (error) {
    return (
      <View style={styles.screen}>
        <Alert>{error}</Alert>
      </View>
    );
  }
  if (!service) return <Loading />;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>{service.name}</Text>
      <Text style={styles.text}>{service.description}</Text>

      <View style={local.facts}>
        <View>
          <Text style={styles.muted}>Duration</Text>
          <Text style={local.factValue}>{service.duration_minutes} minutes</Text>
        </View>
        <View>
          <Text style={styles.muted}>Price</Text>
          <Text style={local.factValue}>{formatPrice(service.price)}</Text>
        </View>
      </View>

      <Button title="Choose a time" onPress={() => navigation.navigate('Booking', { service })} />
    </ScrollView>
  );
}

const local = StyleSheet.create({
  facts: { flexDirection: 'row', gap: 32, marginTop: 20, marginBottom: 12 },
  factValue: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink, marginTop: 2 },
});
