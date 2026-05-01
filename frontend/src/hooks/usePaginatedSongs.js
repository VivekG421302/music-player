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

export default function usePaginatedSongs(params = {}, options = {}) {
  const enabled = options.enabled !== false;

  const [songs, setSongs]       = useState([]);
  const [page, setPage]         = useState(1);
  const [hasNext, setHasNext]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const observerRef  = useRef(null);
  const sentinelRef  = useRef(null);
  const inFlightRef  = useRef(new Set());
  const loadedRef    = useRef(new Set());
  const loadingRef   = useRef(false);
  const hasNextRef   = useRef(true);

  // Track params as a string so effect re-fires on real changes only
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);

  // Reset when query params change
  useEffect(() => {
    setSongs([]);
    setPage(1);
    setHasNext(enabled);
    setError(null);
    inFlightRef.current.clear();
    loadedRef.current.clear();
    loadingRef.current = false;
    hasNextRef.current = enabled;
  }, [paramsKey, enabled]);

  // Fetch page whenever `page` changes (and hasn't already loaded)
  useEffect(() => {
    let cancelled = false;

    async function fetchPage() {
      if (!enabled) return;
      if (!hasNext && page > 1) return;
      const requestKey = `${paramsKey}:${page}`;
      if (inFlightRef.current.has(requestKey) || loadedRef.current.has(requestKey)) {
        return;
      }

      inFlightRef.current.add(requestKey);
      loadingRef.current = true;
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
        hasNextRef.current = data.pagination.hasNext;
        loadedRef.current.add(requestKey);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        inFlightRef.current.delete(requestKey);
        if (!cancelled) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }

    fetchPage();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paramsKey]);

  // Wire up IntersectionObserver to the sentinel element
  useEffect(() => {
    if (!enabled) return undefined;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || !hasNextRef.current || loadingRef.current) {
          return;
        }

        setPage((currentPage) => {
          const nextPage = currentPage + 1;
          const requestKey = `${paramsKey}:${nextPage}`;

          if (inFlightRef.current.has(requestKey) || loadedRef.current.has(requestKey)) {
            return currentPage;
          }

          loadingRef.current = true;
          return nextPage;
        });
      },
      { rootMargin: "200px 0px", threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [enabled, paramsKey]);

  const refresh = useCallback(() => {
    setSongs([]);
    setPage(1);
    setHasNext(enabled);
    setError(null);
    inFlightRef.current.clear();
    loadedRef.current.clear();
    loadingRef.current = false;
    hasNextRef.current = enabled;
  }, [enabled]);

  return { songs, loading, error, hasNext, sentinelRef, refresh };
}
