-- Create room_requests table for notification system
CREATE TABLE public.room_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  requester_branch branch_type NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view requests
CREATE POLICY "Anyone can view room requests"
ON public.room_requests
FOR SELECT
USING (true);

-- Authenticated users can create requests
CREATE POLICY "Users can create room requests"
ON public.room_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_requests;