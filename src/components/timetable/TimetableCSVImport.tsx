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

const rowSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().min(1),
  branch: z.enum(allowedBranches),
  class_name: z.string().min(1),
  subject: z.string().min(1),
});

type Row = z.infer<typeof rowSchema>;

type PreviewRow = Row & {
  valid: boolean;
  errors: string[];
  classroom_id?: string;
};

const TimetableCSVImport = ({ userBranch }: Props) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
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
        const parsed = (results.data as any[]).map((raw) => {
          // Normalize keys and trim
          const obj: any = {};
          Object.keys(raw || {}).forEach((k) => {
            obj[k.trim()] = typeof raw[k] === "string" ? String(raw[k]).trim() : raw[k];
          });

          const validation = rowSchema.safeParse(obj);
          let preview: PreviewRow;
          if (!validation.success) {
            preview = {
              ...(obj as Row),
              valid: false,
              errors: validation.error.issues.map((i) => i.message),
            } as PreviewRow;
          } else {
            const v = validation.data;
            const errs: string[] = [];

            // Branch must match the CR's branch
            if (v.branch !== userBranch) {
              errs.push(`Branch mismatch: ${v.branch} (expected ${userBranch})`);
            }

            // Room must exist
            const cid = roomMap.get(v.room.trim().toLowerCase());
            if (!cid) errs.push(`Unknown room: ${v.room}`);

            // Time order
            if (v.start_time >= v.end_time) {
              errs.push("start_time must be before end_time");
            }

            preview = {
              ...v,
              classroom_id: cid,
              valid: errs.length === 0,
              errors: errs,
            };
          }
          return preview;
        });
        setRows(parsed);
      },
      error: () => toast.error("Failed to parse CSV"),
    });
  };

  const validRows = rows.filter((r) => r.valid && r.classroom_id);
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
        <p className="text-sm text-muted-foreground">Columns: day_of_week,start_time,end_time,room,branch,class_name,subject</p>
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
