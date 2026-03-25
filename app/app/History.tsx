/*import { Button } from '@react-navigation/elements';
import { Text, View } from 'react-native';

export function HistoryScreen() {
    return(
        <View>
            <View>
                <Text>PLACEHOLDER</Text>
            </View>
            <View>
                <Text>Test</Text>
            </View>
        </View>
    )
}
*/

// AI Assisted (Claude by Anthropic)
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getItem } from './SecureStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

type ClothingItem = {
  id: number;
  name: string;
  category: string;
  color_primary: string;
  photo_url?: string;
};

type OutfitEntry = {
  id: number;
  date_worn: string;           // ISO date string, e.g. "2025-03-24T14:00:00Z"
  weather_temperature?: number;
  weather_condition?: string;
  weather_city?: string;
  items: ClothingItem[];
  photo_url?: string;          // optional composite/primary outfit photo
};

// ─── Helper: format date ──────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Sub-component: Clothing Pill ─────────────────────────────────────────────

function ClothingPill({ item }: { item: ClothingItem }) {
  return (
    <View style={pillStyles.pill}>
      <View style={[pillStyles.colorDot, { backgroundColor: item.color_primary ?? '#ccc' }]} />
      <Text style={pillStyles.label} numberOfLines={1}>
        {item.name || item.category}
      </Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 12,
    color: '#444',
    maxWidth: 100,
  },
});

// ─── Sub-component: Detail Modal ──────────────────────────────────────────────

function OutfitDetailModal({
  entry,
  visible,
  onClose,
  onDelete,
  onRewear,
}: {
  entry: OutfitEntry | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onRewear: (entry: OutfitEntry) => Promise<void>;
}) {
  const [rewearing, setRewearing] = useState(false);

  if (!entry) return null;

  async function handleRewear() {
    setRewearing(true);
    await onRewear(entry!);
    setRewearing(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Outfit Details</Text>
          <Pressable onPress={onClose} style={modalStyles.closeButton}>
            <Text style={modalStyles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={modalStyles.body}>
          {/* Outfit Photo */}
          {entry.photo_url ? (
            <Image source={{ uri: entry.photo_url }} style={modalStyles.outfitPhoto} resizeMode="cover" />
          ) : (
            <View style={modalStyles.photoPlaceholder}>
              <Text style={modalStyles.photoPlaceholderIcon}>👔</Text>
              <Text style={modalStyles.photoPlaceholderText}>No photo</Text>
            </View>
          )}

          {/* Date */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionLabel}>Date Worn</Text>
            <Text style={modalStyles.sectionValue}>{formatDate(entry.date_worn)}</Text>
          </View>

          {/* Weather */}
          {(entry.weather_temperature !== undefined || entry.weather_condition) && (
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>Weather</Text>
              <Text style={modalStyles.sectionValue}>
                {entry.weather_city ? `${entry.weather_city} · ` : ''}
                {entry.weather_temperature !== undefined ? `${entry.weather_temperature}°F` : ''}
                {entry.weather_condition ? `, ${entry.weather_condition}` : ''}
              </Text>
            </View>
          )}

          {/* Clothing Items */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionLabel}>Items</Text>
            {entry.items.length > 0 ? (
              entry.items.map((item) => (
                <View key={item.id} style={modalStyles.itemRow}>
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={modalStyles.itemThumb} resizeMode="cover" />
                  ) : (
                    <View style={[modalStyles.itemThumb, modalStyles.itemThumbPlaceholder]}>
                      <Text style={{ fontSize: 18 }}>👚</Text>
                    </View>
                  )}
                  <View style={modalStyles.itemInfo}>
                    <Text style={modalStyles.itemName}>{item.name || item.category}</Text>
                    <Text style={modalStyles.itemMeta}>
                      {item.category} · {item.color_primary}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={modalStyles.sectionValue}>No items recorded</Text>
            )}
          </View>

          {/* Wear Again Button */}
          <Pressable
            style={[modalStyles.rewearButton, rewearing && modalStyles.rewearButtonDisabled]}
            onPress={handleRewear}
            disabled={rewearing}
          >
            {rewearing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={modalStyles.rewearButtonText}>👕  Wear Again Today</Text>
            )}
          </Pressable>

          {/* Delete Button */}
          <Pressable
            style={modalStyles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Entry',
                'Remove this outfit from your history?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      onDelete(entry.id);
                      onClose();
                    },
                  },
                ]
              );
            }}
          >
            <Text style={modalStyles.deleteButtonText}>Delete Entry</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: '#555' },
  body: { padding: 20, paddingBottom: 40 },
  outfitPhoto: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  photoPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { fontSize: 14, color: '#aaa' },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionValue: { fontSize: 15, color: '#333' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  itemThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  itemMeta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  deleteButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
    alignItems: 'center',
  },
  rewearButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4a7fcc',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  rewearButtonDisabled: {
    backgroundColor: '#a0b8e0',
  },
  rewearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: '#d9534f' },
});

