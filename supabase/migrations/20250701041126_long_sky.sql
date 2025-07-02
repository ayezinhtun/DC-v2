/*
  # DC Site Access Management Schema

  1. New Tables
    - `dc_visitors`
      - `id` (uuid, primary key) - Unique visitor record ID
      - `name` (text, required) - Visitor full name
      - `nrc_no` (text, required) - National Registration Card number
      - `phone_number` (text, required) - Contact phone number
      - `company_name` (text) - Visiting company name
      - `visit_purpose` (text) - Reason for DC visit
      - `employee_card_number` (text) - Employee identification
      - `access_container_no` (text) - Container access number
      - `access_rack_no` (text) - Rack access number
      - `inventory_list` (text) - Equipment/inventory details
      - `photo_url` (text) - Supabase storage URL for visitor photo
      - `in_time` (timestamptz, required) - Entry timestamp
      - `out_time` (timestamptz) - Exit timestamp (null until checkout)
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `dc_visitors` table
    - Add policies for authenticated and anonymous access (kiosk mode)

  3. Storage
    - Create storage bucket for visitor photos
    - Set up public access for photo viewing
*/

-- Create the dc_visitors table
CREATE TABLE IF NOT EXISTS dc_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nrc_no text NOT NULL,
  phone_number text NOT NULL,
  company_name text,
  visit_purpose text,
  employee_card_number text,
  access_container_no text,
  access_rack_no text,
  inventory_list text,
  photo_url text,
  in_time timestamptz NOT NULL DEFAULT now(),
  out_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dc_visitors ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (kiosk mode)
CREATE POLICY "Allow anonymous insert for kiosk"
  ON dc_visitors
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select for kiosk"
  ON dc_visitors
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update for checkout"
  ON dc_visitors
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visitor-photos', 'visitor-photos', true)
ON CONFLICT DO NOTHING;

-- Create storage policy for public access
CREATE POLICY "Public photo upload"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'visitor-photos');

CREATE POLICY "Public photo access"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'visitor-photos');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dc_visitors_in_time ON dc_visitors(in_time DESC);
CREATE INDEX IF NOT EXISTS idx_dc_visitors_nrc_no ON dc_visitors(nrc_no);
CREATE INDEX IF NOT EXISTS idx_dc_visitors_company ON dc_visitors(company_name);
CREATE INDEX IF NOT EXISTS idx_dc_visitors_name ON dc_visitors(name);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_dc_visitors_updated_at
  BEFORE UPDATE ON dc_visitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();