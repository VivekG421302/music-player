/**
 * src/hooks/usePaginatedSongs.js — Paginated Songs with IntersectionObserver
 *
 * Loads songs page-by-page; attaches an IntersectionObserver to a sentinel
 * element (ref returned as `sentinelRef`) to auto-load the next page when
 * the user scrolls near the bottom.
 *
 * Usage:
 *   const { songs, loading, sentinelRef, error } = usePaginatedSongs({ sort, search });
 */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

const PAGE_SIZE = 20;

export default function usePaginatedSongs(params = {}) {
  const [songs, setSongs]       = useState([]);
  const [page, setPage]         = useState(1);
  const [hasNext, setHasNext]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const observerRef  = useRef(null);
  const sentinelRef  = useRef(null);

  // Track params as a string so effect re-fires on real changes only
  const paramsKey = JSON.stringify(params);

  // Reset when query params change
  useEffect(() => {
    setSongs([]);
    setPage(1);
    setHasNext(true);
    setError(null);
  }, [paramsKey]);

  // Fetch page whenever `page` changes (and hasn't already loaded)
  useEffect(() => {
    let cancelled = false;

    async function fetchPage() {
      if (!hasNext && page > 1) return;
      setLoading(true);
      try {
        const data = await api.songs.getAll({
          page,
          limit: PAGE_SIZE,
          ...params,
        });
        if (cancelled) return;

        setSongs((prev) =>
          page === 1 ? data.songs : [...prev, ...data.songs]
        );
        setHasNext(data.pagination.hasNext);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPage();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paramsKey]);

  // Wire up IntersectionObserver to the sentinel element
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [hasNext, loading]);

  const refresh = useCallback(() => {
    setSongs([]);
    setPage(1);
    setHasNext(true);
    setError(null);
  }, []);

  return { songs, loading, error, hasNext, sentinelRef, refresh };
}
