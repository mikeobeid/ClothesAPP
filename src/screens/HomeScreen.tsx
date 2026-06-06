import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ClothingCard,
  OutfitCard,
  QuickActionCard,
  ScreenContainer,
  StatCard,
} from '../components';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useWardrobe } from '../context/WardrobeContext';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Home'>;

const QUICK_ACTIONS = [
  {
    title: 'Add Clothing',
    subtitle: 'Upload a new piece',
    icon: '+',
    accentColor: '#F3E8E8',
    route: 'AddClothing' as const,
  },
  {
    title: 'My Wardrobe',
    subtitle: 'Browse your closet',
    icon: '◇',
    accentColor: '#EDE4E8',
    route: 'Wardrobe' as const,
  },
  {
    title: 'Build Outfit',
    subtitle: 'Mix and match',
    icon: '✧',
    accentColor: '#E8E4F0',
    route: 'OutfitBuilder' as const,
  },
  {
    title: 'Smart Suggestions',
    subtitle: 'Get styled looks',
    icon: '✦',
    accentColor: '#F0E8E4',
    route: 'OutfitSuggestions' as const,
  },
  {
    title: 'Saved Outfits',
    subtitle: 'Your favorite looks',
    icon: '♡',
    accentColor: '#F5E8EC',
    route: 'SavedOutfits' as const,
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function HomeScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const {
    getRecentClothingItems,
    getRecentOutfits,
    getClothingItemsForOutfit,
    getWardrobeStats,
    isLoading,
  } = useWardrobe();
  const stats = getWardrobeStats();
  const recentItems = getRecentClothingItems(4);
  const recentOutfits = getRecentOutfits(2);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your wardrobe...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>My Wardrobe</Text>
            <Text style={styles.subtitle}>Your personal style dashboard</Text>
          </View>
          <Pressable
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileInitial}>
              {(profile.username ?? profile.displayName).charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            value={stats.totalItems}
            label="Clothing"
            accent={colors.primaryLight}
          />
          <StatCard
            value={stats.savedOutfits}
            label="Outfits"
            accent={colors.accentSoft}
          />
          <StatCard
            value={stats.favoriteItems}
            label="Favorites"
            accent="#F5E0E0"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.route}
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                accentColor={action.accentColor}
                onPress={() => navigation.navigate(action.route)}
              />
            ))}
          </View>
        </View>

        {recentItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <Pressable onPress={() => navigation.navigate('Wardrobe')}>
                <Text style={styles.sectionLink}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recentItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  compact
                  onPress={() =>
                    navigation.navigate('ClothingDetails', { itemId: item.id })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {recentOutfits.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Outfits</Text>
              <Pressable onPress={() => navigation.navigate('SavedOutfits')}>
                <Text style={styles.sectionLink}>See all</Text>
              </Pressable>
            </View>
            {recentOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                items={getClothingItemsForOutfit(outfit)}
                onPress={() =>
                  navigation.navigate('OutfitDetails', { outfitId: outfit.id })
                }
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  greeting: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  sectionTitleSpaced: {
    marginBottom: spacing.md,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: -spacing.md,
  },
  horizontalList: {
    paddingRight: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
  },
});
