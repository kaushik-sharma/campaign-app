import * as ImagePicker from 'expo-image-picker';

import { checkMedia, hasBlockingIssue, type MediaAsset, type MediaCheck } from '@/domain/draft';

export type PickResult =
  | { status: 'picked'; asset: MediaAsset; checks: MediaCheck[] }
  | { status: 'rejected'; checks: MediaCheck[] }
  | { status: 'cancelled' };

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

function guessMime(uri: string): string | null {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  return (ext && MIME_BY_EXT[ext]) ?? null;
}

/**
 * Opens the system photo picker and runs the file checks. Assets with a blocking problem (wrong
 * type, too large, too small, too long) are rejected with the reasons, so they never reach a draft.
 */
export async function pickMedia(kind: 'image' | 'video', role: 'cover' | 'ad' | 'video' | 'story'): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'image' ? 'images' : 'videos',
    quality: 0.9,
  });
  const picked = result.canceled ? null : result.assets[0];
  if (!picked) return { status: 'cancelled' };

  const asset: MediaAsset = {
    image: { source: { uri: picked.uri }, alt: '' },
    kind,
    width: picked.width,
    height: picked.height,
    fileSize: picked.fileSize ?? null,
    mimeType: picked.mimeType ?? guessMime(picked.uri),
    durationMs: picked.duration ?? null,
    generated: false,
  };
  const checks = checkMedia(asset, role === 'story' ? 'ad' : role);
  return hasBlockingIssue(checks) ? { status: 'rejected', checks } : { status: 'picked', asset, checks };
}
