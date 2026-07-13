'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { EventDTO } from '@/types';
import { useAttendEvent } from '@/hooks/useEvents';
import { ApiError } from '@/lib/api';

function formatEventDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleString('en-US', { month: 'short' }),
  };
}

export default function EventCard({ event }: { event: EventDTO }) {
  const [isGoing, setIsGoing] = useState(event.isGoing);
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount);
  const attend = useAttendEvent();
  const { day, month } = formatEventDate(event.eventDate);

  const handleGoing = async () => {
    try {
      const res = await attend.mutateAsync({ eventId: event.id, going: isGoing });
      setIsGoing(res.isGoing);
      setAttendeeCount(res.attendeeCount);
      if (res.isGoing) toast.success(`You're going to ${event.title}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update attendance');
    }
  };

  return (
    <div className="_left_inner_event_card">
      <div className="_left_inner_event_card_iamge">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverImageUrl} alt="" className="_card_img" />
        ) : null}
      </div>
      <div className="_left_inner_event_card_content">
        <div className="_left_inner_card_date">
          <p className="_left_inner_card_date_para">{day}</p>
          <p className="_left_inner_card_date_para1">{month}</p>
        </div>
        <div className="_left_inner_card_txt">
          <h4 className="_left_inner_event_card_title">{event.title}</h4>
        </div>
      </div>
      <hr className="_underline" />
      <div className="_left_inner_event_bottom">
        <p className="_left_iner_event_bottom">{attendeeCount} People Going</p>
        <button
          type="button"
          onClick={handleGoing}
          disabled={attend.isPending}
          className="_left_iner_event_bottom_link"
          style={isGoing ? { background: '#0ACF83', borderColor: '#0ACF83', color: '#fff' } : undefined}
        >
          {isGoing ? 'Going ✓' : 'Going'}
        </button>
      </div>
    </div>
  );
}
