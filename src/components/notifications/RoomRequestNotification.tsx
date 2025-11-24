import { useState, useEffect } from "react";
import { supabase, Branch } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface RoomRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_branch: Branch;
  message: string;
  created_at: string;
}

interface Props {
  userBranch: Branch;
  userId: string;
}

const RoomRequestNotification = ({ userBranch, userId }: Props) => {
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("room-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_requests",
        },
        (payload) => {
          const newReq = payload.new as RoomRequest;
          if (newReq.requester_id !== userId) {
            setRequests((prev) => [newReq, ...prev]);
            toast.info(`${newReq.requester_name} is looking for a classroom!`, {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("room_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setRequests(data);
  };

  const dismissRequest = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleRequests = requests.filter((r) => !dismissed.has(r.id) && r.requester_id !== userId);

  if (visibleRequests.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleRequests.map((req) => (
        <Card key={req.id} className="glass p-4 animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Room Request</p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{req.requester_name}</span> ({req.requester_branch}) is looking for a classroom
              </p>
              {req.message && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(req.created_at).toLocaleTimeString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => dismissRequest(req.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RoomRequestNotification;
