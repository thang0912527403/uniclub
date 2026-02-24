import React from 'react';
import { CallToAction, ClubCategories, Footer, HeroSection, RegistrationCards, Statistics, UpcomingEvents, WhyChooseUs } from './components';
import Navbar from '../../components/Navbar';


const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <HeroSection />
            <ClubCategories />
            <WhyChooseUs />
            <UpcomingEvents />
            <Statistics />
            <RegistrationCards />
            <CallToAction />
            <Footer />
        </div>
    );
};

export default LandingPage;
