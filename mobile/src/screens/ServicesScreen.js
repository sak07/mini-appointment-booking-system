import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Alert, colors, fonts, Loading, styles } from '../components/ui';
import { formatPrice } from '../format';

// Services as a price list (same as the web app): name + description, duration + price.
export default function ServicesScreen({ navigation }) {
  const [services, setServices] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reload, setReload] = useState(0); // change this number to load again

  useEffect(() => {
    api('/services')
      .then((res) => {
        setServices(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        setServices((current) => current ?? []);
      })
      .finally(() => setRefreshing(false));
  }, [reload]);

  function onRefresh() {
    setRefreshing(true);
    setReload((n) => n + 1);
  }

  if (!services) return <Loading />;

  return (
    <FlatList
      contentContainerStyle={styles.screen}
      data={services}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Book an appointment</Text>
          <Text style={styles.muted}>Choose a service, then pick a time that suits you.</Text>
          <View style={{ marginTop: 16 }}>
            <Alert>{error}</Alert>
          </View>
          <View style={local.topRule} />
        </View>
      }
      ListEmptyComponent={!error ? <Text style={styles.muted}>No services are available right now.</Text> : null}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [local.row, pressed && { backgroundColor: colors.navyTint }]}
          onPress={() => navigation.navigate('ServiceDetails', { id: item.id })}
        >
          <View style={local.rowTop}>
            <Text style={local.name}>{item.name}</Text>
            <Text style={local.price}>{formatPrice(item.price)}</Text>
          </View>
          <Text style={styles.muted} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>{item.duration_minutes} min</Text>
        </Pressable>
      )}
    />
  );
}

const local = StyleSheet.create({
  topRule: { borderBottomWidth: 2, borderBottomColor: colors.ink, marginTop: 4 },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 },
  name: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink, flexShrink: 1 },
  price: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
});
