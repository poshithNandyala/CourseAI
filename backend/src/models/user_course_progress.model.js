import mongoose, { Schema } from "mongoose";

const userCourseProgressSchema = new Schema(
    {
        user_id: {
            type: String,
            ref: "User",
            required: true,
        },
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        last_accessed_at: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["not_started", "ongoing", "completed"],
            default: "not_started",
        },
    },
    { timestamps: true }
);

// Ensures a user has only one overall progress entry per course.
userCourseProgressSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export const UserCourseProgress = mongoose.model("UserCourseProgress", userCourseProgressSchema);