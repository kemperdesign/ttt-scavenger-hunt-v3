-- Run automatically by PostgreSQL on first container start
-- Enables required extensions for TimeQuest

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
