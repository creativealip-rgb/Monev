"use client";

import {
    Wallet,
    Landmark,
    Smartphone,
    CreditCard,
    Banknote,
    Building2,
    LandmarkIcon,
    type LucideIcon
} from "lucide-react";

const accountIcons: Record<string, LucideIcon> = {
    Wallet,        // Investment wallet
    Landmark,      // Bank
    LandmarkIcon,  // Alternative bank icon
    Smartphone,    // E-money (GoPay, OVO, etc)
    CreditCard,    // Credit card
    Banknote,      // Cash
    Building2,     // Bank building
};

interface AccountIconProps {
    name: string;
    color?: string;
    size?: number;
    className?: string;
}

export function AccountIcon({ name, color, size = 20, className }: AccountIconProps) {
    const Icon = accountIcons[name] || Wallet;
    return <Icon size={size} color={color} className={className} />;
}
