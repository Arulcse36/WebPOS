const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    companyPrintOutName: {
        type: String,
        required: [true, 'Company print out name is required'],
        trim: true
    },
    headerLine1: {
        type: String,
        required: [true, 'Header line 1 is required'],
        trim: true
    },
    headerLine2: {
        type: String,
        required: [true, 'Header line 2 is required'],
        trim: true
    },
    headerLine3: {
        type: String,
        required: [true, 'Header line 3 is required'],
        trim: true
    },
    footer: {
        type: String,
        required: [true, 'Footer text is required'],
        default: "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System"
    },
    adminUser: {
        username: {
            type: String,
            trim: true,
            lowercase: true
        },
        password: {
            type: String
        }
    },
    // ✅ Embedded users array (similar to adminUser)
    users: [{
        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
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
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: {
        type: Date,
        default: null
    },
    deactivatedReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
companySchema.index({ companyName: 1 }, { unique: true });
companySchema.index({ isActive: 1 });
companySchema.index({ 'adminUser.username': 1 }, { unique: true, sparse: true });
companySchema.index({ 'users.username': 1 });

module.exports = mongoose.model('Company', companySchema);