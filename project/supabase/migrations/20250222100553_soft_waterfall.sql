/*
  # Create survey results table

  1. New Tables
    - `survey_results`
      - `id` (uuid, primary key)
      - `data` (jsonb, stores processed survey data)
      - `uploaded_by` (text, Nostr public key of uploader)
      - `filename` (text, original CSV filename)
      - `uploaded_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `survey_results` table
    - Add policies for:
      - Anyone can read survey results
      - Only authenticated users can insert their own survey results
*/

CREATE TABLE IF NOT EXISTS survey_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  uploaded_by text NOT NULL,
  filename text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE survey_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read survey results
CREATE POLICY "Survey results are viewable by everyone" 
  ON survey_results
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to upload their own survey results
CREATE POLICY "Users can upload their own survey results"
  ON survey_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = uploaded_by);