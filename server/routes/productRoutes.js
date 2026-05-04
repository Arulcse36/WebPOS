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
        const { companyId, productCode, name, ...productData } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!productCode) {
            return res.status(400).json({ error: "Product code required" });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Product name required" });
        }
        
        // Check if product with same code already exists for this company
        const existingProductByCode = await Product.findOne({ 
            companyId, 
            productCode: productCode.trim() 
        });
        
        if (existingProductByCode) {
            return res.status(400).json({ 
                error: "Duplicate product code",
                message: `Product with code "${productCode}" already exists for this company`
            });
        }
        
        // Check if product with same name already exists for this company
        const existingProductByName = await Product.findOne({ 
            companyId, 
            name: name.trim()
        });
        
        if (existingProductByName) {
            return res.status(400).json({ 
                error: "Duplicate product name",
                message: `Product with name "${name}" already exists for this company`
            });
        }
        
        const newItem = new Product({
            ...productData,
            productCode: productCode.trim(),
            name: name.trim(),
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
            // Determine which field caused the duplicate
            const field = Object.keys(err.keyPattern)[0];
            if (field === 'productCode') {
                return res.status(400).json({ 
                    error: "Duplicate product code",
                    message: "Product with this code already exists for your company"
                });
            } else if (field === 'name') {
                return res.status(400).json({ 
                    error: "Duplicate product name",
                    message: "Product with this name already exists for your company"
                });
            }
            return res.status(400).json({ 
                error: "Duplicate entry",
                message: "Product with this information already exists"
            });
        }
        
        res.status(400).json({ error: err.message });
    }
});

// UPDATE product
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { productCode, name, ...updateData } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // Build update object
        const updateFields = { ...updateData };
        
        // If updating product code, check for duplicates
        if (productCode !== undefined) {
            if (!productCode.trim()) {
                return res.status(400).json({ error: "Product code cannot be empty" });
            }
            
            const existingProductByCode = await Product.findOne({
                companyId,
                productCode: productCode.trim(),
                _id: { $ne: req.params.id } // Exclude current product
            });
            
            if (existingProductByCode) {
                return res.status(400).json({
                    error: "Duplicate product code",
                    message: `Product with code "${productCode}" already exists for this company`
                });
            }
            updateFields.productCode = productCode.trim();
        }
        
        // If updating product name, check for duplicates
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ error: "Product name cannot be empty" });
            }
            
            const existingProductByName = await Product.findOne({
                companyId,
                name: name.trim(),
                _id: { $ne: req.params.id } // Exclude current product
            });
            
            if (existingProductByName) {
                return res.status(400).json({
                    error: "Duplicate product name",
                    message: `Product with name "${name}" already exists for this company`
                });
            }
            updateFields.name = name.trim();
        }
        
        // Fix deprecation warning: use returnDocument instead of new
        const updated = await Product.findOneAndUpdate(
            { _id: req.params.id, companyId },
            updateFields,
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
            // Determine which field caused the duplicate
            const field = Object.keys(err.keyPattern)[0];
            if (field === 'productCode') {
                return res.status(400).json({ 
                    error: "Duplicate product code",
                    message: "Product with this code already exists for your company"
                });
            } else if (field === 'name') {
                return res.status(400).json({ 
                    error: "Duplicate product name",
                    message: "Product with this name already exists for your company"
                });
            }
            return res.status(400).json({ 
                error: "Duplicate entry",
                message: "Product with this information already exists"
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