// ─── Sub-component: History Card ──────────────────────────────────────────────

function HistoryCard({
  entry,
  onPress,
}: {
  entry: OutfitEntry;
  onPress: () => void;
}) {
  return (
    <Pressable style={cardStyles.card} onPress={onPress}>
      {/* Thumbnail */}
      {entry.photo_url ? (
        <Image source={{ uri: entry.photo_url }} style={cardStyles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[cardStyles.thumbnail, cardStyles.thumbnailPlaceholder]}>
          <Text style={{ fontSize: 28 }}>👔</Text>
        </View>
      )}

      {/* Content */}
      <View style={cardStyles.content}>
        <Text style={cardStyles.date}>{formatDate(entry.date_worn)}</Text>

        {/* Weather badge */}
        {(entry.weather_temperature !== undefined || entry.weather_condition) && (
          <View style={cardStyles.weatherBadge}>
            <Text style={cardStyles.weatherText}>
              🌡 {entry.weather_temperature !== undefined ? `${entry.weather_temperature}°F` : ''}
              {entry.weather_condition ? ` · ${entry.weather_condition}` : ''}
            </Text>
          </View>
        )}

        {/* Item pills */}
        {entry.items.length > 0 && (
          <View style={cardStyles.pills}>
            {entry.items.slice(0, 3).map((item) => (
              <ClothingPill key={item.id} item={item} />
            ))}
            {entry.items.length > 3 && (
              <Text style={cardStyles.moreItems}>+{entry.items.length - 3} more</Text>
            )}
          </View>
        )}
      </View>

      {/* Chevron */}
      <Text style={cardStyles.chevron}>›</Text>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#f0f0f0',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  date: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  weatherBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef4ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  weatherText: { fontSize: 12, color: '#4a7fcc' },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  moreItems: { fontSize: 12, color: '#888', alignSelf: 'center' },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 4 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const [history, setHistory] = useState<OutfitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<OutfitEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const token = await getItem('token');
      if (!token) {
        setError('You are not logged in.');
        return;
      }

      const response = await fetch(`${API_URL}/outfits/history`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not load history.');
        return;
      }

      setHistory(data.history ?? []);
    } catch (err) {
      console.error(err);
      setError('Network error. Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id: number) {
    try {
      const token = await getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/outfits/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setHistory((prev) => prev.filter((e) => e.id !== id));
      } else {
        Alert.alert('Error', 'Could not delete this entry.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Could not connect to server.');
    }
  }

  async function rewearEntry(entry: OutfitEntry) {
    try {
      const token = await getItem('token');
      if (!token) {
        Alert.alert('Error', 'You are not logged in.');
        return;
      }

      const response = await fetch(`${API_URL}/outfits/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_ids: entry.items.map((i) => i.id),
          date_worn: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.error || 'Could not log outfit.');
        return;
      }

      // Prepend the new entry to the top of the list
      const newEntry: OutfitEntry = {
        ...entry,
        id: data.id ?? Date.now(),
        date_worn: new Date().toISOString(),
      };
      setHistory((prev) => [newEntry, ...prev]);
      Alert.alert('Logged!', "Today's outfit has been added to your history.");
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Could not connect to server.');
    }
  }

  function openDetail(entry: OutfitEntry) {
    setSelectedEntry(entry);
    setModalVisible(true);
  }

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={screenStyles.centered}>
        <ActivityIndicator size="large" color="#4a7fcc" />
        <Text style={screenStyles.loadingText}>Loading your outfit history…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.errorIcon}>⚠️</Text>
        <Text style={screenStyles.errorText}>{error}</Text>
        <Pressable style={screenStyles.retryButton} onPress={() => { setError(''); setLoading(true); fetchHistory(); }}>
          <Text style={screenStyles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.emptyIcon}>🗂️</Text>
        <Text style={screenStyles.emptyTitle}>No outfit history yet</Text>
        <Text style={screenStyles.emptySubtitle}>
          Your worn outfits will appear here once you start using recommendations.
        </Text>
      </View>
    );
  }

  // ── Main list ────────────────────────────────────────────────────────────

  return (
    <View style={screenStyles.screen}>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <HistoryCard entry={item} onPress={() => openDetail(item)} />
        )}
        contentContainerStyle={screenStyles.listContent}
        ListHeaderComponent={
          <View style={screenStyles.listHeader}>
            <Text style={screenStyles.listHeaderTitle}>Outfit History</Text>
            <Text style={screenStyles.listHeaderSub}>{history.length} outfit{history.length !== 1 ? 's' : ''} logged</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <OutfitDetailModal
        entry={selectedEntry}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDelete={deleteEntry}
        onRewear={rewearEntry}
      />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  listContent: {
    paddingBottom: 32,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  listHeaderSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f7f8fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#d9534f', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#4a7fcc',
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});

export default HistoryScreen;