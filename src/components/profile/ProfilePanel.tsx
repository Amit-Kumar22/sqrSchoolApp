import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';

import { apiErrorMessage } from '@/api/client';
import { getProfile, ROLE_LABELS, updateProfile, type Profile } from '@/api/services/auth';
import { useAuth } from '@/auth/AuthContext';
import Button from '@/components/ui/Button';
import { Card, SectionCard } from '@/components/ui/Card';
import { Badge, Banner, SkeletonList } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { Avatar, ListRow, PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, spacing } from '@/theme';

const EMPTY_ADDRESS = {
  buildingName: '',
  streetName: '',
  landmark: '',
  district: '',
  city: '',
  pin: '',
  stateName: '',
};

export interface ProfileLink {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  /** Typed against the generated route map, so a renamed screen fails the build. */
  href: Href;
}

/**
 * Profile screen shared by both panels — identity card, editable details, the
 * panel's extra destinations, and sign out. Same endpoints as the portal's
 * ProfileView (/v1/profile + /v1/profile/update).
 */
export default function ProfilePanel({ links }: { links: ProfileLink[] }) {
  const { user, signOut, refreshUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
      setName(data.fullName ?? '');
      setPhone(data.phone ?? '');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your profile.'));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Your name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      // The endpoint takes the whole address block, so untouched fields are
      // sent back as empty strings rather than omitted.
      await updateProfile({ name: name.trim(), phone: phone.trim(), address });
      setSavedMessage('Profile updated successfully.');
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const roleLabel = ROLE_LABELS[profile?.role ?? user?.role ?? ''] ?? 'Member';

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} keyboardAvoiding contentStyle={styles.content}>
      <PageTitle title="Profile" subtitle="Your account and app settings" />

      {loading ? (
        <SkeletonList rows={3} height={110} />
      ) : (
        <>
          <Card style={styles.identity}>
            <Avatar name={profile?.fullName ?? user?.fullName} size={54} />
            <View style={styles.identityText}>
              <Text style={styles.identityName} numberOfLines={1}>
                {profile?.fullName ?? user?.fullName ?? '—'}
              </Text>
              <View style={styles.identityBadges}>
                <Badge label={roleLabel} toneName="brand" />
                {profile?.status ? (
                  <Badge
                    label={profile.status}
                    toneName={profile.status?.toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
                  />
                ) : null}
              </View>
              <View style={styles.identityRow}>
                <Ionicons name="mail-outline" size={12} color={colors.textFaint} />
                <Text style={styles.identityMeta} numberOfLines={1}>
                  {profile?.email ?? user?.email ?? '—'}
                </Text>
              </View>
              <View style={styles.identityRow}>
                <Ionicons name="call-outline" size={12} color={colors.textFaint} />
                <Text style={styles.identityMeta} numberOfLines={1}>
                  {profile?.phone || 'Not set'}
                </Text>
              </View>
            </View>
          </Card>

          {error ? <Banner message={error} /> : null}
          {savedMessage ? <Banner message={savedMessage} toneName="success" /> : null}

          <SectionCard title="Edit details" icon="create-outline">
            <View style={styles.form}>
              <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
              <TextField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile number"
                keyboardType="phone-pad"
              />

              <Text style={styles.groupLabel}>Address</Text>
              <View style={styles.row}>
                <TextField
                  label="Building"
                  value={address.buildingName}
                  onChangeText={(text) => setAddress((a) => ({ ...a, buildingName: text }))}
                  containerStyle={styles.flex}
                />
                <TextField
                  label="Street"
                  value={address.streetName}
                  onChangeText={(text) => setAddress((a) => ({ ...a, streetName: text }))}
                  containerStyle={styles.flex}
                />
              </View>
              <View style={styles.row}>
                <TextField
                  label="Landmark"
                  value={address.landmark}
                  onChangeText={(text) => setAddress((a) => ({ ...a, landmark: text }))}
                  containerStyle={styles.flex}
                />
                <TextField
                  label="District"
                  value={address.district}
                  onChangeText={(text) => setAddress((a) => ({ ...a, district: text }))}
                  containerStyle={styles.flex}
                />
              </View>
              <View style={styles.row}>
                <TextField
                  label="City"
                  value={address.city}
                  onChangeText={(text) => setAddress((a) => ({ ...a, city: text }))}
                  containerStyle={styles.flex}
                />
                <TextField
                  label="State"
                  value={address.stateName}
                  onChangeText={(text) => setAddress((a) => ({ ...a, stateName: text }))}
                  containerStyle={styles.flex}
                />
              </View>
              <TextField
                label="PIN code"
                value={address.pin}
                onChangeText={(text) => setAddress((a) => ({ ...a, pin: text }))}
                keyboardType="number-pad"
              />

              <Button label="Save changes" icon="save-outline" loading={saving} onPress={handleSave} block />
            </View>
          </SectionCard>

          {links.length > 0 ? (
            <Card padded={false} style={styles.links}>
              {links.map((link, index) => (
                <View key={link.label}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ListRow
                    icon={link.icon}
                    title={link.label}
                    subtitle={link.description}
                    onPress={() => router.push(link.href)}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          <Card padded={false}>
            <ListRow
              icon="log-out-outline"
              title={signingOut ? 'Signing out…' : 'Sign out'}
              subtitle="End this session on this device"
              danger
              onPress={signingOut ? undefined : handleSignOut}
              right={<Ionicons name="chevron-forward" size={16} color={colors.danger} />}
            />
          </Card>

          <Text style={styles.version}>SQR School · v1.0.0</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: { flex: 1, gap: 3 },
  identityName: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  identityBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 2,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  identityMeta: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textMuted,
  },
  form: { gap: spacing.md },
  groupLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  links: { overflow: 'hidden' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 30 + spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textFaint,
    paddingVertical: spacing.md,
  },
});
