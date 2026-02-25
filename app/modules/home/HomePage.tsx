import React from 'react';
import { CallToAction, ClubCategories, Footer, Navbar, HeroSection, RegistrationCards, Statistics, UpcomingEvents, WhyChooseUs, ClubPost } from './components';



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
            <RegistrationCards />
            <CallToAction />
            <Footer />
        </div>
    );
};

export default LandingPage;
