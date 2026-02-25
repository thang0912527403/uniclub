import React from 'react';
import { CallToAction, ClubCategories, CampaignsSection, Footer, Navbar, HeroSection, Statistics, UpcomingEvents, WhyChooseUs } from './components';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <HeroSection />
            <ClubCategories />
            <WhyChooseUs />
            <UpcomingEvents />
            <Statistics />
            <CampaignsSection />
            <CallToAction />
            <Footer />
        </div>
    );
};

export default LandingPage;
