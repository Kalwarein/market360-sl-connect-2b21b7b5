-- Enable realtime for profiles table to sync online presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;