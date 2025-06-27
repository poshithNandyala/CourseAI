/*
  # Enable Complete Public Access to Published Courses

  1. Security Changes
    - Enable public (anonymous) access to published courses
    - Enable public access to lessons of published courses  
    - Enable public access to comments on published courses
    - Ensure NO authentication required for viewing published content

  2. Public Policies
    - Allow anonymous users to read published courses
    - Allow anonymous users to read lessons of published courses
    - Allow anonymous users to read comments on published courses
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Public can view comments on published courses" ON public.comments;

-- Enable COMPLETE public access to published courses (NO AUTH REQUIRED)
CREATE POLICY "Anonymous users can view published courses" 
ON public.courses
FOR SELECT 
TO anon, authenticated
USING (is_published = true);

-- Enable COMPLETE public access to lessons of published courses (NO AUTH REQUIRED)
CREATE POLICY "Anonymous users can view lessons of published courses" 
ON public.lessons
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);

-- Enable COMPLETE public access to comments on published courses (NO AUTH REQUIRED)
CREATE POLICY "Anonymous users can view comments on published courses" 
ON public.comments
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = comments.course_id
    AND courses.is_published = true
  )
);

-- Ensure the anon role has SELECT permissions
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.users TO anon;

-- Grant usage on sequences if needed
GRANT USAGE ON SCHEMA public TO anon;