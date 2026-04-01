import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FundHistoryItem, FundHistoryResponse, FundHistoryScopeFilter, FundHistoryStatusFilter } from '~/cores/api';
import { fetchFundHistory } from '../api/fetchFundHistory';

type UseFundHistoryArgs = {
  clubId: number;
  fundId: number;
  page: number;
  pageSize: number;
  status?: FundHistoryStatusFilter;
  scope?: FundHistoryScopeFilter;
};

type UseFundHistoryResult = {
  items: FundHistoryItem[];
  paging: Omit<FundHistoryResponse, 'items'>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const DEFAULT_PAGING: Omit<FundHistoryResponse, 'items'> = {
  pageNumber: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export function useFundHistory({
  clubId,
  fundId,
  page,
  pageSize,
  status = 'ALL',
  scope = '',
}: UseFundHistoryArgs): UseFundHistoryResult {
  const [items, setItems] = useState<FundHistoryItem[]>([]);
  const [paging, setPaging] = useState<Omit<FundHistoryResponse, 'items'>>({
    ...DEFAULT_PAGING,
    pageNumber: page,
    pageSize,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const validParams = useMemo(
    () => clubId > 0 && fundId > 0 && page >= 1 && pageSize >= 1 && pageSize <= 100,
    [clubId, fundId, page, pageSize],
  );

  const refetch = useCallback(() => {
    setReloadTick((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!validParams) {
      abortRef.current?.abort();
      setLoading(false);
      setError(null);
      setItems([]);
      setPaging({
        ...DEFAULT_PAGING,
        pageNumber: Math.max(1, page),
        pageSize,
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    void fetchFundHistory({
      clubId,
      fundId,
      page,
      pageSize,
      status,
      scope,
      signal: controller.signal,
    })
      .then((response) => {
        if (currentRequestId !== requestIdRef.current) return;
        setItems(response.items);
        setPaging({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage,
        });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || currentRequestId !== requestIdRef.current) return;
        const message = e instanceof Error ? e.message : 'Không thể tải lịch sử giao dịch quỹ.';
        setError(message);
      })
      .finally(() => {
        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [clubId, fundId, page, pageSize, status, scope, validParams, reloadTick]);

  return {
    items,
    paging,
    loading,
    error,
    refetch,
  };
}
