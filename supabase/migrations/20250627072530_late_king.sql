/*
  # Create ratings table

  1. New Tables
    - `ratings`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `course_id` (uuid, foreign key to courses.id)
      - `user_id` (uuid, foreign key to users.id)
      - `rating` (integer, check constraint 1-5)
      - `created_at` (timestamp with timezone, default now())
      - Unique constraint on (course_id, user_id)

  2. Security
    - Enable RLS on `ratings` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read ratings
CREATE POLICY "Anyone can read ratings"
  ON ratings
  FOR SELECT
  TO authenticated;

-- Policy to allow users to manage their own ratings
CREATE POLICY "Users can manage own ratings"
  ON ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);