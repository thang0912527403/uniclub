import React from 'react';
import { CallToAction, ClubCategories, CampaignsSection, Footer, HeroSection, Statistics, UpcomingEvents, WhyChooseUs } from './components';
import Navbar from '../../components/Navbar';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <HeroSection />
            <ClubCategories />
            <WhyChooseUs />
            <UpcomingEvents />
            <ClubPost/>
            <Statistics />
            <CampaignsSection />
            <CallToAction />
            <Footer />
        </div>
    );
};

export default LandingPage;
