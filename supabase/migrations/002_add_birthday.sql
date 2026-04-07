-- Add optional birthday column to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birthday date;
