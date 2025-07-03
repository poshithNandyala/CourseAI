import mongoose, { Schema } from "mongoose";

const courseTagSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        tag: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } } // Tags usually don't need updates
);

// Add a compound index to prevent duplicate tags per course
courseTagSchema.index({ course_id: 1, tag: 1 }, { unique: true });

export const CourseTag = mongoose.model("CourseTag", courseTagSchema);
