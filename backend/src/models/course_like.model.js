import mongoose, { Schema } from "mongoose";

const courseLikeSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Ensures a user can only like a course once.
courseLikeSchema.index({ course_id: 1, user_id: 1 }, { unique: true });

export const CourseLike = mongoose.model("CourseLike", courseLikeSchema);