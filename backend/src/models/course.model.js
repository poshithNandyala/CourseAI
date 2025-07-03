import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const courseSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail_url: {
            type: String,
            default: ""
        },
        owner_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        is_published: {
            type: Boolean,
            default: false,
            index: true
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
            index: true
        },
        estimated_duration: {
            type: Number,
            default: 0 // in minutes
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        likes_count: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        ratings_count: {
            type: Number,
            default: 0
        },
        views_count: {
            type: Number,
            default: 0
        }
    },
    { 
        timestamps: true 
    }
);

// Add text search index
courseSchema.index({ 
    title: 'text', 
    description: 'text', 
    tags: 'text' 
});

// Add compound indexes for better query performance
courseSchema.index({ is_published: 1, createdAt: -1 });
courseSchema.index({ owner_id: 1, is_published: 1 });
courseSchema.index({ difficulty: 1, is_published: 1 });

courseSchema.plugin(mongooseAggregatePaginate);

export const Course = mongoose.model("Course", courseSchema);