import { supabase } from '../lib/supabase';
import { Course, Lesson, Comment, Rating } from '../types';
import { useAuthStore } from '../store/authStore';
import { generateAICourse, GeneratedCourse } from './aiCourseGenerator';
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

export const generateCourseWithAI = async (prompt: string): Promise<{ course: Partial<Course>; lessons: Lesson[]; generatedContent: GeneratedCourse }> => {
  console.log('🤖 Generating AI course for prompt:', prompt);
  
  try {
    // Generate comprehensive course content using AI
    const generatedContent = await generateAICourse(prompt);
    
    // Convert generated content to our course format
    const courseData: Partial<Course> = {
      title: generatedContent.title,
      description: generatedContent.overview,
      difficulty: 'beginner' as const,
      estimated_duration: generatedContent.lessons.length * 45, // 45 minutes per lesson
      tags: extractTagsFromTopic(prompt),
      is_published: false,
    };

    // Convert lessons to our lesson format
    const lessons: Lesson[] = generatedContent.lessons.map((lesson, index) => ({
      id: `lesson-${index + 1}`,
      course_id: '',
      title: lesson.title,
      content: formatLessonContent(lesson),
      type: index === 0 ? 'article' : (index % 3 === 0 ? 'quiz' : 'article') as 'article' | 'quiz',
      order: index + 1,
      video_url: lesson.videos[0]?.url,
      quiz_questions: lesson.quiz.map(q => ({
        id: `q-${index}-${Math.random().toString(36).substr(2, 9)}`,
        question: q.question,
        type: 'multiple_choice' as const,
        options: q.options,
        correct_answer: q.options[q.correctAnswer],
        explanation: q.explanation
      })),
      resources: lesson.furtherReading.map(r => ({
        id: `r-${Math.random().toString(36).substr(2, 9)}`,
        title: r.title,
        url: r.url,
        type: r.type as 'article' | 'documentation' | 'video'
      })),
      created_at: new Date().toISOString()
    }));

    console.log('✅ AI course generation completed');
    return { course: courseData, lessons, generatedContent };
  } catch (error) {
    console.error('❌ AI course generation failed:', error);
    throw error;
  }
};

function extractTagsFromTopic(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  const tags: string[] = [];
  
  // Add the main topic
  tags.push(topic.toLowerCase().replace(/\s+/g, '-'));
  
  // Add related tags based on content
  if (topicLower.includes('react')) tags.push('react', 'javascript', 'frontend');
  if (topicLower.includes('python')) tags.push('python', 'programming', 'backend');
  if (topicLower.includes('javascript')) tags.push('javascript', 'programming', 'web');
  if (topicLower.includes('machine learning')) tags.push('ml', 'ai', 'data-science');
  if (topicLower.includes('web development')) tags.push('html', 'css', 'javascript');
  if (topicLower.includes('data science')) tags.push('python', 'analytics', 'statistics');
  
  // Add general tags
  tags.push('tutorial', 'beginner-friendly');
  
  return [...new Set(tags)]; // Remove duplicates
}

function formatLessonContent(lesson: any): string {
  let content = `# ${lesson.title}\n\n`;
  
  content += `## Lesson Objective\n${lesson.objective}\n\n`;
  
  if (lesson.videos && lesson.videos.length > 0) {
    content += `## Video Resources\n\n`;
    lesson.videos.forEach((video: any) => {
      content += `### ${video.title}\n`;
      content += `**Duration:** ${video.duration}\n\n`;
      content += `${video.description}\n\n`;
      content += `[Watch Video](${video.url})\n\n`;
    });
  }
  
  content += `## Summary\n\n${lesson.summary}\n\n`;
  
  if (lesson.furtherReading && lesson.furtherReading.length > 0) {
    content += `## Further Reading\n\n`;
    lesson.furtherReading.forEach((resource: any) => {
      content += `- [${resource.title}](${resource.url}) - ${resource.description}\n`;
    });
    content += '\n';
  }
  
  return content;
}

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