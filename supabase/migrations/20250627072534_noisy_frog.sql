/*
  # Create comments table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `course_id` (uuid, foreign key to courses.id)
      - `user_id` (uuid, foreign key to users.id)
      - `content` (text, not null)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `comments` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read comments on published courses
CREATE POLICY "Anyone can read comments on published courses"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = comments.course_id 
      AND courses.is_published = true
    )
  );

-- Policy to allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update/delete their own comments
CREATE POLICY "Users can manage own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);