-- Register Astro Blitz in the analytics database
-- Run this SQL query in your Supabase SQL editor if the app is not already registered

INSERT INTO applications (name, description, domain)
VALUES ('astro-blitz', 'Astro Blitz - A fast-paced space shooter game', 'your-game-domain.com')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    domain = EXCLUDED.domain;

-- Verify registration
SELECT * FROM applications WHERE name = 'astro-blitz';
