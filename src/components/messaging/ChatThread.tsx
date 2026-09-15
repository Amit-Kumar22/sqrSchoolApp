import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiErrorMessage } from '@/api/client';
import {
  getMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
} from '@/api/services/communication';
import { useAuth } from '@/auth/AuthContext';
import { Banner, EmptyState } from '@/components/ui/Feedback';
import HeaderBand, { sheetStyle } from '@/components/ui/HeaderBand';
import { Avatar } from '@/components/ui/Layout';
import { loadLastRead, saveLastRead } from '@/components/messaging/lastRead';
import { colors, font, radius, spacing, SCREEN_PADDING } from '@/theme';
import { formatChatTimestamp, formatDate } from '@/utils/format';

/** How often an open thread re-checks for new messages. */
const POLL_INTERVAL_MS = 6000;

const byTime = (a: ChatMessage, b: ChatMessage) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/**
 * One conversation. The portal gets live delivery over STOMP/SockJS, which
 * can't run inside Expo Go, so the thread polls the same REST endpoint while
 * it's open — sending still goes through POST /send-message either way.
 */
export default function ChatThread() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const conversationId = Number(id);
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const markRead = useCallback(
    async (upTo?: string) => {
      if (!user?.id || !conversationId) return;
      const stamp = upTo ?? new Date().toISOString();
      const map = await loadLastRead(user.id);
      const current = map[conversationId];
      if (!current || new Date(current).getTime() < new Date(stamp).getTime()) {
        await saveLastRead(user.id, { ...map, [conversationId]: stamp });
      }
      // Tell the backend too, for whenever it starts tracking read state.
      markConversationRead(conversationId).catch(() => {});
    },
    [user?.id, conversationId],
  );

  const load = useCallback(
    async (silent: boolean) => {
      if (!conversationId) return;
      try {
        const fetched = await getMessages(conversationId);
        const sorted = [...fetched].sort(byTime);
        setMessages((prev) => {
          // Keep any optimistic bubble the server hasn't echoed back yet.
          const pending = prev.filter(
            (m) => m.status === 'SENDING' && !sorted.some((s) => s.content === m.content && s.senderId === m.senderId),
          );
          return [...sorted, ...pending];
        });
        if (!silent) setError('');
        await markRead(sorted[sorted.length - 1]?.createdAt);
      } catch (err) {
        if (!silent) setError(apiErrorMessage(err, 'Could not load this conversation.'));
      }
    },
    [conversationId, markRead],
  );

  useEffect(() => {
    load(false).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !user || sending) return;

    const optimistic: ChatMessage = {
      id: -Date.now(),
      clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      conversationId,
      senderId: user.id,
      senderName: user.fullName,
      type: 'TEXT',
      content,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);
    setError('');

    try {
      await sendMessage(conversationId, content);
      await load(true);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.clientMessageId !== optimistic.clientMessageId));
      setDraft(content);
      setError(apiErrorMessage(err, 'Could not send that message.'));
    } finally {
      setSending(false);
    }
  };

  // Newest-first data in an inverted list keeps the thread pinned to the latest
  // message and behaves correctly when the keyboard opens.
  const data = [...messages].reverse();

  return (
    // The header band paints under the status bar itself, so 'top' is left off.
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <HeaderBand>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}>
            <Ionicons name="chevron-back" size={19} color={colors.onChrome} />
          </Pressable>
          <Avatar name={name} size={38} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {name || 'Conversation'}
            </Text>
            <Text style={styles.headerMeta} numberOfLines={1}>
              {sending ? 'Sending…' : 'Messages refresh automatically'}
            </Text>
          </View>
        </View>
      </HeaderBand>

      <View style={sheetStyle}>
        {error ? <Banner message={error} style={styles.banner} /> : null}

        {/* 'padding' on both platforms — under edge-to-edge Android the window
            doesn't resize, which would leave the composer behind the keyboard. */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.flex}>
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="No messages yet"
                description="Say hello to start the conversation."
              />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={data}
              inverted
              keyExtractor={(item) => `${item.id}-${item.clientMessageId ?? ''}`}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const mine = item.senderId === user?.id;
                // `data` is newest-first, so the "next" item is the older one.
                const older = data[index + 1];
                const showDate =
                  !older || formatDate(older.createdAt) !== formatDate(item.createdAt);
                return (
                  <View>
                    {/* The divider precedes the bubble so it sits above the day's
                        first message once the inverted list flips cell order. */}
                    {showDate ? (
                      <View style={styles.dateDivider}>
                        <Text style={styles.dateDividerText}>{formatDate(item.createdAt)}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                        {!mine && item.senderName ? (
                          <Text style={styles.sender} numberOfLines={1}>
                            {item.senderName}
                          </Text>
                        ) : null}
                        <Text style={[styles.message, mine && styles.messageMine]}>{item.content}</Text>
                        <View style={styles.metaRow}>
                          <Text style={[styles.time, mine && styles.timeMine]}>
                            {formatChatTimestamp(item.createdAt)}
                          </Text>
                          {mine ? (
                            <Ionicons
                              name={item.status === 'SENDING' ? 'time-outline' : 'checkmark-done'}
                              size={12}
                              color={colors.onChromeMuted}
                            />
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message…"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => [
                styles.send,
                { opacity: !draft.trim() || sending ? 0.45 : pressed ? 0.8 : 1 },
              ]}>
              <Ionicons name="send" size={16} color={colors.onBrand} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.chromeGlass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chromeGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerName: {
    fontSize: font.lg + 1,
    fontWeight: '700',
    color: colors.onChrome,
  },
  headerMeta: {
    fontSize: font.xs,
    color: colors.onChromeMuted,
    marginTop: 1,
  },
  banner: { marginHorizontal: SCREEN_PADDING, marginTop: spacing.md },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: colors.brand,
    borderBottomRightRadius: radius.sm / 2,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sender: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.brand,
  },
  message: {
    fontSize: font.md + 1,
    lineHeight: 19,
    color: colors.text,
  },
  messageMine: { color: colors.onBrand },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
  },
  time: {
    fontSize: 10,
    color: colors.textFaint,
  },
  timeMine: { color: colors.onChromeMuted },
  dateDivider: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dateDividerText: {
    fontSize: font.xs,
    color: colors.textFaint,
    backgroundColor: colors.neutralTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    fontSize: font.md + 1,
    color: colors.text,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
