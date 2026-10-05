import { Outlet } from 'react-router';
import { AuthGate } from '~/features/auth/auth-gate';
import { AppSidebar } from '~/components/layout/app-sidebar';
import { AppHeader } from '~/components/layout/app-header';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { BusinessChatbot } from '~/features/chatbot/business-chatbot';

export default function Workspace() {
  return (
    <AuthGate>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <div className="flex flex-1 flex-col bg-muted/40 p-4 md:p-8">
            <Outlet />
          </div>
        </SidebarInset>
        <BusinessChatbot />
      </SidebarProvider>
    </AuthGate>
  );
}
