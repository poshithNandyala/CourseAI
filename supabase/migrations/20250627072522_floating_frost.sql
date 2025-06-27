/*
  # Create lessons table

  1. New Tables
    - `lessons`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `course_id` (uuid, foreign key to courses.id)
      - `title` (text, not null)
      - `content` (text, not null)
      - `type` (text, check constraint for 'video', 'article', 'quiz', 'code')
      - `order` (integer, not null)
      - `video_url` (text, optional)
      - `quiz_questions` (jsonb, optional)
      - `resources` (jsonb, optional)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `lessons` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text CHECK (type IN ('video', 'article', 'quiz', 'code')) DEFAULT 'article',
  "order" integer NOT NULL,
  video_url text,
  quiz_questions jsonb,
  resources jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read lessons of published courses
CREATE POLICY "Anyone can read lessons of published courses"
  ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id 
      AND (courses.is_published = true OR courses.creator_id = auth.uid())
    )
  );

-- Policy to allow course creators to manage lessons
CREATE POLICY "Course creators can manage lessons"
  ON lessons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id 
      AND courses.creator_id = auth.uid()
    )
  );