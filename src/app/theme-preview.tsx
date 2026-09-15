// TEMPORARY — visual check of the theme with mock data. Delete after verifying.
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import HeroHeader from '@/components/dashboard/HeroHeader';
import { NoticePanel, TimetablePanel } from '@/components/dashboard/Panels';
import TabBar from '@/components/navigation/TabBar';
import Button from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/Card';
import { Badge, Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Input';
import { ListRow, PageTitle, ScreenHeader, SegmentedControl, StatCard, StatGrid } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import Donut from '@/components/charts/Donut';
import { colors, spacing } from '@/theme';

export default function ThemePreview() {
  const { v } = useLocalSearchParams<{ v?: string }>();
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const routes = ['dashboard', 'attendance', 'timetable', 'homework', 'profile'].map((name) => ({ key: name, name }));
  const tabBar = (
    <TabBar
      state={{ index: v === 'page' ? 3 : 0, routes }}
      descriptors={Object.fromEntries(routes.map((r) => [r.key, { options: { title: r.name[0].toUpperCase() + r.name.slice(1) } }]))}
      navigation={{ emit: () => ({ defaultPrevented: false }), navigate: () => {} }}
    />
  );

  if (v === 'page') {
    return (
      <View style={{ flex: 1 }}>
        <Screen
          contentStyle={{ gap: spacing.md }}
          header={<PageTitle title="Homework" subtitle="12 assigned" right={<Button label="Add" icon="add" size="sm" />} />}>
          <SegmentedControl items={[{ key: 'a', label: 'Upcoming (4)' }, { key: 'b', label: 'Past (9)' }]} value={seg} onChange={setSeg} />
          <Banner toneName="warning" message="No periods are assigned to you on the weekly timetable yet." />
          <SectionCard title="Edit details" icon="create-outline">
            <View style={{ gap: spacing.md }}>
              <TextField label="Full name" icon="person-outline" value="Mithilesh Kumar" />
              <TextField label="Phone" placeholder="Mobile number" />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Button label="Check In" icon="log-in-outline" size="sm" style={{ flex: 1 }} />
                <Button label="Check Out" variant="secondary" size="sm" style={{ flex: 1 }} />
              </View>
              <Button label="Save changes" icon="save-outline" block />
            </View>
          </SectionCard>
          <SectionCard title="Links" icon="link-outline" bodyStyle={{ paddingHorizontal: 0 }}>
            <ListRow icon="sunny-outline" title="Holidays" subtitle="School calendar" onPress={() => {}} />
            <ListRow icon="log-out-outline" title="Sign out" danger onPress={() => {}} />
          </SectionCard>
        </Screen>
        {tabBar}
      </View>
    );
  }

  if (v === 'stack') {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']} contentStyle={{ gap: spacing.md }} header={<ScreenHeader title="Holidays" subtitle="14 in the calendar" />}>
        <SegmentedControl items={[{ key: 'a', label: 'Upcoming (4)' }, { key: 'b', label: 'Past (9)' }]} value={seg} onChange={setSeg} />
        <NoticePanel notices={[{ id: 1, title: 'Annual sports day', content: 'All students assemble at 8 AM in the main ground.', priority: 'HIGH', authorName: 'Principal', publishDate: '2026-09-12' } as never]} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen
        contentStyle={{ gap: spacing.lg }}
        header={<HeroHeader name="Mithilesh Kumar" roleLabel="Teacher" meta="EMP-0042" />}>
        <StatGrid>
          <StatCard icon="library-outline" label="My classes" value="4" toneName="violet" />
          <StatCard icon="people-outline" label="My students" value="186" toneName="info" caption="180 active" />
          <StatCard icon="checkmark-done-outline" label="Attendance today" value="92%" toneName="success" caption="171 present" />
          <StatCard icon="book-outline" label="Homework this week" value="12" toneName="warning" caption="48 total" />
        </StatGrid>
        <SectionCard title="Today's attendance" subtitle="15 Sep 2026" icon="pie-chart-outline">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <Donut percentage={92} label="Present rate" size={100} />
            <View style={{ gap: spacing.sm }}>
              <Badge label="Class teacher" toneName="success" />
              <Badge label="10-A" toneName="brand" />
              <Badge label="Pending" toneName="warning" />
            </View>
          </View>
        </SectionCard>
        <TimetablePanel entries={[{ periodName: 'P1', subjectName: 'Mathematics', teacherName: 'You', startTime: '09:00', endTime: '09:45', breakPeriod: false } as never]} />
      </Screen>
      {tabBar}
    </View>
  );
}
