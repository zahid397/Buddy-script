'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { useUserSuggestions } from '@/hooks/useFollow';
import { useFriends } from '@/hooks/useFriends';
import FollowButton from '../common/FollowButton';

export default function RightSidebar() {
  const { data: suggestions } = useUserSuggestions('follow', 3);
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [friendFilter, setFriendFilter] = useState('');

  const visibleSuggestions = (suggestions?.items ?? []).filter((u) => !dismissed.has(u.id));
  const friends = friendsData?.items ?? [];
  const filteredFriends = friendFilter.trim()
    ? friends.filter((f) => `${f.firstName} ${f.lastName}`.toLowerCase().includes(friendFilter.toLowerCase()))
    : friends;

  return (
    <div className="_layout_right_sidebar_wrap">
      {visibleSuggestions.slice(0, 1).map((suggestion) => (
        <div
          className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area _mar_b16"
          key={suggestion.id}
        >
          <div className="_right_inner_area_info_box">
            <div className="_left_inner_area_suggest_info_image">
              <Link href={`/profile/${suggestion.id}`}>
                {suggestion.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={suggestion.avatarUrl} alt={suggestion.firstName} className="_info_img" />
                ) : null}
              </Link>
            </div>
            <div className="_left_inner_area_suggest_info_txt">
              <Link href={`/profile/${suggestion.id}`}>
                <h4 className="_left_inner_area_suggest_info_title">
                  {suggestion.firstName} {suggestion.lastName}
                </h4>
              </Link>
              <p className="_left_inner_area_suggest_info_para">Suggested for you</p>
            </div>
          </div>
          <div className="_right_info_btn_grp">
            <button
              type="button"
              className="_right_info_btn_link"
              onClick={() => setDismissed((prev) => new Set(prev).add(suggestion.id))}
            >
              Ignore
            </button>
            <FollowButton userId={suggestion.id} isFollowing={suggestion.isFollowedByMe} variant="sidebar" />
          </div>
        </div>
      ))}

      <div className="_feed_right_inner_area_card _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <h4 className="_title5 _mar_b16">Your Friends</h4>
        <form className="_feed_right_inner_area_card_form" onSubmit={(e) => e.preventDefault()}>
          <Search size={15} color="#666" />
          <input
            type="search"
            placeholder="Search friends"
            value={friendFilter}
            onChange={(e) => setFriendFilter(e.target.value)}
          />
        </form>
        <div className="_feed_right_inner_area_card_ppl_wrap">
          {friendsLoading ? <p className="text-xs text-gray-400">Loading…</p> : null}
          {!friendsLoading && filteredFriends.length === 0 ? (
            <p className="text-xs text-gray-400">
              {friends.length === 0 ? 'No friends yet — send some requests!' : 'No matches.'}
            </p>
          ) : null}
          {filteredFriends.map((f) => (
            <div className="_feed_right_inner_area_card_ppl_box" key={f.id}>
              <Link href={`/profile/${f.id}`}>
                {f.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.avatarUrl} alt={f.firstName} className="_ppl_img" />
                ) : null}
              </Link>
              <div className="_feed_right_inner_area_card_ppl_txt">
                <Link href={`/profile/${f.id}`}>
                  <h4>
                    {f.firstName} {f.lastName}
                  </h4>
                </Link>
              </div>
              <Link href={`/messages/${f.id}`} aria-label={`Message ${f.firstName}`} className="ml-auto text-gray-400 hover:text-brand">
                <MessageCircle size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
