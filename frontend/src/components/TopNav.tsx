import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Globe, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function TopNav() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shadow-card">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
      </div>

      <div className="flex items-center gap-3">
        {/* Role Toggle */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground cursor-pointer">ASHA</Label>
          <Switch
            checked={user?.role === "doctor"}
            onCheckedChange={(checked) => {
              const role = checked ? "doctor" : "asha";
              switchRole(role);
              navigate(role === "doctor" ? "/hospital" : "/asha");
            }}
          />
          <Label className="text-xs text-muted-foreground cursor-pointer">Doctor</Label>
        </div>

        <div className="h-5 w-px bg-border" />

        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 font-medium">
          <Globe className="h-3.5 w-3.5" />
          EN / हिं
        </Button>

        <div className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </div>

        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {user?.avatar || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
