const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET products with company filter
router.get("/", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const query = { companyId };
        
        const data = await Product.find(query)
            .populate("category")
            .populate("brand")
            .populate("uom")
            .sort({ createdAt: -1 });
        
        res.json(data);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: err.message });
    }
});

// ADD product with companyId
router.post("/", async (req, res) => {
    try {
        const { companyId, ...productData } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const newItem = new Product({
            ...productData,
            companyId
        });
        
        const saved = await newItem.save();
        
        // Populate references before returning
        const populated = await Product.findById(saved._id)
            .populate("category")
            .populate("brand")
            .populate("uom");
        
        res.json(populated);
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(400).json({ error: err.message });
    }
});

// UPDATE product
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const updateData = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // Find and update product only if it belongs to the company
        const updated = await Product.findOneAndUpdate(
            { _id: req.params.id, companyId },
            updateData,
            { new: true, runValidators: true }
        )
            .populate("category")
            .populate("brand")
            .populate("uom");
        
        if (!updated) {
            return res.status(404).json({ error: "Product not found or access denied" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE product
router.delete("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // Delete product only if it belongs to the company
        const deleted = await Product.findOneAndDelete({ 
            _id: req.params.id, 
            companyId 
        });
        
        if (!deleted) {
            return res.status(404).json({ error: "Product not found or access denied" });
        }
        
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;