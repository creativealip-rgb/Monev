import ClientLayout from "../ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SecurityProvider>
            <ClientLayout>{children}</ClientLayout>
        </SecurityProvider>
    );
}
