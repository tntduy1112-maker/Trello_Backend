-- Migration 005: add cover_image_url to cards & object_name to attachments
-- cover_image_url: stores the MinIO public URL of the attachment set as card cover
-- object_name:     stores the MinIO object key (used to delete file from storage)

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS object_name TEXT;
