import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Branch = 'CSE' | 'ECE' | 'IT' | 'MECH' | 'CIVIL' | 'EEE';
export type UserRole = 'student' | 'cr' | 'admin';
export type ClassroomStatus = 'vacant' | 'occupied' | 'reserved';
