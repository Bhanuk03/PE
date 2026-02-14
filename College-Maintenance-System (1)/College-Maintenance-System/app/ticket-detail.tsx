import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/lib/ticket-context';

export default function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tickets, updateTicketStatus } = useTickets();

  const ticket = tickets.find((t) => t.id === id);
  if (!ticket || !user) return null;

  const isAdmin = user.role === 'admin';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusConfig = {
    new: { label: 'New', color: Colors.accent, bg: Colors.accentSoft, icon: 'sparkles' },
    pending: { label: 'Pending', color: Colors.warning, bg: Colors.warningSoft, icon: 'time-outline' },
    closed: { label: 'Closed', color: Colors.success, bg: Colors.successSoft, icon: 'checkmark-circle' },
  };

  const sc = statusConfig[ticket.status];

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Ticket Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon as any} size={20} color={sc.color} />
          <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Issue Details</Text>
          <Text style={styles.descText}>{ticket.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location & Work</Text>
          <InfoRow label="Block" value={ticket.blockType === 'academic' ? `Academic - ${ticket.subBlock}` : 'Hostel'} icon="business-outline" />
          <InfoRow label="Work Type" value={ticket.workType.charAt(0).toUpperCase() + ticket.workType.slice(1)} icon="construct-outline" />
          <InfoRow label="Floor" value={ticket.floorNo} icon="layers-outline" />
          <InfoRow label="Wing" value={ticket.wing} icon="navigate-outline" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reported By</Text>
          <InfoRow label="Name" value={ticket.userName} icon="person-outline" />
          <InfoRow label={ticket.userRole === 'student' ? 'Reg. No.' : 'Staff ID'} value={ticket.userId} icon="card-outline" />
          <InfoRow label="Role" value={ticket.userRole.charAt(0).toUpperCase() + ticket.userRole.slice(1)} icon="shield-outline" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <InfoRow label="Created" value={formatDate(ticket.createdAt)} icon="calendar-outline" />
          <InfoRow label="Updated" value={formatDate(ticket.updatedAt)} icon="time-outline" />
        </View>

        {ticket.assignedWorker && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Worker</Text>
            <View style={styles.workerRow}>
              <View style={styles.workerAvatar}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.workerName}>{ticket.assignedWorker}</Text>
            </View>
          </View>
        )}

        {ticket.status === 'closed' && ticket.resolvedPhoto && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resolved Work Photo</Text>
            <Image source={{ uri: ticket.resolvedPhoto }} style={styles.resolvedPhoto} contentFit="cover" />
          </View>
        )}

        {ticket.status === 'closed' && ticket.review && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review / Remark</Text>
            <Text style={styles.reviewText}>{ticket.review}</Text>
          </View>
        )}

        {isAdmin && ticket.status === 'new' && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/assign-worker', params: { id: ticket.id } });
            }}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Assign Worker</Text>
          </Pressable>
        )}

        {isAdmin && ticket.status === 'pending' && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: Colors.success }, pressed && styles.actionBtnPressed]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await updateTicketStatus(ticket.id, 'closed');
              router.back();
            }}
          >
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Closed</Text>
          </Pressable>
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
  content: { padding: 16, paddingBottom: 60 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  statusLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary, marginBottom: 12 },
  descText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  workerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  resolvedPhoto: { width: '100%', height: 200, borderRadius: 10 },
  reviewText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 20 },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  actionBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  actionBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
