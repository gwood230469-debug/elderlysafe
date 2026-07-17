import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { members } = useCircle();
  const { displayName } = useProfile();
  const confirmedMembers = members.filter((m) => m.status === 'confirmed');

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>{copy.home.greeting(displayName ?? 'there')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('VerifyCall')}
          style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
        >
          <Card accentBorder="accent">
            <Text style={styles.ctaTitle}>{copy.home.cta.title}</Text>
            <Text style={styles.ctaSubtitle}>{copy.home.cta.subtitle}</Text>
          </Card>
        </Pressable>

        <Text style={styles.sectionLabel}>{copy.home.circle.label}</Text>
        <FlatList
          data={confirmedMembers}
          keyExtractor={(m) => m.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.circleRow}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.memberChip}>
              <Avatar name={item.displayName} size={48} />
              <Text style={styles.memberName}>{item.displayName}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Pressable onPress={() => navigation.navigate('Dashboard')}>
              <Text style={styles.emptyCircle}>Add family members →</Text>
            </Pressable>
          }
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h2,
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.neutral[600],
  },
  ctaWrap: {
    marginBottom: spacing.xl,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaTitle: {
    fontFamily: typography.headingFamily,
    fontSize: typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ctaSubtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.neutral[600],
  },
  sectionLabel: {
    fontFamily: typography.bodyFamilyMedium,
    fontSize: typography.small,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  circleRow: {
    gap: spacing.md,
  },
  memberChip: {
    alignItems: 'center',
    width: 72,
  },
  memberName: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.small,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyCircle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.accentText,
  },
});
