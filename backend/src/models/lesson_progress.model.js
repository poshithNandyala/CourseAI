import mongoose, { Schema } from "mongoose";

const lessonProgressSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        lesson_id: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
        },
        is_completed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

// Ensures a user has only one progress entry per lesson.
lessonProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

export const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);