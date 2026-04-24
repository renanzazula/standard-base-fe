# Navigation Management - Technical Implementation Guide

## Overview

The Navigation Management feature provides a comprehensive admin interface for dynamically configuring bottom navigation tabs in a React Native Expo application. It allows administrators to control tab visibility, ordering, naming, and add custom tabs at runtime.

## Architecture

### Component Hierarchy

```
NavigationManagementScreen
├── Header (Stack.Screen)
├── ScrollView
│   ├── Section: Bottom Navigation Tabs
│   │   ├── Card: Manage Tab Visibility
│   │   │   └── TabItem[] (sorted by order)
│   │   │       ├── Drag Handle (visual indicator)
│   │   │       ├── Reorder Buttons (up/down)
│   │   │       ├── Tab Info (name, badges, metadata)
│   │   │       └── Actions (edit, delete, toggle switch)
│   │   ├── Add Custom Tab Button
│   │   └── Info Box (instructions)
├── Edit Tab Modal
└── Add Tab Modal
```

### State Management

Uses context-based state management with three main providers:

1. **AdminConfigContext** - Core navigation configuration
2. **PreferencesContext** - Theme and color management
3. **useTranslation** - Internationalization

## Data Models

### NavigationTab Interface

```typescript
interface NavigationTab {
  id: string;              // Unique identifier (e.g., "home", "settings")
  name: string;            // Display name
  enabled: boolean;        // Visibility state
  icon: string;           // Icon identifier (lucide-react-native)
  order: number;          // Position in tab bar (0-indexed)
  isSystem?: boolean;     // Protected system tab flag
}
```

### NavigationConfig

```typescript
interface NavigationConfig {
  tabs: NavigationTab[];
}
```

## Core Functionality

### 1. Toggle Tab Visibility

**API Method**: `toggleTabEnabled(tabId: string)`

**Implementation**:
```typescript
const handleToggleTab = (tabId: string) => {
  const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
  if (!tab) return;

  // Prevent disabling settings tab
  if (tab.id === 'settings') {
    Alert.alert(
      t('navigation.settingsAlwaysVisible'),
      t('navigation.settingsAlwaysVisibleDescription')
    );
    return;
  }

  toggleTabEnabled(tabId);
};
```

**Business Rules**:
- Settings tab cannot be disabled (always visible)
- Shows alert dialog for protected tabs
- Immediately reflects in navigation bar

### 2. Edit Tab Name

**API Method**: `updateTabName(tabId: string, newName: string)`

**Implementation**:
```typescript
const handleSaveEdit = () => {
  if (!editingTab || !newTabName.trim()) {
    Alert.alert(t('common.error'), t('navigation.tabNameRequired'));
    return;
  }

  updateTabName(editingTab.id, newTabName.trim());
  setEditModalVisible(false);
  Alert.alert(t('common.success'), t('navigation.tabNameUpdated'));
};
```

**Validation**:
- Tab name cannot be empty
- Automatically trims whitespace
- Shows success confirmation

### 3. Add Custom Tab

**API Method**: `addCustomTab(tab: NavigationTab)`

**Implementation**:
```typescript
const handleAddTab = () => {
  // Validate required fields
  if (!newTabName.trim() || !newTabId.trim()) {
    Alert.alert(t('common.error'), t('navigation.tabDetailsRequired'));
    return;
  }

  // Check for duplicate IDs
  const existingTab = config.navigationConfig.tabs.find(
    (t) => t.id === newTabId.trim()
  );
  if (existingTab) {
    Alert.alert(t('common.error'), t('navigation.tabIdExists'));
    return;
  }

  addCustomTab({
    id: newTabId.trim(),
    name: newTabName.trim(),
    enabled: true,
    icon: newTabIcon,
  });

  Alert.alert(t('common.success'), t('navigation.tabAdded'));
};
```

**Validation**:
- Tab ID must be unique
- Both name and ID are required
- Icon defaults to 'home'
- New tabs are enabled by default

### 4. Remove Custom Tab

**API Method**: `removeCustomTab(tabId: string)`

**Implementation**:
```typescript
const handleRemoveTab = (tabId: string) => {
  const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
  
  // Prevent removing system tabs
  if (!tab || tab.isSystem) {
    Alert.alert(t('common.error'), t('navigation.cannotRemoveSystemTab'));
    return;
  }

  // Confirmation dialog
  Alert.alert(
    t('navigation.removeTab'),
    t('navigation.removeTabConfirm'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeCustomTab(tabId);
          Alert.alert(t('common.success'), t('navigation.tabRemoved'));
        },
      },
    ]
  );
};
```

