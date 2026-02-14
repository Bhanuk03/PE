import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useTickets, Ticket } from '@/lib/ticket-context';

export default function CloseTicketScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getTicketsByUser, closeTicket } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const activeTickets = getTicketsByUser(user.id).filter((t) => t.status !== 'closed');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setError('');
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    if (!photo) { setError('Please upload a photo of the resolved work'); return; }
    if (!review.trim()) { setError('Please write a review or remark'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await closeTicket(selectedTicket.id, photo, review.trim());
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Ticket Closed', 'The ticket has been marked as closed successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Close a Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!selectedTicket ? (
          <>
            <Text style={styles.sectionLabel}>Select an active ticket to close</Text>
            {activeTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No Active Tickets</Text>
                <Text style={styles.emptyDesc}>You don't have any active tickets to close.</Text>
              </View>
            ) : (
              activeTickets.map((ticket) => (
                <Pressable
                  key={ticket.id}
                  style={({ pressed }) => [styles.ticketCard, pressed && styles.ticketCardPressed]}
                  onPress={() => { setSelectedTicket(ticket); Haptics.selectionAsync(); }}
                >
                  <View style={styles.ticketLeft}>
                    <View style={[styles.workIcon, { backgroundColor: ticket.workType === 'electrical' ? Colors.warningSoft : ticket.workType === 'plumbing' ? Colors.accentSoft : Colors.successSoft }]}>
                      <Ionicons
                        name={ticket.workType === 'electrical' ? 'flash' : ticket.workType === 'plumbing' ? 'water' : 'hammer'}
                        size={20}
                        color={ticket.workType === 'electrical' ? Colors.warning : ticket.workType === 'plumbing' ? Colors.accent : Colors.success}
                      />
                    </View>
                    <View style={styles.ticketTextWrap}>
                      <Text style={styles.ticketDesc} numberOfLines={1}>{ticket.description}</Text>
                      <Text style={styles.ticketMeta}>
                        {ticket.blockType === 'academic' ? ticket.subBlock : 'Hostel'} | Floor {ticket.floorNo} | Wing {ticket.wing}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedTitle}>Closing Ticket</Text>
                <Pressable onPress={() => { setSelectedTicket(null); setPhoto(null); setReview(''); setError(''); }}>
                  <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
                </Pressable>
              </View>
              <Text style={styles.selectedDesc}>{selectedTicket.description}</Text>
              <Text style={styles.selectedMeta}>
                {selectedTicket.workType.charAt(0).toUpperCase() + selectedTicket.workType.slice(1)} | {selectedTicket.blockType === 'academic' ? selectedTicket.subBlock : 'Hostel'} | Floor {selectedTicket.floorNo}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Upload Resolved Work Photo *</Text>
              <Pressable style={styles.uploadArea} onPress={pickImage}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.uploadedImage} contentFit="cover" />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={36} color={Colors.textTertiary} />
                    <Text style={styles.uploadText}>Tap to upload photo</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Review / Remark *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your review about the resolved work..."
                placeholderTextColor={Colors.textTertiary}
                value={review}
                onChangeText={(t) => { setReview(t); setError(''); }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, submitting && styles.submitBtnDisabled]}
              onPress={handleClose}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Close Ticket</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  title: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderLight,
  },
  ticketCardPressed: { backgroundColor: Colors.accentSoft },
  ticketLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  workIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ticketTextWrap: { flex: 1 },
  ticketDesc: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  ticketMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  selectedCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.borderLight },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectedTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  selectedDesc: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },
  selectedMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 18 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 8 },
  uploadArea: { borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: Colors.borderLight, borderStyle: 'dashed', minHeight: 160 },
  uploadPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  uploadText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  uploadedImage: { width: '100%', height: 200 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 15,
    fontFamily: 'Inter_400Regular', color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight,
  },
  textArea: { minHeight: 100 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.dangerSoft, padding: 10, borderRadius: 10, marginBottom: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.danger },
  submitBtn: {
    backgroundColor: Colors.success, borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
