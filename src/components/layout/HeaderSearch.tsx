'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Search } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearch } from '@/hooks/useSearch';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

export default function HeaderSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 300);
  const { data, isFetching } = useSearch(debounced);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(wrapperRef, () => setOpen(false));

  const hasResults = data && (data.users.length > 0 || data.posts.length > 0 || data.events.length > 0);

  const goToResults = () => {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }} className={mobile ? 'w-full' : ''}>
      <form
        className={mobile ? 'flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2' : '_header_form_grp'}
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <Search className={mobile ? undefined : '_header_form_svg'} size={16} color="#666" />
        <input
          className={mobile ? 'w-full bg-transparent text-sm outline-none' : 'form-control me-2 _inpt1'}
          type="search"
          placeholder="Search people, posts, events"
          aria-label="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </form>

      {open && debounced.trim().length > 0 ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-card border border-gray-100 bg-white py-2 shadow-lg">
          {isFetching ? <p className="px-4 py-2 text-xs text-gray-400">Searching…</p> : null}
          {!isFetching && !hasResults ? <p className="px-4 py-2 text-xs text-gray-400">No results for &quot;{debounced}&quot;.</p> : null}

          {data?.users.slice(0, 3).map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {u.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatarUrl} alt={u.firstName} className="h-7 w-7 rounded-full object-cover" />
              ) : null}
              <span>
                {u.firstName} {u.lastName}
              </span>
            </Link>
          ))}

          {data?.posts.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.author.id}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-gray-50"
            >
              <span className="font-medium">
                {p.author.firstName} {p.author.lastName}:
              </span>{' '}
              <span className="text-gray-500">{p.content.slice(0, 60)}</span>
            </Link>
          ))}

          {data?.events.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-2 px-4 py-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <span>{e.title}</span>
            </div>
          ))}

          {hasResults ? (
            <button
              type="button"
              onClick={goToResults}
              className="mt-1 block w-full border-t border-gray-100 px-4 py-2 text-center text-xs font-medium text-brand hover:underline"
            >
              See all results
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
