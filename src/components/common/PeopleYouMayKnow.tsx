'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserSuggestions } from '@/hooks/useFollow';
import PeopleYouMayKnowCard from './PeopleYouMayKnowCard';

export default function PeopleYouMayKnow({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useUserSuggestions('friends', limit);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = (data?.items ?? []).filter((p) => !dismissed.has(p.id));

  return (
    <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
      <div className="_left_inner_area_suggest_content _mar_b24">
        <h4 className="_left_inner_area_suggest_content_title _title5">People You May Know</h4>
        <span className="_left_inner_area_suggest_content_txt">
          <Link href="/search" className="_left_inner_area_suggest_content_txt_link">
            See All
          </Link>
        </span>
      </div>
      {isLoading ? <p className="text-xs text-gray-400">Loading…</p> : null}
      {!isLoading && visible.length === 0 ? <p className="text-xs text-gray-400">No suggestions right now.</p> : null}
      {visible.map((person) => (
        <PeopleYouMayKnowCard
          key={person.id}
          person={person}
          onDismiss={(id) => setDismissed((prev) => new Set(prev).add(id))}
        />
      ))}
    </div>
  );
}
