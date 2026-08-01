// routes/barcodes.js
const express = require('express');
const router = express.Router();
const Barcode = require('../models/Barcode');
const Product = require('../models/Product');

// Get all barcodes with filters
router.get('/', async (req, res) => {
    try {
        const { 
            companyId, 
            productId, 
            search, 
            isActive,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = -1
        } = req.query;

        if (!companyId) {
            return res.status(400).json({ message: 'companyId is required' });
        }

        const query = { companyId };
        
        if (productId) query.productId = productId;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        if (search) {
            query.$or = [
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: parseInt(sortOrder) };

        const [barcodes, total] = await Promise.all([
            Barcode.find(query)
                .populate('productId', 'name productCode tamilName')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Barcode.countDocuments(query)
        ]);

        res.json({
            data: barcodes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching barcodes:', error);
        res.status(500).json({ message: 'Failed to fetch barcodes' });
    }
});

// Get single barcode
router.get('/:id', async (req, res) => {
    try {
        const barcode = await Barcode.findById(req.params.id)
            .populate('productId', 'name productCode tamilName category brand uom');
        
        if (!barcode) {
            return res.status(404).json({ message: 'Barcode not found' });
        }
        
        res.json(barcode);
    } catch (error) {
        console.error('Error fetching barcode:', error);
        res.status(500).json({ message: 'Failed to fetch barcode' });
    }
});

// Get barcode by barcode number
router.get('/lookup/:barcode', async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ message: 'companyId is required' });
        }

        const barcode = await Barcode.findOne({ 
            barcode: req.params.barcode, 
            companyId,
            isActive: true 
        }).populate('productId');

        if (!barcode) {
            return res.status(404).json({ message: 'Barcode not found' });
        }

        res.json(barcode);
    } catch (error) {
        console.error('Error looking up barcode:', error);
        res.status(500).json({ message: 'Failed to lookup barcode' });
    }
});

// Create new barcode
router.post('/', async (req, res) => {
    try {
        const {
            companyId,
            productId,
            barcode,
            expiryDate,
            mrp,
            retailRate,
            wholesaleRate,
            purchaseRate,
            batchNumber,
            quantity,
            isActive
        } = req.body;

        // Validate required fields
        if (!companyId || !productId || !barcode || !expiryDate || !mrp) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if barcode already exists
        const existingBarcode = await Barcode.findOne({ barcode, companyId });
        if (existingBarcode) {
            return res.status(400).json({ message: 'Barcode already exists' });
        }

        const newBarcode = new Barcode({
            companyId,
            productId,
            barcode,
            expiryDate: new Date(expiryDate),
            mrp: parseFloat(mrp),
            retailRate: parseFloat(retailRate) || 0,
            wholesaleRate: parseFloat(wholesaleRate) || 0,
            purchaseRate: parseFloat(purchaseRate) || 0,
            batchNumber,
            quantity: parseInt(quantity) || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        await newBarcode.save();
        
        const populated = await Barcode.findById(newBarcode._id)
            .populate('productId', 'name productCode');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating barcode:', error);
        res.status(500).json({ message: 'Failed to create barcode' });
    }
});

// Update barcode
router.put('/:id', async (req, res) => {
    try {
        const {
            productId,
            barcode,
            expiryDate,
            mrp,
            retailRate,
            wholesaleRate,
            purchaseRate,
            batchNumber,
            quantity,
            isActive
        } = req.body;

        const existingBarcode = await Barcode.findById(req.params.id);
        if (!existingBarcode) {
            return res.status(404).json({ message: 'Barcode not found' });
        }

        // Check if barcode number conflict (if changing)
        if (barcode && barcode !== existingBarcode.barcode) {
            const conflict = await Barcode.findOne({ 
                barcode, 
                companyId: existingBarcode.companyId,
                _id: { $ne: req.params.id }
            });
            if (conflict) {
                return res.status(400).json({ message: 'Barcode already exists' });
            }
        }

        // Check if product exists (if changing)
        if (productId && productId !== existingBarcode.productId.toString()) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
        }

        const updateData = {};
        if (productId) updateData.productId = productId;
        if (barcode) updateData.barcode = barcode;
        if (expiryDate) updateData.expiryDate = new Date(expiryDate);
        if (mrp !== undefined) updateData.mrp = parseFloat(mrp);
        if (retailRate !== undefined) updateData.retailRate = parseFloat(retailRate);
        if (wholesaleRate !== undefined) updateData.wholesaleRate = parseFloat(wholesaleRate);
        if (purchaseRate !== undefined) updateData.purchaseRate = parseFloat(purchaseRate);
        if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
        if (quantity !== undefined) updateData.quantity = parseInt(quantity);
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await Barcode.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('productId', 'name productCode');

        res.json(updated);
    } catch (error) {
        console.error('Error updating barcode:', error);
        res.status(500).json({ message: 'Failed to update barcode' });
    }
});

// Delete barcode (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const barcode = await Barcode.findById(req.params.id);
        if (!barcode) {
            return res.status(404).json({ message: 'Barcode not found' });
        }

        barcode.isActive = false;
        await barcode.save();

        res.json({ message: 'Barcode deleted successfully' });
    } catch (error) {
        console.error('Error deleting barcode:', error);
        res.status(500).json({ message: 'Failed to delete barcode' });
    }
});

// Bulk import barcodes
router.post('/bulk', async (req, res) => {
    try {
        const { companyId, barcodes } = req.body;

        if (!companyId || !barcodes || !Array.isArray(barcodes)) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        const results = { success: [], failed: [] };

        for (const item of barcodes) {
            try {
                // Check if product exists
                const product = await Product.findById(item.productId);
                if (!product) {
                    results.failed.push({ barcode: item.barcode, error: 'Product not found' });
                    continue;
                }

                // Check if barcode already exists
                const existing = await Barcode.findOne({ 
                    barcode: item.barcode, 
                    companyId 
                });
                if (existing) {
                    results.failed.push({ barcode: item.barcode, error: 'Barcode already exists' });
                    continue;
                }

                const newBarcode = new Barcode({
                    companyId,
                    productId: item.productId,
                    barcode: item.barcode,
                    expiryDate: new Date(item.expiryDate),
                    mrp: parseFloat(item.mrp),
                    retailRate: parseFloat(item.retailRate) || 0,
                    wholesaleRate: parseFloat(item.wholesaleRate) || 0,
                    purchaseRate: parseFloat(item.purchaseRate) || 0,
                    batchNumber: item.batchNumber,
                    quantity: parseInt(item.quantity) || 0,
                    isActive: true
                });

                await newBarcode.save();
                results.success.push(item.barcode);
            } catch (error) {
                results.failed.push({ barcode: item.barcode, error: error.message });
            }
        }

        res.json({
            message: `Successfully imported ${results.success.length} barcodes`,
            results
        });
    } catch (error) {
        console.error('Error bulk importing barcodes:', error);
        res.status(500).json({ message: 'Failed to import barcodes' });
    }
});

module.exports = router;