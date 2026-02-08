-- Create storage bucket for audio/video uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  3221225472, -- 3GB limit
  array[
    'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/flac', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/aiff', 'audio/opus',
    'video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/mpeg', 'video/3gpp'
  ]
);

-- RLS policies for uploads bucket
create policy "Users can upload their own files"
on storage.objects for insert
with check (
  bucket_id = 'uploads' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own files"
on storage.objects for select
using (
  bucket_id = 'uploads' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'uploads' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create library table for storing upload metadata and generated materials
create table public.library (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  duration_seconds integer,
  transcript text,
  summary text,
  notes jsonb,
  flashcards jsonb,
  quizzes jsonb,
  key_points jsonb,
  glossary jsonb,
  exam_questions jsonb,
  visual_image_url text,
  status text not null default 'processing',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.library enable row level security;

-- RLS policies for library
create policy "Users can view their own library items"
on public.library for select
using (auth.uid() = user_id);

create policy "Users can create their own library items"
on public.library for insert
with check (auth.uid() = user_id);

create policy "Users can update their own library items"
on public.library for update
using (auth.uid() = user_id);

create policy "Users can delete their own library items"
on public.library for delete
using (auth.uid() = user_id);

-- Create trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_library_updated_at
before update on public.library
for each row
execute function public.update_updated_at_column();