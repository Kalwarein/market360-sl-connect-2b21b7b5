-- Enable realtime for store_perks table
ALTER TABLE public.store_perks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_perks;