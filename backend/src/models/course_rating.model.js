import mongoose, { Schema } from "mongoose";

const courseRatingSchema = new Schema(
    {
        course_id: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true
        },
        user_id: {
            type: String,
            ref: "User",
            required: true,
            index: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: function(value) {
                    return Number.isInteger(value) && value >= 1 && value <= 5;
                },
                message: "Rating must be an integer between 1 and 5"
            }
        },
        review: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    { 
        timestamps: true 
    }
);

// Compound index to ensure one rating per user per course
courseRatingSchema.index({ course_id: 1, user_id: 1 }, { unique: true });

// Index for efficient rating queries
courseRatingSchema.index({ course_id: 1, rating: 1 });

// Static method to calculate average rating for a course
courseRatingSchema.statics.calculateAverageRating = async function(courseId) {
    const stats = await this.aggregate([
        {
            $match: { course_id: new mongoose.Types.ObjectId(courseId) }
        },
        {
            $group: {
                _id: "$course_id",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 },
                distribution: {
                    $push: "$rating"
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const result = stats[0];
    
    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.distribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
        averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings: result.totalRatings,
        distribution
    };
};

// Method to update course rating statistics
courseRatingSchema.methods.updateCourseStats = async function() {
    const CourseRating = this.constructor;
    const Course = mongoose.model("Course");
    
    const stats = await CourseRating.calculateAverageRating(this.course_id);
    
    await Course.findByIdAndUpdate(this.course_id, {
        rating: stats.averageRating,
        ratings_count: stats.totalRatings
    });
    
    return stats;
};

// Post-save middleware to update course statistics
courseRatingSchema.post('save', async function() {
    await this.updateCourseStats();
});

// Post-remove middleware to update course statistics
courseRatingSchema.post('remove', async function() {
    await this.updateCourseStats();
});

// Post-findOneAndDelete middleware to update course statistics
courseRatingSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        await doc.updateCourseStats();
    }
});

export const CourseRating = mongoose.model("CourseRating", courseRatingSchema);
