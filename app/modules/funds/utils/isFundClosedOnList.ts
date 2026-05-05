import type { ClubFund } from '~/cores/api/types/clubFund';
import { isManagerClosedAmberNoteDuplicateVi } from '~/modules/funds/utils/fundContributeNoteFilter';

export function isFundClosedOnList(f: ClubFund): boolean {
  if (f.isClosed === true || f.isDeleted === true) return true;
  if (isManagerClosedAmberNoteDuplicateVi(f.cannotContributeReasonVi)) return true;
  return false;
}
