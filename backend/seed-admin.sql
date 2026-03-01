INSERT INTO users (id, email, "passwordHash", role, active, "mustChangePassword", "createdAt")
SELECT gen_random_uuid(), 'admin@travel.local', '$2b$10$cauI82TEJ4.7ptAKBLopO.Ko8L9eG16MxBl4zlWOrzg4uDpVkmXI.', 'admin', true, false, now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@travel.local');

INSERT INTO branches (id, name, location, active, "createdAt")
SELECT gen_random_uuid(), 'Main Branch', 'Head Office', true, now()
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Main Branch');

INSERT INTO agents (id, "userId", "branchId", "displayName", active, "createdAt")
SELECT gen_random_uuid(), u.id, b.id, 'Admin Agent', true, now()
FROM users u, branches b
WHERE u.email = 'admin@travel.local' AND b.name = 'Main Branch'
AND NOT EXISTS (SELECT 1 FROM agents WHERE "userId" = u.id);
