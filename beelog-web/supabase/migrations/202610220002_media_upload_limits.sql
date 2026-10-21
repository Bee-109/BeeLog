begin;

-- Keep BeeLog media private and make the configured limits match the uploader.
-- Existing objects and policies are preserved; this only updates bucket settings.
update storage.buckets
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/*', 'video/*']::text[]
where id = 'beelog-media';

commit;
