export interface RecordOfChange {
  id: string;
  entityName: string;
  notification: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE'|'SOFT DELETE';
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedByName: string;
  clubId: number | null;
  changedAt: string;
  isUndo: boolean;
}

export interface RecordOfChangeParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  entityName?: string;
  changeType?: string;
  clubId?: number | string;
  changedBy?: string;
  fromDate?: string;
  toDate?: string;
  oldValueSearch?: string;
  newValueSearch?: string;
}

export interface RecordOfChangeResult {
  items: RecordOfChange[];
  totalCount: number;
}
