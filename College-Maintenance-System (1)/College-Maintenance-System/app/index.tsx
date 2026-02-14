import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth, UserRole } from '@/lib/auth-context';

type RoleOption = { key: UserRole; label: string; icon: string; iconSet: 'ion' | 'mci'; desc: string };

const roles: RoleOption[] = [
  { key: 'student', label: 'Student', icon: 'school-outline', iconSet: 'ion', desc: 'Registration No. + Name' },
  { key: 'staff', label: 'Staff', icon: 'briefcase-outline', iconSet: 'ion', desc: 'Staff ID + Name' },
  { key: 'admin', label: 'Maintenance Head', icon: 'shield-account-outline', iconSet: 'mci', desc: 'Name + Password' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [idField, setIdField] = useState('');
  const [nameField, setNameField] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const timer = setTimeout(() => {
        if (user.role === 'admin') router.replace('/admin-dashboard');
        else router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  if (isLoading || user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleLogin = async () => {
    setError('');
    if (!selectedRole) return;

    if (selectedRole === 'student') {
      if (!idField.trim() || !nameField.trim()) { setError('Please enter Registration Number and Name'); return; }
    } else if (selectedRole === 'staff') {
      if (!idField.trim() || !nameField.trim()) { setError('Please enter Staff ID and Name'); return; }
    } else {
      if (!nameField.trim() || !passwordField.trim()) { setError('Please enter Name and Password'); return; }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await login({ id: idField.trim() || nameField.trim(), name: nameField.trim(), role: selectedRole });
    setSubmitting(false);
  };

  const renderIcon = (role: RoleOption, color: string) => {
    if (role.iconSet === 'mci') return <MaterialCommunityIcons name={role.icon as any} size={28} color={color} />;
    return <Ionicons name={role.icon as any} size={28} color={color} />;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryLight, '#1E88C9']} style={[styles.headerGradient, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoCircle}>
            <Ionicons name="construct" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.appTitle}>CampusFix</Text>
          <Text style={styles.appSubtitle}>College Maintenance Management</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.formArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!selectedRole ? (
            <View style={styles.roleSection}>
              <Text style={styles.sectionTitle}>Select your role</Text>
              {roles.map((role) => (
                <Pressable
                  key={role.key}
                  style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
                  onPress={() => { setSelectedRole(role.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <View style={styles.roleIconWrap}>
                    {renderIcon(role, Colors.primary)}
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.loginForm}>
              <Pressable style={styles.backBtn} onPress={() => { setSelectedRole(null); setIdField(''); setNameField(''); setPasswordField(''); setError(''); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                <Text style={styles.backText}>Change role</Text>
              </Pressable>

              <Text style={styles.sectionTitle}>
                {selectedRole === 'student' ? 'Student Login' : selectedRole === 'staff' ? 'Staff Login' : 'Maintenance Head Login'}
              </Text>

              {selectedRole !== 'admin' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{selectedRole === 'student' ? 'Registration Number' : 'Staff ID'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={selectedRole === 'student' ? 'e.g. RA2011003010XXX' : 'e.g. STF-2024-001'}
                    placeholderTextColor={Colors.textTertiary}
                    value={idField}
                    onChangeText={setIdField}
                    autoCapitalize="characters"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textTertiary}
                  value={nameField}
                  onChangeText={setNameField}
                  autoCapitalize="words"
                />
              </View>

              {selectedRole === 'admin' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={Colors.textTertiary}
                    value={passwordField}
                    onChangeText={setPasswordField}
                    secureTextEntry
                  />
                </View>
              )}

              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed, submitting && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { alignItems: 'center', gap: 10 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  appTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff' },
  appSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },
  formArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  roleSection: { gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 4 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.borderLight,
  },
  roleCardPressed: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  roleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  loginForm: { gap: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.primary },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 15,
    fontFamily: 'Inter_400Regular', color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.dangerSoft, padding: 10, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.danger },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  loginBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
