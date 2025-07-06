import mongoose, { Schema } from "mongoose";

const verificationSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        code: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['signup', 'password_reset', 'email_change'],
            required: true
        },
        expires_at: {
            type: Date,
            required: true,
            default: Date.now,
            index: { expireAfterSeconds: 0 }
        },
        attempts: {
            type: Number,
            default: 0,
            max: 5
        },
        verified: {
            type: Boolean,
            default: false
        },
        user_data: {
            type: Schema.Types.Mixed,
            required: function() {
                return this.type === 'signup';
            }
        }
    },
    {
        timestamps: true
    }
);

// Index for faster queries
verificationSchema.index({ email: 1, type: 1, verified: 1 });
verificationSchema.index({ expires_at: 1 });

// Auto-delete expired documents
verificationSchema.index({ "expires_at": 1 }, { expireAfterSeconds: 0 });

export const Verification = mongoose.model("Verification", verificationSchema);
