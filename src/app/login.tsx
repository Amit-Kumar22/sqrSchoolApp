import { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';

import { apiErrorMessage } from '@/api/client';
import { useAuth, UnsupportedRoleError } from '@/auth/AuthContext';
import Button from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { useKeyboardAwareScroll } from '@/components/ui/useKeyboardAwareScroll';
import { colors, font, gradients, radius, shadow, spacing, SCREEN_PADDING } from '@/theme';

/** Demo accounts shown under the form — tapping one fills in the fields. */
const DEMO_ACCOUNTS = [
  { role: 'Teacher', icon: 'school-outline', email: 'kavita.joshi@yopmail.com', password: '12345' },
  { role: 'Student', icon: 'person-outline', email: 'aarav@gvs.edu', password: '12345' },
] as const;

/**
 * One sign-in screen for every role, exactly like the web portal: the backend
 * decides the role, /v1/profile confirms it, and the app routes to the matching
 * panel. Roles without an app panel are turned away here with an explanation.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { scrollRef, onScroll, scrollEventThrottle } = useKeyboardAwareScroll();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const user = await signIn(email, password);
      router.replace(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(
        err instanceof UnsupportedRoleError
          ? err.message
          : apiErrorMessage(err, 'Invalid email or password. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* The only light-topped screen — every signed-in screen has a dark band. */}
      <StatusBar style="dark" />
      <CornerStripes position="topRight" />
      <CornerStripes position="bottomLeft" />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* 'padding' on both platforms — the app is edge-to-edge, so Android's
            window no longer resizes for the keyboard on its own. */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <View style={styles.brand}>
              <LinearGradient
                colors={gradients.chrome}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}>
                <Image
                  source={require('@/assets/images/splash-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </LinearGradient>
              <Text style={styles.brandName}>
                SQR <Text style={styles.brandNameAccent}>SCHOOL</Text>
              </Text>
              <Text style={styles.brandTag}>One portal for teachers and students</Text>
            </View>

            <View style={styles.intro}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue to your panel.</Text>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email address"
                icon="mail-outline"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                placeholder="you@sqrschool.edu"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!loading}
              />

              <TextField
                label="Password"
                icon="lock-closed-outline"
                secure
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />

              {error ? <Banner message={error} /> : null}

              <Button label="Sign In" onPress={handleSubmit} loading={loading} block style={styles.submit} />
            </View>

            <View style={styles.demo}>
              <Text style={styles.demoTitle}>Demo accounts · tap to fill</Text>
              {DEMO_ACCOUNTS.map((account) => {
                const selected = email === account.email && password === account.password;
                return (
                  <Pressable
                    key={account.role}
                    onPress={() => fillDemo(account)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={`Fill ${account.role} demo credentials`}
                    style={({ pressed }) => [
                      styles.demoCard,
                      selected && styles.demoCardSelected,
                      pressed && styles.demoCardPressed,
                    ]}>
                    <View style={styles.demoIcon}>
                      <Ionicons name={account.icon} size={16} color={colors.brand} />
                    </View>
                    <View style={styles.demoBody}>
                      <Text style={styles.demoRole}>{account.role}</Text>
                      <Text style={styles.demoText} numberOfLines={1}>
                        {account.email}
                      </Text>
                      <Text style={styles.demoText}>Password: {account.password}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'arrow-forward-circle-outline'}
                      size={20}
                      color={selected ? colors.brand : colors.textFaint}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.help}>
              <Ionicons name="help-circle-outline" size={14} color={colors.textFaint} />
              <Text style={styles.helpText}>Trouble signing in? Contact your school administrator.</Text>
            </View>

            <Text style={styles.footer}>© {new Date().getFullYear()} SQR School</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const STRIPE_SIZE = 150;

/**
 * Diagonal green bands tucked into a corner — pure decoration, drawn behind the
 * form and ignored by touches.
 */
function CornerStripes({ position }: { position: 'topRight' | 'bottomLeft' }) {
  const top = position === 'topRight';
  const id = `stripe-${position}`;
  // Points are authored for the top-right corner; the bottom-left copy is the
  // same shape rotated half a turn.
  return (
    <View pointerEvents="none" style={[styles.stripes, top ? styles.stripesTop : styles.stripesBottom]}>
      <Svg width={STRIPE_SIZE} height={STRIPE_SIZE} viewBox="0 0 150 150">
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandBright} />
            <Stop offset="1" stopColor={colors.brandDark} />
          </SvgGradient>
        </Defs>
        <Polygon points="52,0 92,0 150,58 150,98" fill={`url(#${id})`} />
        <Polygon points="104,0 118,0 150,32 150,46" fill={colors.brandBright} opacity={0.45} />
        <Polygon points="128,0 150,0 150,22" fill={colors.chrome} opacity={0.9} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING + 8,
    paddingVertical: spacing.xxl + spacing.lg,
    gap: spacing.xl,
  },
  stripes: { position: 'absolute', width: STRIPE_SIZE, height: STRIPE_SIZE },
  stripesTop: { top: 0, right: 0 },
  stripesBottom: { bottom: 0, left: 0, transform: [{ rotate: '180deg' }] },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.brandBright,
    marginBottom: spacing.xs,
    ...shadow.raised,
  },
  logoImage: { width: 44, height: 44 },
  brandName: {
    fontSize: font.xxl + 3,
    fontWeight: '800',
    color: colors.chrome,
    letterSpacing: 0.4,
  },
  brandNameAccent: { color: colors.brand },
  brandTag: {
    fontSize: font.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  intro: { gap: 3, marginTop: spacing.md },
  title: {
    fontSize: font.xxl + 2,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.xs },
  demo: { gap: spacing.sm },
  demoTitle: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  demoCardSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  demoCardPressed: { opacity: 0.7 },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  demoBody: { flex: 1, gap: 1 },
  demoRole: { fontSize: font.md, fontWeight: '700', color: colors.text },
  demoText: { fontSize: font.sm, color: colors.textMuted },
  help: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  helpText: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  footer: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textFaint,
  },
});
