import {useAuth} from '@core/contexts/AuthContext';
import {ManagedUser, useUserManagement} from '@core/contexts/UserManagementContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {Stack, useFocusEffect, useRouter} from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
    Apple as AppleIcon,
    CheckCircle,
    ChevronRight,
    Chrome,
    Edit3,
    Filter,
    Key,
    Lock,
    Shield,
    Trash2,
    User as UserIcon,
    UserCheck,
    UserPlus,
    Users,
    UserX,
    XCircle,
} from 'lucide-react-native';

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, loadError, loadUsers, toggleUserStatus, deleteUser, updateUser, addUser } = useUserManagement();

  useFocusEffect(useCallback(() => {
    loadUsers();
  }, []));
  const { colors } = usePreferences();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'standard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'standard'>('standard');
  const [createEmail, setCreateEmail] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'STANDARD' | 'ADMIN'>('STANDARD');
  const [createLoading, setCreateLoading] = useState(false);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query),
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const disabledUsers = users.filter((u) => u.status === 'disabled').length;
    return { total: users.length, active: activeUsers, disabled: disabledUsers };
  }, [users]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { padding: 20, paddingTop: 20 + insets.top, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
        header: { marginBottom: 24 },
        title: { fontSize: 32, fontWeight: '700' as const, color: colors.text, marginBottom: 8 },
        subtitle: { fontSize: 16, color: colors.textSecondary },
        statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
        statCard: {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        statValue: { fontSize: 28, fontWeight: '700' as const, color: colors.primary, marginBottom: 4 },
        statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' as const },
        searchContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
        searchInput: {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        filterButton: {
          backgroundColor: colors.card,
          borderRadius: 12,
          width: 50,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        activeFiltersContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
        activeFilterChip: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary + '20',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          gap: 4,
        },
        activeFilterText: { fontSize: 12, fontWeight: '600' as const, color: colors.primary },
        userCard: {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        userAvatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        userInfo: { flex: 1 },
        userName: { fontSize: 16, fontWeight: '700' as const, color: colors.text, marginBottom: 2 },
        userEmail: { fontSize: 14, color: colors.textSecondary },
        statusBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        statusBadgeActive: { backgroundColor: '#10B981' + '20' },
        statusBadgeDisabled: { backgroundColor: colors.error + '20' },
        statusText: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const },
        statusTextActive: { color: '#10B981' },
        statusTextDisabled: { color: colors.error },
        userDetails: { gap: 8, marginBottom: 12 },
        userDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        userDetailLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
        userDetailValue: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
        roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.primary + '20' },
        roleBadgeText: { fontSize: 11, fontWeight: '700' as const, color: colors.primary, textTransform: 'uppercase' as const },
        userActions: {
          flexDirection: 'row',
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
        },
        actionButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: colors.surface,
          borderRadius: 10,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        actionButtonText: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
        deleteButton: { backgroundColor: colors.error + '10', borderColor: colors.error + '20' },
        deleteButtonText: { color: colors.error },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        modalContent: {
          backgroundColor: colors.card,
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: colors.border,
        },
        modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
        modalTitle: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
        modalBody: { padding: 20 },
        filterSection: { marginBottom: 20 },
        filterLabel: { fontSize: 14, fontWeight: '600' as const, color: colors.text, marginBottom: 12 },
        filterOptions: { gap: 8 },
        filterOption: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        filterOptionActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
        filterOptionText: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
        modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
        modalCloseButton: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' },
        modalCloseButtonText: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
        formField: { marginBottom: 16 },
        formLabel: { fontSize: 14, fontWeight: '600' as const, color: colors.text, marginBottom: 8 },
        formInput: {
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 14,
          fontSize: 15,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        modalActionButtons: { flexDirection: 'row', gap: 12 },
        modalActionButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
        modalActionButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
        emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
        emptyIcon: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginBottom: 8 },
        emptyDescription: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700' as const,
          color: colors.textSecondary,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          marginBottom: 12,
          marginTop: 4,
        },
        profileDefaultsCard: {
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden' as const,
          marginBottom: 24,
        },
        profileRow: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        profileIconWrap: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
        },
        profileRowInfo: { flex: 1 },
        profileRowTitle: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
        profileRowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
        accessDeniedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
        accessDeniedIcon: {
          width: 100,
          height: 100,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        },
        accessDeniedTitle: { fontSize: 24, fontWeight: '700' as const, marginBottom: 12, textAlign: 'center' },
        accessDeniedText: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
        backButton: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 },
        backButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
      }),
    [colors, insets.top],
  );

  if (!hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS)) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <View style={[styles.accessDeniedIcon, { backgroundColor: colors.error + '20' }]}>
            <Shield size={48} color={colors.error} />
          </View>
          <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>
            {t('userManagement.accessDenied')}
          </Text>
          <Text style={[styles.accessDeniedText, { color: colors.textSecondary }]}>
            {t('userManagement.adminOnly')}
          </Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleToggleStatus = (user: ManagedUser) => {
    const isDisabling = user.status === 'active';
    Alert.alert(
      isDisabling ? t('userManagement.disableUser') : t('userManagement.enableUser'),
      isDisabling ? t('userManagement.disableConfirm') : t('userManagement.enableConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await toggleUserStatus(user.id);
            Alert.alert(t('common.success'), isDisabling ? t('userManagement.userDisabled') : t('userManagement.userEnabled'));
          },
        },
      ],
    );
  };

  const handleDeleteUser = (user: ManagedUser) => {
    if (user.id === currentUser.id) {
      Alert.alert(t('common.error'), 'You cannot delete your own account');
      return;
    }

    Alert.alert(t('userManagement.deleteUser'), t('userManagement.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteUser(user.id);
          Alert.alert(t('common.success'), t('userManagement.userDeleted'));
        },
      },
    ]);
  };

  const handleEditUser = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditUsername(user.username || '');
    setEditRole(user.role);
    setEditModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (!editName.trim()) {
      Alert.alert(t('common.error'), 'Name is required');
      return;
    }

    await updateUser(selectedUser.id, {
      name: editName.trim(),
      username: editUsername.trim() || undefined,
      role: editRole,
    });

    setEditModalVisible(false);
    Alert.alert(t('common.success'), t('userManagement.userUpdated'));
  };

  const handleCreateUser = async () => {
    if (!createEmail.trim() || !createDisplayName.trim() || !createPassword) {
      Alert.alert(t('common.error'), 'All fields are required');
      return;
    }
    if (createPassword.length < 8) {
      Alert.alert(t('common.error'), 'Password must be at least 8 characters');
      return;
    }
    setCreateLoading(true);
    try {
      await addUser({ email: createEmail.trim(), displayName: createDisplayName.trim(), temporaryPassword: createPassword, role: createRole });
      setCreateModalVisible(false);
      setCreateEmail('');
      setCreateDisplayName('');
      setCreatePassword('');
      setCreateRole('STANDARD');
      Alert.alert(t('common.success'), 'User created successfully');
    } catch {
      Alert.alert(t('common.error'), 'Failed to create user. The email may already be in use.');
    } finally {
      setCreateLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Chrome size={14} color={colors.textSecondary} />;
      case 'apple':
        return <AppleIcon size={14} color={colors.textSecondary} />;
      case 'manual':
        return <Lock size={14} color={colors.textSecondary} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('userManagement.never');
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('userManagement.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('userManagement.title')}</Text>
            <Text style={styles.subtitle}>{t('userManagement.subtitle')}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('userManagement.totalUsers')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>{t('userManagement.activeUsers')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.disabled}</Text>
              <Text style={styles.statLabel}>{t('userManagement.disabledUsers')}</Text>
            </View>
          </View>

          {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE) && (
            <>
              <Text style={styles.sectionTitle}>{t('userManagement.profileDefaults')}</Text>
              <View style={styles.profileDefaultsCard}>
                <TouchableOpacity
                  style={styles.profileRow}
                  onPress={() => router.push('/profile-permissions?role=STANDARD')}
                >
                  <View style={styles.profileIconWrap}>
                    <UserIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.profileRowInfo}>
                    <Text style={styles.profileRowTitle}>{t('userManagement.standard')}</Text>
                    <Text style={styles.profileRowSubtitle}>{t('userManagement.profileDefaultsSubtitle')}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileRow, { borderBottomWidth: 0 }]}
                  onPress={() => router.push('/profile-permissions?role=ADMIN')}
                >
                  <View style={styles.profileIconWrap}>
                    <Shield size={18} color={colors.primary} />
                  </View>
                  <View style={styles.profileRowInfo}>
                    <Text style={styles.profileRowTitle}>{t('userManagement.admin')}</Text>
                    <Text style={styles.profileRowSubtitle}>{t('userManagement.profileDefaultsSubtitle')}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.searchContainer}>
            <View style={{ flex: 1, position: 'relative' }}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('userManagement.searchUsers')}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Filter size={20} color={hasActiveFilters ? '#FFFFFF' : colors.text} />
            </TouchableOpacity>
            {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE) && (
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setCreateModalVisible(true)}
              >
                <UserPlus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              {roleFilter !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {roleFilter === 'admin' ? t('userManagement.admin') : t('userManagement.standard')}
                  </Text>
                </View>
              )}
              {statusFilter !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {statusFilter === 'active' ? t('userManagement.active') : t('userManagement.disabled')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyDescription, { marginTop: 16 }]}>Loading users...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.error + '20' }]}>
                <Users size={40} color={colors.error} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.error }]}>Backend unreachable</Text>
              <Text style={styles.emptyDescription}>{loadError}</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Users size={40} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>{t('userManagement.noUsers')}</Text>
              <Text style={styles.emptyDescription}>{t('userManagement.noUsersDescription')}</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                    {user.role === 'admin' ? (
                      <Shield size={24} color={colors.primary} />
                    ) : (
                      <UserIcon size={24} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.username || user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      user.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeDisabled,
                    ]}
                  >
                    {user.status === 'active' ? (
                      <CheckCircle size={12} color="#10B981" />
                    ) : (
                      <XCircle size={12} color={colors.error} />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        user.status === 'active' ? styles.statusTextActive : styles.statusTextDisabled,
                      ]}
                    >
                      {user.status === 'active' ? t('userManagement.active') : t('userManagement.disabled')}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>{t('home.role')}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {user.role === 'admin' ? t('userManagement.admin') : t('userManagement.standard')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>{t('home.provider')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {getProviderIcon(user.provider)}
                      <Text style={styles.userDetailValue}>{user.provider}</Text>
                    </View>
                  </View>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>{t('userManagement.createdAt')}</Text>
                    <Text style={styles.userDetailValue}>{formatDate(user.createdAt)}</Text>
                  </View>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>{t('userManagement.lastLogin')}</Text>
                    <Text style={styles.userDetailValue}>{formatDate(user.lastLogin)}</Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE) && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEditUser(user)}>
                      <Edit3 size={16} color={colors.text} />
                      <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                  )}
                  {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE) &&
                    user.id !== currentUser.id && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/user-permissions?userId=${user.id}`)}
                      >
                        <Key size={16} color={colors.text} />
                        <Text style={styles.actionButtonText}>{t('userManagement.managePermissions')}</Text>
                      </TouchableOpacity>
                    )}
                  {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE) && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleToggleStatus(user)}
                      disabled={user.id === currentUser.id}
                    >
                      {user.status === 'active' ? (
                        <>
                          <UserX size={16} color={colors.text} />
                          <Text style={styles.actionButtonText}>{t('userManagement.disable')}</Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} color={colors.text} />
                          <Text style={styles.actionButtonText}>{t('userManagement.enable')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {hasPermission(PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_DELETE) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 size={16} color={colors.error} />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('userManagement.filterByRole')}</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{t('userManagement.filterByRole')}</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, roleFilter === 'all' && styles.filterOptionActive]}
                    onPress={() => setRoleFilter('all')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.allRoles')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, roleFilter === 'admin' && styles.filterOptionActive]}
                    onPress={() => setRoleFilter('admin')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.admin')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, roleFilter === 'standard' && styles.filterOptionActive]}
                    onPress={() => setRoleFilter('standard')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.standard')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{t('userManagement.filterByStatus')}</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, statusFilter === 'all' && styles.filterOptionActive]}
                    onPress={() => setStatusFilter('all')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.allStatuses')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, statusFilter === 'active' && styles.filterOptionActive]}
                    onPress={() => setStatusFilter('active')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.active')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, statusFilter === 'disabled' && styles.filterOptionActive]}
                    onPress={() => setStatusFilter('disabled')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.disabled')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCreateModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create User</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={createEmail}
                  onChangeText={setCreateEmail}
                  placeholder="user@example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Display Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={createDisplayName}
                  onChangeText={setCreateDisplayName}
                  placeholder="Full name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Temporary Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={createPassword}
                  onChangeText={setCreatePassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Role</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, createRole === 'STANDARD' && styles.filterOptionActive]}
                    onPress={() => setCreateRole('STANDARD')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.standard')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, createRole === 'ADMIN' && styles.filterOptionActive]}
                    onPress={() => setCreateRole('ADMIN')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.admin')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setCreateModalVisible(false)} disabled={createLoading}>
                  <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalActionButton, createLoading && { opacity: 0.6 }]} onPress={handleCreateUser} disabled={createLoading}>
                  <Text style={styles.modalActionButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('userManagement.editUserInfo')}</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('userManagement.name')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('userManagement.enterName')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('settings.username')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder={t('settings.enterUsername')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('userManagement.changeRole')}</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, editRole === 'standard' && styles.filterOptionActive]}
                    onPress={() => setEditRole('standard')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.standard')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, editRole === 'admin' && styles.filterOptionActive]}
                    onPress={() => setEditRole('admin')}
                  >
                    <Text style={styles.filterOptionText}>{t('userManagement.admin')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionButton} onPress={handleSaveUser}>
                  <Text style={styles.modalActionButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
