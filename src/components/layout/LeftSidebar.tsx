'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookMarked, Compass, Gamepad2, GraduationCap, Settings, UserSearch, Users2, LineChart } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import FriendRequestsPanel from '../common/FriendRequestsPanel';
import PeopleYouMayKnow from '../common/PeopleYouMayKnow';
import EventCard from '../common/EventCard';

const EXPLORE_LINKS = [
  { label: 'Find friends', href: '/friends', icon: UserSearch },
  { label: 'Learning', href: '/learning', icon: GraduationCap },
  { label: 'Insights', href: '/insights', icon: LineChart },
  { label: 'Saved Posts', href: '/bookmarks', icon: BookMarked },
  { label: 'Groups', href: '/groups', icon: Users2 },
  { label: 'Gaming', href: '/gaming', icon: Gamepad2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function LeftSidebar() {
  const { data: eventsData } = useEvents(2);
  const pathname = usePathname();

  return (
    <div className="_layout_left_sidebar_wrap">
      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_explore _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <h4 className="_left_inner_area_explore_title _title5 _mar_b24">Explore</h4>
          <ul className="_left_inner_area_explore_list">
            {EXPLORE_LINKS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <li className="_left_inner_area_explore_item" key={label}>
                  <Link
                    href={href}
                    className="_left_inner_area_explore_link"
                    aria-current={active ? 'page' : undefined}
                    style={active ? { color: '#1890FF', fontWeight: 600 } : undefined}
                  >
                    <Icon size={18} color={active ? '#1890FF' : '#666'} /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <FriendRequestsPanel />

      <div className="_layout_left_sidebar_inner">
        <PeopleYouMayKnow limit={5} />
      </div>

      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_event _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_left_inner_event_content">
            <h4 className="_left_inner_event_title _title5">Events</h4>
          </div>
          {eventsData?.items.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
          {eventsData && eventsData.items.length === 0 ? <p className="text-xs text-gray-400">No upcoming events.</p> : null}
        </div>
      </div>
    </div>
  );
}
