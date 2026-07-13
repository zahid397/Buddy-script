'use client';

import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookMarked, Compass, Gamepad2, Save, Settings, UserSearch, Users2 } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import FriendRequestsPanel from '../common/FriendRequestsPanel';
import PeopleYouMayKnow from '../common/PeopleYouMayKnow';
import EventCard from '../common/EventCard';

function notImplemented() {
  toast("This isn't part of the demo scope, but the UI is here for fidelity.", { icon: '🚧' });
}

const EXPLORE_LINKS = [
  { label: 'Learning', icon: Compass, badge: 'New' },
  { label: 'Insights', icon: Compass },
  { label: 'Bookmarks', icon: BookMarked },
  { label: 'Group', icon: Users2 },
  { label: 'Gaming', icon: Gamepad2, badge: 'New' },
  { label: 'Settings', icon: Settings },
  { label: 'Save post', icon: Save },
];

export default function LeftSidebar() {
  const { data: eventsData } = useEvents(2);

  return (
    <div className="_layout_left_sidebar_wrap">
      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_explore _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <h4 className="_left_inner_area_explore_title _title5 _mar_b24">Explore</h4>
          <ul className="_left_inner_area_explore_list">
            <li className="_left_inner_area_explore_item">
              <Link href="/search" className="_left_inner_area_explore_link">
                <UserSearch size={18} color="#666" /> Find friends
              </Link>
            </li>
            {EXPLORE_LINKS.map(({ label, icon: Icon, badge }) => (
              <li className="_left_inner_area_explore_item" key={label}>
                <button type="button" className="_left_inner_area_explore_link" onClick={notImplemented}>
                  <Icon size={18} color="#666" /> {label}
                </button>
                {badge ? <span className="_left_inner_area_explore_link_txt">{badge}</span> : null}
              </li>
            ))}
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
