import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useTickets, TicketStatus, Ticket } from '@/lib/ticket-context';

const tabs: { key: TicketStatus; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'new', label: 'New', icon: 'sparkles', color: Colors.accent, bg: Colors.accentSoft },
  { key: 'pending', label: 'Pending', icon: 'time-outline', color: Colors.warning, bg: Colors.warningSoft },
  { key: 'closed', label: 'Closed', icon: 'checkmark-circle-outline', color: Colors.success, bg: Colors.successSoft },
];

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { tickets, getTicketsByStatus, refreshTickets } = useTickets();
  const [activeTab, setActiveTab] = useState<TicketStatus>('new');
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  const filteredTickets = getTicketsByStatus(activeTab);
  const newCount = getTicketsByStatus('new').length;
  const pendingCount = getTicketsByStatus('pending').length;
  const closedCount = getTicketsByStatus('closed').length;

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTickets();
    setRefreshing(false);
  };

  const getCount = (status: TicketStatus) => {
    if (status === 'new') return newCount;
    if (status === 'pending') return pendingCount;
    return closedCount;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTicket = (ticket: Ticket) => (
    <Pressable
      key={ticket.id}
      style={({ pressed }) => [styles.ticketCard, pressed && styles.ticketCardPressed]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: '/ticket-detail', params: { id: ticket.id } });
      }}
    >
      <View style={styles.ticketRow}>
        <View style={[styles.workIcon, { backgroundColor: ticket.workType === 'electrical' ? Colors.warningSoft : ticket.workType === 'plumbing' ? Colors.accentSoft : Colors.successSoft }]}>
          <Ionicons
            name={ticket.workType === 'electrical' ? 'flash' : ticket.workType === 'plumbing' ? 'water' : 'hammer'}
            size={20}
            color={ticket.workType === 'electrical' ? Colors.warning : ticket.workType === 'plumbing' ? Colors.accent : Colors.success}
          />
        </View>
        <View style={styles.ticketContent}>
          <Text style={styles.ticketDesc} numberOfLines={1}>{ticket.description}</Text>
          <Text style={styles.ticketMeta}>
            {ticket.userName} ({ticket.userRole}) | {ticket.blockType === 'academic' ? ticket.subBlock : 'Hostel'}
          </Text>
          <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.ticketActions}>
        {ticket.assignedWorker && (
          <View style={styles.workerBadge}>
            <Ionicons name="person" size={12} color={Colors.primary} />
            <Text style={styles.workerName}>{ticket.assignedWorker}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="shield-account" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.greeting}>Maintenance Head</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{tickets.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: '#7DD3FC' }]}>{newCount}</Text>
            <Text style={styles.summaryLabel}>New</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: '#FCD34D' }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: '#6EE7B7' }]}>{closedCount}</Text>
            <Text style={styles.summaryLabel}>Closed</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => { setActiveTab(tab.key); Haptics.selectionAsync(); }}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? Colors.primary : Colors.borderLight }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? '#fff' : Colors.textSecondary }]}>
                {getCount(tab.key)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No {activeTab} tickets</Text>
            <Text style={styles.emptyDesc}>Tickets with {activeTab} status will appear here.</Text>
          </View>
        ) : (
          filteredTickets.map(renderTicket)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  tabActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },
  tabBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16, paddingBottom: 40 },
  ticketCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  ticketCardPressed: { backgroundColor: Colors.accentSoft },
  ticketRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  workIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ticketContent: { flex: 1 },
  ticketDesc: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  ticketMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 3 },
  ticketDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
  ticketActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
  workerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.overlay, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  workerName: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center' },
});
