const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// GET categories with company filter
router.get("/", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const data = await Category.find({ companyId }).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST create category
router.post("/", async (req, res) => {
    try {
        const { companyId, name } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Category name required" });
        }
        
        // Check if category already exists for this company
        const existingCategory = await Category.findOne({ 
            companyId, 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });
        
        if (existingCategory) {
            return res.status(400).json({ 
                message: `Category "${name}" already exists for this company`,
                exists: true 
            });
        }
        
        const newItem = new Category({ 
            companyId, 
            name: name.trim()
        });
        
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Error creating category:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Category already exists for this company" });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// UPDATE category
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { name } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Category name required" });
        }
        
        // Check if another category with same name exists for this company
        const existingCategory = await Category.findOne({ 
            companyId, 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        
        if (existingCategory) {
            return res.status(400).json({ 
                message: `Category "${name}" already exists for this company`,
                exists: true 
            });
        }
        
        const updated = await Category.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { name: name.trim() },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "Category not found or access denied" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating category:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Category already exists for this company" });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// UPDATE category status
router.put("/:id/status", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { isActive } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const updated = await Category.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { isActive },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "Category not found or access denied" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating category status:", err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE category
router.delete("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // Check if category is being used by any product
        const Product = require("../models/Product");
        const productsUsingCategory = await Product.findOne({ 
            companyId, 
            category: req.params.id 
        });
        
        if (productsUsingCategory) {
            return res.status(400).json({ 
                message: "Cannot delete category as it is being used by one or more products. Please reassign or delete those products first." 
            });
        }
        
        const deleted = await Category.findOneAndDelete({ 
            _id: req.params.id, 
            companyId 
        });
        
        if (!deleted) {
            return res.status(404).json({ error: "Category not found or access denied" });
        }
        
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;