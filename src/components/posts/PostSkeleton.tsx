export default function PostSkeleton() {
  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="flex items-center gap-3">
          <div className="bs-skeleton h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bs-skeleton h-3 w-32 rounded" />
            <div className="bs-skeleton h-3 w-20 rounded" />
          </div>
        </div>
        <div className="bs-skeleton mt-4 h-4 w-3/4 rounded" />
        <div className="bs-skeleton mt-2 h-56 w-full rounded-card" />
      </div>
    </div>
  );
}
