import mongoose, { Schema } from "mongoose";

const quizResponseSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        question_id: {
            type: Schema.Types.ObjectId,
            ref: "QuizQuestion",
            required: true,
            index: true,
        },
        selected_choice_id: { // For multiple_choice or true_false
            type: Schema.Types.ObjectId,
            ref: "QuizChoice",
        },
        answer_text: { // For short_answer
            type: String,
        },
        is_correct: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// A user can only answer a specific question once.
quizResponseSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

export const QuizResponse = mongoose.model("QuizResponse", quizResponseSchema);
