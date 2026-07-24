import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Dumbbell,
  ClipboardCheck,
  LineChart,
  FileBarChart,
  Trophy,
  Library,
  Users,
  Bell,
  User,
  Settings,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  Gamepad2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandLogo } from "./brand-logo";
import { useLanguage } from "@/hooks/use-language";

const learnItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "Learning Path", url: "/learning-path", icon: Compass },
  { title: "Practice", url: "/practice", icon: Dumbbell },
  { title: "Games", url: "/games", icon: Gamepad2 },
  { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
] as const;

const insightItems = [
  { title: "Progress", url: "/progress", icon: LineChart },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Achievements", url: "/achievements", icon: Trophy },
] as const;

const exploreItems = [
  { title: "Resources", url: "/resources", icon: Library },
  { title: "Community", url: "/community", icon: Users },
  { title: "Notifications", url: "/notifications", icon: Bell },
] as const;

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: LifeBuoy },
] as const;

const getTranslationKey = (title: string): string => {
  if (title === "Learning Path") return "nav.learningPath";
  if (title === "Log out") return "nav.logout";
  return `nav.${title.toLowerCase()}`;
};

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isActive = (url: string) => pathname === url;

  const renderGroup = (
    label: string,
    items: readonly { title: string; url: string; icon: typeof BookOpen }[],
  ) => {
    const groupKey = `nav.${label.toLowerCase()}Group`;
    const translatedLabel = t(groupKey) || label;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{translatedLabel}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const transKey = getTranslationKey(item.title);
              const labelText = t(transKey) || item.title;
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={labelText}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{labelText}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const logoutLabel = t("nav.logout") || "Log out";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <BrandLogo to="/dashboard" />
        </div>
        <div className="hidden justify-center py-1 group-data-[collapsible=icon]:flex">
          <BrandLogo variant="mark" to="/dashboard" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Learn", learnItems)}
        {renderGroup("Insights", insightItems)}
        {renderGroup("Explore", exploreItems)}
        {renderGroup("Account", accountItems)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={logoutLabel}
              onClick={() => navigate({ to: "/login" })}
            >
              <LogOut />
              <span>{logoutLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
