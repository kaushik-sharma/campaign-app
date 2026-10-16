import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { demo } from '@/config/demo';
import type { Draft } from '@/domain/draft';
import { services } from '@/services';

import { draftKeys } from './queries';

export type AutosaveStatus = 'saved' | 'pending' | 'saving' | 'error';

const RETRY_MS = 3000;

/**
 * Saves the draft shortly after every change. Saves are serialised (never two in flight), a
 * failed save retries on its own, and pending changes are flushed when the app goes to the
 * background or the editor closes, so killing the app loses at most the last moment of typing.
 */
export function useAutosave(draft: Draft | null) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const baseline = useRef<Draft | null>(null);
  const unsaved = useRef<Draft | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timers call the latest `run` through this ref (it can't reference itself directly).
  const runRef = useRef<() => Promise<void>>(async () => {});
  const later = (ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void runRef.current(), ms);
  };

  const run = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const d = unsaved.current;
    if (inFlight.current || !d) return;
    inFlight.current = true;
    setStatus('saving');
    try {
      const saved = await services.drafts.save(d);
      if (unsaved.current === d) {
        unsaved.current = null;
        setStatus('saved');
      }
      setSavedAt(saved.updatedAt);
      queryClient.setQueryData(draftKeys.detail(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: draftKeys.list() });
    } catch {
      setStatus('error');
      later(RETRY_MS);
    } finally {
      inFlight.current = false;
      // Changes made while this save was in flight get their own save.
      if (unsaved.current && unsaved.current !== d && !timer.current) later(demo.creation.autosaveMs);
    }
  }, [queryClient]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    if (!draft) return;
    if (!baseline.current) {
      // The first value is what was loaded; nothing to save yet.
      baseline.current = draft;
      return;
    }
    if (draft === baseline.current) return;
    unsaved.current = draft;
    setStatus('pending');
    later(demo.creation.autosaveMs);
  }, [draft]);

  // Flush on background and when the editor unmounts.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void run();
    });
    return () => {
      sub.remove();
      void run();
    };
  }, [run]);

  return { status, savedAt: savedAt ?? draft?.updatedAt ?? null, flush: run };
}
