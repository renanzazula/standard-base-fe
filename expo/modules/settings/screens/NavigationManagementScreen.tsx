import {NavigationTab, useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {Stack} from 'expo-router';
import {ChevronDown, ChevronUp, Edit3, GripVertical, Menu, Plus, Trash2} from 'lucide-react-native';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import React from 'react';
import {useTranslation} from '@shared/hooks/useTranslation';

export default function NavigationManagementScreen() {
  const { colors } = usePreferences();
  const { config, toggleTabEnabled, updateTabName, addCustomTab, removeCustomTab, updateTabOrder } = useAdminConfig();
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const [editingTab, setEditingTab] = React.useState<NavigationTab | null>(null);
  const [newTabName, setNewTabName] = React.useState('');
  const [newTabId, setNewTabId] = React.useState('');
  const [newTabIcon, setNewTabIcon] = React.useState('home');
  const { t } = useTranslation();

  const handleToggleTab = (tabId: string) => {
    const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.id === 'settings') {
      Alert.alert(
        t('navigation.settingsAlwaysVisible'),
        t('navigation.settingsAlwaysVisibleDescription')
      );
      return;
    }

    console.log(`[NavigationManagement] Toggling tab: ${tabId}`);
    toggleTabEnabled(tabId);
  };

  const handleEditTab = (tab: NavigationTab) => {
    setEditingTab(tab);
    setNewTabName(tab.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingTab || !newTabName.trim()) {
      Alert.alert(t('common.error'), t('navigation.tabNameRequired'));
      return;
    }

    console.log(`[NavigationManagement] Updating tab name: ${editingTab.id} to ${newTabName}`);
    updateTabName(editingTab.id, newTabName.trim());
    setEditModalVisible(false);
    setEditingTab(null);
    setNewTabName('');
    Alert.alert(t('common.success'), t('navigation.tabNameUpdated'));
  };

  const handleAddTab = () => {
    if (!newTabName.trim() || !newTabId.trim()) {
      Alert.alert(t('common.error'), t('navigation.tabDetailsRequired'));
      return;
    }

    const existingTab = config.navigationConfig.tabs.find((t) => t.id === newTabId.trim());
    if (existingTab) {
      Alert.alert(t('common.error'), t('navigation.tabIdExists'));
      return;
    }

    console.log(`[NavigationManagement] Adding custom tab: ${newTabId}`);
    addCustomTab({
      id: newTabId.trim(),
      name: newTabName.trim(),
      enabled: true,
      icon: newTabIcon,
    });

    setAddModalVisible(false);
    setNewTabName('');
    setNewTabId('');
    setNewTabIcon('home');
    Alert.alert(t('common.success'), t('navigation.tabAdded'));
  };

  const handleRemoveTab = (tabId: string) => {
    const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
    if (!tab || tab.isSystem) {
      Alert.alert(t('common.error'), t('navigation.cannotRemoveSystemTab'));
      return;
    }

    Alert.alert(
      t('navigation.removeTab'),
      t('navigation.removeTabConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            console.log(`[NavigationManagement] Removing custom tab: ${tabId}`);
            removeCustomTab(tabId);
            Alert.alert(t('common.success'), t('navigation.tabRemoved'));
          },
        },
      ]
    );
  };

  const handleMoveUp = (tabId: string) => {
    const sortedTabs = [...config.navigationConfig.tabs].sort((a, b) => a.order - b.order);
    const currentIndex = sortedTabs.findIndex((t) => t.id === tabId);

    if (currentIndex > 0) {
      const currentTab = sortedTabs[currentIndex];
      const previousTab = sortedTabs[currentIndex - 1];
      console.log(`[NavigationManagement] Moving tab ${tabId} up: order ${currentTab.order} -> ${previousTab.order}`);
      updateTabOrder(tabId, previousTab.order);
    }
  };

  const handleMoveDown = (tabId: string) => {
    const sortedTabs = [...config.navigationConfig.tabs].sort((a, b) => a.order - b.order);
    const currentIndex = sortedTabs.findIndex((t) => t.id === tabId);

    if (currentIndex < sortedTabs.length - 1) {
      const currentTab = sortedTabs[currentIndex];
      const nextTab = sortedTabs[currentIndex + 1];
      console.log(`[NavigationManagement] Moving tab ${tabId} down: order ${currentTab.order} -> ${nextTab.order}`);
      updateTabOrder(tabId, nextTab.order);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabItemLast: {
      borderBottomWidth: 0,
    },
    tabDragHandle: {
      marginRight: 8,
    },
    tabReorderButtons: {
      marginRight: 8,
    },
    reorderButton: {
      width: 24,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderButtonDisabled: {
      opacity: 0.3,
    },
    tabInfo: {
      flex: 1,
    },
    tabName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    tabMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tabBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    systemBadge: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    tabBadgeText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
    },
    systemBadgeText: {
      color: colors.primary,
    },
    tabId: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tabActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginLeft: 12,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      marginLeft: 8,
    },
    infoBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
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
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    modalBody: {
      padding: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    modalFooter: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalActionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCloseButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    modalActionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    modalActionButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('navigation.navigationManagement'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} testID="navigation-management-scroll">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('navigation.bottomNavigationTabs')}</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Menu size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>{t('navigation.manageTabVisibility')}</Text>
              </View>

              {config.navigationConfig.tabs
                .sort((a, b) => a.order - b.order)
                .map((tab, index, array) => {
                  console.log(`[NavigationManagement] Rendering tab: ${tab.id}, order: ${tab.order}, enabled: ${tab.enabled}`);
                  return (
                    <View
                      key={tab.id}
                      style={[styles.tabItem, index === array.length - 1 && styles.tabItemLast]}
                    >
                      <View style={styles.tabDragHandle}>
                        <GripVertical size={20} color={colors.textSecondary} />
                      </View>
                      <View style={styles.tabReorderButtons}>
                        <TouchableOpacity
                          style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                          onPress={() => handleMoveUp(tab.id)}
                          disabled={index === 0}
                          testID={`move-up-tab-${tab.id}`}
                        >
                          <ChevronUp size={16} color={index === 0 ? colors.border : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reorderButton, index === array.length - 1 && styles.reorderButtonDisabled]}
                          onPress={() => handleMoveDown(tab.id)}
                          disabled={index === array.length - 1}
                          testID={`move-down-tab-${tab.id}`}
                        >
                          <ChevronDown size={16} color={index === array.length - 1 ? colors.border : colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.tabInfo}>
                        <Text style={styles.tabName}>{tab.name}</Text>
                        <View style={styles.tabMeta}>
                          {tab.isSystem && (
                            <View style={[styles.tabBadge, styles.systemBadge]}>
                              <Text style={[styles.tabBadgeText, styles.systemBadgeText]}>
                                {t('navigation.system')}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.tabId}>ID: {tab.id}</Text>
                        </View>
                      </View>
                      <View style={styles.tabActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleEditTab(tab)}
                          testID={`edit-tab-${tab.id}`}
                        >
                          <Edit3 size={16} color={colors.primary} />
                        </TouchableOpacity>
                        {!tab.isSystem && (
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleRemoveTab(tab.id)}
                            testID={`remove-tab-${tab.id}`}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </TouchableOpacity>
                        )}
                        <Switch
                          value={tab.enabled}
                          onValueChange={() => handleToggleTab(tab.id)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#FFFFFF"
                          testID={`toggle-tab-${tab.id}`}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}
              testID="add-custom-tab"
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{t('navigation.addCustomTab')}</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: '700' as const }}>{t('navigation.important')}</Text>{' '}
                {t('navigation.navigationRules')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('navigation.editTabName')}</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('navigation.tabName')}</Text>
              <TextInput
                style={styles.input}
                value={newTabName}
                onChangeText={setNewTabName}
                placeholder={t('navigation.enterTabName')}
                placeholderTextColor={colors.textSecondary}
                autoFocus
                testID="edit-tab-name-input"
              />
            </View>
            <View style={styles.modalFooter}>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setEditModalVisible(false)}
                  testID="cancel-edit-tab"
                >
                  <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleSaveEdit}
                  testID="save-edit-tab"
                >
                  <Text style={styles.modalActionButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('navigation.addNewTab')}</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('navigation.tabId')}</Text>
              <TextInput
                style={styles.input}
                value={newTabId}
                onChangeText={setNewTabId}
                placeholder={t('navigation.enterTabId')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                testID="add-tab-id-input"
              />
              <Text style={styles.inputLabel}>{t('navigation.tabName')}</Text>
              <TextInput
                style={styles.input}
                value={newTabName}
                onChangeText={setNewTabName}
                placeholder={t('navigation.enterTabName')}
                placeholderTextColor={colors.textSecondary}
                testID="add-tab-name-input"
              />
              <Text style={styles.inputLabel}>{t('navigation.tabIcon')}</Text>
              <TextInput
                style={styles.input}
                value={newTabIcon}
                onChangeText={setNewTabIcon}
                placeholder={t('navigation.enterTabIcon')}
                placeholderTextColor={colors.textSecondary}
                testID="add-tab-icon-input"
              />
            </View>
            <View style={styles.modalFooter}>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setAddModalVisible(false)}
                  testID="cancel-add-tab"
                >
                  <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleAddTab}
                  testID="save-add-tab"
                >
                  <Text style={styles.modalActionButtonText}>{t('navigation.addTab')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
