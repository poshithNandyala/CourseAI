/*
  # Create courses table

  1. New Tables
    - `courses`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `title` (text, not null)
      - `description` (text, not null)
      - `thumbnail_url` (text, optional)
      - `creator_id` (uuid, foreign key to users.id)
      - `is_published` (boolean, default false)
      - `difficulty` (text, check constraint for 'beginner', 'intermediate', 'advanced')
      - `estimated_duration` (integer, not null) - in minutes
      - `tags` (text array, default empty array)
      - `likes_count` (integer, default 0)
      - `rating` (numeric, default 0.0)
      - `ratings_count` (integer, default 0)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `courses` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  thumbnail_url text,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_published boolean DEFAULT false,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  rating numeric DEFAULT 0.0,
  ratings_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read published courses
CREATE POLICY "Anyone can read published courses"
  ON courses
  FOR SELECT
  USING (is_published = true OR auth.uid() = creator_id);

-- Policy to allow creators to manage their own courses
CREATE POLICY "Creators can manage own courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id);

-- Policy to allow authenticated users to create courses
CREATE POLICY "Authenticated users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);