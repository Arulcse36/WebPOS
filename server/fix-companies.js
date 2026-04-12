require("dotenv").config();
const mongoose = require("mongoose");
const Company = require("./models/Company");

async function fixCompanies() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        // Find companies without adminUser
        const companies = await Company.find({
            $or: [
                { adminUser: { $exists: false } },
                { 'adminUser.username': { $exists: false } }
            ]
        });
        
        console.log(`Found ${companies.length} companies without adminUser`);
        
        for (let company of companies) {
            // Set a default admin username based on company name
            const defaultUsername = company.companyName.toLowerCase().replace(/\s/g, '') + '_admin';
            
            company.adminUser = {
                username: defaultUsername,
                password: '' // Empty password, they'll need to reset it
            };
            
            await company.save();
            console.log(`✅ Updated company: ${company.companyName} with admin: ${defaultUsername}`);
        }
        
        console.log("Migration completed!");
        await mongoose.disconnect();
        
    } catch (error) {
        console.error("Error:", error);
    }
}

fixCompanies();