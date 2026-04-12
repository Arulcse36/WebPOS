const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required'],
        index: true
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ REMOVE the pre-save middleware completely
// You are already hashing passwords manually in userRoutes.js

// Indexes
userSchema.index({ companyId: 1, username: 1 });
userSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);