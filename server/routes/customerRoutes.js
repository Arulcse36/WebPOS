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

        console.log("Create customer request:", req.body);

        console.log("Create customer request:", req.companyId);


        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }

        if (!name || !phone) {
            return res.status(400).json({ error: "Name & Phone required" });
        }

        // Check if customer with same phone exists for this company
        const existingPhone = await Customer.findOne({ companyId, phone });
        if (existingPhone) {
            return res.status(400).json({ error: "Phone number already exists for this company" });
        }

        // Check if customer with same email exists for this company
        if (email) {
            const existingEmail = await Customer.findOne({ companyId, email });
            if (existingEmail) {
                return res.status(400).json({ error: "Email already exists for this company" });
            }
        }

        const customer = new Customer({
            companyId,
            name,
            phone,
            email,
            address
        });

        await customer.save();
        res.json(customer);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Duplicate entry" });
        }
        res.status(500).json({ error: err.message });
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