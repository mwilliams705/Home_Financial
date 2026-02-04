-- Grant app user ownership and permissions in the public schema
ALTER SCHEMA public OWNER TO home_financial;

GRANT ALL ON SCHEMA public TO home_financial;
GRANT ALL ON ALL TABLES IN SCHEMA public TO home_financial;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO home_financial;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO home_financial;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO home_financial;
