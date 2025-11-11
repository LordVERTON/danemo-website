-- Add container_id column to orders table
-- This migration adds a foreign key relationship between orders and containers tables

-- First, create the containers table if it doesn't exist
CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  vessel VARCHAR(255),
  departure_port VARCHAR(255),
  arrival_port VARCHAR(255),
  etd TIMESTAMP WITH TIME ZONE,
  eta TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'departed', 'in_transit', 'arrived', 'delivered', 'delayed')),
  client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add an index for better query performance on containers
CREATE INDEX IF NOT EXISTS idx_containers_code ON containers(code);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
CREATE INDEX IF NOT EXISTS idx_containers_client_id ON containers(client_id);

-- Add trigger to update updated_at for containers
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now add the container_id column to orders table (nullable, as orders may not be in a container)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS container_id UUID REFERENCES containers(id) ON DELETE SET NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_container_id ON orders(container_id);

-- Add a comment to document the column
COMMENT ON COLUMN orders.container_id IS 'Foreign key reference to the containers table. NULL if the order is not assigned to a container.';

