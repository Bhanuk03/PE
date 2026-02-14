import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useTickets, BlockType, SubBlock, WorkType } from '@/lib/ticket-context';

const blockOptions: { key: BlockType; label: string }[] = [
  { key: 'academic', label: 'Academic Block' },
  { key: 'hostel', label: 'Hostel' },
];
const subBlockOptions: { key: SubBlock; label: string }[] = [
  { key: 'AB1', label: 'AB1' },
  { key: 'AB2', label: 'AB2' },
];
const workTypes: { key: WorkType; label: string; icon: string }[] = [
  { key: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { key: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { key: 'carpentry', label: 'Carpentry', icon: 'hammer-outline' },
];

export default function RaiseTicketScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addTicket } = useTickets();
  const [blockType, setBlockType] = useState<BlockType | null>(null);
  const [subBlock, setSubBlock] = useState<SubBlock | null>(null);
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [description, setDescription] = useState('');
  const [floorNo, setFloorNo] = useState('');
  const [wing, setWing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!blockType) e.blockType = 'Select a block type';
    if (blockType === 'academic' && !subBlock) e.subBlock = 'Select a sub-block';
    if (!workType) e.workType = 'Select work type';
    if (!description.trim()) e.description = 'Describe the issue';
    if (!floorNo.trim()) e.floorNo = 'Enter floor number';
    if (!wing.trim()) e.wing = 'Enter wing';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await addTicket({
      userId: user.id,
      userName: user.name,
      userRole: user.role as 'student' | 'staff',
      blockType: blockType!,
      subBlock: blockType === 'academic' ? subBlock! : undefined,
      workType: workType!,
      description: description.trim(),
      floorNo: floorNo.trim(),
      wing: wing.trim(),
    });
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Ticket Raised', 'Your maintenance ticket has been submitted successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const ChipSelect = ({ options, value, onChange, error }: { options: { key: string; label: string; icon?: string }[]; value: string | null; onChange: (v: any) => void; error?: string }) => (
    <View>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, value === opt.key && styles.chipSelected]}
            onPress={() => { onChange(opt.key); Haptics.selectionAsync(); }}
          >
            {opt.icon && <Ionicons name={opt.icon as any} size={16} color={value === opt.key ? '#fff' : Colors.text} />}
            <Text style={[styles.chipText, value === opt.key && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Raise a Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.idRow}>
          <View style={styles.idField}>
            <Text style={styles.idLabel}>{user.role === 'student' ? 'Reg. No.' : 'Staff ID'}</Text>
            <Text style={styles.idValue}>{user.id}</Text>
          </View>
          <View style={styles.idField}>
            <Text style={styles.idLabel}>Name</Text>
            <Text style={styles.idValue}>{user.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Block Type</Text>
          <ChipSelect options={blockOptions} value={blockType} onChange={(v: BlockType) => { setBlockType(v); setSubBlock(null); }} error={errors.blockType} />
        </View>

        {blockType === 'academic' && (
          <View style={styles.section}>
            <Text style={styles.label}>Academic Block</Text>
            <ChipSelect options={subBlockOptions} value={subBlock} onChange={setSubBlock} error={errors.subBlock} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Type of Work</Text>
          <ChipSelect options={workTypes} value={workType} onChange={setWorkType} error={errors.workType} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Work Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, !!errors.description && styles.inputError]}
            placeholder="Describe the maintenance issue..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: '' })); }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {!!errors.description && <Text style={styles.fieldError}>{errors.description}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Floor No.</Text>
            <TextInput
              style={[styles.input, !!errors.floorNo && styles.inputError]}
              placeholder="e.g. 2"
              placeholderTextColor={Colors.textTertiary}
              value={floorNo}
              onChangeText={(t) => { setFloorNo(t); setErrors((e) => ({ ...e, floorNo: '' })); }}
              keyboardType="number-pad"
            />
            {!!errors.floorNo && <Text style={styles.fieldError}>{errors.floorNo}</Text>}
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Wing</Text>
            <TextInput
              style={[styles.input, !!errors.wing && styles.inputError]}
              placeholder="e.g. A"
              placeholderTextColor={Colors.textTertiary}
              value={wing}
              onChangeText={(t) => { setWing(t); setErrors((e) => ({ ...e, wing: '' })); }}
              autoCapitalize="characters"
            />
            {!!errors.wing && <Text style={styles.fieldError}>{errors.wing}</Text>}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Ticket</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  title: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  form: { padding: 20, paddingBottom: 60 },
  idRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  idField: { flex: 1, backgroundColor: Colors.overlay, borderRadius: 12, padding: 12 },
  idLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  idValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: 2 },
  section: { marginBottom: 18 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  chipTextSelected: { color: '#fff' },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 15,
    fontFamily: 'Inter_400Regular', color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight,
  },
  inputError: { borderColor: Colors.danger },
  textArea: { minHeight: 100 },
  row: { flexDirection: 'row', gap: 12 },
  fieldError: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.danger, marginTop: 4 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
  },
  submitBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
