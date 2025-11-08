import { Link, useLocation } from "react-router-dom";
import { Home, Edit, MessageSquare, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavbarProps {
  userName: string;
  userRole: string;
  userBranch: string;
}

const Navbar = ({ userName, userRole, userBranch }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:inline">Room Pulse</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            {userRole === "cr" && (
              <>
                <Link to="/update-status">
                  <Button
                    variant={isActive("/update-status") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Update</span>
                  </Button>
                </Link>

                <Link to="/cr-chat">
                  <Button
                    variant={isActive("/cr-chat") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </Button>
                </Link>

                <Link to="/timetable">
                  <Button
                    variant={isActive("/timetable") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Timetable</span>
                  </Button>
                </Link>
              </>
            )}

            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border/50">
              <div className="text-sm">
                <p className="font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {userBranch} • {userRole.toUpperCase()}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
