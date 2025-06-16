-- Update user srijanaadhi4@gmail.com to Trainer (Tester) role
UPDATE users SET role = 'Tester' WHERE email = 'srijanaadhi4@gmail.com';

-- Verify the update
SELECT id, fullName, email, role FROM users WHERE email = 'srijanaadhi4@gmail.com';

-- Show all users and their roles for confirmation
SELECT id, fullName, email, role, created_at FROM users ORDER BY role DESC, created_at; 