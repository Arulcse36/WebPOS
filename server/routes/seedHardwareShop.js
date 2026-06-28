// backend/routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Uom = require('../models/Uom');
const Product = require('../models/Product');

// POST /api/seed-database
router.post('/seed-database', async (req, res) => {
  const { companyId } = req.body;
  
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const COMPANY_ID = new mongoose.Types.ObjectId(companyId);
    
    // Check if company exists
    const Company = require('../models/Company');
    const companyExists = await Company.findById(COMPANY_ID);
    if (!companyExists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Clear existing data for this company
    await Brand.deleteMany({ companyId: COMPANY_ID });
    await Category.deleteMany({ companyId: COMPANY_ID });
    await Product.deleteMany({ companyId: COMPANY_ID });
    

    
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;