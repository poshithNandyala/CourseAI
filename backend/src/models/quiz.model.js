import mongoose, { Schema } from "mongoose";

const quizSchema = new Schema(
    {
        lesson_id: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
            unique: true, // Typically one quiz per lesson
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);