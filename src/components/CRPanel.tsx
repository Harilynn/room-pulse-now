import { useState, useEffect } from "react";
import { supabase, Branch } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";

interface Props {
  userBranch: Branch;
  userId: string;
}

const CRPanel = ({ userBranch, userId }: Props) => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState<"vacant" | "occupied" | "reserved">("occupied");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .order("room_number");

    if (!error && data) {
      setClassrooms(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, end any existing occupancy for this classroom that's ongoing/future
      const { error: updateError } = await supabase
        .from("classroom_occupancy")
        .update({ end_time: new Date().toISOString() })
        .eq("classroom_id", selectedClassroom)
        .gte("end_time", new Date().toISOString());

      if (updateError) throw updateError;

      // If status is vacant, we're done - no need to insert
      if (status === "vacant") {
        toast.success("Classroom marked as vacant!");
        setClassName("");
        setSubject("");
        setPurpose("");
        setStartTime("");
        setEndTime("");
        setIsSubmitting(false);
        return;
      }

      // Insert new occupancy for occupied or reserved
      const { error } = await supabase.from("classroom_occupancy").insert({
        classroom_id: selectedClassroom,
        branch: userBranch,
        class_name: className,
        subject: subject || null,
        occupied_by: userId,
        status,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose || null,
      });

      if (error) throw error;

      toast.success("Classroom status updated!");
      
      // Reset form
      setClassName("");
      setSubject("");
      setPurpose("");
      setStartTime("");
      setEndTime("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass p-6 hover-lift">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold gradient-text">CR Panel</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="classroom">Classroom</Label>
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom} required>
            <SelectTrigger className="glass">
              <SelectValue placeholder="Select classroom" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number} - {room.building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value: any) => setStatus(value)} required>
            <SelectTrigger className="glass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status !== "vacant" && (
          <>
            <div>
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., ECE 3rd Year"
                className="glass"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Signals & Systems"
                className="glass"
              />
            </div>

            <div>
              <Label htmlFor="purpose">Purpose (for reserved)</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., OA/Interview"
                className="glass"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass"
                  required
                />
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="w-full hover-glow" disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Updating..." : "Update Status"}
        </Button>
      </form>
    </Card>
  );
};

export default CRPanel;
