import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getUserReviews } from '../services/firestore-exports';
import { ReviewsList } from '../components/features/reviews/ReviewsList';
import { Button } from '../components/ui/Button';

const ReviewsPage: React.FC = () => {
  const [params] = useSearchParams();
  const userId = params.get('user') || '';
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getUserReviews(userId);
        if (res.error) throw new Error(res.error.message);
        const data = (res.data || []).sort((a: any, b: any) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setAllReviews(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allReviews;
    const rating = Number(filter);
    return allReviews.filter(r => Number(r.rating || 0) === rating);
  }, [allReviews, filter]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          {userId && (
            <p className="text-sm text-muted-foreground">for <Link to={`/profile/${userId}`} className="underline hover:no-underline">profile</Link></p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border border-border rounded-md bg-background text-sm px-2 py-1"
            value={filter}
            onChange={(e) => { setFilter(e.target.value as any); setVisibleCount(10); }}
          >
            <option value="all">All</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>
      </div>

      <ReviewsList reviews={filtered.slice(0, visibleCount)} loading={loading} emptyMessage="No reviews found." />

      {!loading && visibleCount < filtered.length && (
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setVisibleCount(v => Math.min(v + 10, filtered.length))}>Load more</Button>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;


