import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, Settings, Clock } from "lucide-react";
import { toast } from "sonner";
import ClassroomGrid from "@/components/ClassroomGrid";
import CRPanel from "@/components/CRPanel";
import CRChat from "@/components/CRChat";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showCRPanel, setShowCRPanel] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-6 hover-lift">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                ClassTrack Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome, {profile.name} • {profile.branch} • {profile.role.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              {profile.role === "cr" && (
                <>
                  <Button
                    onClick={() => setShowCRPanel(!showCRPanel)}
                    variant="outline"
                    className="glass hover-glow"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    CR Panel
                  </Button>
                  <Button
                    onClick={() => setShowChat(!showChat)}
                    variant="outline"
                    className="glass hover-glow"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    CR Chat
                  </Button>
                </>
              )}
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="hover-glow"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${showCRPanel || showChat ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <ClassroomGrid userRole={profile.role} userBranch={profile.branch} />
          </div>
          
          {showCRPanel && profile.role === "cr" && (
            <div className="lg:col-span-1">
              <CRPanel userBranch={profile.branch} userId={user.id} />
            </div>
          )}
          
          {showChat && profile.role === "cr" && (
            <div className="lg:col-span-1">
              <CRChat userBranch={profile.branch} userId={user.id} userName={profile.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
