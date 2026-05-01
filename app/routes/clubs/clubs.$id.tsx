import { useEffect } from "react";
import { useParams } from "react-router";
import { setClubId } from "~/utils/auth";
import { ClubDetailModule } from "~/modules/clubs/detail";

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    const clubId = Number(id) || 0;
    if (clubId > 0) setClubId(clubId);
  }, [id]);

  return <ClubDetailModule />;
}
