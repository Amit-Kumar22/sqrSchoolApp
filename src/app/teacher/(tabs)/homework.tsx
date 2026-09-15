import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { apiErrorMessage } from '@/api/client';
import { getTeacherDashboard } from '@/api/services/dashboard';
import {
  addDailyHomework,
  createHomework,
  deleteHomework,
  getTeacherHomeworks,
  type Homework,
} from '@/api/services/homework';
import {
  formatTime,
  getTeacherWeeklyTimetable,
  type TeacherWeeklyTimetableEntry,
} from '@/api/services/timetable';
import Button, { IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import { Badge, Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { SelectField, TextField } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import Sheet, { OptionSheet } from '@/components/ui/Sheet';
import { colors, font, radius, spacing } from '@/theme';
import { dayLabel, formatDate, todayKey } from '@/utils/format';

const PAGE_SIZE = 10;

/** Deduplicated {id, name} options taken from the teacher's own timetable slots. */
function distinctOptions(
  slots: TeacherWeeklyTimetableEntry[],
  idKey: 'classId' | 'subjectId',
  nameKey: 'className' | 'subjectName',
) {
  const map = new Map<number, string>();
  slots.forEach((slot) => map.set(slot[idKey], slot[nameKey]));
  return Array.from(map, ([value, label]) => ({ value, label }));
}

export default function TeacherHomeworkScreen() {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [slots, setSlots] = useState<TeacherWeeklyTimetableEntry[]>([]);

  const [items, setItems] = useState<Homework[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<number | null>(null);
  const [picker, setPicker] = useState<'class' | 'subject' | null>(null);

  const [detail, setDetail] = useState<Homework | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<Homework | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const classOptions = useMemo(() => distinctOptions(slots, 'classId', 'className'), [slots]);
  const subjectOptions = useMemo(() => distinctOptions(slots, 'subjectId', 'subjectName'), [slots]);

  // teacherId comes from the dashboard payload — the homework list is scoped by
  // it, exactly as the portal's Homework page does.
  useEffect(() => {
    getTeacherDashboard()
      .then((dashboard) => setTeacherId(dashboard.profile?.teacherId ?? null))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your teacher profile.')));
    getTeacherWeeklyTimetable()
      .then(setSlots)
      .catch(() => setSlots([]));
  }, []);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!teacherId) return;
      replace ? setLoading(true) : setLoadingMore(true);
      setError('');
      try {
        const result = await getTeacherHomeworks({
          teacherId,
          sectionId: classFilter ?? undefined,
          subjectId: subjectFilter ?? undefined,
          page: nextPage,
          size: PAGE_SIZE,
        });
        const content = result.content ?? [];
        setItems((prev) => (replace ? content : [...prev, ...content]));
        setPage(result.pageNumber ?? nextPage);
        setIsLast(result.last ?? true);
        setTotal(result.totalElements ?? content.length);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load homework.'));
        if (replace) setItems([]);
      } finally {
        replace ? setLoading(false) : setLoadingMore(false);
      }
    },
    [teacherId, classFilter, subjectFilter],
  );

  useEffect(() => {
    if (teacherId) load(0, true);
  }, [teacherId, classFilter, subjectFilter, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(0, true);
    setRefreshing(false);
  }, [load]);

  const handleDelete = (item: Homework) => {
    Alert.alert('Delete homework?', `${item.subjectName} · ${item.className}. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(item.id);
          try {
            await deleteHomework(item.id);
            setItems((prev) => prev.filter((h) => h.id !== item.id));
            setTotal((t) => Math.max(0, t - 1));
          } catch (err) {
            setError(apiErrorMessage(err, 'Could not delete that homework.'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const hasFilters = classFilter !== null || subjectFilter !== null;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}
      header={
        <PageTitle
          title="Homework"
          subtitle={total ? `${total} assigned` : 'Set work for your classes'}
          right={
            <Button
              label="Add"
              icon="add"
              size="sm"
              disabled={slots.length === 0}
              onPress={() => setCreateOpen(true)}
            />
          }
        />
      }>

      {error ? <Banner message={error} /> : null}

      {slots.length === 0 && !loading ? (
        <Banner
          toneName="warning"
          message="No periods are assigned to you on the weekly timetable yet — ask your principal to add you to a class period first."
        />
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterChip
          label={classOptions.find((c) => c.value === classFilter)?.label ?? 'All classes'}
          active={classFilter !== null}
          onPress={() => setPicker('class')}
          disabled={classOptions.length === 0}
        />
        <FilterChip
          label={subjectOptions.find((s) => s.value === subjectFilter)?.label ?? 'All subjects'}
          active={subjectFilter !== null}
          onPress={() => setPicker('subject')}
          disabled={subjectOptions.length === 0}
        />
        {hasFilters ? (
          <FilterChip
            label="Clear"
            icon="close"
            onPress={() => {
              setClassFilter(null);
              setSubjectFilter(null);
            }}
          />
        ) : null}
      </ScrollView>

      {loading ? (
        <SkeletonList rows={4} height={96} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="book-outline"
            title="No homework yet"
            description={
              hasFilters
                ? 'No homework matches these filters.'
                : 'Add homework for one of your scheduled classes to get started.'
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setDetail(item)}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.itemHead}>
                <View style={styles.itemTitles}>
                  <Text style={styles.itemSubject} numberOfLines={1}>
                    {item.subjectName}
                  </Text>
                  <Text style={styles.itemClass} numberOfLines={1}>
                    {item.className} · {item.periodName} · {dayLabel(item.dayOfWeek)}
                  </Text>
                </View>
                <Badge label={`${item.notes?.length ?? 0} entr${item.notes?.length === 1 ? 'y' : 'ies'}`} toneName="brand" />
              </View>

              <View style={styles.itemDates}>
                <View style={styles.dateCell}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textFaint} />
                  <Text style={styles.dateText}>Set {formatDate(item.homeworkDate)}</Text>
                </View>
                <View style={styles.dateCell}>
                  <Ionicons name="alarm-outline" size={12} color={colors.warning} />
                  <Text style={[styles.dateText, { color: colors.warning }]}>
                    Due {formatDate(item.dueDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.itemActions}>
                <Button
                  label="Add note"
                  icon="calendar-number-outline"
                  variant="secondary"
                  size="sm"
                  onPress={() => setNoteTarget(item)}
                />
                <IconButton
                  icon="trash-outline"
                  accessibilityLabel={`Delete homework for ${item.subjectName}`}
                  color={colors.danger}
                  background={colors.dangerTint}
                  disabled={deletingId === item.id}
                  onPress={() => handleDelete(item)}
                />
              </View>
            </Pressable>
          ))}

          {!isLast ? (
            <Button
              label="Load more"
              variant="secondary"
              size="sm"
              loading={loadingMore}
              onPress={() => load(page + 1, false)}
            />
          ) : null}
        </View>
      )}

      <OptionSheet
        visible={picker === 'class'}
        onClose={() => setPicker(null)}
        title="Filter by class"
        options={[{ value: -1, label: 'All classes' }, ...classOptions]}
        selected={classFilter ?? -1}
        onSelect={(value) => setClassFilter(value === -1 ? null : value)}
      />
      <OptionSheet
        visible={picker === 'subject'}
        onClose={() => setPicker(null)}
        title="Filter by subject"
        options={[{ value: -1, label: 'All subjects' }, ...subjectOptions]}
        selected={subjectFilter ?? -1}
        onSelect={(value) => setSubjectFilter(value === -1 ? null : value)}
      />

      <HomeworkDetailSheet item={detail} onClose={() => setDetail(null)} />

      <CreateHomeworkSheet
        visible={createOpen}
        slots={slots}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load(0, true);
        }}
      />

      <AddDailyNoteSheet
        homework={noteTarget}
        onClose={() => setNoteTarget(null)}
        onSaved={() => {
          setNoteTarget(null);
          load(0, true);
        }}
      />
    </Screen>
  );
}

function FilterChip({
  label,
  active = false,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons
        name={icon ?? 'chevron-down'}
        size={13}
        color={active ? colors.onBrand : colors.textFaint}
      />
    </Pressable>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function HomeworkDetailSheet({ item, onClose }: { item: Homework | null; onClose: () => void }) {
  return (
    <Sheet
      visible={!!item}
      onClose={onClose}
      title={item?.subjectName ?? 'Homework'}
      subtitle={item ? `${item.className} · ${item.periodName}` : undefined}>
      {item ? (
        <View style={{ gap: spacing.md }}>
          <View style={styles.detailDates}>
            <Badge label={`Set ${formatDate(item.homeworkDate)}`} toneName="neutral" />
            <Badge label={`Due ${formatDate(item.dueDate)}`} toneName="warning" />
          </View>

          {(item.notes ?? []).length === 0 ? (
            <EmptyState title="No entries" description="This homework has no questions yet." />
          ) : (
            (item.notes ?? []).map((note) => (
              <View key={note.id} style={styles.note}>
                <Text style={styles.noteDate}>{formatDate(note.homeworkDate)}</Text>
                {(note.questions ?? []).map((question, index) => (
                  <View key={`${note.id}-${index}`} style={styles.question}>
                    <Text style={styles.questionIndex}>{index + 1}.</Text>
                    <Text style={styles.questionText}>{question}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      ) : null}
    </Sheet>
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

function CreateHomeworkSheet({
  visible,
  slots,
  onClose,
  onCreated,
}: {
  visible: boolean;
  slots: TeacherWeeklyTimetableEntry[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [slotId, setSlotId] = useState<number | null>(null);
  const [homeworkDate, setHomeworkDate] = useState(todayKey());
  const [dueDate, setDueDate] = useState(todayKey());
  const [questions, setQuestions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<'slot' | 'homeworkDate' | 'dueDate' | null>(null);

  const selectedSlot = slots.find((slot) => slot.id === slotId);

  const reset = () => {
    setSlotId(null);
    setHomeworkDate(todayKey());
    setDueDate(todayKey());
    setQuestions('');
    setError('');
  };

  const handleSubmit = async () => {
    const lines = questions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!slotId) return setError('Please select a class period.');
    if (lines.length === 0) return setError('Add at least one question.');
    if (dueDate < homeworkDate) return setError('The due date cannot be before the homework date.');

    setSaving(true);
    setError('');
    try {
      await createHomework({
        weeklyTimetableId: slotId,
        homeworkDate,
        dueDate,
        notes: [{ homeworkDate, questions: lines }],
      });
      reset();
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to create homework.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={() => {
          reset();
          onClose();
        }}
        title="Add homework"
        subtitle="For one of your scheduled periods"
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              style={styles.flex}
              onPress={() => {
                reset();
                onClose();
              }}
            />
            <Button label="Create" style={styles.flex} loading={saving} onPress={handleSubmit} />
          </>
        }>
        <SelectField
          label="Class period"
          value={
            selectedSlot
              ? `${selectedSlot.className} · ${selectedSlot.subjectName} — ${dayLabel(selectedSlot.dayOfWeek)}`
              : undefined
          }
          placeholder={slots.length === 0 ? 'No scheduled periods' : 'Select a class period'}
          onPress={() => setSheet('slot')}
          disabled={slots.length === 0}
        />

        <View style={styles.row}>
          <SelectField
            label="Homework date"
            value={formatDate(homeworkDate)}
            icon="calendar-outline"
            onPress={() => setSheet('homeworkDate')}
            containerStyle={styles.flex}
          />
          <SelectField
            label="Due date"
            value={formatDate(dueDate)}
            icon="calendar-outline"
            onPress={() => setSheet('dueDate')}
            containerStyle={styles.flex}
          />
        </View>

        <TextField
          label="Questions (one per line)"
          value={questions}
          onChangeText={setQuestions}
          placeholder={'Exercise 4.1, Q1–Q10\nRead chapter 5'}
          multiline
        />

        {error ? <Banner message={error} /> : null}
      </Sheet>

      <OptionSheet
        visible={sheet === 'slot'}
        onClose={() => setSheet(null)}
        title="Class period"
        options={slots.map((slot) => ({
          value: slot.id,
          label: `${slot.className} · ${slot.subjectName}`,
          description: `${dayLabel(slot.dayOfWeek)}, ${slot.periodName} (${formatTime(slot.startTime)})`,
        }))}
        selected={slotId ?? undefined}
        onSelect={setSlotId}
      />
      <DatePickerSheet
        visible={sheet === 'homeworkDate'}
        onClose={() => setSheet(null)}
        value={homeworkDate}
        title="Homework date"
        onSelect={(date) => {
          setHomeworkDate(date);
          // Keep the pair coherent — a due date can't precede the set date.
          if (dueDate < date) setDueDate(date);
        }}
      />
      <DatePickerSheet
        visible={sheet === 'dueDate'}
        onClose={() => setSheet(null)}
        value={dueDate}
        title="Due date"
        minDate={homeworkDate}
        onSelect={setDueDate}
      />
    </>
  );
}

// ─── Daily note ───────────────────────────────────────────────────────────────

function AddDailyNoteSheet({
  homework,
  onClose,
  onSaved,
}: {
  homework: Homework | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(todayKey());
  const [questions, setQuestions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickingDate, setPickingDate] = useState(false);

  const handleSubmit = async () => {
    if (!homework) return;
    const lines = questions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return setError('Add at least one question.');

    setSaving(true);
    setError('');
    try {
      await addDailyHomework({ homeworkId: homework.id, homeworkDate: date, questions: lines });
      setQuestions('');
      setDate(todayKey());
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add this daily note.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        visible={!!homework}
        onClose={onClose}
        title="Add daily note"
        subtitle={homework ? `${homework.subjectName} — ${homework.className}` : undefined}
        footer={
          <>
            <Button label="Cancel" variant="secondary" style={styles.flex} onPress={onClose} />
            <Button label="Add" style={styles.flex} loading={saving} onPress={handleSubmit} />
          </>
        }>
        <SelectField
          label="Date"
          value={formatDate(date)}
          icon="calendar-outline"
          onPress={() => setPickingDate(true)}
        />
        <TextField
          label="Questions (one per line)"
          value={questions}
          onChangeText={setQuestions}
          placeholder={'Revise today’s notes\nComplete worksheet 3'}
          multiline
        />
        {error ? <Banner message={error} /> : null}
      </Sheet>

      <DatePickerSheet
        visible={pickingDate}
        onClose={() => setPickingDate(false)}
        value={date}
        title="Note date"
        onSelect={setDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  filterRow: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
    maxWidth: 140,
  },
  chipTextActive: { color: colors.onBrand },
  list: { gap: spacing.sm },
  item: {
    padding: spacing.lg - 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  itemTitles: { flex: 1 },
  itemSubject: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  itemClass: {
    fontSize: font.sm,
    color: colors.textFaint,
    marginTop: 1,
  },
  itemDates: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  dateCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detailDates: { flexDirection: 'row', gap: spacing.sm },
  note: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    gap: 5,
  },
  noteDate: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.brand,
  },
  question: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  questionIndex: {
    fontSize: font.sm,
    color: colors.textFaint,
    fontWeight: '700',
  },
  questionText: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    lineHeight: 19,
  },
});
