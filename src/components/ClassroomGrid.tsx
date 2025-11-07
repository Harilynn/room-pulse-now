import { useEffect, useState } from "react";
import { supabase, Branch, UserRole } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  room_number: string;
  capacity: number;
  floor: string;
  building: string;
}

interface ClassroomOccupancy {
  id: string;
  classroom_id: string;
  branch: Branch;
  class_name: string;
  subject: string | null;
  status: "vacant" | "occupied" | "reserved";
  start_time: string;
  end_time: string;
  purpose: string | null;
}

interface Props {
  userRole: UserRole;
  userBranch: Branch;
}

const ClassroomGrid = ({ userRole, userBranch }: Props) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [occupancies, setOccupancies] = useState<ClassroomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel("classroom-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classroom_occupancy",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [classroomsRes, occupanciesRes] = await Promise.all([
        supabase.from("classrooms").select("*").order("room_number"),
        supabase.from("classroom_occupancy").select("*")
          .gte("end_time", new Date().toISOString())
      ]);

      if (classroomsRes.error) throw classroomsRes.error;
      if (occupanciesRes.error) throw occupanciesRes.error;

      setClassrooms(classroomsRes.data || []);
      setOccupancies(occupanciesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load classrooms");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getClassroomStatus = (classroomId: string) => {
    const now = new Date();
    const currentOccupancy = occupancies.find(
      (occ) =>
        occ.classroom_id === classroomId &&
        new Date(occ.start_time) <= now &&
        new Date(occ.end_time) >= now
    );

    return currentOccupancy || null;
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "occupied":
        return "bg-red-500/20 border-red-500 text-red-700";
      case "reserved":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-700";
      default:
        return "bg-green-500/20 border-green-500 text-green-700";
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Classroom Status</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Reserved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classrooms.map((classroom) => {
          const occupancy = getClassroomStatus(classroom.id);
          const status = occupancy?.status || "vacant";

          return (
            <Card
              key={classroom.id}
              className={`glass p-6 hover-lift hover-glow transition-all ${
                status === "vacant" ? "border-green-500/50" : 
                status === "occupied" ? "border-red-500/50" : 
                "border-yellow-500/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{classroom.room_number}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {classroom.building} • {classroom.floor}
                  </p>
                </div>
                <Badge className={getStatusColor(status)}>
                  {status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {classroom.capacity}</span>
                </div>

                {occupancy && (
                  <>
                    <div className="pt-2 border-t border-border/50">
                      <p className="font-semibold text-foreground">
                        {occupancy.branch} - {occupancy.class_name}
                      </p>
                      {occupancy.subject && (
                        <p className="text-muted-foreground">{occupancy.subject}</p>
                      )}
                      {occupancy.purpose && (
                        <div className="flex items-center gap-1 mt-1 text-accent">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">{occupancy.purpose}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground pt-2">
                      <Clock className="w-4 h-4" />
                      <span>Ends in: {getTimeRemaining(occupancy.end_time)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ClassroomGrid;
