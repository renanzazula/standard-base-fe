import {useUserManagement} from '@core/contexts/UserManagementContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useTranslation} from '@shared/hooks/useTranslation';
import type {Permission} from '@shared/constants/permissions';
import {PERMISSION_LABELS, PERMISSIONS} from '@shared/constants/permissions';
import {Stack, useLocalSearchParams} from 'expo-router';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Info} from 'lucide-react-native';

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export default function ProfilePermissionsScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { rolePermissions, rolePermissionsLoading, loadRolePermissions, saveRolePermissions } =
    useUserManagement();
  const { colors } = usePreferences();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [pendingPermissions, setPendingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRolePermissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = rolePermissions.find(
      (rp) => rp.role.toUpperCase() === role?.toUpperCase(),
    );
    if (current) {
      setPendingPermissions(new Set(current.permissions));
    }
  }, [rolePermissions, role]);

  const handleToggle = (perm: Permission, value: boolean) => {
    setPendingPermissions((prev) => {
      const next = new Set(prev);
      if (value) next.add(perm);
      else next.delete(perm);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRolePermissions(role.toUpperCase(), Array.from(pendingPermissions));
      Alert.alert(t('common.success'), t('profilePermissions.saveSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('profilePermissions.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { padding: 20, paddingTop: 20 + insets.top },
        infoBanner: {
          flexDirection: 'row' as const,
          alignItems: 'flex-start' as const,
          gap: 10,
          backgroundColor: colors.primary + '15',
          borderRadius: 12,
          padding: 14,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.primary + '30',
        },
        infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700' as const,
          color: colors.textSecondary,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          marginBottom: 12,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden' as const,
        },
        permRow: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        permLabel: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: colors.text },
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
      }),
    [colors, insets.top],
  );

  if (rolePermissionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('profilePermissions.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoBanner}>
            <Info size={16} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={styles.infoText}>{t('profilePermissions.inheritanceInfo')}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('profilePermissions.functionalitiesSection')}</Text>
          <View style={styles.card}>
            {ALL_PERMISSIONS.map((perm, index) => {
              const isOn = pendingPermissions.has(perm);
              const isLast = index === ALL_PERMISSIONS.length - 1;
              return (
                <View
                  key={perm}
                  style={[styles.permRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.permLabel}>{PERMISSION_LABELS[perm]}</Text>
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

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? t('common.loading') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
