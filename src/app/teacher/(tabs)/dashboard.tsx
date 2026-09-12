import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { apiErrorMessage } from '@/api/client';
import { getTeacherDashboard, type TeacherDashboard } from '@/api/services/dashboard';
import { useAuth } from '@/auth/AuthContext';
import BarChart from '@/components/charts/BarChart';
import Donut from '@/components/charts/Donut';
import HeroHeader from '@/components/dashboard/HeroHeader';
import { NoticePanel, TimetablePanel } from '@/components/dashboard/Panels';
import { SectionCard } from '@/components/ui/Card';
import { Badge, Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { StatCard, StatGrid } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

const QUICK_ACTIONS = [
  { icon: 'checkbox-outline', label: 'Attendance', href: '/teacher/attendance' },
  { icon: 'book-outline', label: 'Homework', href: '/teacher/homework' },
  { icon: 'chatbubbles-outline', label: 'Messages', href: '/teacher/messages' },
  { icon: 'sunny-outline', label: 'Holidays', href: '/teacher/holidays' },
] as const;

export default function TeacherDashboardScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setDashboard(await getTeacherDashboard());
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your dashboard.'));
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

  const profile = dashboard?.profile;
  const attendance = dashboard?.attendanceOverview;
  const students = dashboard?.studentOverview;
  const exams = dashboard?.examSummary;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <HeroHeader
        name={profile?.fullName ?? user?.fullName}
        roleLabel="Teacher"
        meta={profile?.employeeCode}
        action={
          <Pressable
            onPress={() => router.push('/teacher/messages')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open messages"
            style={styles.heroAction}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.onBrand} />
          </Pressable>
        }
      />

      {error ? <Banner message={error} /> : null}

      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.href)}
            style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.75 }]}>
            <View style={styles.quickIcon}>
              <Ionicons name={action.icon} size={17} color={colors.brand} />
            </View>
            <Text style={styles.quickLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <SkeletonList rows={4} height={92} />
      ) : dashboard ? (
        <>
          <StatGrid>
            <StatCard
              icon="library-outline"
              label="My classes"
              value={`${students?.totalClasses ?? 0}`}
              toneName="brand"
            />
            <StatCard
              icon="people-outline"
              label="My students"
              value={`${students?.totalStudents ?? 0}`}
              toneName="info"
              caption={`${students?.activeStudents ?? 0} active`}
            />
            <StatCard
              icon="checkmark-done-outline"
              label="Attendance today"
              value={`${Math.round(attendance?.attendancePercentage ?? 0)}%`}
              toneName="success"
              caption={`${attendance?.presentCount ?? 0} present`}
            />
            <StatCard
              icon="book-outline"
              label="Homework this week"
              value={`${dashboard.homeworkSummary?.thisWeekHomework ?? 0}`}
              toneName="warning"
              caption={`${dashboard.homeworkSummary?.totalHomework ?? 0} total`}
            />
          </StatGrid>

          <SectionCard
            title="Today's attendance"
            subtitle={attendance?.date ? formatDate(attendance.date) : undefined}
            icon="pie-chart-outline">
            <View style={styles.donutRow}>
              <Donut percentage={attendance?.attendancePercentage} label="Present rate" size={100} />
              <View style={styles.legend}>
                <LegendRow color={colors.success} label="Present" value={attendance?.presentCount ?? 0} />
                <LegendRow color={colors.danger} label="Absent" value={attendance?.absentCount ?? 0} />
                <LegendRow color={colors.warning} label="Late" value={attendance?.lateCount ?? 0} />
                <LegendRow
                  color={colors.textFaint}
                  label="Marked"
                  value={attendance?.totalRecords ?? 0}
                />
              </View>
            </View>
          </SectionCard>

          <TimetablePanel entries={dashboard.todayTimetable ?? []} />

          <SectionCard title="My classes" icon="school-outline">
            {!dashboard.assignedClasses || dashboard.assignedClasses.length === 0 ? (
              <EmptyState
                icon="school-outline"
                title="No classes assigned"
                description="Your principal hasn't assigned you a class yet."
              />
            ) : (
              <View style={styles.classList}>
                {dashboard.assignedClasses.map((item) => (
                  <View key={item.classId} style={styles.classRow}>
                    <View style={styles.classIcon}>
                      <Text style={styles.classIconText} numberOfLines={1}>
                        {item.className?.replace(/[^0-9A-Za-z]/g, '').slice(0, 3) || '—'}
                      </Text>
                    </View>
                    <View style={styles.classBody}>
                      <Text style={styles.className} numberOfLines={1}>
                        {item.className}
                      </Text>
                      <Text style={styles.classMeta}>{item.studentCount} students</Text>
                    </View>
                    <Badge
                      label={item.isClassTeacher ? 'Class teacher' : 'Subject'}
                      toneName={item.isClassTeacher ? 'success' : 'neutral'}
                    />
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard title="Exams" subtitle="Across your classes" icon="clipboard-outline">
            <BarChart
              data={[
                { label: 'Upcoming', value: exams?.upcomingExams ?? 0, color: colors.info },
                { label: 'Completed', value: exams?.completedExams ?? 0, color: colors.success },
                { label: 'Pending results', value: exams?.pendingResults ?? 0, color: colors.warning },
              ]}
            />
          </SectionCard>

          <SectionCard title="My profile" subtitle={profile?.primarySubject} icon="id-card-outline">
            <View style={styles.profileGrid}>
              <ProfileCell label="Qualification" value={profile?.qualification} />
              <ProfileCell label="Experience" value={`${profile?.experienceYears ?? 0} yrs`} />
              <ProfileCell label="Phone" value={profile?.phone} />
              <ProfileCell label="Email" value={profile?.email} />
            </View>
            {profile?.assignedClassNames && profile.assignedClassNames.length > 0 ? (
              <View style={styles.chipRow}>
                {profile.assignedClassNames.map((name) => (
                  <Badge key={name} label={name} toneName="brand" />
                ))}
              </View>
            ) : null}
          </SectionCard>

          <NoticePanel notices={dashboard.recentNotices ?? []} />
        </>
      ) : null}
    </Screen>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function ProfileCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.profileCell}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md, gap: spacing.lg },
  heroAction: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: font.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: { width: 8, height: 8, borderRadius: radius.pill },
  legendLabel: { flex: 1, fontSize: font.sm, color: colors.textMuted },
  legendValue: { fontSize: font.md, fontWeight: '700', color: colors.text },
  classList: { gap: spacing.md },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  classIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classIconText: {
    fontSize: font.sm,
    fontWeight: '800',
    color: colors.brand,
  },
  classBody: { flex: 1 },
  className: {
    fontSize: font.md + 1,
    fontWeight: '600',
    color: colors.text,
  },
  classMeta: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  profileCell: { width: '50%', paddingRight: spacing.md },
  profileLabel: { fontSize: font.xs, color: colors.textFaint },
  profileValue: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
