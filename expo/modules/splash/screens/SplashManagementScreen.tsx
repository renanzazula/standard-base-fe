import {usePreferences} from '@core/contexts/PreferencesContext';
import type {SplashScreenConfig, SplashStatus} from '@core/services/splash';
import {deleteSplashScreen, duplicateSplashScreen, listSplashScreens, updateSplashScreen,} from '@core/services/splash';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {useTranslation} from '@shared/hooks/useTranslation';
import {showAlert} from '@shared/utils/alert';
import {useRouter} from 'expo-router';
import {Copy, Eye, Monitor, Pencil, Plus, Power, Smartphone, Trash2} from 'lucide-react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import SplashOverlay from '../components/SplashOverlay';
import {toWriteInput} from '../splashForm';

const STATUS_FILTERS: Array<SplashStatus | null> = [null, 'active', 'scheduled', 'draft', 'expired', 'default'];

function formatWindow(splash: SplashScreenConfig): string {
  const fmt = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
  };
  if (splash.isDefault) return '—';
  return `${fmt(splash.publishStart)} → ${fmt(splash.publishEnd)}`;
}

export default function SplashManagementScreen() {
  const {colors} = usePreferences();
  const {t} = useTranslation();
  const router = useRouter();

  const [items, setItems] = useState<SplashScreenConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SplashStatus | null>(null);
  const [preview, setPreview] = useState<SplashScreenConfig | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listSplashScreens();
      setItems(data.splashScreens);
    } catch {
      showAlert(t('common.error'), t('splash.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      items
        .filter((s) => !statusFilter || s.status === statusFilter)
        .filter((s) => !search.trim() || s.title.toLowerCase().includes(search.trim().toLowerCase())),
    [items, statusFilter, search],
  );

  const statusLabel = (status?: SplashStatus): string => {
    switch (status) {
      case 'active': return t('splash.statusActive');
      case 'scheduled': return t('splash.statusScheduled');
      case 'expired': return t('splash.statusExpired');
      case 'default': return t('splash.statusDefault');
      default: return t('splash.statusDraft');
    }
  };

  const statusColor = (status?: SplashStatus): string => {
    switch (status) {
      case 'active': return '#2E9E5B';
      case 'scheduled': return '#3478F6';
      case 'expired': return colors.textSecondary;
      case 'default': return '#F2A900';
      default: return colors.textSecondary;
    }
  };

  const handleToggleEnabled = async (splash: SplashScreenConfig) => {
    try {
      await updateSplashScreen(splash.id, {...toWriteInput(splash), enabled: !splash.enabled});
      await load();
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : t('splash.actionFailed'));
    }
  };

  const handleDuplicate = async (splash: SplashScreenConfig) => {
    try {
      await duplicateSplashScreen(splash.id);
      await load();
      showAlert(t('common.success'), t('splash.duplicated'));
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : t('splash.actionFailed'));
    }
  };

  const handleDelete = (splash: SplashScreenConfig) => {
    showAlert(t('splash.deleteSplash'), t('splash.deleteConfirm'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSplashScreen(splash.id);
            await load();
            showAlert(t('common.success'), t('splash.deleted'));
          } catch (error) {
            showAlert(t('common.error'), error instanceof Error ? error.message : t('splash.actionFailed'));
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <TextInput
          style={[styles.search, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
          placeholder={t('splash.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => {
            const selected = statusFilter === f;
            return (
              <Pressable
                key={f ?? 'all'}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setStatusFilter(f)}
              >
                <Text style={[styles.filterChipText, {color: selected ? colors.onAccent : colors.text}]}>
                  {f ? statusLabel(f) : t('splash.filterAll')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              {t('splash.noSplashScreens')}
            </Text>
          </View>
        ) : (
          visible.map((splash) => (
            <View
              key={splash.id}
              style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, {color: colors.text}]} numberOfLines={1}>
                  {splash.title}
                </Text>
                <View style={[styles.badge, {backgroundColor: statusColor(splash.status)}]}>
                  <Text style={styles.badgeText}>{statusLabel(splash.status)}</Text>
                </View>
              </View>

              <Text style={[styles.cardMeta, {color: colors.textSecondary}]}>
                {formatWindow(splash)}
              </Text>

              <View style={styles.cardMetaRow}>
                <View style={styles.platformBadge}>
                  {splash.platforms !== 'MOBILE' ? <Monitor size={14} color={colors.textSecondary} /> : null}
                  {splash.platforms !== 'WEB' ? <Smartphone size={14} color={colors.textSecondary} /> : null}
                  <Text style={[styles.cardMetaSmall, {color: colors.textSecondary}]}>{splash.platforms}</Text>
                </View>
                <Text style={[styles.cardMetaSmall, {color: colors.textSecondary}]}>
                  {t('splash.fieldPriority')}: {splash.priority}
                </Text>
                {!splash.enabled ? (
                  <Text style={[styles.cardMetaSmall, {color: colors.error}]}>
                    {t('splash.statusDraft')}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.actions, {borderTopColor: colors.border}]}>
                <Pressable style={styles.actionButton} onPress={() => setPreview(splash)} hitSlop={6}>
                  <Eye size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/splash-edit?id=${splash.id}` as any)}
                  hitSlop={6}
                >
                  <Pencil size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleDuplicate(splash)} hitSlop={6}>
                  <Copy size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleToggleEnabled(splash)} hitSlop={6}>
                  <Power size={18} color={splash.enabled ? '#2E9E5B' : colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleDelete(splash)} hitSlop={6}>
                  <Trash2 size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, {backgroundColor: colors.primary}]}
        onPress={() => router.push('/splash-edit' as any)}
      >
        <Plus size={26} color={colors.onAccent} />
      </Pressable>

      <Modal visible={!!preview} animationType="fade" onRequestClose={() => setPreview(null)}>
        {preview ? <SplashOverlay splash={preview} onDismiss={() => setPreview(null)} /> : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 20, paddingBottom: 100, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center'},
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  filterRow: {marginBottom: 16},
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {fontSize: 13, fontWeight: '600'},
  loader: {marginTop: 40},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyText: {fontSize: 15},
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6},
  cardTitle: {flex: 1, fontSize: 15, fontWeight: '700'},
  badge: {borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3},
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  cardMeta: {fontSize: 13, marginBottom: 6},
  cardMetaRow: {flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10},
  cardMetaSmall: {fontSize: 12},
  platformBadge: {flexDirection: 'row', alignItems: 'center', gap: 4},
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  actionButton: {padding: 8},
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
});
