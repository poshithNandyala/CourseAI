import mongoose, { Schema } from "mongoose";

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
        description: {
            type: String,
        },
        video_url: {
            type: String, // URL to the video
            required: true,
        },
        sequence_number: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export const Lesson = mongoose.model("Lesson", lessonSchema);