import mongoose, { Schema } from "mongoose";

const courseCommentLikeSchema = new Schema(
    {
        comment_id: {
            type: Schema.Types.ObjectId,
            ref: "CourseComment",
            required: true,
            index: true,
        },
        user_id: {
            type: String,
            ref: "User",
            required: true,
            index: true
        },
    },
    { 
        timestamps: true 
    }
);

// Ensure user can only like a comment once
courseCommentLikeSchema.index({ comment_id: 1, user_id: 1 }, { unique: true });

export const CourseCommentLike = mongoose.model("CourseCommentLike", courseCommentLikeSchema);
