require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Company = require("./models/Company");

async function migrateAdminUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        
        // Find all companies
        const companies = await Company.find({});
        console.log(`📊 Found ${companies.length} companies`);
        
        let updatedCount = 0;
        
        for (let company of companies) {
            let needsUpdate = false;
            
            // Check if company has adminUser field
            if (!company.adminUser || !company.adminUser.username) {
                console.log(`\n⚠️ Company missing adminUser: ${company.companyName}`);
                
                // Create default credentials
                const defaultUsername = company.companyName.toLowerCase().replace(/\s/g, '') + '_admin';
                const defaultPassword = 'company123';
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                
                console.log(`   Creating default adminUser...`);
                console.log(`   Username: ${defaultUsername}`);
                console.log(`   Password: ${defaultPassword}`);
                
                company.adminUser = {
                    username: defaultUsername,
                    password: hashedPassword
                };
                needsUpdate = true;
            }
            
            // Check if password is hashed (starts with $2a$ or $2b$)
            if (company.adminUser && company.adminUser.password && 
                !company.adminUser.password.startsWith('$2')) {
                console.log(`   Hashing plain text password for: ${company.companyName}`);
                company.adminUser.password = await bcrypt.hash(company.adminUser.password, 10);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await company.save();
                updatedCount++;
                console.log(`   ✅ Updated: ${company.companyName}`);
            }
        }
        
        console.log(`\n✅ Migration completed! Updated ${updatedCount} companies`);
        
        // Display all companies with their adminUser credentials
        console.log("\n📋 Current companies and their admin credentials:");
        console.log("=".repeat(60));
        
        const updatedCompanies = await Company.find({});
        updatedCompanies.forEach(company => {
            console.log(`\n🏢 ${company.companyName}`);
            console.log(`   Admin Username: ${company.adminUser?.username || 'NOT SET'}`);
            console.log(`   Active: ${company.isActive ? 'Yes' : 'No'}`);
        });
        
        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

migrateAdminUser();