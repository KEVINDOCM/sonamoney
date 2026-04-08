import { Sidebar } from "@/components/layout/Sidebar";
import { UserDataProvider } from "@/lib/contexts/UserDataContext";
import { ChatProvider } from "@/components/chat";

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Layout no longer blocks on data fetching - moved to client-side
// This improves TTFB significantly
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <UserDataProvider>
      <Sidebar>
        <ChatProvider>
          {children}
        </ChatProvider>
      </Sidebar>
    </UserDataProvider>
  );
}
