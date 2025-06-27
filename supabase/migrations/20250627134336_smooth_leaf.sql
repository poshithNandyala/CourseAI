/*
  # Enable public access to published courses

  1. New RLS Policies
    - Allow anyone to read published courses
    - Allow anyone to read lessons of published courses
    - Allow anyone to read comments on published courses
    
  2. Functions
    - Add functions for incrementing/decrementing course likes
    - Add function for updating course ratings
*/

-- Enable public access to published courses
CREATE POLICY "Anyone can read published courses" 
ON public.courses
FOR SELECT 
TO public
USING (is_published = true);

-- Enable public access to lessons of published courses
CREATE POLICY "Anyone can read lessons of published courses" 
ON public.lessons
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);

-- Enable public access to comments on published courses
CREATE POLICY "Anyone can read comments on published courses" 
ON public.comments
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = comments.course_id
    AND courses.is_published = true
  )
);

-- Create course_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.course_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Enable RLS on course_likes
ALTER TABLE public.course_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for course_likes
CREATE POLICY "Users can manage their own likes"
ON public.course_likes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to increment course likes
CREATE OR REPLACE FUNCTION public.increment_course_likes(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.courses
  SET likes_count = likes_count + 1
  WHERE id = course_id;
END;
$$;

-- Create function to decrement course likes
CREATE OR REPLACE FUNCTION public.decrement_course_likes(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.courses
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = course_id;
END;
$$;

-- Create function to update course rating
CREATE OR REPLACE FUNCTION public.update_course_rating(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric;
  ratings_count integer;
BEGIN
  -- Calculate average rating
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, ratings_count
  FROM public.ratings
  WHERE course_id = update_course_rating.course_id;
  
  -- Update course
  UPDATE public.courses
  SET 
    rating = COALESCE(avg_rating, 0),
    ratings_count = COALESCE(ratings_count, 0)
  WHERE id = update_course_rating.course_id;
END;
$$;