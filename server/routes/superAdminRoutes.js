const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Super admin credentials (hardcoded as requested)
const SUPER_ADMIN = {
    username: 'Admin',
    password: 'h8dw7258th'
};

// 🔹 Super Admin Login
router.post('/super-admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Check credentials
        if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
            // Create super admin session data
            const superAdminData = {
                id: 'super_admin',
                username: SUPER_ADMIN.username,
                role: 'super_admin',
                isSuperAdmin: true
            };
            
            return res.json({
                success: true,
                message: 'Super admin login successful',
                user: superAdminData,
                isSuperAdmin: true
            });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Company User Login
router.post('/company-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const Company = require('../models/Company');
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Find company by username
        const company = await Company.findOne({ 
            'superUser.username': username.toLowerCase(),
            isActive: true 
        });
        
        if (!company) {
            return res.status(401).json({ error: 'Invalid credentials or company is deactivated' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, company.superUser.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Return company data without password
        const companyData = company.toObject();
        delete companyData.superUser.password;
        
        res.json({
            success: true,
            message: 'Login successful',
            user: companyData,
            isSuperAdmin: false,
            companyId: company._id
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;