**Business Rules**:
- System tabs cannot be removed
- Requires confirmation dialog
- Destructive action styling

### 5. Reorder Tabs

**API Method**: `updateTabOrder(tabId: string, newOrder: number)`

**Implementation**:
```typescript
const handleMoveUp = (tabId: string) => {
  const sortedTabs = [...config.navigationConfig.tabs].sort(
    (a, b) => a.order - b.order
  );
  const currentIndex = sortedTabs.findIndex((t) => t.id === tabId);
  
  if (currentIndex > 0) {
    const previousTab = sortedTabs[currentIndex - 1];
    updateTabOrder(tabId, previousTab.order);
  }
};

const handleMoveDown = (tabId: string) => {
  const sortedTabs = [...config.navigationConfig.tabs].sort(
    (a, b) => a.order - b.order
  );
  const currentIndex = sortedTabs.findIndex((t) => t.id === tabId);
  
  if (currentIndex < sortedTabs.length - 1) {
    const nextTab = sortedTabs[currentIndex + 1];
    updateTabOrder(tabId, nextTab.order);
  }
};
```

**Algorithm**:
1. Sort tabs by current order
2. Find current tab index
3. Swap order values with adjacent tab
4. Disable buttons at boundaries (first/last)

## AdminConfigContext Implementation

### Required Context Methods

```typescript
interface AdminConfigContextValue {
  config: {
    navigationConfig: {
      tabs: NavigationTab[];
    };
  };
  
  // Toggle methods
  toggleTabEnabled: (tabId: string) => void;
  
  // CRUD operations
  updateTabName: (tabId: string, newName: string) => void;
  addCustomTab: (tab: NavigationTab) => void;
  removeCustomTab: (tabId: string) => void;
  updateTabOrder: (tabId: string, newOrder: number) => void;
}
```

### Context Implementation Example

```typescript
const [config, setConfig] = useState<Config>({
  navigationConfig: {
    tabs: [
      { id: 'home', name: 'Home', enabled: true, icon: 'home', order: 0, isSystem: true },
      { id: 'feed', name: 'Feed', enabled: true, icon: 'rss', order: 1, isSystem: true },
      { id: 'settings', name: 'Settings', enabled: true, icon: 'settings', order: 2, isSystem: true },
    ],
  },
});

const toggleTabEnabled = (tabId: string) => {
  setConfig((prev) => ({
    ...prev,
    navigationConfig: {
      ...prev.navigationConfig,
      tabs: prev.navigationConfig.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab
      ),
    },
  }));
};

const updateTabName = (tabId: string, newName: string) => {
  setConfig((prev) => ({
    ...prev,
    navigationConfig: {
      ...prev.navigationConfig,
      tabs: prev.navigationConfig.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, name: newName } : tab
      ),
    },
  }));
};

const addCustomTab = (newTab: NavigationTab) => {
  setConfig((prev) => {
    const maxOrder = Math.max(...prev.navigationConfig.tabs.map((t) => t.order), -1);
    return {
      ...prev,
      navigationConfig: {
        ...prev.navigationConfig,
        tabs: [
          ...prev.navigationConfig.tabs,
          { ...newTab, order: maxOrder + 1, isSystem: false },
        ],
      },
    };
  });
};

const removeCustomTab = (tabId: string) => {
  setConfig((prev) => ({
    ...prev,
    navigationConfig: {
      ...prev.navigationConfig,
      tabs: prev.navigationConfig.tabs.filter((tab) => tab.id !== tabId),
    },
  }));
};

const updateTabOrder = (tabId: string, newOrder: number) => {
  setConfig((prev) => {
    const tabs = [...prev.navigationConfig.tabs];
    const targetTab = tabs.find((t) => t.id === tabId);
    const swapTab = tabs.find((t) => t.order === newOrder);
    
    if (!targetTab || !swapTab) return prev;
    
    const tempOrder = targetTab.order;
    targetTab.order = swapTab.order;
    swapTab.order = tempOrder;
    
    return {
      ...prev,
      navigationConfig: {
        ...prev.navigationConfig,
        tabs,
      },
    };
  });
};
```

## UI Components

### Tab Item Structure

