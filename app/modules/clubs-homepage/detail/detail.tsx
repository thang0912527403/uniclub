import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import Navbar from "app/components/Navbar";
import ClubDetail from "../components/ClubDetail";
import { useGetClubByIdQuery } from "~/cores/api";

const NewsDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: club, isLoading } = useGetClubByIdQuery(Number(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center font-bold text-orange-500">
        Đang tải...
      </div>
    );

  if (!club)
    return (
      <div className="h-screen flex items-center justify-center">
        Không tìm thấy câu lạc bộ
      </div>
    );

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ClubDetail club={club} />
        </div>
      </main>
    </div>
  );
};

export default NewsDetailPage;
