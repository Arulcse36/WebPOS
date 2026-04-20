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

// ✅ GET single product by ID (for fetching Tamil name and other details)
router.get("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const product = await Product.findOne({ 
            _id: req.params.id, 
            companyId 
        })
        .populate("category")
        .populate("brand")
        .populate("uom");
        
        if (!product) {
            return res.status(404).json({ error: "Product not found or access denied" });
        }
        
        res.json(product);
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).json({ error: err.message });
    }
});

// ADD product with companyId
router.post("/", async (req, res) => {
    try {
        const { companyId, productCode, ...productData } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!productCode) {
            return res.status(400).json({ error: "Product code required" });
        }
        
        // Check if product with same code already exists for this company
        const existingProduct = await Product.findOne({ 
            companyId, 
            productCode: productCode.trim() 
        });
        
        if (existingProduct) {
            return res.status(400).json({ 
                error: "Duplicate product code",
                message: `Product with code "${productCode}" already exists for this company`
            });
        }
        
        const newItem = new Product({
            ...productData,
            productCode: productCode.trim(),
            companyId
        });
        
        const saved = await newItem.save();
        
        // Populate references before returning
        const populated = await Product.findById(saved._id)
            .populate("category")
            .populate("brand")
            .populate("uom");
        
        res.status(201).json(populated);
    } catch (err) {
        console.error("Error creating product:", err);
        
        // Handle duplicate key error (fallback)
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: "Duplicate product code",
                message: "Product with this code already exists for your company"
            });
        }
        
        res.status(400).json({ error: err.message });
    }
});

// UPDATE product
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { productCode, ...updateData } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // If updating product code, check for duplicates
        if (productCode) {
            const existingProduct = await Product.findOne({
                companyId,
                productCode: productCode.trim(),
                _id: { $ne: req.params.id } // Exclude current product
            });
            
            if (existingProduct) {
                return res.status(400).json({
                    error: "Duplicate product code",
                    message: `Product with code "${productCode}" already exists for this company`
                });
            }
            updateData.productCode = productCode.trim();
        }
        
        // Fix deprecation warning: use returnDocument instead of new
        const updated = await Product.findOneAndUpdate(
            { _id: req.params.id, companyId },
            updateData,
            { 
                returnDocument: 'after',  // ✅ Replaces 'new: true'
                runValidators: true 
            }
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
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: "Duplicate product code",
                message: "Product with this code already exists for your company"
            });
        }
        
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