Each tab item displays:
- **Drag Handle Icon**: Visual indicator (non-functional, decorative)
- **Reorder Buttons**: ChevronUp/ChevronDown for position changes
- **Tab Info**:
  - Tab name (bold, primary text)
  - System badge (if `isSystem === true`)
  - Tab ID (secondary text)
- **Actions**:
  - Edit button (pencil icon)
  - Delete button (trash icon, only for custom tabs)
  - Toggle switch (enable/disable)

### Modal Dialogs

#### Edit Tab Modal
- **Fields**: Tab Name (TextInput)
- **Actions**: Cancel, Save
- **Validation**: Name cannot be empty

#### Add Tab Modal
- **Fields**: 
  - Tab ID (TextInput, auto-capitalization off)
  - Tab Name (TextInput)
  - Tab Icon (TextInput, default: 'home')
- **Actions**: Cancel, Add Tab
- **Validation**: All fields required, ID must be unique

## Styling System

Uses dynamic theming from `PreferencesContext`:

```typescript
const { colors } = usePreferences();

const styles = StyleSheet.create({
  // Colors adapt to light/dark theme
  container: {
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  // ... etc
});
```

**Color Variables**:
- `colors.background` - Screen background
- `colors.surface` - Secondary background
- `colors.card` - Card background
- `colors.text` - Primary text
- `colors.textSecondary` - Secondary text
- `colors.border` - Border colors
- `colors.primary` - Primary brand color
- `colors.error` - Destructive actions

## Testing Strategy

### Test IDs

All interactive elements have testID attributes:

```typescript
// Tab actions
testID={`edit-tab-${tab.id}`}
testID={`remove-tab-${tab.id}`}
testID={`toggle-tab-${tab.id}`}
testID={`move-up-tab-${tab.id}`}
testID={`move-down-tab-${tab.id}`}

// Buttons
testID="add-custom-tab"

// Modal inputs
testID="edit-tab-name-input"
testID="add-tab-id-input"
testID="add-tab-name-input"
testID="add-tab-icon-input"

// Modal actions
testID="cancel-edit-tab"
testID="save-edit-tab"
testID="cancel-add-tab"
testID="save-add-tab"

// Containers
testID="navigation-management-scroll"
```

### Test Scenarios

1. **Toggle Tab Visibility**
   - Toggle enabled/disabled state
   - Verify settings tab cannot be disabled
   - Check alert message for protected tabs

2. **Edit Tab Name**
   - Open edit modal
   - Change name
   - Save and verify update
   - Test empty name validation

3. **Add Custom Tab**
   - Open add modal
   - Fill all fields
   - Test duplicate ID validation
   - Test empty field validation
   - Verify tab appears in list

4. **Remove Custom Tab**
   - Attempt to remove system tab (should fail)
   - Remove custom tab with confirmation
   - Cancel removal
   - Verify tab removed from list

5. **Reorder Tabs**
   - Move tab up
   - Move tab down
   - Test boundary conditions (first/last)
   - Verify order persistence

## Integration Requirements

### 1. Routing Configuration

Update tab bar router to read from config:

```typescript
// app/(tabs)/_layout.tsx
import { useAdminConfig } from '@/contexts/AdminConfigContext';

export default function TabLayout() {
  const { config } = useAdminConfig();
  const enabledTabs = config.navigationConfig.tabs
    .filter((tab) => tab.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Tabs>
      {enabledTabs.map((tab) => (
        <Tabs.Screen
          key={tab.id}
          name={tab.id}
          options={{
            title: tab.name,
            tabBarIcon: ({ color }) => (
              <TabBarIcon name={tab.icon as any} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
```

### 2. Persistence Layer

Save configuration to AsyncStorage or backend:

```typescript
// In AdminConfigContext
useEffect(() => {
  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('admin-config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };
  
  saveConfig();
}, [config]);
```

### 3. Translation Keys

Required translation keys in `locales/en.ts` and `locales/es.ts`:

