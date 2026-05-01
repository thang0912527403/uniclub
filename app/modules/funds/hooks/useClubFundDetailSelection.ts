import { useSyncExternalStore } from 'react';
import {
  CLUB_FUND_DETAIL_CHANGE_EVENT,
  CLUB_FUND_DETAIL_SESSION_KEY,
  readClubFundDetailSession,
} from '~/modules/funds/utils/clubFundDetailSession';

type Snapshot = { clubId: number | null; fundId: number | null };

let cachedClientSnapshot: Snapshot = { clubId: null, fundId: null };
const serverSnapshot: Snapshot = { clubId: null, fundId: null };

function getSnapshot(): Snapshot {
  const s = readClubFundDetailSession();
  const clubId = s?.clubId ?? null;
  const fundId = s?.fundId ?? null;
  if (cachedClientSnapshot.clubId === clubId && cachedClientSnapshot.fundId === fundId) {
    return cachedClientSnapshot;
  }
  cachedClientSnapshot = { clubId, fundId };
  return cachedClientSnapshot;
}

function getServerSnapshot(): Snapshot {
  return serverSnapshot;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const onCustom = () => onStoreChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLUB_FUND_DETAIL_SESSION_KEY || e.key === null) onStoreChange();
  };
  const onAuth = () => onStoreChange();

  window.addEventListener(CLUB_FUND_DETAIL_CHANGE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  window.addEventListener('authchange', onAuth);
  return () => {
    window.removeEventListener(CLUB_FUND_DETAIL_CHANGE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('authchange', onAuth);
  };
}

export function useClubFundDetailSelection(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
