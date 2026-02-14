import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useTickets } from '@/lib/ticket-context';

const presetWorkers = ['Rajesh Kumar', 'Suresh Babu', 'Manoj Singh', 'Anil Sharma', 'Vikram Reddy'];

export default function AssignWorkerScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assignWorker } = useTickets();
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [customWorker, setCustomWorker] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAssign = async () => {
    const worker = selectedWorker || customWorker.trim();
    if (!worker) {
      Alert.alert('Select Worker', 'Please select or enter a worker name.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await assignWorker(id!, worker);
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Worker Assigned', `${worker} has been assigned to this ticket.`, [
      { text: 'OK', onPress: () => { router.back(); router.back(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Assign Worker</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select a Worker</Text>

        {presetWorkers.map((worker) => (
          <Pressable
            key={worker}
            style={[styles.workerCard, selectedWorker === worker && styles.workerCardSelected]}
            onPress={() => { setSelectedWorker(worker); setCustomWorker(''); Haptics.selectionAsync(); }}
          >
            <View style={[styles.workerAvatar, selectedWorker === worker && styles.workerAvatarSelected]}>
              <Ionicons name="person" size={18} color={selectedWorker === worker ? '#fff' : Colors.primary} />
            </View>
            <Text style={[styles.workerText, selectedWorker === worker && styles.workerTextSelected]}>{worker}</Text>
            {selectedWorker === worker && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
          </Pressable>
        ))}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter worker name"
          placeholderTextColor={Colors.textTertiary}
          value={customWorker}
          onChangeText={(t) => { setCustomWorker(t); setSelectedWorker(null); }}
          autoCapitalize="words"
        />

        <Pressable
          style={({ pressed }) => [styles.assignBtn, pressed && styles.assignBtnPressed, submitting && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.assignBtnText}>Assign & Move to Pending</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  title: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 12 },
  workerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight,
  },
  workerCardSelected: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  workerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  workerAvatarSelected: { backgroundColor: Colors.primary },
  workerText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },
  workerTextSelected: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 15,
    fontFamily: 'Inter_400Regular', color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 20,
  },
  assignBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  assignBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
