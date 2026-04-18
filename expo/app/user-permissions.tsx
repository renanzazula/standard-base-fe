import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/contexts/UserManagementContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/hooks/useTranslation';
import { PERMISSIONS, PERMISSION_LABELS } from '@/constants/permissions';
import type { Permission } from '@/constants/permissions';
import type { PermissionOverride } from '@/services/adminUsers';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, User as UserIcon, Info } from 'lucide-react-native';

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export default function UserPermissionsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const {
    getUserById,
    selectedUserPermissions,
    permissionsLoading,
    loadUserPermissions,
    saveUserPermissions,
    updateUser,
  } = useUserManagement();
  const { colors } = usePreferences();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const targetUser = getUserById(userId);
  const [pendingOverrides, setPendingOverrides] = useState<Map<Permission, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [editRole, setEditRole] = useState<'admin' | 'standard'>(targetUser?.role ?? 'standard');

  useEffect(() => {
    if (userId) loadUserPermissions(userId);
  }, [userId]);

  useEffect(() => {
    if (selectedUserPermissions) {
      const map = new Map<Permission, boolean>();
      for (const o of selectedUserPermissions.overrides) {
        map.set(o.permission as Permission, o.granted);
      }
      setPendingOverrides(map);
    }
  }, [selectedUserPermissions]);

  useEffect(() => {
    if (targetUser) setEditRole(targetUser.role);
  }, [targetUser]);

  const roleDefaults = useMemo(
    () => new Set(selectedUserPermissions?.roleDefaults ?? []),
    [selectedUserPermissions],
  );

  const getEffectiveState = (perm: Permission): boolean => {
    if (pendingOverrides.has(perm)) return pendingOverrides.get(perm)!;
    return roleDefaults.has(perm);
  };

  const getSource = (perm: Permission): 'role' | 'granted' | 'revoked' => {
    if (!pendingOverrides.has(perm)) return 'role';
    return pendingOverrides.get(perm) ? 'granted' : 'revoked';
  };

  const handleToggle = (perm: Permission, value: boolean) => {
    const isDefault = roleDefaults.has(perm);
    setPendingOverrides((prev) => {
      const next = new Map(prev);
      if (value === isDefault) {
        next.delete(perm);
      } else {
        next.set(perm, value);
      }
      return next;
    });
  };

  const handleRoleChange = (role: 'admin' | 'standard') => {
    if (role === editRole) return;
    Alert.alert(
      t('userPermissions.roleSection'),
      t('userPermissions.roleChangeWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await updateUser(userId, { role });
            setEditRole(role);
            setPendingOverrides(new Map());
            await loadUserPermissions(userId);
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const overrides: PermissionOverride[] = Array.from(pendingOverrides.entries()).map(
        ([permission, granted]) => ({ permission, granted }),
      );
      await saveUserPermissions(userId, overrides);
      Alert.alert(t('common.success'), t('userPermissions.saveSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('userPermissions.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { padding: 20, paddingTop: 20 + insets.top },
        header: { marginBottom: 24 },
        title: { fontSize: 28, fontWeight: '700' as const, color: colors.text, marginBottom: 4 },
        subtitle: { fontSize: 14, color: colors.textSecondary },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700' as const,
          color: colors.textSecondary,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          marginBottom: 12,
          marginTop: 24,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden' as const,
        },
        roleRow: {
          flexDirection: 'row' as const,
          gap: 10,
        },
        roleOption: {
          flex: 1,
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        roleOptionActive: {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        },
        roleOptionText: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
        permRow: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        permInfo: { flex: 1 },
        permLabel: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
        permSource: { fontSize: 12, marginTop: 2 },
        sourceRole: { color: colors.textSecondary },
        sourceGranted: { color: colors.success },
        sourceRevoked: { color: colors.error },
        saveButton: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          padding: 18,
          alignItems: 'center' as const,
          marginTop: 24,
          marginBottom: 24,
        },
        saveButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
        center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
        loadingText: { marginTop: 12, color: colors.textSecondary },
      }),
    [colors, insets.top],
  );

  if (!targetUser || targetUser.id === currentUser?.id) {
    router.back();
    return null;
  }

  if (permissionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('userPermissions.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('userPermissions.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{targetUser.username || targetUser.name}</Text>
            <Text style={styles.subtitle}>{targetUser.email}</Text>
          </View>

          {/* Role */}
          <Text style={styles.sectionTitle}>{t('userPermissions.roleSection')}</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleOption, editRole === 'standard' && styles.roleOptionActive]}
              onPress={() => handleRoleChange('standard')}
            >
              <UserIcon size={18} color={editRole === 'standard' ? colors.primary : colors.text} />
              <Text style={styles.roleOptionText}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, editRole === 'admin' && styles.roleOptionActive]}
              onPress={() => handleRoleChange('admin')}
            >
              <Shield size={18} color={editRole === 'admin' ? colors.primary : colors.text} />
              <Text style={styles.roleOptionText}>Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Functionalities */}
          <Text style={styles.sectionTitle}>{t('userPermissions.functionalitiesSection')}</Text>
          <View style={styles.card}>
            {ALL_PERMISSIONS.map((perm, index) => {
              const source = getSource(perm);
              const isOn = getEffectiveState(perm);
              const isLast = index === ALL_PERMISSIONS.length - 1;
              return (
                <View
                  key={perm}
                  style={[styles.permRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.permInfo}>
                    <Text style={styles.permLabel}>{PERMISSION_LABELS[perm]}</Text>
                    <Text
                      style={[
                        styles.permSource,
                        source === 'role' && styles.sourceRole,
                        source === 'granted' && styles.sourceGranted,
                        source === 'revoked' && styles.sourceRevoked,
                      ]}
                    >
                      {source === 'role'
                        ? t('userPermissions.sourceRoleDefault')
                        : source === 'granted'
                        ? t('userPermissions.sourceGranted')
                        : t('userPermissions.sourceRevoked')}
                    </Text>
                  </View>
                  <Switch
                    value={isOn}
                    onValueChange={(val) => handleToggle(perm, val)}
                    trackColor={{ false: colors.border, true: colors.primary + '80' }}
                    thumbColor={isOn ? colors.primary : colors.textSecondary}
                  />
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? t('common.loading') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
