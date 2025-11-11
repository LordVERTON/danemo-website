-- Add qr_code column to orders table
-- This migration adds a QR code field to enable tracking orders via QR code scanning

-- Add the qr_code column to orders table (unique, nullable for existing records)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) UNIQUE;

-- Add an index for better query performance on qr_code lookups
CREATE INDEX IF NOT EXISTS idx_orders_qr_code ON orders(qr_code);

-- Add a comment to document the column
COMMENT ON COLUMN orders.qr_code IS 'Unique QR code identifier for tracking orders. Generated automatically when order is created.';

-- Function to generate a unique QR code for orders
-- Format: ORD-{timestamp}-{random}
CREATE OR REPLACE FUNCTION generate_order_qr_code()
RETURNS TEXT AS $$
DECLARE
  generated_qr_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate QR code: ORD-{timestamp}-{random 6 chars}
    generated_qr_code := 'ORD-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM9999999999') || '-' || 
               SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6);
    
    -- Check if this QR code already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE orders.qr_code = generated_qr_code) INTO exists_check;
    
    -- If it doesn't exist, we can use it
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN generated_qr_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate QR code when order is created (if not provided)
CREATE OR REPLACE FUNCTION set_order_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set QR code if it's not already provided
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_order_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_order_qr_code ON orders;
CREATE TRIGGER trigger_set_order_qr_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_qr_code();

