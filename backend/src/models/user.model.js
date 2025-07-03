import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        _id: {
            type: String,
            required: true,
            unique: true,
            primary: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password_hash: {
            type: String,
            required: [true, "password is required"],
        },
        fullname: {
            type: String,
            required: true,
            trim: true
        },
        avatar_url: {
            type: String,
            default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        },
        refresh_token: {
            type: String,
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password_hash")) return next()
    this.password_hash = await bcrypt.hash(this.password_hash, 10)
    this.updated_at = new Date()
    next()
}) 

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password_hash)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)