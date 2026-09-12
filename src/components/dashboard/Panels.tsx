import { StyleSheet, Text, View } from 'react-native';

import type { DashboardNotice, DashboardTimetableEntry } from '@/api/services/dashboard';
import { formatTime } from '@/api/services/timetable';
import { SectionCard } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { colors, font, radius, spacing, type ToneName } from '@/theme';
import { formatDateShort } from '@/utils/format';

const PRIORITY_TONE: Record<string, ToneName> = {
  HIGH: 'danger',
  URGENT: 'danger',
  MEDIUM: 'warning',
  NORMAL: 'info',
  LOW: 'neutral',
};

/** Today's periods, in order — shared by the teacher and student dashboards. */
export function TimetablePanel({ entries }: { entries: DashboardTimetableEntry[] }) {
  return (
    <SectionCard title="Today's schedule" subtitle={`${entries.length} period${entries.length === 1 ? '' : 's'}`} icon="time-outline">
      {entries.length === 0 ? (
        <EmptyState icon="cafe-outline" title="No periods today" description="Enjoy the free day." />
      ) : (
        <View style={styles.list}>
          {entries.map((entry, index) => (
            <View key={`${entry.periodName}-${index}`} style={styles.period}>
              <View style={styles.timeColumn}>
                <Text style={styles.time}>{formatTime(entry.startTime)}</Text>
                <Text style={styles.timeEnd}>{formatTime(entry.endTime)}</Text>
              </View>
              <View style={[styles.rail, entry.breakPeriod && { backgroundColor: colors.borderStrong }]} />
              <View style={styles.periodBody}>
                <Text style={styles.periodTitle} numberOfLines={1}>
                  {entry.breakPeriod ? 'Break' : entry.subjectName || 'Subject'}
                </Text>
                <Text style={styles.periodMeta} numberOfLines={1}>
                  {[entry.periodName, entry.teacherName].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

/** Recent notices feed. */
export function NoticePanel({ notices }: { notices: DashboardNotice[] }) {
  return (
    <SectionCard title="Notice board" subtitle="Latest announcements" icon="megaphone-outline">
      {notices.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="No notices" description="New announcements will appear here." />
      ) : (
        <View style={styles.list}>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.notice}>
              <View style={styles.noticeHead}>
                <Text style={styles.noticeTitle} numberOfLines={1}>
                  {notice.title}
                </Text>
                {notice.priority ? (
                  <Badge
                    label={notice.priority}
                    toneName={PRIORITY_TONE[notice.priority?.toUpperCase()] ?? 'neutral'}
                  />
                ) : null}
              </View>
              {notice.content ? (
                <Text style={styles.noticeBody} numberOfLines={2}>
                  {notice.content}
                </Text>
              ) : null}
              <Text style={styles.noticeMeta} numberOfLines={1}>
                {[notice.authorName, formatDateShort(notice.publishDate)].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  period: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeColumn: { width: 62 },
  time: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.text,
  },
  timeEnd: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  rail: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  periodBody: {
    flex: 1,
    paddingVertical: 2,
  },
  periodTitle: {
    fontSize: font.md + 1,
    fontWeight: '600',
    color: colors.text,
  },
  periodMeta: {
    fontSize: font.xs,
    color: colors.textFaint,
    marginTop: 1,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    gap: 3,
  },
  noticeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noticeTitle: {
    flex: 1,
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  noticeBody: {
    fontSize: font.sm,
    color: colors.textMuted,
    lineHeight: 17,
  },
  noticeMeta: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
});
