import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
    {
        owner_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
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
            required: true,
        },
        is_published: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);