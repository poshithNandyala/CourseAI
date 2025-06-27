import { supabase } from '../lib/supabase';
import { Course, Lesson, Comment, Rating } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Mock data for demo mode
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Complete React.js Course',
    description: 'Learn React from basics to advanced concepts with hands-on projects',
    creator_id: 'demo-user',
    creator: { name: 'Demo Instructor', avatar_url: undefined },
    is_published: true,
    difficulty: 'intermediate',
    estimated_duration: 240,
    tags: ['react', 'javascript', 'frontend'],
    likes_count: 156,
    rating: 4.8,
    ratings_count: 42,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Python for Beginners',
    description: 'Start your programming journey with Python fundamentals',
    creator_id: 'demo-user-2',
    creator: { name: 'Python Expert', avatar_url: undefined },
    is_published: true,
    difficulty: 'beginner',
    estimated_duration: 180,
    tags: ['python', 'programming', 'basics'],
    likes_count: 203,
    rating: 4.9,
    ratings_count: 67,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return url && 
         key && 
         !url.includes('your_supabase_project_url') && 
         !key.includes('your_supabase_anon_key') &&
         url.startsWith('http');
};

export const generateCourseWithAI = async (prompt: string): Promise<{ course: Partial<Course>; lessons: Lesson[] }> => {
  // Simulate AI course generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const courseTitle = `Complete Guide to ${prompt}`;
  const mockCourse: Partial<Course> = {
    title: courseTitle,
    description: `A comprehensive course covering all aspects of ${prompt}. This course includes practical examples, hands-on exercises, and real-world applications.`,
    difficulty: 'intermediate' as const,
    estimated_duration: 180,
    tags: [prompt.toLowerCase(), 'programming', 'tutorial'],
    is_published: false,
  };

  const mockLessons: Lesson[] = [
    {
      id: '1',
      course_id: '',
      title: `Introduction to ${prompt}`,
      content: `# Introduction to ${prompt}\n\nWelcome to your comprehensive course on ${prompt}. In this lesson, we'll cover the fundamentals and set up your learning environment.\n\n## What you'll learn:\n- Basic concepts and terminology\n- Setting up your development environment\n- Your first practical example`,
      type: 'article',
      order: 1,
      resources: [
        {
          id: '1',
          title: 'Official Documentation',
          url: 'https://example.com/docs',
          type: 'documentation'
        }
      ]
    },
    {
      id: '2',
      course_id: '',
      title: `Practical Examples in ${prompt}`,
      content: `# Practical Examples\n\nLet's dive into some hands-on examples to solidify your understanding.\n\n\`\`\`javascript\n// Example code here\nconsole.log('Hello, ${prompt}!');\n\`\`\``,
      type: 'code',
      order: 2,
    },
    {
      id: '3',
      course_id: '',
      title: 'Knowledge Check',
      content: 'Test your understanding with this quick quiz.',
      type: 'quiz',
      order: 3,
      quiz_questions: [
        {
          id: '1',
          question: `What is the main benefit of using ${prompt}?`,
          type: 'multiple_choice',
          options: ['Easy to learn', 'High performance', 'Great community', 'All of the above'],
          correct_answer: 'All of the above',
          explanation: `${prompt} offers multiple benefits including ease of learning, performance, and community support.`
        }
      ]
    }
  ];

  return { course: mockCourse, lessons: mockLessons };
};

export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('User must be authenticated');

  if (!isSupabaseConfigured()) {
    // Return mock course for demo
    const mockCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      title: courseData.title || 'Untitled Course',
      description: courseData.description || 'No description',
      creator_id: user.id,
      creator: { name: user.name, avatar_url: user.avatar_url },
      is_published: false,
      difficulty: courseData.difficulty || 'beginner',
      estimated_duration: courseData.estimated_duration || 60,
      tags: courseData.tags || [],
      likes_count: 0,
      rating: 0,
      ratings_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    toast.success('Course created successfully! (Demo mode)');
    return mockCourse;
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        creator_id: user.id,
      })
      .select(`
        *,
        creator:users(name, avatar_url)
      `)
      .single();

    if (error) throw error;
    
    toast.success('Course created successfully!');
    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    toast.error('Failed to create course');
    throw error;
  }
};

export const fetchCourses = async (published_only = false): Promise<Course[]> => {
  if (!isSupabaseConfigured()) {
    // Return mock courses for demo
    return published_only ? mockCourses : mockCourses;
  }

  try {
    let query = supabase
      .from('courses')
      .select(`
        *,
        creator:users(name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (published_only) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const fetchCourseById = async (id: string): Promise<Course | null> => {
  if (!isSupabaseConfigured()) {
    return mockCourses.find(c => c.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        creator:users(name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

export const fetchLessonsByCourseId = async (courseId: string): Promise<Lesson[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
};

export const publishCourse = async (courseId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    toast.success('Course published successfully! (Demo mode)');
    return;
  }

  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: true })
      .eq('id', courseId);

    if (error) throw error;
    
    toast.success('Course published successfully!');
  } catch (error) {
    console.error('Error publishing course:', error);
    toast.error('Failed to publish course');
    throw error;
  }
};

export const rateCourse = async (courseId: string, rating: number): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('User must be authenticated');

  if (!isSupabaseConfigured()) {
    toast.success('Rating submitted successfully! (Demo mode)');
    return;
  }

  try {
    const { error } = await supabase
      .from('ratings')
      .upsert({
        course_id: courseId,
        user_id: user.id,
        rating,
      }, { onConflict: 'course_id,user_id' });

    if (error) throw error;
    
    toast.success('Rating submitted successfully!');
  } catch (error) {
    console.error('Error rating course:', error);
    toast.error('Failed to submit rating');
    throw error;
  }
};