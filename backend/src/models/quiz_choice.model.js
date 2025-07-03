import mongoose, { Schema } from "mongoose";

const quizChoiceSchema = new Schema({
    question_id: {
        type: Schema.Types.ObjectId,
        ref: "QuizQuestion",
        required: true,
        index: true,
    },
    choice_text: {
        type: String,
        required: true,
    },
    is_correct: {
        type: Boolean,
        required: true,
        default: false,
    },
});

export const QuizChoice = mongoose.model("QuizChoice", quizChoiceSchema);