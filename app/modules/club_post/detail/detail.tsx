import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Navbar from '../../../components/Navbar';
import NewsDetailContent from '../components/NewsDetailContent';
import { useGetClubPostByIdQuery } from '~/cores/api';
import type { ClubPostResponseDto } from '~/cores/api';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams();

  const { data: post, isLoading } = useGetClubPostByIdQuery({ postId: Number(id) });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center font-bold text-orange-500">
        Đang tải...
      </div>
    );

  if (!post)
    return <div className="h-screen flex items-center justify-center">Không tìm thấy bài viết</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <NewsDetailContent post={post} />
      </main>
    </div>
  );
};

export default NewsDetailPage;