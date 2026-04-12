const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');

// Super admin credentials
const SUPER_ADMIN = {
    username: 'Admin',
    password: 'admin'
};

// 🔹 SUPER ADMIN LOGIN
router.post('/', async (req, res) => {
    console.log('📝 Super admin login attempt:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username and password required' 
            });
        }
        
        if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
            const superAdminData = {
                id: 'super_admin',
                username: SUPER_ADMIN.username,
                role: 'super_admin',
                isSuperAdmin: true
            };
            
            console.log('✅ Super admin login successful');
            
            return res.json({
                success: true,
                message: 'Super admin login successful',
                user: superAdminData,
                isSuperAdmin: true,
                redirectTo: '/admin/dashboard'
            });
        } else {
            console.log('❌ Invalid super admin credentials');
            return res.status(401).json({ 
                success: false,
                error: 'Invalid super admin credentials' 
            });
        }
    } catch (err) {
        console.error('Super admin login error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🔹 COMPANY ADMIN LOGIN - Using adminUser
router.post('/login', async (req, res) => {
    console.log('📝 Company admin login attempt:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username and password required' 
            });
        }
        
        // Find company by adminUser.username (case-insensitive)
        const company = await Company.findOne({ 
            'adminUser.username': username.toLowerCase(),
            isActive: true 
        });
        
        if (!company) {
            console.log('❌ Company not found or inactive:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid company credentials or account deactivated' 
            });
        }
        
        // Check if company has adminUser credentials
        if (!company.adminUser || !company.adminUser.password) {
            console.log('❌ Company has no admin credentials:', company.companyName);
            return res.status(401).json({ 
                success: false,
                error: 'Company credentials not configured. Please contact super admin.' 
            });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, company.adminUser.password);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for company:', company.companyName);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }
        
        // Return company data without password
        const companyData = {
            id: company._id,
            companyName: company.companyName,
            companyPrintOutName: company.companyPrintOutName,
            headerLine1: company.headerLine1,
            headerLine2: company.headerLine2,
            headerLine3: company.headerLine3,
            footer: company.footer,
            username: company.adminUser.username,
            role: 'admin',
            isActive: company.isActive,
            isSuperAdmin: false
        };
        
        console.log('✅ Company admin login successful:', company.companyName);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: companyData,
            isSuperAdmin: false,
            companyId: company._id,
            redirectTo: '/dashboard'
        });
        
    } catch (err) {
        console.error('Company login error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🔹 REGULAR USER LOGIN - Using embedded users array
router.post('/user-login', async (req, res) => {
    console.log('📝 Regular user login attempt:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username and password required' 
            });
        }
        
        // Find company that has this user in the users array
        const company = await Company.findOne({ 
            'users.username': username.toLowerCase(),
            'users.isActive': true,
            isActive: true 
        });
        
        if (!company) {
            console.log('❌ User not found or inactive:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }
        
        // Find the user in the users array
        const user = company.users.find(u => u.username === username.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await company.save();
        
        // Return user data without password
        const userData = {
            id: user._id,
            name: user.name,
            username: user.username,
            role: 'user',
            companyId: company._id,
            companyName: company.companyName,
            isActive: user.isActive,
            isSuperAdmin: false
        };
        
        console.log('✅ Regular user login successful:', user.username);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userData,
            isSuperAdmin: false,
            companyId: company._id,
            redirectTo: '/dashboard'
        });
        
    } catch (err) {
        console.error('User login error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🔹 UNIVERSAL LOGIN - Tries both admin and regular user
router.post('/universal-login', async (req, res) => {
    console.log('📝 Universal login attempt:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username and password required' 
            });
        }
        
        // First, try to find as company admin
        let company = await Company.findOne({ 
            'adminUser.username': username.toLowerCase(),
            isActive: true 
        });
        
        if (company && company.adminUser && company.adminUser.password) {
            const isValidPassword = await bcrypt.compare(password, company.adminUser.password);
            
            if (isValidPassword) {
                const companyData = {
                    id: company._id,
                    companyName: company.companyName,
                    companyPrintOutName: company.companyPrintOutName,
                    headerLine1: company.headerLine1,
                    headerLine2: company.headerLine2,
                    headerLine3: company.headerLine3,
                    footer: company.footer,
                    username: company.adminUser.username,
                    role: 'admin',
                    isActive: company.isActive,
                    isSuperAdmin: false
                };
                
                console.log('✅ Company admin login successful (universal):', company.companyName);
                
                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: companyData,
                    isSuperAdmin: false,
                    companyId: company._id,
                    redirectTo: '/dashboard'
                });
            }
        }
        
        // If not admin, try to find as regular user
        company = await Company.findOne({ 
            'users.username': username.toLowerCase(),
            'users.isActive': true,
            isActive: true 
        });
        
        if (company) {
            const user = company.users.find(u => u.username === username.toLowerCase());

            console.log('📝 User found for universal login:', user ? user.username : 'No user found');
            
            if (user) {
                const isValidPassword = await bcrypt.compare(password, user.password);

                console.log('📝 Password validation result for universal login:', isValidPassword);
                
                if (isValidPassword) {
                    user.lastLogin = new Date();
                    await company.save();
                    
                    const userData = {
                        id: user._id,
                        name: user.name,
                        username: user.username,
                        role: 'user',
                        companyId: company._id,
                        companyName: company.companyName,
                        isActive: user.isActive,
                        isSuperAdmin: false
                    };
                    
                    console.log('✅ Regular user login successful (universal):', user.username);
                    
                    return res.json({
                        success: true,
                        message: 'Login successful',
                        user: userData,
                        isSuperAdmin: false,
                        companyId: company._id,
                        redirectTo: '/dashboard'
                    });
                }
            }
        }
        
        console.log('❌ Invalid credentials (universal):', username);
        return res.status(401).json({ 
            success: false,
            error: 'Invalid credentials' 
        });
        
    } catch (err) {
        console.error('Universal login error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Auth server is running',
        endpoints: {
            superAdmin: 'POST /admin',
            companyAdmin: 'POST /admin/login',
            regularUser: 'POST /admin/user-login',
            universalLogin: 'POST /admin/universal-login',
            test: 'GET /admin/test'
        }
    });
});

module.exports = router;