import ProfilePanel, { type ProfileLink } from '@/components/profile/ProfilePanel';

const LINKS: ProfileLink[] = [
  {
    icon: 'checkbox-outline',
    label: 'My attendance',
    description: 'Daily record and monthly history',
    href: '/student/attendance',
  },
  {
    icon: 'chatbubbles-outline',
    label: 'Messages',
    description: 'Chat with your teachers',
    href: '/student/messages',
  },
];

export default function StudentProfileScreen() {
  return <ProfilePanel links={LINKS} />;
}
