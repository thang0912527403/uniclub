import { useParams } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import CampaignFormManager from '~/modules/campaign-forms/CampaignFormManager';
import { useGetRecruitmentCampaignsQuery, useGetRecruitmentCampaignsByClubIdQuery } from '~/cores/api';
import { useAuth } from '~/components/AuthProvider';

export default function CampaignFormsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const id = Number(campaignId);
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, clubManagerMembership } = useAuth();
  const clubId = clubManagerMembership?.clubId ?? 0;

  const { data: adminCampaigns } = useGetRecruitmentCampaignsQuery(undefined, {
    skip: !isAdmin
  });

  const { data: clubCampaigns } = useGetRecruitmentCampaignsByClubIdQuery(clubId, {
    skip: isAdmin || clubId === 0
  });

  const campaigns = (isAdmin ? adminCampaigns : clubCampaigns) || [];
  const campaign = campaigns.find(c => c.campaignId === id);

  if (!id || isNaN(id)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-400 mb-3 block" />
          <p className="font-medium">Không tìm thấy campaign.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/recruitment-campaigns" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Quản lý Biểu mẫu"
        breadcrumb={`Recruitment / ${campaign?.campaignName ?? 'Campaign'} / Forms`}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <CampaignFormManager campaignId={id} campaignName={campaign?.campaignName} />
      </main>
    </div>
  );
}
