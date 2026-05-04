const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// 🔹 CREATE CUSTOMER
router.post("/", async (req, res) => {
    try {
        const {
            companyId,
            name,
            phone,
            email,
            address
        } = req.body;

        console.log("Create customer request test:", req.body);

        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }

        if (!name || !phone) {
            return res.status(400).json({ error: "Name & Phone required" });
        }

        // Clean and prepare data
        const cleanedPhone = phone.toString().trim();
        const cleanedName = name.toString().trim();
        
        // IMPORTANT: Convert empty/undefined email to null (not undefined)
        let cleanedEmail = null;
        if (email && typeof email === 'string' && email.trim() !== '') {
            cleanedEmail = email.trim().toLowerCase();
        }
        
        let cleanedAddress = null;
        if (address && typeof address === 'string' && address.trim() !== '') {
            cleanedAddress = address.trim();
        }

        // Check if customer with same phone exists for this company
        const existingPhone = await Customer.findOne({ 
            companyId, 
            phone: cleanedPhone 
        });
        
        if (existingPhone) {
            return res.status(400).json({ 
                error: "Phone number already exists for this company" 
            });
        }

        // Only check email if it's provided (not null)
        if (cleanedEmail) {
            const existingEmail = await Customer.findOne({ 
                companyId, 
                email: cleanedEmail 
            });
            if (existingEmail) {
                return res.status(400).json({ 
                    error: "Email already exists for this company" 
                });
            }
        }

        // Create customer object - explicitly set email to null if not provided
        const customerData = {
            companyId,
            name: cleanedName,
            phone: cleanedPhone,
            email: cleanedEmail,  // This will be null, not undefined
            address: cleanedAddress
        };

        const customer = new Customer(customerData);
        await customer.save();
        
        // Return the saved customer
        res.status(201).json(customer);

    } catch (err) {
        console.error("Create customer error:", err);
        
        if (err.code === 11000) {
            // Handle duplicate key error
            if (err.keyPattern?.email) {
                return res.status(400).json({ 
                    error: "Email already exists for this company" 
                });
            }
            if (err.keyPattern?.phone) {
                return res.status(400).json({ 
                    error: "Phone number already exists for this company" 
                });
            }
            return res.status(400).json({ 
                error: "Duplicate entry - customer already exists" 
            });
        }
        
        res.status(500).json({ 
            error: err.message || "Internal server error" 
        });
    }
});

// 🔹 GET CUSTOMERS (WITH SEARCH & COMPANY FILTER)
router.get("/", async (req, res) => {
    try {
        const { companyId, search = "" } = req.query;

        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }

        const query = {
            companyId,
            $or: [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        };

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.json(customers);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 UPDATE CUSTOMER
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { name, phone, email, address } = req.body;

        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }

        // Get existing customer
        const existing = await Customer.findOne({ 
            _id: req.params.id,
            companyId 
        });

        if (!existing) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Check if phone is being changed and if it's unique within company
        if (phone && phone !== existing.phone) {
            const existingPhone = await Customer.findOne({ 
                companyId, 
                phone,
                _id: { $ne: req.params.id }
            });
            if (existingPhone) {
                return res.status(400).json({ error: "Phone number already exists for this company" });
            }
        }

        // Check if email is being changed and if it's unique within company
        if (email && email !== existing.email) {
            const existingEmail = await Customer.findOne({ 
                companyId, 
                email,
                _id: { $ne: req.params.id }
            });
            if (existingEmail) {
                return res.status(400).json({ error: "Email already exists for this company" });
            }
        }

        const updated = await Customer.findByIdAndUpdate(
            req.params.id,
            {
                name: name || existing.name,
                phone: phone || existing.phone,
                email: email || existing.email,
                address: address || existing.address,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 DELETE CUSTOMER
router.delete("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }

        const customer = await Customer.findOneAndDelete({ 
            _id: req.params.id,
            companyId 
        });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({ message: "Customer deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;