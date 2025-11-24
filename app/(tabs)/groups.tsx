import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, useTheme, IconButton, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';
import { FeedScreen, ExploreScreen, MyNotesScreen } from '@/src/screens/community';

const renderScene = SceneMap({
  feed: FeedScreen,
  explore: ExploreScreen,
  notes: MyNotesScreen,
});

export default function GroupsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'feed', title: 'Feed', icon: 'home' },
    { key: 'explore', title: 'Explore', icon: 'compass' },
    { key: 'notes', title: 'My Notes', icon: 'note-multiple' },
  ]);

  const renderTabBar = useCallback(
    (props: any) => (
      <TabBar
        {...props}
        style={{ backgroundColor: theme.colors.surface }}
        indicatorStyle={{ backgroundColor: theme.colors.primary }}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        labelStyle={{ textTransform: 'none', fontWeight: '600' }}
        renderIcon={({ route, color }) => (
          <MaterialCommunityIcons
            name={route.icon as any}
            size={20}
            color={color}
          />
        )}
      />
    ),
    [theme]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <MaterialCommunityIcons
          name="account-group"
          size={24}
          color={theme.colors.primary}
          style={{ marginLeft: 16 }}
        />
        <Appbar.Content title="Community" titleStyle={{ fontWeight: 'bold' }} />
        <IconButton
          icon="account-search"
          onPress={() => router.push('/search-users' as any)}
          iconColor={theme.colors.onSurface}
        />
        <View style={{ marginRight: 8 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        lazy
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
