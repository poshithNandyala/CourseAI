import mongoose, { Schema } from "mongoose";

const quizQuestionSchema = new Schema(
    {
        quiz_id: {
            type: Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
            index: true,
        },
        question_text: {
            type: String,
            required: true,
        },
        question_type: {
            type: String,
            enum: ["multiple_choice", "true_false", "short_answer"],
            required: true,
        },
        sequence_number: {
            type: Number,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const QuizQuestion = mongoose.model("QuizQuestion", quizQuestionSchema);
