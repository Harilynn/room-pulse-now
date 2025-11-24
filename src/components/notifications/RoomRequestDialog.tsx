import { useState } from "react";
import { supabase, Branch } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userName: string;
  userBranch: Branch;
  userId: string;
}

const RoomRequestDialog = ({ userName, userBranch, userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendRequest = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("room_requests").insert({
        requester_id: userId,
        requester_name: userName,
        requester_branch: userBranch,
        message: message.trim(),
      });

      if (error) throw error;

      toast.success("Room request sent to all users!");
      setMessage("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass hover-lift">
          <Bell className="w-4 h-4 mr-2" />
          Request Classroom
        </Button>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Request a Classroom</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g., Need a room for project discussion, 2-3 PM..."
              className="glass mt-2"
              rows={4}
            />
          </div>
          <Button onClick={sendRequest} disabled={sending} className="w-full">
            {sending ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomRequestDialog;
