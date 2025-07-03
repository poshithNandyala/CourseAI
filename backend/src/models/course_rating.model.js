import mongoose, { Schema } from "mongoose";

const courseRatingSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    },
    { 
        timestamps: true 
    }
);

// Ensures a user can only rate a course once
courseRatingSchema.index({ course_id: 1, user_id: 1 }, { unique: true });

export const CourseRating = mongoose.model("CourseRating", courseRatingSchema);