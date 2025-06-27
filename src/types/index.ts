export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'github';
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  creator_id: string;
  creator: {
    name: string;
    avatar_url?: string;
  };
  is_published: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // in minutes
  tags: string[];
  likes_count: number;
  rating: number;
  ratings_count: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  type: 'video' | 'article' | 'quiz' | 'code';
  order: number;
  video_url?: string;
  quiz_questions?: QuizQuestion[];
  resources?: Resource[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'documentation' | 'video';
}

export interface Comment {
  id: string;
  course_id: string;
  user_id: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  content: string;
  created_at: string;
}

export interface Rating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  course_id: string;
  user_id: string;
  completed_lessons: string[];
  progress_percentage: number;
  last_accessed: string;
}