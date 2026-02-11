// Landing Page Component Types
export interface ClubCategory {
    id: number;
    title: string;
    description: string;
    icon: string;
    image: string;
    members: number;
    clubs: number;
}

export interface Feature {
    id: number;
    icon: string;
    title: string;
    description: string;
}

export interface Event {
    id: number;
    date: {
        day: string;
        month: string;
    };
    title: string;
    club: string;
    location: string;
    time: string;
    category: string;
}

export interface Stat {
    id: number;
    value: string;
    label: string;
    icon: string;
    color: string;
}

export interface RegistrationType {
    id: number;
    title: string;
    description: string;
    features: string[];
    icon: string;
    color: string;
    bgColor: string;
}

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export interface ClubNewsCardProps {
    image: string;
    title: string;
    clubName: string;
    category: string;
    date: string;
    views: number;
    likes: number;
    summary: string;
}

// Filter Types
export interface FilterProps {
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onClubChange: (value: string) => void;
    onDateChange: (dates: [any | null, any | null] | null) => void;
}
