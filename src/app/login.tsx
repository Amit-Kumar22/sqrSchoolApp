import { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiErrorMessage } from '@/api/client';
import { useAuth, UnsupportedRoleError } from '@/auth/AuthContext';
import Button from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { useKeyboardAwareScroll } from '@/components/ui/useKeyboardAwareScroll';
import { colors, font, radius, shadow, spacing, SCREEN_PADDING } from '@/theme';

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
      <LinearGradient
        colors={[colors.brandDeeper, colors.brandDeep, colors.brandDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
              <View style={styles.logo}>
                <Image
                  source={require('@/assets/images/splash-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>SQR School</Text>
              <Text style={styles.brandTag}>One portal for teachers and students</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue to your panel.</Text>

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

                <Button label="Sign In" onPress={handleSubmit} loading={loading} block />
              </View>

              <View style={styles.help}>
                <Ionicons name="help-circle-outline" size={14} color={colors.textFaint} />
                <Text style={styles.helpText}>
                  Trouble signing in? Contact your school administrator.
                </Text>
              </View>
            </View>

            <Text style={styles.footer}>© {new Date().getFullYear()} SQR School</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandDeep },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING + 4,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 62,
    height: 62,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 38, height: 38 },
  brandName: {
    fontSize: font.display,
    fontWeight: '800',
    color: colors.onBrand,
    letterSpacing: -0.8,
  },
  brandTag: {
    fontSize: font.md,
    color: 'rgba(255,255,255,0.72)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
    ...shadow.raised,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  help: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.lg,
  },
  helpText: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  footer: {
    textAlign: 'center',
    fontSize: font.xs,
    color: 'rgba(255,255,255,0.5)',
  },
});
