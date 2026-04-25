import { useGetMyClubsDetailedQuery } from "~/cores/api/userApi";
import { getClubId } from "~/utils/auth";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useEffect } from "react";

export function useClubRole() {
  const { isAdmin: isGlobalAdmin, isLoading: isUserLoading } = useCurrentUser();
  const { data: detailedInfo, isLoading: isDetailedLoading } = useGetMyClubsDetailedQuery();
  
  // clubId từ cookie luôn được ép kiểu về Number trong getClubId()
  const selectedClubId = getClubId();

  const memberships = detailedInfo ?? [];
  const isLoading = isUserLoading || isDetailedLoading;

  // Lấy Global Role từ API clubs (nếu có)
  const globalRole = memberships.length > 0 ? memberships[0].globalRole : 'User';
  
  // Admin hệ thống
  const isAdmin = isGlobalAdmin || globalRole === 'Admin';

  const currentClub = memberships.find(m => Number(m.clubId) === Number(selectedClubId));

  // Log debug
  useEffect(() => {
    if (currentClub) {
      console.log(`[useClubRole] Club Selected: ${currentClub.clubName || currentClub.clubId}`);
      console.log(`[useClubRole] Policies:`, currentClub.policies);
      console.log(`[useClubRole] Roles:`, currentClub.clubRoles);
    } else if (!isLoading && selectedClubId) {
      console.warn(`[useClubRole] Club ID ${selectedClubId} found in Cookie but not in memberships!`);
    }
  }, [currentClub, isLoading, selectedClubId]);

  /**
   * Kiểm tra quyền hạn dựa trên Policy
   */
  const can = (policyName: string, clubId?: number) => {
    if (isAdmin) return true; 

    const targetClubId = Number(clubId ?? selectedClubId);
    const targetClub = memberships.find(m => Number(m.clubId) === targetClubId);

    if (!targetClub) return false;

    // Ép kiểu level về số để so sánh (tránh trường hợp API trả về chuỗi "0")
    if (targetClub.clubRoles.some(r => Number(r.level) === 0)) return true;

    return targetClub.policies.includes(policyName);
  };

  // Kiểm tra xem User có phải Manager (Level 0) ở BẤT KỲ CLB nào không
  const isAnyClubManager = memberships.some(m => 
    m.clubRoles?.some(r => Number(r.level) === 0)
  );

  // Kiểm tra Manager của CLB hiện tại
  const isCurrentClubManager = currentClub?.clubRoles?.some(r => Number(r.level) === 0) ?? false;

  return {
    memberships,
    isAdmin,
    // Trả về true nếu là manager của CLB đang chọn HOẶC là admin
    isClubManager: isCurrentClubManager || isAdmin, 
    // Trả về true nếu có quyền manager ở ít nhất 1 CLB
    isAnyClubManager: isAnyClubManager || isAdmin,
    can,
    isLoading,
    selectedClubId,
    currentPolicies: currentClub?.policies ?? [],
    currentClub
  };
}
