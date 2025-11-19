-- Make job_id nullable in notification_history for test notifications
ALTER TABLE notification_history 
ALTER COLUMN job_id DROP NOT NULL;