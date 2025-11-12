import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import TimetableCSVImport from "@/components/timetable/TimetableCSVImport";
import TimetableForm from "@/components/timetable/TimetableForm";
const Timetable = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.role !== "cr") {
        navigate("/dashboard");
      }
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        userName={profile.name}
        userRole={profile.role}
        userBranch={profile.branch}
      />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold gradient-text mb-2">Timetable Manager</h2>
          <p className="text-muted-foreground">Upload CSV or add weekly slots. Sync today's timetable to occupancy.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TimetableCSVImport userBranch={profile.branch} />
          <TimetableForm userBranch={profile.branch} userId={user.id} />
        </div>
      </main>
    </div>
  );
};

export default Timetable;
