import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { apiErrorMessage } from '@/api/client';
import {
  checkInStudent,
  checkInTeacher,
  checkOut,
  getStudentsByClassTeacher,
  getUserTodayAttendance,
  type Attendance,
  type ClassTeacherStudent,
} from '@/api/services/attendance';
import { useAuth } from '@/auth/AuthContext';
import { statusTone } from '@/components/attendance/attendanceDisplay';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge, Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { Avatar, PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { formatClockTime, formatEnumLabel } from '@/utils/format';
import { getCurrentCoordinates } from '@/utils/location';

const PAGE_SIZE = 20;

type SelfStatus = 'idle' | 'checked-in' | 'checked-out';

/**
 * Teacher attendance — the teacher's own GPS check-in/out plus their class
 * roster, where each student is checked in from the teacher's position. Same
 * endpoints and same rules as the portal's Attendance workspace.
 */
export default function TeacherAttendanceScreen() {
  const { user } = useAuth();

  // ── Self ────────────────────────────────────────────────────────────────────
  const [selfRecord, setSelfRecord] = useState<Attendance | null>(null);
  const [selfLoading, setSelfLoading] = useState(true);
  const [selfBusy, setSelfBusy] = useState<'in' | 'out' | null>(null);
  const [selfError, setSelfError] = useState('');

  // ── Roster ──────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<ClassTeacherStudent[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(true);
  const [total, setTotal] = useState(0);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [search, setSearch] = useState('');

  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set());
  const [statusLoading, setStatusLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const selfStatus: SelfStatus = selfRecord?.logoutTime
    ? 'checked-out'
    : selfRecord?.loginTime
      ? 'checked-in'
      : 'idle';

  const loadSelf = useCallback(async () => {
    if (!user?.id) return;
    try {
      setSelfRecord(await getUserTodayAttendance(user.id));
    } catch {
      // Today's own record is a nicety — the check-in buttons still work.
    }
  }, [user?.id]);

  const loadRoster = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!user?.email) return;
      replace ? setRosterLoading(true) : setLoadingMore(true);
      setRosterError('');
      try {
        const result = await getStudentsByClassTeacher({
          reqEmail: user.email,
          page: nextPage,
          size: PAGE_SIZE,
        });
        const content = result.content ?? [];
        setStudents((prev) => (replace ? content : [...prev, ...content]));
        setPage(result.pageNumber ?? nextPage);
        setIsLast(result.last ?? true);
        setTotal(result.totalElements ?? content.length);
      } catch (err) {
        setRosterError(apiErrorMessage(err, 'Could not load your class roster.'));
        if (replace) setStudents([]);
      } finally {
        replace ? setRosterLoading(false) : setLoadingMore(false);
      }
    },
    [user?.email],
  );

  useEffect(() => {
    loadSelf().finally(() => setSelfLoading(false));
  }, [loadSelf]);

  useEffect(() => {
    loadRoster(0, true);
  }, [loadRoster]);

  // Resolve each student's real "checked in today" state from the backend —
  // local state alone would forget check-ins across an app restart.
  useEffect(() => {
    if (students.length === 0) return;
    let cancelled = false;
    setStatusLoading(true);
    Promise.all(students.map((student) => getUserTodayAttendance(student.id).catch(() => null)))
      .then((records) => {
        if (cancelled) return;
        setCheckedInIds((prev) => {
          const next = new Set(prev);
          records.forEach((record, index) => {
            if (record?.loginTime) next.add(students[index].id);
          });
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [students]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCheckedInIds(new Set());
    await Promise.all([loadSelf(), loadRoster(0, true)]);
    setRefreshing(false);
  }, [loadSelf, loadRoster]);

  const handleSelfMark = async (action: 'in' | 'out') => {
    setSelfBusy(action);
    setSelfError('');
    try {
      const coords = await getCurrentCoordinates();
      if (action === 'in') await checkInTeacher(coords);
      else await checkOut(coords);
      await loadSelf();
    } catch (err) {
      setSelfError(
        err instanceof Error && !(err as { response?: unknown }).response
          ? err.message
          : apiErrorMessage(err, action === 'in' ? 'Check-in failed.' : 'Check-out failed.'),
      );
    } finally {
      setSelfBusy(null);
    }
  };

  const handleStudentCheckIn = async (student: ClassTeacherStudent) => {
    setCheckingInId(student.id);
    setRosterError('');
    try {
      const coords = await getCurrentCoordinates();
      await checkInStudent(student.id, coords);
      setCheckedInIds((prev) => new Set(prev).add(student.id));
    } catch (err) {
      setRosterError(
        err instanceof Error && !(err as { response?: unknown }).response
          ? err.message
          : apiErrorMessage(err, `Could not check in ${student.fullName}.`),
      );
    } finally {
      setCheckingInId(null);
    }
  };

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(query) || student.email?.toLowerCase().includes(query),
    );
  }, [students, search]);

  const presentCount = checkedInIds.size;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <PageTitle title="Attendance" subtitle="Mark yourself in, then your class" />

      {/* ── My attendance ── */}
      <Card style={styles.selfCard}>
        <View style={styles.selfHead}>
          <View style={styles.selfIcon}>
            <Ionicons name="location-outline" size={16} color={colors.brand} />
          </View>
          <View style={styles.selfText}>
            <Text style={styles.selfTitle}>My attendance</Text>
            <Text style={styles.selfMeta} numberOfLines={1}>
              {selfLoading
                ? 'Checking today’s status…'
                : selfStatus === 'checked-in'
                  ? `Checked in at ${formatClockTime(selfRecord?.loginTime)}`
                  : selfStatus === 'checked-out'
                    ? `Checked out at ${formatClockTime(selfRecord?.logoutTime)}`
                    : 'Not checked in yet today.'}
            </Text>
          </View>
          {selfRecord ? (
            <Badge label={formatEnumLabel(selfRecord.status)} toneName={statusTone(selfRecord.status)} />
          ) : null}
        </View>

        {selfError ? <Banner message={selfError} style={{ marginTop: spacing.md }} /> : null}

        <View style={styles.selfActions}>
          <Button
            label="Check In"
            icon="log-in-outline"
            size="sm"
            loading={selfBusy === 'in'}
            disabled={selfLoading || selfBusy !== null || selfStatus !== 'idle'}
            onPress={() => handleSelfMark('in')}
            style={styles.flex}
          />
          <Button
            label="Check Out"
            icon="log-out-outline"
            variant="secondary"
            size="sm"
            loading={selfBusy === 'out'}
            disabled={selfLoading || selfBusy !== null || selfStatus !== 'checked-in'}
            onPress={() => handleSelfMark('out')}
            style={styles.flex}
          />
          <Button
            label="History"
            icon="calendar-outline"
            variant="secondary"
            size="sm"
            disabled={!user?.id}
            onPress={() =>
              router.push({
                pathname: '/teacher/attendance-history/[id]',
                params: { id: String(user?.id), name: 'My attendance' },
              })
            }
            style={styles.flex}
          />
        </View>
      </Card>

      {/* ── Class roster ── */}
      <View style={styles.rosterHead}>
        <Text style={styles.rosterTitle}>My class</Text>
        <Text style={styles.rosterMeta}>
          {statusLoading ? 'Checking…' : `${presentCount}/${total || students.length} checked in`}
        </Text>
      </View>

      <TextField
        icon="search-outline"
        placeholder="Search students"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {rosterError ? <Banner message={rosterError} /> : null}

      {rosterLoading ? (
        <SkeletonList rows={5} height={62} />
      ) : visibleStudents.length === 0 ? (
        <Card>
          <EmptyState
            icon="people-outline"
            title={search ? 'No matching students' : 'No students found'}
            description={
              search
                ? `Nothing matches “${search}”.`
                : 'Students appear here once your class roster is set up by the school.'
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {visibleStudents.map((student) => {
            const checkedIn = checkedInIds.has(student.id);
            return (
              <Pressable
                key={student.id}
                onPress={() =>
                  router.push({
                    pathname: '/teacher/attendance-history/[id]',
                    params: { id: String(student.id), name: student.fullName },
                  })
                }
                style={({ pressed }) => [styles.studentRow, pressed && { backgroundColor: colors.surfaceAlt }]}>
                <Avatar
                  name={student.fullName}
                  size={36}
                  background={checkedIn ? colors.successTint : colors.neutralTint}
                  color={checkedIn ? colors.success : colors.textMuted}
                />
                <View style={styles.studentBody}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {student.fullName}
                  </Text>
                  <Text style={styles.studentMeta} numberOfLines={1}>
                    {student.email || student.phone || '—'}
                  </Text>
                </View>
                {statusLoading && !checkedIn ? (
                  <ActivityIndicator size="small" color={colors.textFaint} />
                ) : checkedIn ? (
                  <Badge label="Checked in" toneName="success" icon="checkmark-circle" />
                ) : (
                  <Button
                    label="Check in"
                    size="sm"
                    loading={checkingInId === student.id}
                    disabled={checkingInId !== null}
                    onPress={() => handleStudentCheckIn(student)}
                  />
                )}
              </Pressable>
            );
          })}

          {!isLast && !search ? (
            <Button
              label={loadingMore ? 'Loading…' : 'Load more students'}
              variant="secondary"
              size="sm"
              loading={loadingMore}
              onPress={() => loadRoster(page + 1, false)}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  flex: { flex: 1 },
  selfCard: { gap: spacing.md },
  selfHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selfIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfText: { flex: 1 },
  selfTitle: {
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  selfMeta: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  selfActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rosterHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  rosterTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
  },
  rosterMeta: {
    fontSize: font.sm,
    color: colors.textFaint,
    fontWeight: '600',
  },
  list: { gap: spacing.sm },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  studentBody: { flex: 1 },
  studentName: {
    fontSize: font.md + 1,
    fontWeight: '600',
    color: colors.text,
  },
  studentMeta: {
    fontSize: font.xs,
    color: colors.textFaint,
    marginTop: 1,
  },
});
