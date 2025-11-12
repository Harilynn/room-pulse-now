import { useEffect, useMemo, useState } from "react";
import { supabase, Branch } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  userBranch: Branch;
  userId: string;
}

interface Classroom { id: string; room_number: string; building: string; }
interface TimetableRow {
  id: string;
  day_of_week: number;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  classroom_id: string | null;
  class_name: string;
  subject: string;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TimetableForm = ({ userBranch, userId }: Props) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [items, setItems] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [day, setDay] = useState<string>(String(new Date().getDay()));
  const [start, setStart] = useState<string>("09:00");
  const [end, setEnd] = useState<string>("10:00");
  const [roomId, setRoomId] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [roomsRes, tRes] = await Promise.all([
        supabase.from("classrooms").select("id, room_number, building").order("room_number"),
        supabase.from("timetable").select("id, day_of_week, start_time, end_time, classroom_id, class_name, subject").eq("branch", userBranch).order("day_of_week").order("start_time"),
      ]);

      if (roomsRes.error) toast.error("Failed to load classrooms");
      else setClassrooms(roomsRes.data || []);

      if (tRes.error) toast.error("Failed to load timetable");
      else setItems(tRes.data || []);
    })();
  }, [userBranch]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return toast.error("Select a room");
    if (!className || !subject) return toast.error("Class and subject required");
    if (start >= end) return toast.error("Start must be before end");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("timetable")
        .insert({
          day_of_week: Number(day),
          start_time: `${start}:00`,
          end_time: `${end}:00`,
          classroom_id: roomId,
          branch: userBranch,
          class_name: className,
          subject,
        })
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => [...prev, data as any].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
      setClassName("");
      setSubject("");
    } catch (e: any) {
      toast.error(e.message || "Failed to add slot");
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("timetable").delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const itemsByDay = useMemo(() => {
    const map = new Map<number, TimetableRow[]>();
    items.forEach((it) => {
      const arr = map.get(it.day_of_week) || [];
      arr.push(it);
      map.set(it.day_of_week, arr);
    });
    return map;
  }, [items]);

  const syncToday = async () => {
    const today = new Date();
    const dow = today.getDay();
    const todays = items.filter((i) => i.day_of_week === dow && i.classroom_id);
    if (!todays.length) return toast.info("No slots for today");

    setLoading(true);
    try {
      const y = today.getFullYear();
      const m = today.getMonth();
      const d = today.getDate();

      await Promise.all(
        todays.map(async (slot) => {
          const [sh, sm] = slot.start_time.split(":");
          const [eh, em] = slot.end_time.split(":");

          const startDt = new Date(y, m, d, Number(sh), Number(sm));
          const endDt = new Date(y, m, d, Number(eh), Number(em));

          const startIso = startDt.toISOString();
          const endIso = endDt.toISOString();

          // End any overlapping occupancies for this classroom
          await supabase
            .from("classroom_occupancy")
            .update({ end_time: startIso })
            .eq("classroom_id", slot.classroom_id!)
            .gt("end_time", startIso)
            .lt("start_time", endIso);

          // Insert occupancy for this slot
          const { error } = await supabase.from("classroom_occupancy").insert({
            classroom_id: slot.classroom_id!,
            branch: userBranch,
            class_name: slot.class_name,
            subject: slot.subject,
            occupied_by: userId,
            status: "occupied",
            start_time: startIso,
            end_time: endIso,
            purpose: null,
          });
          if (error) throw error;
        })
      );

      toast.success("Synced today's timetable to occupancy");
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass p-6 hover-lift">
        <div className="mb-4">
          <h3 className="text-xl font-bold gradient-text">Add Weekly Slot</h3>
          <p className="text-sm text-muted-foreground">Create or manage weekly timetable entries for your branch</p>
        </div>
        <form onSubmit={addSlot} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((n, i) => (
                  <SelectItem key={i} value={String(i)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.room_number} - {r.building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="glass" />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="glass" />
          </div>
          <div>
            <Label>Class Name</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., CSE 3rd Year" className="glass" />
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Algorithms" className="glass" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Add Slot"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold gradient-text">Weekly Timetable</h3>
          <Button variant="secondary" onClick={syncToday} disabled={loading}>
            {loading ? "Syncing..." : "Sync today's occupancy"}
          </Button>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left p-2">Day</th>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Room</th>
                <th className="text-left p-2">Class</th>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const room = classrooms.find((c) => c.id === it.classroom_id);
                return (
                  <tr key={it.id} className="border-t border-border/30">
                    <td className="p-2">{dayNames[it.day_of_week]}</td>
                    <td className="p-2">{it.start_time.slice(0,5)} - {it.end_time.slice(0,5)}</td>
                    <td className="p-2">{room ? `${room.room_number} - ${room.building}` : ""}</td>
                    <td className="p-2">{it.class_name}</td>
                    <td className="p-2">{it.subject}</td>
                    <td className="p-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteSlot(it.id)} disabled={loading}>Delete</Button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">No entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TimetableForm;
