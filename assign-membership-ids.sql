-- SQL script to assign membership IDs to existing users
-- This will update all users who don't currently have a membership_id

-- First, let's see how many users need membership IDs
SELECT COUNT(*) as users_without_membership_id 
FROM users 
WHERE membership_id IS NULL OR membership_id = '';

-- Update users with generated membership IDs
-- We'll use a combination of user ID and timestamp to ensure uniqueness
UPDATE users 
SET membership_id = 'DSNC' || 
                   CASE 
                     WHEN id < 10 THEN '00000' || id
                     WHEN id < 100 THEN '0000' || id  
                     WHEN id < 1000 THEN '000' || id
                     WHEN id < 10000 THEN '00' || id
                     WHEN id < 100000 THEN '0' || id
                     ELSE CAST(id AS TEXT)
                   END ||
                   SUBSTR(CAST((julianday('now') - julianday('1970-01-01')) * 86400000 AS INTEGER), -3)
WHERE membership_id IS NULL OR membership_id = '';

-- Verify the update
SELECT id, fullName, email, role, membership_id 
FROM users 
ORDER BY id; 