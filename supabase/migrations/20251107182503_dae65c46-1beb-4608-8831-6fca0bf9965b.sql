-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'cr', 'admin');

-- Create enum for branch types
CREATE TYPE branch_type AS ENUM ('CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE');

-- Create enum for classroom status
CREATE TYPE classroom_status AS ENUM ('vacant', 'occupied', 'reserved');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  branch branch_type NOT NULL,
  cr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create classrooms table
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  floor TEXT NOT NULL,
  building TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create classroom occupancy table
CREATE TABLE classroom_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  branch branch_type NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT,
  occupied_by UUID REFERENCES profiles(id),
  status classroom_status NOT NULL DEFAULT 'vacant',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CR verification codes table
CREATE TABLE cr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch branch_type NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timetable table for scheduled classes
CREATE TABLE timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  branch branch_type NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CR chat messages table
CREATE TABLE cr_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_branch branch_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for classrooms (everyone can view)
CREATE POLICY "Anyone can view classrooms"
  ON classrooms FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for classroom_occupancy
CREATE POLICY "Anyone can view occupancy"
  ON classroom_occupancy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CRs can insert occupancy"
  ON classroom_occupancy FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cr'
    )
  );

CREATE POLICY "CRs can update occupancy"
  ON classroom_occupancy FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cr'
    )
  );

-- RLS Policies for timetable
CREATE POLICY "Anyone can view timetable"
  ON timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CRs can manage timetable"
  ON timetable FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cr'
    )
  );

-- RLS Policies for CR chat
CREATE POLICY "CRs can view chat"
  ON cr_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cr'
    )
  );

CREATE POLICY "CRs can send messages"
  ON cr_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cr'
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, branch)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    (NEW.raw_user_meta_data->>'branch')::branch_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_occupancy_updated_at
  BEFORE UPDATE ON classroom_occupancy
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert dummy CR codes for testing
INSERT INTO cr_codes (branch, code) VALUES
  ('CSE', 'CSE123'),
  ('ECE', 'ECE456'),
  ('IT', 'IT789'),
  ('MECH', 'MECH101'),
  ('CIVIL', 'CIVIL202'),
  ('EEE', 'EEE303');

-- Insert sample classrooms
INSERT INTO classrooms (room_number, capacity, floor, building) VALUES
  ('E-101', 60, '1st Floor', 'E-Block'),
  ('E-102', 60, '1st Floor', 'E-Block'),
  ('E-201', 60, '2nd Floor', 'E-Block'),
  ('E-202', 60, '2nd Floor', 'E-Block'),
  ('B-101', 80, '1st Floor', 'B-Block'),
  ('B-102', 80, '1st Floor', 'B-Block'),
  ('B-201', 80, '2nd Floor', 'B-Block'),
  ('B-305', 100, '3rd Floor', 'B-Block');

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE cr_chat_messages;