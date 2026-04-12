const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

// 🔹 GET all users for a company
router.get('/', async (req, res) => {
    try {
        const { companyId, search = "" } = req.query;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Filter users based on search
        let users = company.users || [];
        if (search) {
            users = users.filter(user => 
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.username.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort by createdAt descending
        users.sort((a, b) => b.createdAt - a.createdAt);

        // Remove passwords from response
        const safeUsers = users.map(user => {
            const userObj = user.toObject();
            delete userObj.password;
            return userObj;
        });

        res.json(safeUsers);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔹 CREATE user
router.post('/', async (req, res) => {
    try {
        const { companyId, name, password } = req.body;

        console.log('Creating user with data:', { companyId, name });

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        if (!name || !password) {
            return res.status(400).json({ error: 'Name and password required' });
        }

        // Get company details to generate username
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Generate username: company.user.name
        const companyName = company.companyName.toLowerCase().replace(/\s+/g, '.');
        const userName = name.toLowerCase().replace(/\s+/g, '.');
        const username = `${companyName}.user.${userName}`;

        console.log('Generated username:', username);

        // Check if username already exists in users array
        const existingUser = company.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this name already exists for this company' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user object
        const newUser = {
            username,
            password: hashedPassword,
            name,
            isActive: true,
            createdAt: new Date()
        };

        // Add to company's users array
        company.users.push(newUser);
        await company.save();

        // Get the newly created user
        const savedUser = company.users[company.users.length - 1];
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        console.log('User created successfully:', userResponse);
        res.status(201).json(userResponse);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔹 UPDATE user (password and status)
router.put('/:userId', async (req, res) => {
    try {
        const { companyId } = req.query;
        const { password, isActive } = req.body;
        const { userId } = req.params;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Find user index
        const userIndex = company.users.findIndex(u => u._id.toString() === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields
        if (password) {
            const salt = await bcrypt.genSalt(10);
            company.users[userIndex].password = await bcrypt.hash(password, salt);
        }
        if (isActive !== undefined) {
            company.users[userIndex].isActive = isActive;
        }

        await company.save();

        const userResponse = company.users[userIndex].toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔹 DELETE user
router.delete('/:userId', async (req, res) => {
    try {
        const { companyId } = req.query;
        const { userId } = req.params;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Find user
        const userExists = company.users.find(u => u._id.toString() === userId);
        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove user from array
        company.users = company.users.filter(u => u._id.toString() !== userId);
        await company.save();

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔹 USER LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password required'
            });
        }

        // Find company that has this user
        const company = await Company.findOne({
            'users.username': username.toLowerCase(),
            'users.isActive': true
        });

        if (!company) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Find the user
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
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await company.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            companyId: company._id,
            companyName: company.companyName
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;