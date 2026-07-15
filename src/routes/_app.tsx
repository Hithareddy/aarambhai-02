import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = pathname.split("/").filter(Boolean).slice(-1)[0] ?? "dashboard";
  const pretty = title.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
            <h1 className="truncate font-display text-base font-semibold">{pretty}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search lessons, topics…"
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to="/notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <Link
              to="/profile"
              aria-label="Open profile"
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">AA</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
