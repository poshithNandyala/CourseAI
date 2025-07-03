import mongoose, { Schema } from "mongoose";

const courseCommentSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        parent_comment_id: { // For threaded replies
            type: Schema.Types.ObjectId,
            ref: "CourseComment",
            default: null,
        },
        comment_text: {
            type: String,
            required: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const CourseComment = mongoose.model("CourseComment", courseCommentSchema);

