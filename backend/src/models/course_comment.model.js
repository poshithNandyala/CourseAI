import mongoose, { Schema } from "mongoose";

const courseCommentSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        parent_comment_id: { // For threaded replies
            type: Schema.Types.ObjectId,
            ref: "CourseComment",
            default: null,
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        likes_count: {
            type: Number,
            default: 0
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { 
        timestamps: true 
    }
);

// Add indexes for better query performance
courseCommentSchema.index({ course_id: 1, createdAt: -1 });
courseCommentSchema.index({ user_id: 1, createdAt: -1 });

export const CourseComment = mongoose.model("CourseComment", courseCommentSchema);