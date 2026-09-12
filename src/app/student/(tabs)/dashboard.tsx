import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { apiErrorMessage } from '@/api/client';
import { getStudentDashboard, type StudentDashboard } from '@/api/services/dashboard';
import { useAuth } from '@/auth/AuthContext';
import BarChart from '@/components/charts/BarChart';
import Donut from '@/components/charts/Donut';
import HeroHeader from '@/components/dashboard/HeroHeader';
import { NoticePanel, TimetablePanel } from '@/components/dashboard/Panels';
import { SectionCard } from '@/components/ui/Card';
import { Badge, Banner, EmptyState, InfoRow, SkeletonList } from '@/components/ui/Feedback';
import { StatCard, StatGrid } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing, type ToneName } from '@/theme';
import { formatCompactCurrency, formatCurrency, formatDateShort } from '@/utils/format';

const LEAVE_TONE: Record<string, ToneName> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
};

export default function StudentDashboardScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setDashboard(await getStudentDashboard());
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

  // Nested sections can come back null despite the declared types (seen on the
  // portal too), so each one degrades to an empty shape instead of throwing.
  const profile = dashboard?.profile;
  const attendance = dashboard?.attendance ?? {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    attendancePercentage: 0,
    recentAttendance: [],
  };
  const fees = dashboard?.fees ?? {
    totalFees: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    collectionPercentage: 0,
  };
  const exams = dashboard?.exams ?? {
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    upcomingExams: 0,
    averagePercentage: 0,
    upcomingExamList: [],
  };
  const leave = dashboard?.leave ?? {
    approvedDays: 0,
    pendingCount: 0,
    rejectedCount: 0,
    recentLeaves: [],
  };
  const results = dashboard?.recentResults ?? [];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <HeroHeader
        name={profile?.fullName ?? user?.fullName}
        roleLabel="Student"
        meta={[profile?.className, profile?.rollNumber && `Roll ${profile.rollNumber}`]
          .filter(Boolean)
          .join(' · ')}
        action={
          <Pressable
            onPress={() => router.push('/student/messages')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open messages"
            style={styles.heroAction}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.onBrand} />
          </Pressable>
        }
      />

      {error ? <Banner message={error} /> : null}

      {loading ? (
        <SkeletonList rows={4} height={92} />
      ) : dashboard ? (
        <>
          <StatGrid>
            <StatCard
              icon="checkmark-done-outline"
              label="Attendance"
              value={`${Math.round(attendance.attendancePercentage ?? 0)}%`}
              toneName="success"
              caption={`${attendance.presentDays}/${attendance.totalDays} days`}
            />
            <StatCard
              icon="wallet-outline"
              label="Fee pending"
              value={formatCompactCurrency(fees.pendingAmount)}
              toneName={fees.pendingAmount > 0 ? 'warning' : 'success'}
              caption={`${fees.pendingCount} pending`}
            />
            <StatCard
              icon="document-text-outline"
              label="Upcoming exams"
              value={`${exams.upcomingExams}`}
              toneName="info"
            />
            <StatCard
              icon="trophy-outline"
              label="Average score"
              value={`${Math.round(exams.averagePercentage ?? 0)}%`}
              toneName="brand"
              caption={`${exams.passedExams} passed`}
            />
          </StatGrid>

          <SectionCard
            title="Attendance"
            subtitle={`${attendance.totalDays} days on record`}
            icon="pie-chart-outline"
            actionLabel="View"
            onAction={() => router.push('/student/attendance')}>
            <View style={styles.donutRow}>
              <Donut percentage={attendance.attendancePercentage} label="Present rate" size={100} />
              <View style={styles.legend}>
                <LegendRow color={colors.success} label="Present" value={attendance.presentDays} />
                <LegendRow color={colors.danger} label="Absent" value={attendance.absentDays} />
                <LegendRow color={colors.warning} label="Late" value={attendance.lateDays} />
                <LegendRow color={colors.textFaint} label="Half day" value={attendance.halfDays} />
              </View>
            </View>
          </SectionCard>

          <TimetablePanel entries={dashboard.todayTimetable ?? []} />

          <SectionCard title="Recent results" subtitle="Percentage per subject" icon="school-outline">
            <BarChart
              data={results.map((result) => ({
                label: result.subjectName,
                value: Math.round(result.percentage ?? 0),
                color: result.absent ? colors.textFaint : result.passed ? colors.success : colors.danger,
              }))}
              formatValue={(value) => `${value}%`}
              emptyMessage="Results appear here once exams are marked."
            />
          </SectionCard>

          <SectionCard title="Fees" icon="wallet-outline">
            <View style={styles.feeRow}>
              <Donut
                percentage={fees.collectionPercentage}
                label="Collected"
                size={92}
                color={colors.brand}
              />
              <View style={styles.feeList}>
                <InfoRow label="Total" value={formatCurrency(fees.totalFees)} />
                <InfoRow label="Paid" value={formatCurrency(fees.paidAmount)} />
                <InfoRow label="Pending" value={formatCurrency(fees.pendingAmount)} />
                <InfoRow label="Overdue" value={`${fees.overdueCount}`} />
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Upcoming exams" icon="clipboard-outline">
            {exams.upcomingExamList.length === 0 ? (
              <EmptyState
                icon="clipboard-outline"
                title="No upcoming exams"
                description="You're all clear for now."
              />
            ) : (
              <View style={styles.list}>
                {exams.upcomingExamList.map((exam) => (
                  <View key={exam.examId} style={styles.examItem}>
                    <View style={styles.examHead}>
                      <Text style={styles.examTitle} numberOfLines={1}>
                        {exam.title}
                      </Text>
                      {exam.status ? <Badge label={exam.status} toneName="info" /> : null}
                    </View>
                    <Text style={styles.examMeta} numberOfLines={1}>
                      {[exam.examType, exam.className].filter(Boolean).join(' · ')} ·{' '}
                      {formatDateShort(exam.startDate)} – {formatDateShort(exam.endDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard title="Leave" icon="airplane-outline">
            <View style={styles.leaveSummary}>
              <LeaveStat label="Approved" value={leave.approvedDays} />
              <LeaveStat label="Pending" value={leave.pendingCount} />
              <LeaveStat label="Rejected" value={leave.rejectedCount} />
            </View>
            {leave.recentLeaves.length === 0 ? (
              <Text style={styles.leaveEmpty}>No leave requests yet.</Text>
            ) : (
              <View style={styles.list}>
                {leave.recentLeaves.map((item) => (
                  <View key={item.leaveId} style={styles.leaveItem}>
                    <View style={styles.examHead}>
                      <Text style={styles.leaveType} numberOfLines={1}>
                        {item.leaveType}
                      </Text>
                      <Badge label={item.status} toneName={LEAVE_TONE[item.status?.toUpperCase()] ?? 'neutral'} />
                    </View>
                    <Text style={styles.examMeta} numberOfLines={1}>
                      {formatDateShort(item.fromDate)} – {formatDateShort(item.toDate)} · {item.numberOfDays}d
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard title="My details" icon="id-card-outline">
            <InfoRow label="Admission no." value={profile?.admissionNumber} />
            <InfoRow label="Class" value={profile?.className} />
            <InfoRow label="Roll number" value={profile?.rollNumber} />
            <InfoRow label="Academic year" value={profile?.academicYear} />
            <InfoRow label="Father" value={profile?.fatherName} />
            <InfoRow label="Mother" value={profile?.motherName} />
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

function LeaveStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.leaveStat}>
      <Text style={styles.leaveValue}>{value}</Text>
      <Text style={styles.leaveLabel}>{label}</Text>
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
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  feeList: { flex: 1 },
  list: { gap: spacing.sm },
  examItem: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    gap: 3,
  },
  examHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  examTitle: {
    flex: 1,
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  examMeta: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  leaveSummary: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  leaveStat: { flex: 1, alignItems: 'center' },
  leaveValue: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.text,
  },
  leaveLabel: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  leaveItem: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    gap: 3,
  },
  leaveType: {
    flex: 1,
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  leaveEmpty: {
    fontSize: font.sm,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
