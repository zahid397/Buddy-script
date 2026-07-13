'use client';

import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookMarked, Compass, Gamepad2, Save, Settings, UserSearch, Users2 } from 'lucide-react';
import { useUserSuggestions } from '@/hooks/useFollow';
import { useEvents } from '@/hooks/useEvents';
import FriendRequestButton from '../common/FriendRequestButton';
import FriendRequestsPanel from '../common/FriendRequestsPanel';
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
  const { data: suggestions, isLoading } = useUserSuggestions('friends', 3);
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
        <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_left_inner_area_suggest_content _mar_b24">
            <h4 className="_left_inner_area_suggest_content_title _title5">Suggested People</h4>
            <span className="_left_inner_area_suggest_content_txt">
              <Link href="/search" className="_left_inner_area_suggest_content_txt_link">
                See All
              </Link>
            </span>
          </div>
          {isLoading ? <p className="text-xs text-gray-400">Loading…</p> : null}
          {!isLoading && suggestions?.items.length === 0 ? (
            <p className="text-xs text-gray-400">No suggestions right now.</p>
          ) : null}
          {suggestions?.items.map((p) => (
            <div className="_left_inner_area_suggest_info" key={p.id}>
              <div className="_left_inner_area_suggest_info_box">
                <div className="_left_inner_area_suggest_info_image">
                  <Link href={`/profile/${p.id}`}>
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatarUrl} alt={p.firstName} className="_info_img" />
                    ) : null}
                  </Link>
                </div>
                <div className="_left_inner_area_suggest_info_txt">
                  <Link href={`/profile/${p.id}`}>
                    <h4 className="_left_inner_area_suggest_info_title">
                      {p.firstName} {p.lastName}
                    </h4>
                  </Link>
                </div>
              </div>
              <div className="_left_inner_area_suggest_info_link">
                <FriendRequestButton userId={p.id} status={p.friendshipStatus} requestId={p.friendRequestId} compact />
              </div>
            </div>
          ))}
        </div>
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
