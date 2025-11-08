-- Fix cr_codes table RLS - allow anyone to read CR codes for verification
CREATE POLICY "Anyone can view CR codes for verification"
ON cr_codes
FOR SELECT
TO authenticated, anon
USING (true);

-- Add RLS policy to allow profile creation via trigger
CREATE POLICY "Allow profile creation via trigger"
ON profiles
FOR INSERT
WITH CHECK (true);