import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Mic, LayoutDashboard, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const allNavItems = [
  { title: "ASHA Field", url: "/asha", icon: Mic, description: "Field Worker View", role: "asha" as const },
  { title: "Hospital Dashboard", url: "/hospital", icon: LayoutDashboard, description: "District Hospital", role: "doctor" as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();
  const navItems = allNavItems.filter((item) => item.role === user?.role);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-4 flex items-center gap-2">
          <img src={logo} alt="GramAI Logo" className="h-9 w-9 rounded-lg flex-shrink-0" />
          {!collapsed && (
            <div>
              <h2 className="font-display text-sm font-bold text-sidebar-primary-foreground tracking-tight">GramAI</h2>
              <p className="text-[10px] text-sidebar-foreground/60">Rural Health Co-Pilot</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/60 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user.role === "asha" ? "ASHA Worker" : "CMO"}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 text-xs gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && "Sign Out"}
        </Button>
        {!collapsed && (
          <div className="flex items-center gap-2 text-sidebar-foreground/40 text-[10px] px-1">
            <Shield className="h-3 w-3" />
            <span>HIPAA Compliant</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
