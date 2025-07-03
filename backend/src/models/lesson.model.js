import mongoose, { Schema } from "mongoose";

const videoDataSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    duration: {
        type: String,
        default: "0:00"
    },
    thumbnailUrl: {
        type: String,
        default: ""
    },
    channelTitle: {
        type: String,
        default: ""
    },
    publishedAt: {
        type: String,
        default: ""
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    embedUrl: {
        type: String,
        required: true
    },
    watchUrl: {
        type: String,
        required: true
    },
    relevanceScore: {
        type: Number,
        default: 0
    }
}, { _id: false });

const quizQuestionSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer'],
        default: 'multiple_choice'
    },
    options: [{
        type: String
    }],
    correct_answer: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        default: ""
    }
}, { _id: false });

const resourceSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['article', 'documentation', 'video', 'tutorial'],
        default: 'article'
    }
}, { _id: false });

const lessonSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['video', 'article', 'quiz', 'code'],
            default: 'article'
        },
        order: {
            type: Number,
            required: true,
            default: 1
        },
        video_url: {
            type: String,
            default: ""
        },
        // Store complete video data as embedded documents
        video_data: [videoDataSchema],
        quiz_questions: [quizQuestionSchema],
        resources: [resourceSchema],
        estimated_duration: {
            type: Number,
            default: 30 // in minutes
        }
    },
    { 
        timestamps: true 
    }
);

// Add indexes for better performance
lessonSchema.index({ course_id: 1, order: 1 });

export const Lesson = mongoose.model("Lesson", lessonSchema);