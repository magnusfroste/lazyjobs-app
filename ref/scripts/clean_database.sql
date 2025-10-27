-- Clean LazyJobs Database
-- Removes all test data for fresh start with new OpenJobs data

-- Clear all jobs
DELETE FROM jobs;

-- Verify cleanup
SELECT 'jobs' as table_name, COUNT(*) as remaining_rows FROM jobs;

-- Success message
SELECT 'LazyJobs database cleaned! Ready for fresh ingestion.' as status;
