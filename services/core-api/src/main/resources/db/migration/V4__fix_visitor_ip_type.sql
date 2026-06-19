-- ================================================================
-- V4: Change visitor_ip from INET to TEXT so Java String mapping works
-- ================================================================
ALTER TABLE conversations ALTER COLUMN visitor_ip TYPE TEXT USING visitor_ip::TEXT;
