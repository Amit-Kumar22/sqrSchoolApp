import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';

import ConversationList from '@/components/messaging/ConversationList';
import { ScreenHeader } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { spacing } from '@/theme';

export default function TeacherMessagesScreen() {
  const reload = useRef<(() => Promise<void>) | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload.current?.();
    setRefreshing(false);
  }, []);

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={{ gap: spacing.md }}
      header={<ScreenHeader title="Messages" subtitle="Chat with staff and students" />}>
      <ConversationList
        onReady={(fn) => {
          reload.current = fn;
        }}
        onOpenChat={(conversation) =>
          router.push({
            pathname: '/teacher/chat/[id]',
            params: { id: String(conversation.id), name: conversation.name ?? 'Chat' },
          })
        }
      />
    </Screen>
  );
}
