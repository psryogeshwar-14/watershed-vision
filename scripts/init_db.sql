-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage to watershed_user
GRANT ALL PRIVILEGES ON DATABASE watershed_db TO watershed_user;
