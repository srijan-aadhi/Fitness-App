-- Migration script to add timestamp columns to existing users table
-- This handles SQLite's limitation with ALTER TABLE and dynamic defaults

-- Step 1: Add columns with NULL defaults (SQLite allows this)
ALTER TABLE users ADD COLUMN created_at DATETIME;
ALTER TABLE users ADD COLUMN updated_at DATETIME;

-- Step 2: Update existing records to have proper timestamps
UPDATE users SET 
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

-- Step 3: Verify the migration
SELECT 'Users table after timestamp migration:' as info;
SELECT id, fullName, email, role, created_at, updated_at FROM users;

-- Step 4: Check if all users have timestamps
SELECT 'Users without timestamps (should be empty):' as info;
SELECT id, fullName, email FROM users WHERE created_at IS NULL OR updated_at IS NULL; 