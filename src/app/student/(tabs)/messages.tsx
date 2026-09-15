import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';

import ConversationList from '@/components/messaging/ConversationList';
import { PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { spacing } from '@/theme';

export default function StudentMessagesScreen() {
  const reload = useRef<(() => Promise<void>) | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload.current?.();
    setRefreshing(false);
  }, []);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={{ gap: spacing.md }}
      header={<PageTitle title="Messages" subtitle="Chat with your teachers" />}>
      <ConversationList
        onReady={(fn) => {
          reload.current = fn;
        }}
        onOpenChat={(conversation) =>
          router.push({
            pathname: '/student/chat/[id]',
            params: { id: String(conversation.id), name: conversation.name ?? 'Chat' },
          })
        }
      />
    </Screen>
  );
}