```typescript
navigation: {
  navigationManagement: 'Navigation Management',
  bottomNavigationTabs: 'Bottom Navigation Tabs',
  manageTabVisibility: 'Manage Tab Visibility',
  settingsAlwaysVisible: 'Settings Always Visible',
  settingsAlwaysVisibleDescription: 'The settings tab cannot be disabled.',
  tabNameRequired: 'Tab name is required',
  tabNameUpdated: 'Tab name updated successfully',
  tabDetailsRequired: 'All tab details are required',
  tabIdExists: 'A tab with this ID already exists',
  tabAdded: 'Custom tab added successfully',
  cannotRemoveSystemTab: 'System tabs cannot be removed',
  removeTab: 'Remove Tab',
  removeTabConfirm: 'Are you sure you want to remove this tab?',
  tabRemoved: 'Tab removed successfully',
  editTabName: 'Edit Tab Name',
  tabName: 'Tab Name',
  enterTabName: 'Enter tab name',
  addNewTab: 'Add New Tab',
  tabId: 'Tab ID',
  enterTabId: 'Enter unique tab ID',
  tabIcon: 'Tab Icon',
  enterTabIcon: 'Enter icon name',
  addCustomTab: 'Add Custom Tab',
  addTab: 'Add Tab',
  system: 'SYSTEM',
  important: 'Important:',
  navigationRules: 'System tabs cannot be deleted. The settings tab is always visible.',
}
```

## Console Logging

Debug logs for development:

```typescript
console.log(`[NavigationManagement] Toggling tab: ${tabId}`);
console.log(`[NavigationManagement] Updating tab name: ${editingTab.id} to ${newTabName}`);
console.log(`[NavigationManagement] Adding custom tab: ${newTabId}`);
console.log(`[NavigationManagement] Removing custom tab: ${tabId}`);
console.log(`[NavigationManagement] Moving tab ${tabId} up: order ${currentTab.order} -> ${previousTab.order}`);
console.log(`[NavigationManagement] Rendering tab: ${tab.id}, order: ${tab.order}, enabled: ${tab.enabled}`);
```

## Performance Considerations

1. **Memoization**: Consider memoizing sorted tab arrays
2. **Debouncing**: Add debounce to order updates if needed
3. **Optimistic Updates**: UI updates immediately, sync to storage async
4. **Virtualization**: Not needed (typically < 10 tabs)

## Security Considerations

1. **System Tab Protection**: Always validate `isSystem` flag
2. **ID Validation**: Sanitize tab IDs (alphanumeric + dashes)
3. **Input Validation**: Trim and validate all user inputs
4. **Admin Access**: Ensure route is protected by admin authentication

## File Dependencies

```
app/navigation-management.tsx
├── contexts/AdminConfigContext.tsx (state management)
├── contexts/PreferencesContext.tsx (theming)
├── hooks/useTranslation.ts (i18n)
├── locales/en.ts (translations)
├── locales/es.ts (translations)
└── expo-router (navigation)
```

## Implementation Checklist

- [ ] Create `AdminConfigContext` with navigation config state
- [ ] Implement CRUD methods in context
- [ ] Add persistence layer (AsyncStorage/Backend)
- [ ] Create `NavigationManagementScreen` component
- [ ] Add translation keys for all UI text
- [ ] Integrate with tab bar router configuration
- [ ] Add test IDs to all interactive elements
- [ ] Write integration tests
- [ ] Implement theme support
- [ ] Add console logging for debugging
- [ ] Document API in context file
- [ ] Create route protection for admin users

## Example Usage

```typescript
// Navigate to Navigation Management
import { router } from 'expo-router';

// From settings or admin panel
<TouchableOpacity onPress={() => router.push('/navigation-management')}>
  <Text>Manage Navigation</Text>
</TouchableOpacity>
```

## Known Limitations

1. **Drag-and-Drop**: Currently uses up/down buttons, not drag gesture
2. **Icon Picker**: Manual text entry, no visual icon picker
3. **Tab Validation**: No route validation (assumes routes exist)
4. **Bulk Operations**: No multi-select or bulk actions
5. **Undo/Redo**: No change history or undo functionality

## Future Enhancements

1. **Drag-and-Drop Reordering**: Implement with `react-native-draggable-flatlist`
2. **Icon Picker Modal**: Visual selector for lucide-react-native icons
3. **Tab Preview**: Live preview of navigation bar
4. **Import/Export**: JSON import/export for configurations
5. **Role-Based Tabs**: Show/hide tabs based on user roles
6. **Tab Analytics**: Track usage statistics per tab
7. **A/B Testing**: Test different navigation configurations
8. **Tab Groups**: Organize tabs into collapsible groups

## Support and Maintenance

For issues or questions regarding this implementation:
- Check console logs with `[NavigationManagement]` prefix
- Verify `AdminConfigContext` is properly providing values
- Ensure translations exist for current locale
- Check React Navigation configuration
- Validate tab routes exist in `app/(tabs)/` directory
