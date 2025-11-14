-- Normalize legacy match scores from 0-1 to 0-100 format
-- This ensures all match scores are consistently displayed as percentages
UPDATE matches 
SET match_score = match_score * 100 
WHERE match_score <= 1;