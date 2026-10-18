import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { UserCircleIcon, WarningCircleIcon, XIcon } from '@/components/ui/icons';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { demo } from '@/config/demo';
import { useAuth } from '@/features/auth/auth-provider';
import { authReasons, clearPendingAuthAction, type AuthReason } from '@/features/auth/require-auth';
import { haptics } from '@/lib/haptics';
import { describeError, isServiceError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, layout, radius, space, useTheme } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

const schema = z.object({
  name: z.string().trim(),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
const signUpSchema = schema.extend({ name: z.string().trim().min(2, 'Enter your name') });

type FormValues = z.infer<typeof schema>;

export default function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const { reason } = useLocalSearchParams<{ reason?: AuthReason }>();
  const [mode, setMode] = useState<Mode>('sign-in');

  // Closing without signing in drops the action that opened this screen.
  useEffect(() => clearPendingAuthAction, []);
  const [formError, setFormError] = useState<string | null>(null);

  const [sendingReset, setSendingReset] = useState(false);

  const { control, handleSubmit, setError, setValue, getValues, clearErrors, formState } = useForm<FormValues>({
    resolver: zodResolver(mode === 'sign-up' ? signUpSchema : schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session =
        mode === 'sign-up'
          ? await signUp(values)
          : await signIn({ email: values.email, password: values.password });
      haptics.success();
      toast(`Signed in as ${session.user.name}`, 'success');
      router.back();
    } catch (e) {
      if (isServiceError(e) && e.fieldErrors) {
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (field in values) setError(field as keyof FormValues, { message });
        }
      }
      haptics.error();
      setFormError(isServiceError(e) && e.code === 'unauthorized' ? e.message : describeError(e).message);
    }
  });

  const onForgotPassword = async () => {
    setFormError(null);
    const email = getValues('email').trim();
    if (!z.email().safeParse(email).success) {
      setError('email', { message: 'Enter your email address to get a reset link' });
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordReset({ email });
      toast('If there’s an account for that email, a reset link is on its way.', 'success');
    } catch (e) {
      setFormError(describeError(e).message);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* iOS presents this as a sheet below the status bar; Android presents it full screen. */}
      <View style={[styles.topBar, Platform.OS === 'android' && { paddingTop: insets.top + space.sm }]}>
        <IconButton icon={XIcon} accessibilityLabel="Close" variant="tinted" size={36} onPress={() => router.back()} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.titles}>
          <Text variant="title1" accessibilityRole="header">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text variant="body" color="textMuted">
            {(reason && authReasons[reason]) ??
              'Browsing and backing never need an account. Sign in to follow campaigns, keep receipts together and create campaigns.'}
          </Text>
        </View>

        <SegmentedControl<Mode>
          accessibilityLabel="Sign in or create account"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setFormError(null);
            clearErrors();
          }}
          options={[
            { value: 'sign-in', label: 'Sign in' },
            { value: 'sign-up', label: 'Create account' },
          ]}
        />

        <Animated.View layout={LinearTransition.duration(duration.base)} style={styles.fields}>
          {mode === 'sign-up' && (
            <Animated.View entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)}>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Name"
                    required
                    autoComplete="name"
                    textContentType="name"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </Animated.View>
          )}
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label="Email"
                required
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="Password"
                required
                secureTextEntry
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
                helper={mode === 'sign-up' ? 'At least 8 characters.' : undefined}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={() => void onSubmit()}
                returnKeyType="go"
                error={fieldState.error?.message}
              />
            )}
          />

          {formError && (
            <Animated.View
              entering={FadeIn.duration(duration.base)}
              style={[styles.formError, { backgroundColor: colors.dangerSoft }]}
              accessibilityLiveRegion="assertive">
              <WarningCircleIcon size={18} color={colors.danger} />
              <Text variant="subhead" color="danger" style={styles.formErrorText}>
                {formError}
              </Text>
            </Animated.View>
          )}

          <Button
            label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            size="lg"
            fullWidth
            loading={formState.isSubmitting}
            onPress={() => void onSubmit()}
          />
          {mode === 'sign-in' && (
            <Button
              label="Forgot password?"
              variant="ghost"
              size="sm"
              loading={sendingReset}
              onPress={() => void onForgotPassword()}
            />
          )}
        </Animated.View>

        {mode === 'sign-in' && (
          <Card tone="sunken" style={styles.sample}>
            <View style={styles.sampleHeader}>
              <UserCircleIcon size={18} color={colors.textMuted} />
              <Text variant="subhead">Sample creator account</Text>
            </View>
            <Text variant="footnote" color="textMuted">
              Already runs five campaigns at different stages, so you can explore the creator dashboard, campaign
              management and reports without creating one first.
            </Text>
            <Text variant="footnote" tabular selectable>
              {`${demo.demoAccount.email} · ${demo.demoAccount.password}`}
            </Text>
            <Button
              label="Fill in sample account"
              variant="secondary"
              size="sm"
              onPress={() => {
                setFormError(null);
                setValue('email', demo.demoAccount.email, { shouldValidate: true });
                setValue('password', demo.demoAccount.password, { shouldValidate: true });
              }}
            />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  content: { paddingHorizontal: layout.gutter, gap: space.xxl },
  titles: { gap: space.sm },
  fields: { gap: space.lg },
  formError: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
  },
  formErrorText: { flex: 1 },
  sample: { gap: space.sm },
  sampleHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
