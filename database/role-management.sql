-- Role Management SQL Script for Fitness App
-- This script demonstrates how to create and manage user roles

-- 1. View current user roles
SELECT 'Current Users and Roles:' as info;
SELECT id, fullName, email, role, created_at FROM users ORDER BY role DESC, created_at;

-- 2. Create sample users for each role (if they don't exist)
-- Note: Passwords are hashed, these are just examples

-- Super Admin (highest access level)
INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('Super Administrator', 'superadmin@fitness-app.com', '$2a$10$hash_placeholder', 'Super Admin');

-- Admin (can manage testers and athletes)
INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('System Admin', 'admin@fitness-app.com', '$2a$10$hash_placeholder', 'Admin');

INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('Regional Admin', 'regional@fitness-app.com', '$2a$10$hash_placeholder', 'Admin');

-- Tester (can manage athlete performance tests)
INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('Performance Tester 1', 'tester1@fitness-app.com', '$2a$10$hash_placeholder', 'Tester');

INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('Performance Tester 2', 'tester2@fitness-app.com', '$2a$10$hash_placeholder', 'Tester');

-- Athlete (basic access)
INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('John Athlete', 'john@fitness-app.com', '$2a$10$hash_placeholder', 'Athlete');

INSERT OR IGNORE INTO users (fullName, email, password, role) 
VALUES ('Jane Runner', 'jane@fitness-app.com', '$2a$10$hash_placeholder', 'Athlete');

-- 3. Role promotion/demotion examples

-- Promote a user to Tester
-- UPDATE users SET role = 'Tester', updated_at = CURRENT_TIMESTAMP 
-- WHERE email = 'john@fitness-app.com';

-- Promote a user to Admin
-- UPDATE users SET role = 'Admin', updated_at = CURRENT_TIMESTAMP 
-- WHERE email = 'tester1@fitness-app.com';

-- Demote a user to Athlete
-- UPDATE users SET role = 'Athlete', updated_at = CURRENT_TIMESTAMP 
-- WHERE email = 'tester2@fitness-app.com';

-- 4. Role-based queries

-- View all Super Admins
SELECT 'Super Admins:' as info;
SELECT id, fullName, email FROM users WHERE role = 'Super Admin';

-- View all Admins
SELECT 'Admins:' as info;
SELECT id, fullName, email FROM users WHERE role = 'Admin';

-- View all Testers
SELECT 'Testers:' as info;
SELECT id, fullName, email FROM users WHERE role = 'Tester';

-- View all Athletes
SELECT 'Athletes:' as info;
SELECT id, fullName, email FROM users WHERE role = 'Athlete';

-- 5. User count by role
SELECT 'User Count by Role:' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY 
  CASE role 
    WHEN 'Super Admin' THEN 4
    WHEN 'Admin' THEN 3
    WHEN 'Tester' THEN 2
    WHEN 'Athlete' THEN 1
  END DESC;

-- 6. Find users who can manage specific roles
-- Users who can manage Athletes (Tester and above)
SELECT 'Users who can manage Athletes (Tester+):' as info;
SELECT id, fullName, email, role FROM users 
WHERE role IN ('Super Admin', 'Admin', 'Tester')
ORDER BY CASE role 
  WHEN 'Super Admin' THEN 4
  WHEN 'Admin' THEN 3
  WHEN 'Tester' THEN 2
END DESC;

-- Users who can manage Testers (Admin and above)
SELECT 'Users who can manage Testers (Admin+):' as info;
SELECT id, fullName, email, role FROM users 
WHERE role IN ('Super Admin', 'Admin')
ORDER BY CASE role 
  WHEN 'Super Admin' THEN 4
  WHEN 'Admin' THEN 3
END DESC;

-- 7. Role validation queries
-- Check for invalid roles (should return no results)
SELECT 'Invalid roles (should be empty):' as info;
SELECT * FROM users WHERE role NOT IN ('Super Admin', 'Admin', 'Tester', 'Athlete');

-- Check for users without roles (should be empty)
SELECT 'Users without roles (should be empty):' as info;
SELECT * FROM users WHERE role IS NULL OR role = '';

-- 8. Performance tests with role context
SELECT 'Performance tests with tester roles:' as info;
SELECT 
  pt.id,
  pt.timestamp,
  a.fullName as athlete_name,
  u.fullName as tester_name,
  u.role as tester_role
FROM performance_tests pt
LEFT JOIN athletes a ON pt.athlete_id = a.id
LEFT JOIN users u ON pt.user_id = u.id
ORDER BY pt.timestamp DESC
LIMIT 10; 