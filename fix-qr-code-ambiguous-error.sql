-- Fix ambiguous column reference error in generate_order_qr_code function
-- This script fixes the error: column reference "qr_code" is ambiguous

-- Drop and recreate the function with renamed variable to avoid conflict
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

