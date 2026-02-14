import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/lib/ticket-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { getTicketsByUser } = useTickets();

  if (!user) return null;

  const userTickets = getTicketsByUser(user.id);
  const activeTickets = userTickets.filter((t) => t.status !== 'closed');
  const closedTickets = userTickets.filter((t) => t.status === 'closed');

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name={user.role === 'student' ? 'school' : 'briefcase'} size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userTickets.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>{activeTickets.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{closedTickets.length}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/raise-ticket'); }}
        >
          <LinearGradient colors={[Colors.accent, '#2BA8E8']} style={styles.actionIconWrap}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={28} color="#fff" />
          </LinearGradient>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Raise a Ticket</Text>
            <Text style={styles.actionDesc}>Report a maintenance issue in your block or hostel</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/close-ticket'); }}
        >
          <LinearGradient colors={[Colors.success, '#059669']} style={styles.actionIconWrap}>
            <Ionicons name="checkmark-done" size={28} color="#fff" />
          </LinearGradient>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Close a Ticket</Text>
            <Text style={styles.actionDesc}>Mark a resolved issue with photo proof and review</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </Pressable>

        {activeTickets.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Active Tickets</Text>
            {activeTickets.slice(0, 3).map((ticket) => (
              <Pressable
                key={ticket.id}
                style={({ pressed }) => [styles.ticketCard, pressed && styles.actionCardPressed]}
                onPress={() => router.push({ pathname: '/ticket-detail', params: { id: ticket.id } })}
              >
                <View style={[styles.statusDot, { backgroundColor: ticket.status === 'new' ? Colors.accent : Colors.warning }]} />
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.description}</Text>
                  <Text style={styles.ticketMeta}>
                    {ticket.workType.charAt(0).toUpperCase() + ticket.workType.slice(1)} | {ticket.blockType === 'academic' ? ticket.subBlock : 'Hostel'} | Floor {ticket.floorNo}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'new' ? Colors.accentSoft : Colors.warningSoft }]}>
                  <Text style={[styles.statusText, { color: ticket.status === 'new' ? Colors.primaryLight : Colors.warning }]}>
                    {ticket.status === 'new' ? 'New' : 'Pending'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, alignItems: 'center' },
  statNumber: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 12 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, gap: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight,
  },
  actionCardPressed: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  actionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  actionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, gap: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  ticketMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
