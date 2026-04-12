const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

// 🔹 GET all companies
router.get('/', async (req, res) => {
    try {
        const { showInactive } = req.query;
        
        let filter = {};
        
        if (showInactive !== 'true') {
            filter.isActive = true;
        }
        
        const companies = await Company.find(filter).sort({ createdAt: -1 });
        
        // Safely remove passwords from response
        const safeCompanies = companies.map(company => {
            const companyObj = company.toObject();
            if (companyObj.adminUser) {
                delete companyObj.adminUser.password;
            }
            return companyObj;
        });
        
        res.json(safeCompanies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 GET single company
router.get('/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        const companyObj = company.toObject();
        if (companyObj.adminUser) {
            delete companyObj.adminUser.password;
        }
        
        res.json(companyObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 POST create company
router.post('/', async (req, res) => {
    try {
        const { 
            companyName, 
            companyPrintOutName, 
            headerLine1, 
            headerLine2, 
            headerLine3,
            footer,
            adminUsername,
            adminPassword
        } = req.body;
        
        // Check if company already exists
        const existingCompany = await Company.findOne({ companyName });
        if (existingCompany) {
            return res.status(400).json({ error: 'Company with this name already exists' });
        }
        
        // Check if username already exists (only if adminUsername is provided)
        if (adminUsername) {
            const existingUser = await Company.findOne({ 'adminUser.username': adminUsername.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ error: 'Admin username already taken' });
            }
        }
        
        // Hash password
        let hashedPassword = '';
        if (adminPassword) {
            hashedPassword = await bcrypt.hash(adminPassword, 10);
        }
        
        const company = new Company({
            companyName,
            companyPrintOutName,
            headerLine1,
            headerLine2,
            headerLine3,
            footer: footer || "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System",
            adminUser: {
                username: adminUsername ? adminUsername.toLowerCase() : '',
                password: hashedPassword
            },
            isActive: true
        });
        
        const savedCompany = await company.save();
        
        // Remove password from response
        const response = savedCompany.toObject();
        if (response.adminUser) {
            delete response.adminUser.password;
        }
        
        res.status(201).json(response);
    } catch (err) {
        console.error('Error creating company:', err);
        res.status(400).json({ error: err.message });
    }
});

// 🔹 PUT update company
router.put('/:id', async (req, res) => {
    try {
        const { 
            companyName, 
            companyPrintOutName, 
            headerLine1, 
            headerLine2, 
            headerLine3,
            footer,
            adminUsername,
            adminPassword
        } = req.body;
        
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        // Update basic info
        company.companyName = companyName;
        company.companyPrintOutName = companyPrintOutName;
        company.headerLine1 = headerLine1;
        company.headerLine2 = headerLine2;
        company.headerLine3 = headerLine3;
        company.footer = footer;
        
        // Update admin credentials if provided
        if (adminUsername && adminUsername.trim() !== '') {
            // Check if username is taken by another company
            const existingUser = await Company.findOne({ 
                'adminUser.username': adminUsername.toLowerCase(),
                _id: { $ne: req.params.id }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Admin username already taken' });
            }
            company.adminUser.username = adminUsername.toLowerCase();
        }
        
        if (adminPassword && adminPassword.trim() !== '') {
            company.adminUser.password = await bcrypt.hash(adminPassword, 10);
        }
        
        await company.save();
        
        // Remove password from response
        const response = company.toObject();
        if (response.adminUser) {
            delete response.adminUser.password;
        }
        
        res.json(response);
    } catch (err) {
        console.error('Error updating company:', err);
        res.status(400).json({ error: err.message });
    }
});

// 🔹 DEACTIVATE company
router.patch('/:id/deactivate', async (req, res) => {
    try {
        const { reason } = req.body;
        
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        if (!company.isActive) {
            return res.status(400).json({ error: 'Company is already deactivated' });
        }
        
        company.isActive = false;
        company.deactivatedAt = new Date();
        company.deactivatedReason = reason || 'No reason provided';
        
        await company.save();
        
        const response = company.toObject();
        if (response.adminUser) {
            delete response.adminUser.password;
        }
        
        res.json({ 
            message: 'Company deactivated successfully', 
            company: response
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 REACTIVATE company
router.patch('/:id/reactivate', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        if (company.isActive) {
            return res.status(400).json({ error: 'Company is already active' });
        }
        
        company.isActive = true;
        company.deactivatedAt = null;
        company.deactivatedReason = null;
        
        await company.save();
        
        const response = company.toObject();
        if (response.adminUser) {
            delete response.adminUser.password;
        }
        
        res.json({ 
            message: 'Company reactivated successfully', 
            company: response
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 DELETE company
router.delete('/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        if (company.isActive) {
            return res.status(400).json({ error: 'Please deactivate the company before deleting' });
        }
        
        await Company.findByIdAndDelete(req.params.id);
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;