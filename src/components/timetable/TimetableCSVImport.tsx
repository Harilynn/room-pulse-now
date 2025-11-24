import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import { supabase, Branch } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  userBranch: Branch;
}

interface Classroom {
  id: string;
  room_number: string;
  building: string;
}

const allowedBranches = ["CSE", "ECE", "IT", "MECH", "CIVIL", "EEE"] as const;

type ParsedSlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  class_name: string;
  subject: string;
  valid: boolean;
  errors: string[];
  classroom_id?: string;
};

const dayMap: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const timeSlotMap: Record<string, { start: string; end: string }> = {
  "1": { start: "09:00", end: "10:00" },
  "2": { start: "10:00", end: "11:00" },
  "3": { start: "11:00", end: "12:00" },
  "4": { start: "12:00", end: "13:00" },
  "5": { start: "13:00", end: "14:00" },
  "6": { start: "14:00", end: "15:00" },
  "7": { start: "15:00", end: "16:00" },
  "8": { start: "16:00", end: "17:00" },
};

const TimetableCSVImport = ({ userBranch }: Props) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [rows, setRows] = useState<ParsedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("classrooms")
        .select("id, room_number, building")
        .order("room_number");
      if (error) {
        toast.error("Failed to load classrooms");
      } else {
        setClassrooms(data || []);
      }
    })();
  }, []);

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    classrooms.forEach((c) => map.set(c.room_number.trim().toLowerCase(), c.id));
    return map;
  }, [classrooms]);

  const handleFile = (file: File) => {
    setRows([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allSlots: ParsedSlot[] = [];
        const rawData = results.data as any[];

        // Process each row (day)
        rawData.forEach((row: any) => {
          const dayName = row["Days"]?.toLowerCase().trim();
          const dayNum = dayMap[dayName];

          if (dayNum === undefined) return;

          // Process each time slot column
          Object.keys(row).forEach((col) => {
            if (col === "Days" || !row[col] || row[col].trim() === "") return;

            // Extract slot number from column like "1 (9-10 am)"
            const slotMatch = col.match(/^(\d+)/);
            if (!slotMatch) return;

            const slotNum = slotMatch[1];
            const timeSlot = timeSlotMap[slotNum];
            if (!timeSlot) return;

            // Parse subject and room from cell
            const cellValue = row[col].trim();
            const roomMatch = cellValue.match(/\(([^)]+)\)/);
            const room = roomMatch ? roomMatch[1].trim() : "";
            const subject = cellValue.replace(/\([^)]+\)/g, "").trim();

            if (!subject) return;

            const errors: string[] = [];
            const roomKey = room.toLowerCase();
            const cid = roomMap.get(roomKey);

            if (!cid && room) {
              errors.push(`Unknown room: ${room}`);
            }

            allSlots.push({
              day_of_week: dayNum,
              start_time: timeSlot.start,
              end_time: timeSlot.end,
              room: room || "No Room",
              class_name: "Default Class",
              subject: subject,
              classroom_id: cid,
              valid: errors.length === 0 && !!cid,
              errors,
            });
          });
        });

        setRows(allSlots);
        if (allSlots.length === 0) {
          toast.error("No valid slots found in CSV");
        } else {
          toast.success(`Parsed ${allSlots.length} slots`);
        }
      },
      error: () => toast.error("Failed to parse CSV"),
    });
  };

  const validRows = rows.filter((r) => r.valid && r.classroom_id) as ParsedSlot[];
  const hasErrors = rows.some((r) => !r.valid);

  const handleImport = async () => {
    if (!validRows.length) return;
    setLoading(true);
    try {
      const payload = validRows.map((r) => ({
        day_of_week: r.day_of_week,
        start_time: `${r.start_time}:00`,
        end_time: `${r.end_time}:00`,
        classroom_id: r.classroom_id!,
        branch: userBranch,
        class_name: r.class_name,
        subject: r.subject,
      }));

      const { error } = await supabase.from("timetable").insert(payload);
      if (error) throw error;

      toast.success(`Imported ${payload.length} rows`);
      setRows([]);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass p-6 hover-lift">
      <div className="mb-4">
        <h3 className="text-xl font-bold gradient-text">CSV Import</h3>
        <p className="text-sm text-muted-foreground">
          Format: Days column + time slots (1-8) with subjects. Room in parentheses: "Subject (Room)"
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="csv">Upload CSV</Label>
          <Input
            id="csv"
            type="file"
            accept=".csv"
            className="glass"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {validRows.length} valid / {rows.length} total rows
              </p>
              <Button onClick={handleImport} disabled={!validRows.length || hasErrors || loading}>
                {loading ? "Importing..." : `Import ${validRows.length} row(s)`}
              </Button>
            </div>

            <div className="max-h-64 overflow-auto rounded-md border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Day</th>
                    <th className="text-left p-2">Start</th>
                    <th className="text-left p-2">End</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Class</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t border-border/30">
                      <td className="p-2">{r.day_of_week}</td>
                      <td className="p-2">{r.start_time}</td>
                      <td className="p-2">{r.end_time}</td>
                      <td className="p-2">{r.room}</td>
                      <td className="p-2">{r.class_name}</td>
                      <td className="p-2">{r.subject}</td>
                      <td className="p-2">
                        {r.valid ? (
                          <span className="text-green-600">OK</span>
                        ) : (
                          <span className="text-red-600">{r.errors.join(", ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimetableCSVImport;
