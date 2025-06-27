/*
  # Fix public access and course interactions

  1. Public Access
    - Enable public access to published courses
    - Enable public access to lessons of published courses
    - Enable public access to comments on published courses
  
  2. Course Interactions
    - Create course_likes table if needed
    - Enable RLS on course_likes
    - Create policies for course likes management
    - Create functions for course likes and ratings
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read published courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can read lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Public can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can read comments on published courses" ON public.comments;
DROP POLICY IF EXISTS "Public can view comments on published courses" ON public.comments;

-- Enable public access to published courses
CREATE POLICY "Public can view published courses" 
ON public.courses
FOR SELECT 
TO public
USING (is_published = true);

-- Enable public access to lessons of published courses
CREATE POLICY "Public can view lessons of published courses" 
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
CREATE POLICY "Public can view comments on published courses" 
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

-- Check if course_likes table exists, create if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_likes'
  ) THEN
    CREATE TABLE public.course_likes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE(course_id, user_id)
    );
    
    -- Enable RLS on course_likes
    ALTER TABLE public.course_likes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing course_likes policies if they exist
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.course_likes;
DROP POLICY IF EXISTS "Authenticated users can manage their own likes" ON public.course_likes;

-- Create policies for course_likes
CREATE POLICY "Authenticated users can manage their own likes"
ON public.course_likes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create or replace function to increment course likes
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

-- Create or replace function to decrement course likes
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

-- Create or replace function to update course rating
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

-- Create or replace function to toggle course like
CREATE OR REPLACE FUNCTION public.toggle_course_like(course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
  like_exists boolean;
BEGIN
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to like courses';
  END IF;

  -- Check if like already exists
  SELECT EXISTS(
    SELECT 1 FROM public.course_likes 
    WHERE course_likes.course_id = toggle_course_like.course_id 
    AND course_likes.user_id = user_id
  ) INTO like_exists;

  IF like_exists THEN
    -- Remove like
    DELETE FROM public.course_likes 
    WHERE course_likes.course_id = toggle_course_like.course_id 
    AND course_likes.user_id = user_id;
    
    -- Decrement likes count
    PERFORM public.decrement_course_likes(toggle_course_like.course_id);
    
    RETURN false;
  ELSE
    -- Add like
    INSERT INTO public.course_likes (course_id, user_id) 
    VALUES (toggle_course_like.course_id, user_id);
    
    -- Increment likes count
    PERFORM public.increment_course_likes(toggle_course_like.course_id);
    
    RETURN true;
  END IF;
END;
$$;