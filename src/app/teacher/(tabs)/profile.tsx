import ProfilePanel, { type ProfileLink } from '@/components/profile/ProfilePanel';

/** Teacher destinations that don't earn a tab of their own live here. */
const LINKS: ProfileLink[] = [
  {
    icon: 'chatbubbles-outline',
    label: 'Messages',
    description: 'Chat with staff and students',
    href: '/teacher/messages',
  },
  {
    icon: 'sunny-outline',
    label: 'Holidays',
    description: 'School holiday calendar',
    href: '/teacher/holidays',
  },
];

export default function TeacherProfileScreen() {
  return <ProfilePanel links={LINKS} />;
}
