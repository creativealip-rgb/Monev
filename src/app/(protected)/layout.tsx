import ClientLayout from "../ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";
import { OnboardingGuard } from "@/app/components/OnboardingGuard";
import { fetchProfileData } from "@/app/(protected)/profile/actions";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const data = await fetchProfileData();
    const hasCompletedOnboarding = data?.settings?.hasCompletedOnboarding ?? false;

    return (
        <SecurityProvider>
            <OnboardingGuard serverStatus={hasCompletedOnboarding}>
                <ClientLayout>{children}</ClientLayout>
            </OnboardingGuard>
        </SecurityProvider>
    );
}
