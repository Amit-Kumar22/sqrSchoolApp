import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { apiErrorMessage } from '@/api/client';
import {
  createDirectConversation,
  getConversations,
  getMessages,
  searchStaff,
  type ChatMessage,
  type Conversation,
  type StaffMember,
} from '@/api/services/communication';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Layout';
import { countUnread, loadLastRead, type LastReadMap } from '@/components/messaging/lastRead';
import { colors, font, radius, spacing } from '@/theme';
import { formatChatTimestamp, formatEnumLabel } from '@/utils/format';

interface ConversationListProps {
  /** The panel's own chat route — passed in so each panel keeps its typed href. */
  onOpenChat: (conversation: Conversation) => void;
  /** Hands the parent screen this list's loader, so pull-to-refresh can drive it. */
  onReady?: (reload: () => Promise<void>) => void;
}

function otherMember(conversation: Conversation, currentUserId?: number | null) {
  return conversation.members?.find((m) => m.userId !== currentUserId) ?? conversation.members?.[0];
}

/**
 * Conversation list shared by both panels. Messages for every thread are
 * fetched up front (as the portal does) because the list endpoint returns no
 * preview or unread count.
 */
export default function ConversationList({ onOpenChat, onReady }: ConversationListProps) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesById, setMessagesById] = useState<Record<number, ChatMessage[]>>({});
  const [lastRead, setLastRead] = useState<LastReadMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [directory, setDirectory] = useState<StaffMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await getConversations();
      const entries = await Promise.all(
        list.map(async (conversation) => {
          try {
            const messages = await getMessages(conversation.id);
            return [
              conversation.id,
              [...messages].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              ),
            ] as const;
          } catch {
            return [conversation.id, [] as ChatMessage[]] as const;
          }
        }),
      );
      setConversations(list);
      setMessagesById(Object.fromEntries(entries));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your conversations.'));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Read state is re-read on every focus of the list, so a thread opened and
  // read on the chat screen shows as read when the user comes back here.
  const syncLastRead = useCallback(async () => {
    if (user?.id) setLastRead(await loadLastRead(user.id));
  }, [user?.id]);

  useEffect(() => {
    syncLastRead();
  }, [syncLastRead]);

  useFocusEffect(
    useCallback(() => {
      syncLastRead();
    }, [syncLastRead]),
  );

  useEffect(() => {
    onReady?.(async () => {
      await Promise.all([load(), syncLastRead()]);
    });
  }, [load, syncLastRead, onReady]);

  // Typing a name also searches the staff directory, so the search box doubles
  // as "start a new chat" — same behaviour as the portal.
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setDirectory([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchStaff(term);
        if (!cancelled) setDirectory(results);
      } catch {
        if (!cancelled) setDirectory([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const sorted = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aMsgs = messagesById[a.id] ?? [];
      const bMsgs = messagesById[b.id] ?? [];
      const aTime = new Date(aMsgs[aMsgs.length - 1]?.createdAt ?? a.updatedAt).getTime();
      const bTime = new Date(bMsgs[bMsgs.length - 1]?.createdAt ?? b.updatedAt).getTime();
      return bTime - aTime;
    });
  }, [conversations, messagesById]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((conversation) => conversation.name?.toLowerCase().includes(query));
  }, [sorted, search]);

  const existingDirectIds = useMemo(() => {
    const ids = new Set<number>();
    conversations.forEach((conversation) => {
      if (conversation.type === 'DIRECT') {
        const other = otherMember(conversation, user?.id);
        if (other) ids.add(other.userId);
      }
    });
    return ids;
  }, [conversations, user?.id]);

  const suggestions = useMemo(
    () => directory.filter((person) => person.id !== user?.id && !existingDirectIds.has(person.id)),
    [directory, user?.id, existingDirectIds],
  );

  const startChat = async (person: StaffMember) => {
    setStartingId(person.id);
    setError('');
    try {
      const conversation = await createDirectConversation(person.id);
      setConversations((prev) => (prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]));
      setSearch('');
      setDirectory([]);
      onOpenChat(conversation);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not start a conversation with that person.'));
    } finally {
      setStartingId(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <TextField
        icon="search-outline"
        placeholder="Search chats or people"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {error ? <Banner message={error} /> : null}

      {loading ? (
        <SkeletonList rows={5} height={62} />
      ) : (
        <>
          {filtered.length === 0 && suggestions.length === 0 ? (
            <Card>
              <EmptyState
                icon="chatbubbles-outline"
                title={search ? 'No matches' : 'No conversations yet'}
                description={
                  search
                    ? `Nothing matches “${search}”.`
                    : 'Search for a teacher or student above to start chatting.'
                }
              />
            </Card>
          ) : null}

          {filtered.length > 0 ? (
            <View style={styles.list}>
              {filtered.map((conversation) => {
                const messages = messagesById[conversation.id] ?? [];
                const last = messages[messages.length - 1];
                const unread = countUnread(messages, user?.id, lastRead[conversation.id]);
                const other = otherMember(conversation, user?.id);
                return (
                  <Pressable
                    key={conversation.id}
                    onPress={() => onOpenChat(conversation)}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
                    <Avatar name={conversation.name} size={42} />
                    <View style={styles.rowBody}>
                      <View style={styles.rowHead}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {conversation.name}
                        </Text>
                        {last ? (
                          <Text style={styles.rowTime}>{formatChatTimestamp(last.createdAt)}</Text>
                        ) : null}
                      </View>
                      <View style={styles.rowHead}>
                        <Text
                          style={[styles.rowPreview, unread > 0 && styles.rowPreviewUnread]}
                          numberOfLines={1}>
                          {last
                            ? `${last.senderId === user?.id ? 'You: ' : ''}${last.content}`
                            : conversation.type === 'GROUP'
                              ? `${conversation.members?.length ?? 0} members`
                              : formatEnumLabel(other?.role ?? '')}
                        </Text>
                        {unread > 0 ? (
                          <View style={styles.unread}>
                            <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {suggestions.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Start a new chat</Text>
              <View style={styles.list}>
                {suggestions.map((person) => (
                  <Pressable
                    key={person.id}
                    disabled={startingId !== null}
                    onPress={() => startChat(person)}
                    style={({ pressed }) => [
                      styles.row,
                      { opacity: startingId !== null && startingId !== person.id ? 0.5 : 1 },
                      pressed && { backgroundColor: colors.surfaceAlt },
                    ]}>
                    <Avatar
                      name={person.fullName}
                      size={42}
                      background={colors.neutralTint}
                      color={colors.textMuted}
                    />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {person.fullName}
                      </Text>
                      <Text style={styles.rowPreview} numberOfLines={1}>
                        {formatEnumLabel(person.role)} · {person.email}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {searching ? <Text style={styles.searching}>Searching people…</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    flex: 1,
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  rowTime: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  rowPreview: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textFaint,
  },
  rowPreviewUnread: { color: colors.text, fontWeight: '600' },
  unread: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onBrand,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  searching: {
    fontSize: font.xs,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
