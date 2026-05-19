// // backend/routes/seedRoutes.js
// const express = require('express');
// const router = express.Router();
// const mongoose = require('mongoose');
// const Brand = require('../models/Brand');
// const Category = require('../models/Category');
// const Uom = require('../models/Uom');
// const Product = require('../models/Product');

// // POST /api/seed-database
// router.post('/seed-database', async (req, res) => {
//   const { companyId } = req.body;
  
//   if (!companyId) {
//     return res.status(400).json({ error: 'Company ID is required' });
//   }

//   try {
//     const COMPANY_ID = new mongoose.Types.ObjectId(companyId);
    
//     // Check if company exists
//     const Company = require('../models/Company');
//     const companyExists = await Company.findById(COMPANY_ID);
//     if (!companyExists) {
//       return res.status(404).json({ error: 'Company not found' });
//     }
    
//     // Clear existing data for this company
//     await Brand.deleteMany({ companyId: COMPANY_ID });
//     await Category.deleteMany({ companyId: COMPANY_ID });
//     await Product.deleteMany({ companyId: COMPANY_ID });
    
//  // Get or create UOMs (global, not company-specific) - INSERT IF NOT EXISTS
//     const defaultUoms = [
//       { name: "Piece", isActive: true },
//       { name: "Pack", isActive: true },
//       { name: "Kg", isActive: true },
//       { name: "Gram", isActive: true },
//       { name: "Liter", isActive: true },
//       { name: "Ml", isActive: true },
//       { name: "Dozen", isActive: true },
//       { name: "Box", isActive: true },
//       { name: "Bottle", isActive: true },
//       { name: "Packet", isActive: true },
//       { name: "Bag", isActive: true },
//       { name: "Nos", isActive: true },
//       { name: "Tin", isActive: true },
//       { name: "Jar", isActive: true },
//       { name: "Can", isActive: true }
//     ];
    
//     // Insert UOMs only if they don't exist
//     const uoms = [];
//     for (const uomData of defaultUoms) {
//       let uom = await Uom.findOne({ name: uomData.name });
//       if (!uom) {
//         uom = await Uom.create(uomData);
//       }
//       uoms.push(uom);
//     }


// // Insert Brands (UPDATED with missing brands)
// const brands = await Brand.insertMany([
//   { name: "MTR", isActive: true, companyId: COMPANY_ID },
//   { name: "ID", isActive: true, companyId: COMPANY_ID },
//   { name: "Aashirvaad", isActive: true, companyId: COMPANY_ID },
//   { name: "Patanjali", isActive: true, companyId: COMPANY_ID },
//   { name: "Britannia", isActive: true, companyId: COMPANY_ID },
//   { name: "Parle", isActive: true, companyId: COMPANY_ID },
//   { name: "Sunfeast", isActive: true, companyId: COMPANY_ID },
//   { name: "Kissan", isActive: true, companyId: COMPANY_ID },
//   { name: "Maggi", isActive: true, companyId: COMPANY_ID },
//   { name: "Taj", isActive: true, companyId: COMPANY_ID },
//   { name: "Catch", isActive: true, companyId: COMPANY_ID },
//   { name: "MDH", isActive: true, companyId: COMPANY_ID },
//   { name: "Everest", isActive: true, companyId: COMPANY_ID },
//   { name: "Sakthi", isActive: true, companyId: COMPANY_ID },
//   { name: "Aachi", isActive: true, companyId: COMPANY_ID },
//   { name: "Local", isActive: true, companyId: COMPANY_ID },
//   { name: "Amul", isActive: true, companyId: COMPANY_ID },
//   { name: "Nestle", isActive: true, companyId: COMPANY_ID },
//   { name: "Pepsico", isActive: true, companyId: COMPANY_ID },
//   { name: "Coca-Cola", isActive: true, companyId: COMPANY_ID },
//   { name: "Fortune", isActive: true, companyId: COMPANY_ID },
//   { name: "Saffola", isActive: true, companyId: COMPANY_ID },
//   { name: "Dabur", isActive: true, companyId: COMPANY_ID },
//   { name: "Haldiram's", isActive: true, companyId: COMPANY_ID },
//   // MISSING BRANDS - ADD THESE:
//   { name: "Lay's", isActive: true, companyId: COMPANY_ID },
//   { name: "Kurkure", isActive: true, companyId: COMPANY_ID },
//   { name: "Bingo", isActive: true, companyId: COMPANY_ID },
//   { name: "Oreo", isActive: true, companyId: COMPANY_ID },
//   { name: "Hide & Seek", isActive: true, companyId: COMPANY_ID },
//   { name: "Top Ramen", isActive: true, companyId: COMPANY_ID },
//   { name: "Red Label", isActive: true, companyId: COMPANY_ID },
//   { name: "Taj Mahal", isActive: true, companyId: COMPANY_ID },
//   { name: "Bru", isActive: true, companyId: COMPANY_ID },
//   { name: "Nescafe", isActive: true, companyId: COMPANY_ID },
//   { name: "Horlicks", isActive: true, companyId: COMPANY_ID },
//   { name: "Boost", isActive: true, companyId: COMPANY_ID },
//   { name: "Bournvita", isActive: true, companyId: COMPANY_ID },
//   { name: "Complan", isActive: true, companyId: COMPANY_ID },
//   { name: "Protinex", isActive: true, companyId: COMPANY_ID },
//   { name: "Kellogg's", isActive: true, companyId: COMPANY_ID },
//   { name: "Quaker", isActive: true, companyId: COMPANY_ID },
//   { name: "Surf Excel", isActive: true, companyId: COMPANY_ID },
//   { name: "Tide", isActive: true, companyId: COMPANY_ID },
//   { name: "Rin", isActive: true, companyId: COMPANY_ID },
//   { name: "Nirma", isActive: true, companyId: COMPANY_ID },
//   { name: "Comfort", isActive: true, companyId: COMPANY_ID },
//   { name: "Lux", isActive: true, companyId: COMPANY_ID },
//   { name: "Santoor", isActive: true, companyId: COMPANY_ID },
//   { name: "Pears", isActive: true, companyId: COMPANY_ID },
//   { name: "Mysore Sandal", isActive: true, companyId: COMPANY_ID },
//   { name: "Cinthol", isActive: true, companyId: COMPANY_ID },
//   { name: "Head & Shoulders", isActive: true, companyId: COMPANY_ID },
//   { name: "Pantene", isActive: true, companyId: COMPANY_ID },
//   { name: "Dove", isActive: true, companyId: COMPANY_ID },
//   { name: "Sunsilk", isActive: true, companyId: COMPANY_ID },
//   { name: "Closeup", isActive: true, companyId: COMPANY_ID },
//   { name: "Pepsodent", isActive: true, companyId: COMPANY_ID },
//   { name: "Sensodyne", isActive: true, companyId: COMPANY_ID },
//   { name: "24 Mantra", isActive: true, companyId: COMPANY_ID },
//   { name: "Priya", isActive: true, companyId: COMPANY_ID },
//   { name: "Lifebuoy", isActive: true, companyId: COMPANY_ID },
//   { name: "Clinic Plus", isActive: true, companyId: COMPANY_ID },
//   { name: "Colgate", isActive: true, companyId: COMPANY_ID },
//   { name: "Dettol", isActive: true, companyId: COMPANY_ID },
//   { name: "Vim", isActive: true, companyId: COMPANY_ID },
//   { name: "Lizol", isActive: true, companyId: COMPANY_ID },
//   { name: "Harpic", isActive: true, companyId: COMPANY_ID },
//   { name: "Tata", isActive: true, companyId: COMPANY_ID }, // For salt products
//   { name: "Pringles", isActive: true, companyId: COMPANY_ID },
//   { name: "Ching's", isActive: true, companyId: COMPANY_ID }
// ]);
    
// // Insert Categories (UPDATED with all missing categories)
// const categories = await Category.insertMany([
//   { name: "Rice & Grains", isActive: true, companyId: COMPANY_ID },
//   { name: "Flours", isActive: true, companyId: COMPANY_ID },
//   { name: "Dals & Pulses", isActive: true, companyId: COMPANY_ID },
//   { name: "Spices", isActive: true, companyId: COMPANY_ID },
//   { name: "Oil & Ghee", isActive: true, companyId: COMPANY_ID },
//   { name: "Snacks & Namkeen", isActive: true, companyId: COMPANY_ID },
//   { name: "Biscuits & Cookies", isActive: true, companyId: COMPANY_ID },
//   { name: "Noodles & Pasta", isActive: true, companyId: COMPANY_ID },
//   { name: "Sauces & Ketchup", isActive: true, companyId: COMPANY_ID },
//   { name: "Tea & Coffee", isActive: true, companyId: COMPANY_ID },
//   { name: "Masala & Mixes", isActive: true, companyId: COMPANY_ID },
//   { name: "Pickles", isActive: true, companyId: COMPANY_ID },
//   { name: "Canned Foods", isActive: true, companyId: COMPANY_ID },
//   { name: "Beverages", isActive: true, companyId: COMPANY_ID },
//   { name: "Dairy Products", isActive: true, companyId: COMPANY_ID },
//   { name: "Stationery", isActive: true, companyId: COMPANY_ID },
//   { name: "Household Items", isActive: true, companyId: COMPANY_ID },
//   { name: "Personal Care", isActive: true, companyId: COMPANY_ID },
//   { name: "Fresh Vegetables", isActive: true, companyId: COMPANY_ID },
//   // MISSING CATEGORIES - ADD THESE:
//   { name: "Health Drinks", isActive: true, companyId: COMPANY_ID },
//   { name: "Breakfast Cereals", isActive: true, companyId: COMPANY_ID },
//   { name: "Frozen Foods", isActive: true, companyId: COMPANY_ID },
//   { name: "Papad & Appalam", isActive: true, companyId: COMPANY_ID },
//   { name: "Vathal & Vadagam", isActive: true, companyId: COMPANY_ID },
//   { name: "Household Cleaning", isActive: true, companyId: COMPANY_ID },
//   { name: "Laundry Care", isActive: true, companyId: COMPANY_ID },
//   { name: "Baby Care", isActive: true, companyId: COMPANY_ID },
//   { name: "Pet Food", isActive: true, companyId: COMPANY_ID },
//   { name: "Pooja Items", isActive: true, companyId: COMPANY_ID },
//   { name: "Home Fragrance", isActive: true, companyId: COMPANY_ID },
//   { name: "Plastic & Disposables", isActive: true, companyId: COMPANY_ID },
//   { name: "Batteries & Electricals", isActive: true, companyId: COMPANY_ID },
//   { name: "Organic Foods", isActive: true, companyId: COMPANY_ID },
//   { name: "Bakery Items", isActive: true, companyId: COMPANY_ID },
//   { name: "Sweets & Chocolates", isActive: true, companyId: COMPANY_ID },
//   { name: "Dry Fruits & Nuts", isActive: true, companyId: COMPANY_ID }
// ]);
//     // Create lookup maps
//     const brandMap = {};
//     brands.forEach(brand => { brandMap[brand.name] = brand._id; });
    
//     const categoryMap = {};
//     categories.forEach(category => { categoryMap[category.name] = category._id; });
    
//     const uomMap = {};
//     uoms.forEach(uom => { uomMap[uom.name] = uom._id; });
    
//  // Insert Products - 1000+ products
//     const products = await Product.insertMany([
//       // ==================== RICE & GRAINS (100+ products) ====================
//       { productCode: "GRO-001", name: "Ponni Boiled Rice (1kg)", tamilName: "பொன்னி புழுங்கல் அரிசி (1கிலோ)", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-002", name: "Ponni Boiled Rice (5kg)", tamilName: "பொன்னி புழுங்கல் அரிசி (5கிலோ)", mrp: 315, retailRate: 295, wholesaleRate: 275, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-003", name: "Ponni Boiled Rice (10kg)", tamilName: "பொன்னி புழுங்கல் அரிசி (10கிலோ)", mrp: 620, retailRate: 590, wholesaleRate: 550, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-004", name: "Ponni Boiled Rice (25kg)", tamilName: "பொன்னி புழுங்கல் அரிசி (25கிலோ)", mrp: 1520, retailRate: 1450, wholesaleRate: 1380, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-005", name: "Ponni Raw Rice (1kg)", tamilName: "பொன்னி பச்சரிசி (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-006", name: "Ponni Raw Rice (5kg)", tamilName: "பொன்னி பச்சரிசி (5கிலோ)", mrp: 290, retailRate: 275, wholesaleRate: 250, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-007", name: "Ponni Raw Rice (10kg)", tamilName: "பொன்னி பச்சரிசி (10கிலோ)", mrp: 570, retailRate: 540, wholesaleRate: 500, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-008", name: "Ponni Raw Rice (25kg)", tamilName: "பொன்னி பச்சரிசி (25கிலோ)", mrp: 1400, retailRate: 1330, wholesaleRate: 1260, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-009", name: "Sona Masoori Rice (1kg)", tamilName: "சோனா மசூரி அரிசி (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-010", name: "Sona Masoori Rice (5kg)", tamilName: "சோனா மசூரி அரிசி (5கிலோ)", mrp: 365, retailRate: 345, wholesaleRate: 320, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-011", name: "Sona Masoori Rice (10kg)", tamilName: "சோனா மசூரி அரிசி (10கிலோ)", mrp: 720, retailRate: 680, wholesaleRate: 650, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-012", name: "Sona Masoori Rice (25kg)", tamilName: "சோனா மசூரி அரிசி (25கிலோ)", mrp: 1770, retailRate: 1680, wholesaleRate: 1600, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-013", name: "Idly Rice (1kg)", tamilName: "இட்லி அரிசி (1கிலோ)", mrp: 55, retailRate: 50, wholesaleRate: 45, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-014", name: "Idly Rice (5kg)", tamilName: "இட்லி அரிசி (5கிலோ)", mrp: 265, retailRate: 245, wholesaleRate: 225, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-015", name: "Idly Rice (10kg)", tamilName: "இட்லி அரிசி (10கிலோ)", mrp: 520, retailRate: 490, wholesaleRate: 450, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-016", name: "Dosa Rice (1kg)", tamilName: "தோசை அரிசி (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-017", name: "Dosa Rice (5kg)", tamilName: "தோசை அரிசி (5கிலோ)", mrp: 290, retailRate: 275, wholesaleRate: 250, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-018", name: "Dosa Rice (10kg)", tamilName: "தோசை அரிசி (10கிலோ)", mrp: 570, retailRate: 540, wholesaleRate: 510, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-019", name: "Basmati Rice (1kg)", tamilName: "பாஸ்மதி அரிசி (1கிலோ)", mrp: 150, retailRate: 140, wholesaleRate: 130, category: categoryMap["Rice & Grains"], brand: brandMap["Taj"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-020", name: "Basmati Rice (5kg)", tamilName: "பாஸ்மதி அரிசி (5கிலோ)", mrp: 720, retailRate: 690, wholesaleRate: 650, category: categoryMap["Rice & Grains"], brand: brandMap["Taj"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-021", name: "Basmati Rice (10kg)", tamilName: "பாஸ்மதி அரிசி (10கிலோ)", mrp: 1400, retailRate: 1350, wholesaleRate: 1300, category: categoryMap["Rice & Grains"], brand: brandMap["Taj"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-022", name: "Brown Rice (1kg)", tamilName: "பிரவுன் ரைஸ் (1கிலோ)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-023", name: "Brown Rice (5kg)", tamilName: "பிரவுன் ரைஸ் (5கிலோ)", mrp: 430, retailRate: 410, wholesaleRate: 390, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-024", name: "Red Rice (1kg)", tamilName: "சிவப்பு அரிசி (1கிலோ)", mrp: 85, retailRate: 80, wholesaleRate: 76, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-025", name: "Red Rice (5kg)", tamilName: "சிவப்பு அரிசி (5கிலோ)", mrp: 410, retailRate: 390, wholesaleRate: 370, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-026", name: "Wheat (1kg)", tamilName: "கோதுமை (1கிலோ)", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-027", name: "Wheat (5kg)", tamilName: "கோதுமை (5கிலோ)", mrp: 215, retailRate: 195, wholesaleRate: 185, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-028", name: "Wheat (10kg)", tamilName: "கோதுமை (10கிலோ)", mrp: 420, retailRate: 390, wholesaleRate: 370, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-029", name: "Ragi (1kg)", tamilName: "ராகி (1கிலோ)", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-030", name: "Ragi (5kg)", tamilName: "ராகி (5கிலோ)", mrp: 240, retailRate: 220, wholesaleRate: 205, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-031", name: "Kambu (1kg)", tamilName: "கம்பு (1கிலோ)", mrp: 55, retailRate: 50, wholesaleRate: 47, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-032", name: "Kambu (5kg)", tamilName: "கம்பு (5கிலோ)", mrp: 265, retailRate: 245, wholesaleRate: 230, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-033", name: "Samai (500g)", tamilName: "சாமை (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-034", name: "Samai (1kg)", tamilName: "சாமை (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-035", name: "Varagu (500g)", tamilName: "வரகு (500கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-036", name: "Varagu (1kg)", tamilName: "வரகு (1கிலோ)", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-037", name: "Thinai (500g)", tamilName: "தினை (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-038", name: "Thinai (1kg)", tamilName: "தினை (1கிலோ)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-039", name: "Quinoa (500g)", tamilName: "குயினோவா (500கிராம்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-040", name: "Quinoa (1kg)", tamilName: "குயினோவா (1கிலோ)", mrp: 490, retailRate: 470, wholesaleRate: 450, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-041", name: "Oats (500g)", tamilName: "ஓட்ஸ் (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
     
//       { productCode: "GRO-043", name: "Barley (500g)", tamilName: "பார்லி (500கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-044", name: "Barley (1kg)", tamilName: "பார்லி (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-045", name: "Poha (500g)", tamilName: "அவல் (500கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-046", name: "Poha (1kg)", tamilName: "அவல் (1கிலோ)", mrp: 65, retailRate: 60, wholesaleRate: 58, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-047", name: "Semolina - Rava (500g)", tamilName: "ரவை (500கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-048", name: "Semolina - Rava (1kg)", tamilName: "ரவை (1கிலோ)", mrp: 58, retailRate: 55, wholesaleRate: 52, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-049", name: "Corn (1kg)", tamilName: "சோளம் (1கிலோ)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-050", name: "Corn (5kg)", tamilName: "சோளம் (5கிலோ)", mrp: 190, retailRate: 180, wholesaleRate: 170, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== FLOURS (50 products) ====================
//       { productCode: "GRO-051", name: "Wheat Flour - Aashirvaad (1kg)", tamilName: "கோதுமை மாவு - ஆசீர்வாத் (1கிலோ)", mrp: 45, retailRate: 42, wholesaleRate: 39, category: categoryMap["Flours"], brand: brandMap["Aashirvaad"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-052", name: "Wheat Flour - Aashirvaad (5kg)", tamilName: "கோதுமை மாவு - ஆசீர்வாத் (5கிலோ)", mrp: 215, retailRate: 200, wholesaleRate: 190, category: categoryMap["Flours"], brand: brandMap["Aashirvaad"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-053", name: "Wheat Flour - Patanjali (1kg)", tamilName: "கோதுமை மாவு - பதஞ்சலி (1கிலோ)", mrp: 42, retailRate: 39, wholesaleRate: 37, category: categoryMap["Flours"], brand: brandMap["Patanjali"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-054", name: "Wheat Flour - Patanjali (5kg)", tamilName: "கோதுமை மாவு - பதஞ்சலி (5கிலோ)", mrp: 205, retailRate: 195, wholesaleRate: 185, category: categoryMap["Flours"], brand: brandMap["Patanjali"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-055", name: "Rice Flour (500g)", tamilName: "அரிசி மாவு (500கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-056", name: "Rice Flour (1kg)", tamilName: "அரிசி மாவு (1கிலோ)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-057", name: "Maida (500g)", tamilName: "மைதா மாவு (500கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-058", name: "Maida (1kg)", tamilName: "மைதா மாவு (1கிலோ)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-059", name: "Besan - Gram Flour (500g)", tamilName: "கடலை மாவு (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Flours"], brand: brandMap["Taj"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-060", name: "Besan - Gram Flour (1kg)", tamilName: "கடலை மாவு (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Flours"], brand: brandMap["Taj"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-061", name: "Ragi Flour (500g)", tamilName: "ராகி மாவு (500கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-062", name: "Ragi Flour (1kg)", tamilName: "ராகி மாவு (1கிலோ)", mrp: 55, retailRate: 50, wholesaleRate: 47, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-063", name: "Jowar Flour (500g)", tamilName: "சோள மாவு (500கிராம்)", mrp: 32, retailRate: 30, wholesaleRate: 28, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-064", name: "Jowar Flour (1kg)", tamilName: "சோள மாவு (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-065", name: "Bajra Flour (500g)", tamilName: "கம்பு மாவு (500கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-066", name: "Bajra Flour (1kg)", tamilName: "கம்பு மாவு (1கிலோ)", mrp: 55, retailRate: 50, wholesaleRate: 47, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-067", name: "Idiyappam Flour (500g)", tamilName: "இடியாப்ப மாவு (500கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-068", name: "Idiyappam Flour (1kg)", tamilName: "இடியாப்ப மாவு (1கிலோ)", mrp: 68, retailRate: 65, wholesaleRate: 62, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-069", name: "Appam Flour (500g)", tamilName: "அப்ப மாவு (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-070", name: "Appam Flour (1kg)", tamilName: "அப்ப மாவு (1கிலோ)", mrp: 78, retailRate: 75, wholesaleRate: 72, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-071", name: "Multigrain Flour (1kg)", tamilName: "மல்டி கிரெயின் மாவு (1கிலோ)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Flours"], brand: brandMap["Patanjali"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-072", name: "Soy Flour (500g)", tamilName: "சோயா மாவு (500கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 43, category: categoryMap["Flours"], brand: brandMap["Patanjali"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== DALS & PULSES (50 products) ====================
//       { productCode: "GRO-073", name: "Toor Dal (500g)", tamilName: "துவரம் பருப்பு (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-074", name: "Toor Dal (1kg)", tamilName: "துவரம் பருப்பு (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-075", name: "Toor Dal (5kg)", tamilName: "துவரம் பருப்பு (5கிலோ)", mrp: 580, retailRate: 560, wholesaleRate: 540, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-076", name: "Moong Dal (500g)", tamilName: "பாசிப் பருப்பு (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-077", name: "Moong Dal (1kg)", tamilName: "பாசிப் பருப்பு (1கிலோ)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-078", name: "Moong Dal (5kg)", tamilName: "பாசிப் பருப்பு (5கிலோ)", mrp: 530, retailRate: 510, wholesaleRate: 490, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-079", name: "Masoor Dal (500g)", tamilName: "மசூர் பருப்பு (500கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-080", name: "Masoor Dal (1kg)", tamilName: "மசூர் பருப்பு (1கிலோ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-081", name: "Urad Dal (500g)", tamilName: "உளுந்து (500கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-082", name: "Urad Dal (1kg)", tamilName: "உளுந்து (1கிலோ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-083", name: "Urad Dal (5kg)", tamilName: "உளுந்து (5கிலோ)", mrp: 480, retailRate: 460, wholesaleRate: 440, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-084", name: "Chana Dal (500g)", tamilName: "சனக பருப்பு (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-085", name: "Chana Dal (1kg)", tamilName: "சனக பருப்பு (1கிலோ)", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-086", name: "Rajma (500g)", tamilName: "ராஜ்மா (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-087", name: "Rajma (1kg)", tamilName: "ராஜ்மா (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-088", name: "Black Chana (500g)", tamilName: "கருப்பு கொண்டைக்கடலை (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-089", name: "Black Chana (1kg)", tamilName: "கருப்பு கொண்டைக்கடலை (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-090", name: "White Chana (500g)", tamilName: "வெள்ளை கொண்டைக்கடலை (500கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 43, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-091", name: "White Chana (1kg)", tamilName: "வெள்ளை கொண்டைக்கடலை (1கிலோ)", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-092", name: "Green Moong (500g)", tamilName: "பச்சை பாசிப்பயறு (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-093", name: "Green Moong (1kg)", tamilName: "பச்சை பாசிப்பயறு (1கிலோ)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-094", name: "Horsegram - Kollu (500g)", tamilName: "கொள்ளு (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-095", name: "Horsegram - Kollu (1kg)", tamilName: "கொள்ளு (1கிலோ)", mrp: 85, retailRate: 80, wholesaleRate: 76, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-096", name: "Field Beans - Mochai (500g)", tamilName: "மொச்சை (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-097", name: "Field Beans - Mochai (1kg)", tamilName: "மொச்சை (1கிலோ)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-098", name: "Black Eyed Peas (500g)", tamilName: "காராமணி (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-099", name: "Black Eyed Peas (1kg)", tamilName: "காராமணி (1கிலோ)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-100", name: "Soybean (500g)", tamilName: "சோயாபீன்ஸ் (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-101", name: "Soybean (1kg)", tamilName: "சோயாபீன்ஸ் (1கிலோ)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== SPICES (80 products) ====================
//       { productCode: "GRO-102", name: "Turmeric Powder (100g)", tamilName: "மஞ்சள் தூள் (100கிராம்)", mrp: 18, retailRate: 16, wholesaleRate: 15, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-103", name: "Turmeric Powder (200g)", tamilName: "மஞ்சள் தூள் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-104", name: "Turmeric Powder (500g)", tamilName: "மஞ்சள் தூள் (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-105", name: "Red Chilli Powder (100g)", tamilName: "மிளகாய் தூள் (100கிராம்)", mrp: 22, retailRate: 20, wholesaleRate: 18, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-106", name: "Red Chilli Powder (200g)", tamilName: "மிளகாய் தூள் (200கிராம்)", mrp: 42, retailRate: 38, wholesaleRate: 36, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-107", name: "Red Chilli Powder (500g)", tamilName: "மிளகாய் தூள் (500கிராம்)", mrp: 95, retailRate: 88, wholesaleRate: 82, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-108", name: "Coriander Powder (100g)", tamilName: "தனியா தூள் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-109", name: "Coriander Powder (200g)", tamilName: "தனியா தூள் (200கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 24, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-110", name: "Coriander Powder (500g)", tamilName: "தனியா தூள் (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-111", name: "Cumin Seeds (100g)", tamilName: "சீரகம் (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-112", name: "Cumin Seeds (200g)", tamilName: "சீரகம் (200கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-113", name: "Cumin Seeds (500g)", tamilName: "சீரகம் (500கிராம்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-114", name: "Mustard Seeds (100g)", tamilName: "கடுகு (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-115", name: "Mustard Seeds (200g)", tamilName: "கடுகு (200கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 24, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-116", name: "Mustard Seeds (500g)", tamilName: "கடுகு (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-117", name: "Fenugreek Seeds (100g)", tamilName: "வெந்தயம் (100கிராம்)", mrp: 12, retailRate: 11, wholesaleRate: 10, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-118", name: "Fenugreek Seeds (200g)", tamilName: "வெந்தயம் (200கிராம்)", mrp: 22, retailRate: 20, wholesaleRate: 18, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-119", name: "Fenugreek Seeds (500g)", tamilName: "வெந்தயம் (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-120", name: "Fennel Seeds (100g)", tamilName: "சோம்பு (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-121", name: "Fennel Seeds (200g)", tamilName: "சோம்பு (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-122", name: "Fennel Seeds (500g)", tamilName: "சோம்பு (500கிராம்)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-123", name: "Cardamom (10g)", tamilName: "ஏலக்காய் (10கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-124", name: "Cardamom (25g)", tamilName: "ஏலக்காய் (25கிராம்)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-125", name: "Cardamom (50g)", tamilName: "ஏலக்காய் (50கிராம்)", mrp: 140, retailRate: 135, wholesaleRate: 128, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-126", name: "Cloves (10g)", tamilName: "கிராம்பு (10கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-127", name: "Cloves (25g)", tamilName: "கிராம்பு (25கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-128", name: "Cloves (50g)", tamilName: "கிராம்பு (50கிராம்)", mrp: 65, retailRate: 62, wholesaleRate: 59, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-129", name: "Cinnamon (25g)", tamilName: "இலவங்கப்பட்டை (25கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-130", name: "Cinnamon (50g)", tamilName: "இலவங்கப்பட்டை (50கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-131", name: "Cinnamon (100g)", tamilName: "இலவங்கப்பட்டை (100கிராம்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-132", name: "Black Pepper (50g)", tamilName: "மிளகு (50கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-133", name: "Black Pepper (100g)", tamilName: "மிளகு (100கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-134", name: "Black Pepper (200g)", tamilName: "மிளகு (200கிராம்)", mrp: 125, retailRate: 118, wholesaleRate: 112, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-135", name: "Garam Masala (50g)", tamilName: "காரம் மசாலா (50கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-136", name: "Garam Masala (100g)", tamilName: "காரம் மசாலா (100கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-137", name: "Garam Masala (200g)", tamilName: "காரம் மசாலா (200கிராம்)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-138", name: "Sambar Powder (100g)", tamilName: "சாம்பார் பொடி (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-139", name: "Sambar Powder (200g)", tamilName: "சாம்பார் பொடி (200கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-140", name: "Sambar Powder (500g)", tamilName: "சாம்பார் பொடி (500கிராம்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Spices"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-141", name: "Rasam Powder (100g)", tamilName: "ரசம் பொடி (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-142", name: "Rasam Powder (200g)", tamilName: "ரசம் பொடி (200கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-143", name: "Biryani Masala (50g)", tamilName: "பிரியாணி மசாலா (50கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-144", name: "Biryani Masala (100g)", tamilName: "பிரியாணி மசாலா (100கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-145", name: "Chicken Masala (50g)", tamilName: "சிக்கன் மசாலா (50கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-146", name: "Chicken Masala (100g)", tamilName: "சிக்கன் மசாலா (100கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-147", name: "Mutton Masala (50g)", tamilName: "மட்டன் மசாலா (50கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-148", name: "Mutton Masala (100g)", tamilName: "மட்டன் மசாலா (100கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-149", name: "Fish Masala (50g)", tamilName: "மீன் மசாலா (50கிராம்)", mrp: 22, retailRate: 20, wholesaleRate: 19, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-150", name: "Fish Masala (100g)", tamilName: "மீன் மசாலா (100கிராம்)", mrp: 42, retailRate: 40, wholesaleRate: 38, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-151", name: "Chaat Masala (50g)", tamilName: "சாட் மசாலா (50கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Spices"], brand: brandMap["Catch"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-152", name: "Chaat Masala (100g)", tamilName: "சாட் மசாலா (100கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Spices"], brand: brandMap["Catch"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-153", name: "Kitchen King Masala (50g)", tamilName: "கிச்சன் கிங் மசாலா (50கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-154", name: "Kitchen King Masala (100g)", tamilName: "கிச்சன் கிங் மசாலா (100கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-155", name: "Asafoetida - Hing (25g)", tamilName: "பெருங்காயம் (25கிராம்)", mrp: 18, retailRate: 16, wholesaleRate: 15, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-156", name: "Asafoetida - Hing (50g)", tamilName: "பெருங்காயம் (50கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-157", name: "Asafoetida - Hing (100g)", tamilName: "பெருங்காயம் (100கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-158", name: "Dry Mango Powder (50g)", tamilName: "ஆம்சுர் (50கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["Catch"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-159", name: "Dry Mango Powder (100g)", tamilName: "ஆம்சுர் (100கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 24, category: categoryMap["Spices"], brand: brandMap["Catch"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-160", name: "Kasuri Methi (25g)", tamilName: "கசூரி மேதி (25கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-161", name: "Kasuri Methi (50g)", tamilName: "கசூரி மேதி (50கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 24, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-162", name: "Rock Salt (500g)", tamilName: "கல் உப்பு (500கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Spices"], brand: brandMap["Tata"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-163", name: "Rock Salt (1kg)", tamilName: "கல் உப்பு (1கிலோ)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Spices"], brand: brandMap["Tata"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-164", name: "Table Salt (1kg)", tamilName: "டேபிள் உப்பு (1கிலோ)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Spices"], brand: brandMap["Tata"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== OIL & GHEE (50 products) ====================
//       { productCode: "GRO-165", name: "Sunflower Oil (1L)", tamilName: "சூரியகாந்தி எண்ணெய் (1லிட்டர்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-166", name: "Sunflower Oil (2L)", tamilName: "சூரியகாந்தி எண்ணெய் (2லிட்டர்)", mrp: 235, retailRate: 225, wholesaleRate: 215, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-167", name: "Sunflower Oil (5L)", tamilName: "சூரியகாந்தி எண்ணெய் (5லிட்டர்)", mrp: 580, retailRate: 560, wholesaleRate: 540, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-168", name: "Groundnut Oil (1L)", tamilName: "நிலக்கடலை எண்ணெய் (1லிட்டர்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Oil & Ghee"], brand: brandMap["Saffola"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-169", name: "Groundnut Oil (2L)", tamilName: "நிலக்கடலை எண்ணெய் (2லிட்டர்)", mrp: 295, retailRate: 285, wholesaleRate: 275, category: categoryMap["Oil & Ghee"], brand: brandMap["Saffola"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-170", name: "Groundnut Oil (5L)", tamilName: "நிலக்கடலை எண்ணெய் (5லிட்டர்)", mrp: 720, retailRate: 700, wholesaleRate: 680, category: categoryMap["Oil & Ghee"], brand: brandMap["Saffola"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-171", name: "Coconut Oil (500ml)", tamilName: "தேங்காய் எண்ணெய் (500மிலி)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-172", name: "Coconut Oil (1L)", tamilName: "தேங்காய் எண்ணெய் (1லிட்டர்)", mrp: 180, retailRate: 170, wholesaleRate: 160, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-173", name: "Coconut Oil (2L)", tamilName: "தேங்காய் எண்ணெய் (2லிட்டர்)", mrp: 350, retailRate: 335, wholesaleRate: 320, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-174", name: "Rice Bran Oil (1L)", tamilName: "ரைஸ் பிரான் எண்ணெய் (1லிட்டர்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-175", name: "Rice Bran Oil (5L)", tamilName: "ரைஸ் பிரான் எண்ணெய் (5லிட்டர்)", mrp: 520, retailRate: 500, wholesaleRate: 480, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-176", name: "Mustard Oil (1L)", tamilName: "கடுகு எண்ணெய் (1லிட்டர்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-177", name: "Gingelly Oil (1L)", tamilName: "நல்லெண்ணெய் (1லிட்டர்)", mrp: 210, retailRate: 200, wholesaleRate: 190, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-178", name: "Gingelly Oil (2L)", tamilName: "நல்லெண்ணெய் (2லிட்டர்)", mrp: 410, retailRate: 395, wholesaleRate: 380, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-179", name: "Gingelly Oil (5L)", tamilName: "நல்லெண்ணெய் (5லிட்டர்)", mrp: 1000, retailRate: 970, wholesaleRate: 940, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-180", name: "Palm Oil (1L)", tamilName: "பாம் ஆயில் (1லிட்டர்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-181", name: "Palm Oil (5L)", tamilName: "பாம் ஆயில் (5லிட்டர்)", mrp: 380, retailRate: 365, wholesaleRate: 350, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-182", name: "Olive Oil (500ml)", tamilName: "ஆலிவ் எண்ணெய் (500மிலி)", mrp: 480, retailRate: 460, wholesaleRate: 440, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-183", name: "Olive Oil (1L)", tamilName: "ஆலிவ் எண்ணெய் (1லிட்டர்)", mrp: 920, retailRate: 890, wholesaleRate: 850, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-184", name: "Ghee - Amul (500ml)", tamilName: "நெய் - அமுல் (500மிலி)", mrp: 240, retailRate: 230, wholesaleRate: 220, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-185", name: "Ghee - Amul (1L)", tamilName: "நெய் - அமுல் (1லிட்டர்)", mrp: 450, retailRate: 430, wholesaleRate: 400, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-186", name: "Ghee - Patanjali (1L)", tamilName: "நெய் - பதஞ்சலி (1லிட்டர்)", mrp: 420, retailRate: 400, wholesaleRate: 380, category: categoryMap["Oil & Ghee"], brand: brandMap["Patanjali"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-187", name: "Vanaspati Ghee (1kg)", tamilName: "வனஸ்பதி (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 67, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-188", name: "Butter - Amul (100g)", tamilName: "வெண்ணெய் - அமுல் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-189", name: "Butter - Amul (500g)", tamilName: "வெண்ணெய் - அமுல் (500கிராம்)", mrp: 140, retailRate: 135, wholesaleRate: 130, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== SNACKS & NAMKEEN (50 products) ====================
//       { productCode: "GRO-190", name: "Lays Classic Salted (52g)", tamilName: "லேஸ் கிளாசிக் (52கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Lay's"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-191", name: "Kurkure Masala Munch (55g)", tamilName: "குர்குரே (55கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Kurkure"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-192", name: "Bingo Tedhe Madhe (55g)", tamilName: "பிங்கோ (55கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Bingo"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-193", name: "Haldiram's Aloo Bhujia (200g)", tamilName: "அலூ புஜியா (200கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-194", name: "Haldiram's Bhujia (200g)", tamilName: "புஜியா (200கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-195", name: "Mixture (200g)", tamilName: "மிக்சர் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-196", name: "Mixture (500g)", tamilName: "மிக்சர் (500கிராம்)", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-197", name: "Murukku (200g)", tamilName: "முறுக்கு (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-198", name: "Murukku (500g)", tamilName: "முறுக்கு (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-199", name: "Kara Sev (200g)", tamilName: "கார சேவ் (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Patanjali"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-200", name: "Thattai (200g)", tamilName: "தட்டை (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-201", name: "Ribbon Pakoda (200g)", tamilName: "ரிப்பன் பகோடா (200கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-202", name: "Om Podi (200g)", tamilName: "ஓம் பொடி (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-203", name: "Pringles Original (165g)", tamilName: "பிரிங்கிள்ஸ் (165கிராம்)", mrp: 150, retailRate: 140, wholesaleRate: 135, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Pringles"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-204", name: "Cheetos (50g)", tamilName: "சீட்டோஸ் (50கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-205", name: "Doritos (70g)", tamilName: "டோரிடோஸ் (70கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== BISCUITS & COOKIES (50 products) ====================
//       { productCode: "GRO-206", name: "Parle-G (100g)", tamilName: "பார்லே-ஜி (100கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-207", name: "Parle-G (500g)", tamilName: "பார்லே-ஜி (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-208", name: "Marie Gold (100g)", tamilName: "மேரி கோல்ட் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-209", name: "Marie Gold (250g)", tamilName: "மேரி கோல்ட் (250கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-210", name: "Good Day (75g)", tamilName: "குட் டே (75கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-211", name: "Good Day (150g)", tamilName: "குட் டே (150கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-212", name: "Oreo (75g)", tamilName: "ஓரியோ (75கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Oreo"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-213", name: "Oreo (150g)", tamilName: "ஓரியோ (150கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Oreo"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-214", name: "Hide & Seek (75g)", tamilName: "ஹைட் & சீக் (75கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Hide & Seek"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-215", name: "Hide & Seek (150g)", tamilName: "ஹைட் & சீக் (150கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Hide & Seek"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-216", name: "Sunfeast Dark Fantasy (75g)", tamilName: "டார்க் ஃபேண்டஸி (75கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-217", name: "Parle Krackjack (100g)", tamilName: "கிராக்ஜாக் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-218", name: "Parle Monaco (100g)", tamilName: "மொனாக்கோ (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-219", name: "Milk Bikis (100g)", tamilName: "மில்க் பிக்கிஸ் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-220", name: "Tiger Biscuits (100g)", tamilName: "டைகர் பிஸ்கட் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-221", name: "Jim Jam (75g)", tamilName: "ஜிம் ஜாம் (75கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-222", name: "Britannia Bourbon (75g)", tamilName: "போர்பன் (75கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-223", name: "NutriChoice Digestive (250g)", tamilName: "நூட்ரிசாய்ஸ் (250கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== NOODLES & PASTA (25 products) ====================
//       { productCode: "GRO-224", name: "Maggi Noodles (70g)", tamilName: "மக்கி நூடுல்ஸ் (70கிராம்)", mrp: 12, retailRate: 10, wholesaleRate: 9, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-225", name: "Maggi Noodles (140g)", tamilName: "மக்கி நூடுல்ஸ் (140கிராம்)", mrp: 24, retailRate: 22, wholesaleRate: 20, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-226", name: "Maggi Noodles (280g)", tamilName: "மக்கி நூடுல்ஸ் (280கிராம்)", mrp: 48, retailRate: 46, wholesaleRate: 44, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-227", name: "Top Ramen Noodles (70g)", tamilName: "டாப் ரமேன் (70கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Noodles & Pasta"], brand: brandMap["Top Ramen"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-228", name: "Top Ramen Noodles (280g)", tamilName: "டாப் ரமேன் (280கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Noodles & Pasta"], brand: brandMap["Top Ramen"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-229", name: "Yippee Noodles (70g)", tamilName: "யிப்பீ (70கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Noodles & Pasta"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-230", name: "Pasta (500g)", tamilName: "பாஸ்தா (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Noodles & Pasta"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-231", name: "Macaroni (500g)", tamilName: "மக்கரோனி (500கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Noodles & Pasta"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== BEVERAGES (50 products) ====================
//       { productCode: "GRO-232", name: "Coca-Cola (600ml)", tamilName: "கோகோ கோலா (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-233", name: "Coca-Cola (1.25L)", tamilName: "கோகோ கோலா (1.25லிட்டர்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-234", name: "Pepsi (600ml)", tamilName: "பெப்சி (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Pepsico"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-235", name: "Sprite (600ml)", tamilName: "ஸ்ப்ரைட் (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-236", name: "Maaza (600ml)", tamilName: "மாசா (600மிலி)", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-237", name: "Slice (600ml)", tamilName: "ஸ்லைஸ் (600மிலி)", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Beverages"], brand: brandMap["Pepsico"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-238", name: "Frooti (1L)", tamilName: "ப்ரூட்டி (1லிட்டர்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-239", name: "Paper Boat (250ml)", tamilName: "பேப்பர் போட் (250மிலி)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-240", name: "Red Bull (250ml)", tamilName: "ரெட் புல் (250மிலி)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Can"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-241", name: "Monster Energy (500ml)", tamilName: "மான்ஸ்டர் (500மிலி)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Can"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-242", name: "Tropicana Juice (1L)", tamilName: "ட்ரோபிகானா (1லிட்டர்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-243", name: "Real Juice (1L)", tamilName: "ரியல் ஜூஸ் (1லிட்டர்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Beverages"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== DAIRY PRODUCTS (30 products) ====================
//       { productCode: "GRO-244", name: "Milk (1L)", tamilName: "பால் (1லிட்டர்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-245", name: "Milk (500ml)", tamilName: "பால் (500மிலி)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-246", name: "Curd (500g)", tamilName: "தயிர் (500கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-247", name: "Curd (1kg)", tamilName: "தயிர் (1கிலோ)", mrp: 68, retailRate: 65, wholesaleRate: 62, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-248", name: "Paneer (200g)", tamilName: "பன்னீர் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-249", name: "Paneer (500g)", tamilName: "பன்னீர் (500கிராம்)", mrp: 135, retailRate: 130, wholesaleRate: 125, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-250", name: "Cheese (200g)", tamilName: "சீஸ் (200கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== TEA & COFFEE (25 products) ====================
//       { productCode: "GRO-251", name: "Red Label Tea (250g)", tamilName: "ரெட் லேபிள் டீ (250கிராம்)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Tea & Coffee"], brand: brandMap["Red Label"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-252", name: "Red Label Tea (500g)", tamilName: "ரெட் லேபிள் டீ (500கிராம்)", mrp: 140, retailRate: 135, wholesaleRate: 130, category: categoryMap["Tea & Coffee"], brand: brandMap["Red Label"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-253", name: "Taj Mahal Tea (250g)", tamilName: "தாஜ் மஹால் டீ (250கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Tea & Coffee"], brand: brandMap["Taj Mahal"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-254", name: "Taj Mahal Tea (500g)", tamilName: "தாஜ் மஹால் டீ (500கிராம்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Tea & Coffee"], brand: brandMap["Taj Mahal"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-255", name: "Bru Coffee (100g)", tamilName: "ப்ரூ காபி (100கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Tea & Coffee"], brand: brandMap["Bru"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-256", name: "Nescafe (50g)", tamilName: "நெஸ்கபே (50கிராம்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Tea & Coffee"], brand: brandMap["Nescafe"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-257", name: "Nescafe (100g)", tamilName: "நெஸ்கபே (100கிராம்)", mrp: 280, retailRate: 270, wholesaleRate: 260, category: categoryMap["Tea & Coffee"], brand: brandMap["Nescafe"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== MASALA & MIXES (30 products) ====================
//       { productCode: "GRO-258", name: "Idly Podi (100g)", tamilName: "இட்லி பொடி (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Masala & Mixes"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-259", name: "Idly Podi (200g)", tamilName: "இட்லி பொடி (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Masala & Mixes"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-260", name: "Sambar Mix (100g)", tamilName: "சாம்பார் மிக்ஸ் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Masala & Mixes"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-261", name: "Sambar Mix (200g)", tamilName: "சாம்பார் மிக்ஸ் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Masala & Mixes"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-262", name: "Dosa Mix (500g)", tamilName: "தோசை மிக்ஸ் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-263", name: "Dosa Mix (1kg)", tamilName: "தோசை மிக்ஸ் (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-264", name: "Idli Mix (500g)", tamilName: "இட்லி மிக்ஸ் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-265", name: "Idli Mix (1kg)", tamilName: "இட்லி மிக்ஸ் (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-266", name: "Ragi Malt Mix (500g)", tamilName: "ராகி மால்ட் மிக்ஸ் (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Masala & Mixes"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== HEALTH DRINKS (20 products) ====================
//       { productCode: "GRO-267", name: "Horlicks (500g)", tamilName: "ஹார்லிக்ஸ் (500கிராம்)", mrp: 180, retailRate: 170, wholesaleRate: 160, category: categoryMap["Health Drinks"], brand: brandMap["Horlicks"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-268", name: "Boost (500g)", tamilName: "பூஸ்ட் (500கிராம்)", mrp: 180, retailRate: 170, wholesaleRate: 160, category: categoryMap["Health Drinks"], brand: brandMap["Boost"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-269", name: "Bournvita (500g)", tamilName: "போர்ன்விட்டா (500கிராம்)", mrp: 150, retailRate: 140, wholesaleRate: 135, category: categoryMap["Health Drinks"], brand: brandMap["Bournvita"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-270", name: "Complan (500g)", tamilName: "காம்ப்ளான் (500கிராம்)", mrp: 200, retailRate: 190, wholesaleRate: 180, category: categoryMap["Health Drinks"], brand: brandMap["Complan"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-271", name: "Protinex (500g)", tamilName: "புரோட்டினெக்ஸ் (500கிராம்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Health Drinks"], brand: brandMap["Protinex"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== PICKLES (25 products) ====================
//       { productCode: "GRO-272", name: "Mango Pickle (300g)", tamilName: "மாங்காய் ஊறுகாய் (300கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Pickles"], brand: brandMap["Priya"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-273", name: "Lemon Pickle (300g)", tamilName: "எலுமிச்சை ஊறுகாய் (300கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Pickles"], brand: brandMap["Priya"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-274", name: "Mixed Vegetable Pickle (300g)", tamilName: "கலவை ஊறுகாய் (300கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Pickles"], brand: brandMap["Priya"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-275", name: "Garlic Pickle (300g)", tamilName: "பூண்டு ஊறுகாய் (300கிராம்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Pickles"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== HOUSEHOLD ITEMS (30 products) ====================
//       { productCode: "GRO-276", name: "Detergent Powder (1kg)", tamilName: "சலவைத்தூள் (1கிலோ)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Household Items"], brand: brandMap["Surf Excel"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-277", name: "Detergent Powder (2kg)", tamilName: "சலவைத்தூள் (2கிலோ)", mrp: 125, retailRate: 118, wholesaleRate: 112, category: categoryMap["Household Items"], brand: brandMap["Surf Excel"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-278", name: "Liquid Soap (500ml)", tamilName: "திரவ சோப்பு (500மிலி)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Household Items"], brand: brandMap["Patanjali"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-279", name: "Dishwash Bar (1 piece)", tamilName: "டிஷ்வாஷ் பார் (1 துண்டு)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Household Items"], brand: brandMap["Vim"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
       
//       // ==================== PERSONAL CARE (30 products) ====================
//       { productCode: "GRO-281", name: "Soap (1 piece)", tamilName: "சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Personal Care"], brand: brandMap["Lifebuoy"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-282", name: "Soap (4 pack)", tamilName: "சோப் (4 துண்டுகள்)", mrp: 130, retailRate: 125, wholesaleRate: 118, category: categoryMap["Personal Care"], brand: brandMap["Lifebuoy"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-283", name: "Shampoo (100ml)", tamilName: "ஷாம்பூ (100மிலி)", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Personal Care"], brand: brandMap["Clinic Plus"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-284", name: "Shampoo (200ml)", tamilName: "ஷாம்பூ (200மிலி)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Personal Care"], brand: brandMap["Clinic Plus"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-285", name: "Toothpaste (100g)", tamilName: "டூத்பேஸ்ட் (100கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-286", name: "Toothpaste (200g)", tamilName: "டூத்பேஸ்ட் (200கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-287", name: "Hand Wash (250ml)", tamilName: "ஹேண்ட் வாஷ் (250மிலி)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Personal Care"], brand: brandMap["Dettol"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== SWEETS & CHOCOLATES (20 products) ====================
//       { productCode: "GRO-288", name: "Cadbury Dairy Milk (45g)", tamilName: "டெய்ரி மில்க் (45கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Sweets & Chocolates"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-289", name: "Cadbury Dairy Milk (150g)", tamilName: "டெய்ரி மில்க் (150கிராம்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Sweets & Chocolates"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-290", name: "KitKat (40g)", tamilName: "கிட்கட் (40கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Sweets & Chocolates"], brand: brandMap["Nestle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-291", name: "5 Star (40g)", tamilName: "5 ஸ்டார் (40கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Sweets & Chocolates"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-292", name: "Munch (40g)", tamilName: "மஞ்ச் (40கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Sweets & Chocolates"], brand: brandMap["Nestle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== DRY FRUITS & NUTS (20 products) ====================
//       { productCode: "GRO-293", name: "Badam (250g)", tamilName: "பாதாம் (250கிராம்)", mrp: 200, retailRate: 190, wholesaleRate: 180, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-294", name: "Cashew (250g)", tamilName: "முந்திரி (250கிராம்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-295", name: "Walnut (250g)", tamilName: "அக்ரூட் (250கிராம்)", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-296", name: "Pista (250g)", tamilName: "பிஸ்தா (250கிராம்)", mrp: 300, retailRate: 290, wholesaleRate: 280, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-297", name: "Kismis (Raisins) (250g)", tamilName: "கிஸ்மிஸ் (250கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-298", name: "Dates (500g)", tamilName: "பேரீச்சம்பழம் (500கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Dry Fruits & Nuts"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== SAUCES & KETCHUP (20 products) ====================
//       { productCode: "GRO-299", name: "Tomato Ketchup (200g)", tamilName: "தக்காளி கெட்ச்அப் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Kissan"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-300", name: "Tomato Ketchup (500g)", tamilName: "தக்காளி கெட்ச்அப் (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Kissan"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-301", name: "Red Chilli Sauce (200g)", tamilName: "சிவப்பு மிளகாய் சாஸ் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Maggi"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-302", name: "Green Chilli Sauce (200g)", tamilName: "பச்சை மிளகாய் சாஸ் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Maggi"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-303", name: "Soy Sauce (200ml)", tamilName: "சோயா சாஸ் (200மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Ching's"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
      
//       // ==================== CANNED FOODS (15 products) ====================
//       { productCode: "GRO-304", name: "Tuna Canned (185g)", tamilName: "டுனா கேன் (185கிராம்)", mrp: 150, retailRate: 140, wholesaleRate: 135, category: categoryMap["Canned Foods"], brand: brandMap["Local"], uom: uomMap["Can"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-305", name: "Baked Beans (400g)", tamilName: "பேக்ட் பீன்ஸ் (400கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Canned Foods"], brand: brandMap["Local"], uom: uomMap["Can"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-306", name: "Sweet Corn (340g)", tamilName: "ஸ்வீட் கார்ன் (340கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Canned Foods"], brand: brandMap["Local"], uom: uomMap["Can"], isActive: true, companyId: COMPANY_ID },

//       // Continue adding after product GRO-306 in your products array

// // ==================== BREAKFAST CEREALS (30 products) ====================
// { productCode: "GRO-307", name: "Corn Flakes (250g)", tamilName: "கார்ன் ஃப்ளேக்ஸ் (250கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-308", name: "Corn Flakes (500g)", tamilName: "கார்ன் ஃப்ளேக்ஸ் (500கிராம்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-309", name: "Wheat Flakes (250g)", tamilName: "வீட் ஃப்ளேக்ஸ் (250கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-310", name: "Wheat Flakes (500g)", tamilName: "வீட் ஃப்ளேக்ஸ் (500கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-311", name: "Chocos (250g)", tamilName: "சோகோஸ் (250கிராம்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-312", name: "Chocos (500g)", tamilName: "சோகோஸ் (500கிராம்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-313", name: "Muesli (250g)", tamilName: "மியூஸ்லி (250கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-314", name: "Muesli (500g)", tamilName: "மியூஸ்லி (500கிராம்)", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Breakfast Cereals"], brand: brandMap["Kellogg's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-315", name: "Oats (1kg)", tamilName: "ஓட்ஸ் (1கிலோ)", mrp: 115, retailRate: 108, wholesaleRate: 102, category: categoryMap["Breakfast Cereals"], brand: brandMap["Quaker"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-316", name: "Instant Oats (500g)", tamilName: "இன்ஸ்டன்ட் ஓட்ஸ் (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Breakfast Cereals"], brand: brandMap["Quaker"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== FROZEN FOODS (25 products) ====================
// { productCode: "GRO-317", name: "Green Peas Frozen (500g)", tamilName: "உறைந்த பச்சை பட்டாணி (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-318", name: "Mixed Vegetables Frozen (500g)", tamilName: "உறைந்த கலவை காய்கறிகள் (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-319", name: "Corn Frozen (500g)", tamilName: "உறைந்த சோளம் (500கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-320", name: "Paratha Frozen (5 pcs)", tamilName: "உறைந்த பராத்தா (5 துண்டுகள்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-321", name: "Poori Frozen (5 pcs)", tamilName: "உறைந்த பூரி (5 துண்டுகள்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-322", name: "Idli Frozen (10 pcs)", tamilName: "உறைந்த இட்லி (10 துண்டுகள்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Frozen Foods"], brand: brandMap["ID"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-323", name: "Dosa Frozen (10 pcs)", tamilName: "உறைந்த தோசை (10 துண்டுகள்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Frozen Foods"], brand: brandMap["ID"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-324", name: "Chapati Frozen (10 pcs)", tamilName: "உறைந்த சப்பாத்தி (10 துண்டுகள்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-325", name: "Paneer Tikka Frozen (250g)", tamilName: "உறைந்த பன்னீர் டிக்கா (250கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-326", name: "Spring Rolls Frozen (10 pcs)", tamilName: "உறைந்த ஸ்பிரிங் ரோல்ஸ் (10 துண்டுகள்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Frozen Foods"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },

// // ==================== PAPAD & APPALAM (20 products) ====================
// { productCode: "GRO-327", name: "Rice Papad (100g)", tamilName: "ரைஸ் பாப்பட் (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-328", name: "Rice Papad (200g)", tamilName: "ரைஸ் பாப்பட் (200கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-329", name: "Urad Papad (100g)", tamilName: "உளுந்து பாப்பட் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-330", name: "Urad Papad (200g)", tamilName: "உளுந்து பாப்பட் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-331", name: "Appalam (100g)", tamilName: "அப்பளம் (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-332", name: "Appalam (200g)", tamilName: "அப்பளம் (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-333", name: "Masala Papad (100g)", tamilName: "மசாலா பாப்பட் (100கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-334", name: "Jal Jeera Papad (100g)", tamilName: "ஜல் ஜீரா பாப்பட் (100கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Papad & Appalam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== VATHAL & VADAGAM (20 products) ====================
// { productCode: "GRO-335", name: "Manathakkali Vathal (100g)", tamilName: "மணத்தக்காளி வத்தல் (100கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-336", name: "Sundaikkai Vathal (100g)", tamilName: "சுண்டைக்காய் வத்தல் (100கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-337", name: "Vendakkai Vathal (100g)", tamilName: "வெண்டக்காய் வத்தல் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-338", name: "Milagai Vathal (100g)", tamilName: "மிளகாய் வத்தல் (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-339", name: "Vadagam (100g)", tamilName: "வடகம் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-340", name: "Vathal Kulambu Mix (100g)", tamilName: "வத்தல் குழம்பு மிக்ஸ் (100கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Vathal & Vadagam"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== STATIONERY (30 products) ====================
// { productCode: "GRO-341", name: "A4 Paper (500 sheets)", tamilName: "ஏ4 பேப்பர் (500 தாள்கள்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-342", name: "Pen (1 piece)", tamilName: "பேனா (1 துண்டு)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-343", name: "Pen (10 pack)", tamilName: "பேனா (10 துண்டுகள்)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-344", name: "Pencil (1 piece)", tamilName: "பென்சில் (1 துண்டு)", mrp: 5, retailRate: 4, wholesaleRate: 3.5, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-345", name: "Pencil (10 pack)", tamilName: "பென்சில் (10 துண்டுகள்)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-346", name: "Eraser (1 piece)", tamilName: "அழிப்பான் (1 துண்டு)", mrp: 5, retailRate: 4, wholesaleRate: 3.5, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-347", name: "Sharpener (1 piece)", tamilName: "சார்ப்பனர் (1 துண்டு)", mrp: 5, retailRate: 4, wholesaleRate: 3.5, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-348", name: "Notebook - 100 pages", tamilName: "நோட்டுப் புத்தகம் (100 பக்கங்கள்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-349", name: "Notebook - 200 pages", tamilName: "நோட்டுப் புத்தகம் (200 பக்கங்கள்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-350", name: "Fevicol (50ml)", tamilName: "ஃபெவிகோல் (50மிலி)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-351", name: "Fevicol (100ml)", tamilName: "ஃபெவிகோல் (100மிலி)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Stationery"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },

// // ==================== HOUSEHOLD CLEANING (35 products) ====================
// { productCode: "GRO-352", name: "Floor Cleaner (500ml)", tamilName: "ஃப்ளோர் கிளீனர் (500மிலி)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Household Cleaning"], brand: brandMap["Lizol"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-353", name: "Floor Cleaner (1L)", tamilName: "ஃப்ளோர் கிளீனர் (1லிட்டர்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Household Cleaning"], brand: brandMap["Lizol"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-354", name: "Glass Cleaner (500ml)", tamilName: "கிளாஸ் கிளீனர் (500மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-355", name: "Toilet Cleaner (500ml)", tamilName: "டாய்லெட் கிளீனர் (500மிலி)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Household Cleaning"], brand: brandMap["Harpic"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-356", name: "Toilet Cleaner (1L)", tamilName: "டாய்லெட் கிளீனர் (1லிட்டர்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Household Cleaning"], brand: brandMap["Harpic"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-357", name: "Dishwash Liquid (500ml)", tamilName: "டிஷ்வாஷ் லிக்விட் (500மிலி)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Household Cleaning"], brand: brandMap["Vim"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-358", name: "Dishwash Liquid (1L)", tamilName: "டிஷ்வாஷ் லிக்விட் (1லிட்டர்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Household Cleaning"], brand: brandMap["Vim"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-359", name: "Dishwash Bar (4 pack)", tamilName: "டிஷ்வாஷ் பார் (4 துண்டுகள்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Household Cleaning"], brand: brandMap["Vim"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-360", name: "Scrub Pad (2 pcs)", tamilName: "ஸ்க்ரப் பேட் (2 துண்டுகள்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-361", name: "Mop Cloth (1 piece)", tamilName: "மாப் துணி (1 துண்டு)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-362", name: "Broom Stick (1 piece)", tamilName: "துடைப்பம் (1 துண்டு)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-363", name: "Dustbin (Small)", tamilName: "குப்பைத் தொட்டி (சிறியது)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-364", name: "Dustbin (Large)", tamilName: "குப்பைத் தொட்டி (பெரியது)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Household Cleaning"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },

// // ==================== LAUNDRY CARE (25 products) ====================
// { productCode: "GRO-365", name: "Detergent Powder - Surf Excel (1kg)", tamilName: "சலவைத்தூள் - சர்ஃப் எக்செல் (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Laundry Care"], brand: brandMap["Surf Excel"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-366", name: "Detergent Powder - Surf Excel (2kg)", tamilName: "சலவைத்தூள் - சர்ஃப் எக்செல் (2கிலோ)", mrp: 230, retailRate: 220, wholesaleRate: 210, category: categoryMap["Laundry Care"], brand: brandMap["Surf Excel"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-367", name: "Detergent Powder - Tide (1kg)", tamilName: "சலவைத்தூள் - டைட் (1கிலோ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Laundry Care"], brand: brandMap["Tide"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-368", name: "Detergent Powder - Tide (2kg)", tamilName: "சலவைத்தூள் - டைட் (2கிலோ)", mrp: 190, retailRate: 185, wholesaleRate: 180, category: categoryMap["Laundry Care"], brand: brandMap["Tide"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-369", name: "Detergent Powder - Rin (1kg)", tamilName: "சலவைத்தூள் - ரின் (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Laundry Care"], brand: brandMap["Rin"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-370", name: "Detergent Powder - Nirma (1kg)", tamilName: "சலவைத்தூள் - நிர்மா (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Laundry Care"], brand: brandMap["Nirma"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-371", name: "Detergent Liquid (500ml)", tamilName: "சலவை திரவம் (500மிலி)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Laundry Care"], brand: brandMap["Surf Excel"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-372", name: "Fabric Softener (500ml)", tamilName: "ஃபேப்ரிக் சாஃப்ட்னர் (500மிலி)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Laundry Care"], brand: brandMap["Comfort"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-373", name: "Fabric Softener (1L)", tamilName: "ஃபேப்ரிக் சாஃப்ட்னர் (1லிட்டர்)", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Laundry Care"], brand: brandMap["Comfort"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-374", name: "Stain Remover (100ml)", tamilName: "ஸ்டெயின் ரிமூவர் (100மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Laundry Care"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-375", name: "Washing Bar (1 piece)", tamilName: "வாஷிங் பார் (1 துண்டு)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Laundry Care"], brand: brandMap["Rin"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-376", name: "Washing Bar (4 pack)", tamilName: "வாஷிங் பார் (4 துண்டுகள்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Laundry Care"], brand: brandMap["Rin"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },

// // ==================== PERSONAL CARE - SOAPS (30 products) ====================
// { productCode: "GRO-377", name: "Lux Soap (1 piece)", tamilName: "லக்ஸ் சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Personal Care"], brand: brandMap["Lux"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-378", name: "Lux Soap (4 pack)", tamilName: "லக்ஸ் சோப் (4 துண்டுகள்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Personal Care"], brand: brandMap["Lux"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-379", name: "Lifebuoy Soap (1 piece)", tamilName: "லைஃப்பாய் சோப் (1 துண்டு)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Personal Care"], brand: brandMap["Lifebuoy"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-380", name: "Lifebuoy Soap (4 pack)", tamilName: "லைஃப்பாய் சோப் (4 துண்டுகள்)", mrp: 115, retailRate: 110, wholesaleRate: 105, category: categoryMap["Personal Care"], brand: brandMap["Lifebuoy"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-381", name: "Dettol Soap (1 piece)", tamilName: "டெட்டால் சோப் (1 துண்டு)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Personal Care"], brand: brandMap["Dettol"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-382", name: "Dettol Soap (4 pack)", tamilName: "டெட்டால் சோப் (4 துண்டுகள்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Personal Care"], brand: brandMap["Dettol"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-383", name: "Santoor Soap (1 piece)", tamilName: "சந்தூர் சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Personal Care"], brand: brandMap["Santoor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-384", name: "Santoor Soap (4 pack)", tamilName: "சந்தூர் சோப் (4 துண்டுகள்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Personal Care"], brand: brandMap["Santoor"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-385", name: "Pears Soap (1 piece)", tamilName: "பியர்ஸ் சோப் (1 துண்டு)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Personal Care"], brand: brandMap["Pears"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-386", name: "Mysore Sandal Soap (1 piece)", tamilName: "மைசூர் சந்தல் சோப் (1 துண்டு)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Personal Care"], brand: brandMap["Mysore Sandal"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-387", name: "Cinthol Soap (1 piece)", tamilName: "சிந்தோல் சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Personal Care"], brand: brandMap["Cinthol"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-388", name: "Patanjali Soap (1 piece)", tamilName: "பதஞ்சலி சோப் (1 துண்டு)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Personal Care"], brand: brandMap["Patanjali"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },

// // ==================== PERSONAL CARE - SHAMPOO (25 products) ====================
// { productCode: "GRO-389", name: "Clinic Plus Shampoo (100ml)", tamilName: "கிளினிக் பிளஸ் ஷாம்பூ (100மிலி)", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Personal Care"], brand: brandMap["Clinic Plus"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-390", name: "Clinic Plus Shampoo (200ml)", tamilName: "கிளினிக் பிளஸ் ஷாம்பூ (200மிலி)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Personal Care"], brand: brandMap["Clinic Plus"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-391", name: "Head & Shoulders Shampoo (100ml)", tamilName: "ஹெட் & ஷோல்டர்ஸ் ஷாம்பூ (100மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Personal Care"], brand: brandMap["Head & Shoulders"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-392", name: "Head & Shoulders Shampoo (200ml)", tamilName: "ஹெட் & ஷோல்டர்ஸ் ஷாம்பூ (200மிலி)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Personal Care"], brand: brandMap["Head & Shoulders"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-393", name: "Pantene Shampoo (100ml)", tamilName: "பான்டீன் ஷாம்பூ (100மிலி)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Personal Care"], brand: brandMap["Pantene"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-394", name: "Pantene Shampoo (200ml)", tamilName: "பான்டீன் ஷாம்பூ (200மிலி)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Personal Care"], brand: brandMap["Pantene"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-395", name: "Dove Shampoo (100ml)", tamilName: "டவ் ஷாம்பூ (100மிலி)", mrp: 75, retailRate: 70, wholesaleRate: 68, category: categoryMap["Personal Care"], brand: brandMap["Dove"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-396", name: "Dove Shampoo (200ml)", tamilName: "டவ் ஷாம்பூ (200மிலி)", mrp: 140, retailRate: 135, wholesaleRate: 130, category: categoryMap["Personal Care"], brand: brandMap["Dove"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-397", name: "Sunsilk Shampoo (100ml)", tamilName: "சன்சில்க் ஷாம்பூ (100மிலி)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Personal Care"], brand: brandMap["Sunsilk"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-398", name: "Sunsilk Shampoo (200ml)", tamilName: "சன்சில்க் ஷாம்பூ (200மிலி)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Personal Care"], brand: brandMap["Sunsilk"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-399", name: "Patanjali Shampoo (200ml)", tamilName: "பதஞ்சலி ஷாம்பூ (200மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Personal Care"], brand: brandMap["Patanjali"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },

// // ==================== PERSONAL CARE - TOOTHPASTE (25 products) ====================
// { productCode: "GRO-400", name: "Colgate Toothpaste (50g)", tamilName: "கோல்கேட் டூத்பேஸ்ட் (50கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-401", name: "Colgate Toothpaste (100g)", tamilName: "கோல்கேட் டூத்பேஸ்ட் (100கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-402", name: "Colgate Toothpaste (200g)", tamilName: "கோல்கேட் டூத்பேஸ்ட் (200கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-403", name: "Closeup Toothpaste (50g)", tamilName: "க்ளோஸ்அப் டூத்பேஸ்ட் (50கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Personal Care"], brand: brandMap["Closeup"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-404", name: "Closeup Toothpaste (100g)", tamilName: "க்ளோஸ்அப் டூத்பேஸ்ட் (100கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Personal Care"], brand: brandMap["Closeup"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-405", name: "Pepsodent Toothpaste (50g)", tamilName: "பெப்சோடெண்ட் டூத்பேஸ்ட் (50கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 25, category: categoryMap["Personal Care"], brand: brandMap["Pepsodent"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-406", name: "Pepsodent Toothpaste (100g)", tamilName: "பெப்சோடெண்ட் டூத்பேஸ்ட் (100கிராம்)", mrp: 52, retailRate: 49, wholesaleRate: 47, category: categoryMap["Personal Care"], brand: brandMap["Pepsodent"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-407", name: "Sensodyne Toothpaste (70g)", tamilName: "சென்சோடைன் டூத்பேஸ்ட் (70கிராம்)", mrp: 90, retailRate: 85, wholesaleRate: 82, category: categoryMap["Personal Care"], brand: brandMap["Sensodyne"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-408", name: "Dabur Red Toothpaste (100g)", tamilName: "டாபூர் ரெட் டூத்பேஸ்ட் (100கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 43, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-409", name: "Patanjali Toothpaste (100g)", tamilName: "பதஞ்சலி டூத்பேஸ்ட் (100கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Personal Care"], brand: brandMap["Patanjali"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-410", name: "Toothbrush (1 piece)", tamilName: "டூத்பிரஷ் (1 துண்டு)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-411", name: "Toothbrush (2 pack)", tamilName: "டூத்பிரஷ் (2 துண்டுகள்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-412", name: "Mouthwash (250ml)", tamilName: "மவுத்வாஷ் (250மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Personal Care"], brand: brandMap["Colgate"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-413", name: "Dental Floss (50m)", tamilName: "டென்டல் ஃப்ளாஸ் (50மீ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Personal Care"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },

// // ==================== BABY CARE (20 products) ====================
// { productCode: "GRO-414", name: "Diapers (Small - 10 pcs)", tamilName: "டயபர்ஸ் (சிறியது - 10 துண்டுகள்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Baby Care"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-415", name: "Diapers (Medium - 10 pcs)", tamilName: "டயபர்ஸ் (மீடியம் - 10 துண்டுகள்)", mrp: 160, retailRate: 155, wholesaleRate: 150, category: categoryMap["Baby Care"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-416", name: "Diapers (Large - 10 pcs)", tamilName: "டயபர்ஸ் (பெரியது - 10 துண்டுகள்)", mrp: 170, retailRate: 165, wholesaleRate: 160, category: categoryMap["Baby Care"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-417", name: "Baby Wipes (80 pcs)", tamilName: "பேபி வைப்ஸ் (80 துண்டுகள்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Baby Care"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-418", name: "Baby Lotion (200ml)", tamilName: "பேபி லோஷன் (200மிலி)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Baby Care"], brand: brandMap["Dabur"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-419", name: "Baby Powder (100g)", tamilName: "பேபி பவுடர் (100கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Baby Care"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-420", name: "Baby Shampoo (200ml)", tamilName: "பேபி ஷாம்பூ (200மிலி)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Baby Care"], brand: brandMap["Dabur"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-421", name: "Baby Soap (1 piece)", tamilName: "பேபி சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Baby Care"], brand: brandMap["Dabur"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-422", name: "Feeding Bottle (250ml)", tamilName: "ஃபீடிங் போட்டில் (250மிலி)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Baby Care"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-423", name: "Baby Cereal (500g)", tamilName: "பேபி சீரியல் (500கிராம்)", mrp: 180, retailRate: 170, wholesaleRate: 165, category: categoryMap["Baby Care"], brand: brandMap["Nestle"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== PET FOOD (15 products) ====================
// { productCode: "GRO-424", name: "Dog Food (1kg)", tamilName: "டாக் ஃபுட் (1கிலோ)", mrp: 200, retailRate: 190, wholesaleRate: 185, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-425", name: "Dog Food (5kg)", tamilName: "டாக் ஃபுட் (5கிலோ)", mrp: 950, retailRate: 900, wholesaleRate: 870, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-426", name: "Cat Food (1kg)", tamilName: "கேட் ஃபுட் (1கிலோ)", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-427", name: "Bird Food (500g)", tamilName: "பறவை உணவு (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-428", name: "Fish Food (100g)", tamilName: "மீன் உணவு (100கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-429", name: "Pet Treats (100g)", tamilName: "பெட் ட்ரீட்ஸ் (100கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Pet Food"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== POOJA ITEMS (20 products) ====================
// { productCode: "GRO-430", name: "Camphor (50g)", tamilName: "கற்பூரம் (50கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-431", name: "Camphor (100g)", tamilName: "கற்பூரம் (100கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-432", name: "Agarbatti (100 sticks)", tamilName: "அகர்பத்தி (100 குச்சிகள்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-433", name: "Agarbatti (200 sticks)", tamilName: "அகர்பத்தி (200 குச்சிகள்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-434", name: "Dhoop Sticks (12 pcs)", tamilName: "தூப் ஸ்டிக்ஸ் (12 துண்டுகள்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-435", name: "Vibhuti (100g)", tamilName: "விபூதி (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-436", name: "Kumkum (50g)", tamilName: "குங்குமம் (50கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-437", name: "Sandalwood Powder (50g)", tamilName: "சந்தனப் பொடி (50கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-438", name: "Coconut (1 piece)", tamilName: "தேங்காய் (1 துண்டு)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-439", name: "Betel Leaves (10 pcs)", tamilName: "வெற்றிலை (10 துண்டுகள்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Pooja Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },

// // ==================== HOME FRAGRANCE (15 products) ====================
// { productCode: "GRO-440", name: "Room Freshener (200ml)", tamilName: "ரூம் ஃப்ரெஷ்னர் (200மிலி)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-441", name: "Room Freshener (500ml)", tamilName: "ரூம் ஃப்ரெஷ்னர் (500மிலி)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-442", name: "Incense Cones (12 pcs)", tamilName: "இன்சென்ஸ் கோன்ஸ் (12 துண்டுகள்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-443", name: "Essential Oil (10ml)", tamilName: "எசன்ஷியல் ஆயில் (10மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-444", name: "Candle (1 piece)", tamilName: "மெழுகுவர்த்தி (1 துண்டு)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-445", name: "Candle (6 pack)", tamilName: "மெழுகுவர்த்தி (6 துண்டுகள்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Home Fragrance"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },

// // ==================== PLASTIC & DISPOSABLES (25 products) ====================
// { productCode: "GRO-446", name: "Plastic Glass (50 pcs)", tamilName: "பிளாஸ்டிக் கிளாஸ் (50 துண்டுகள்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-447", name: "Plastic Plate (25 pcs)", tamilName: "பிளாஸ்டிக் தட்டு (25 துண்டுகள்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-448", name: "Plastic Spoon (50 pcs)", tamilName: "பிளாஸ்டிக் ஸ்பூன் (50 துண்டுகள்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-449", name: "Plastic Fork (50 pcs)", tamilName: "பிளாஸ்டிக் ஃபோர்க் (50 துண்டுகள்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-450", name: "Garbage Bag (10 pcs)", tamilName: "கார்பேஜ் பேக் (10 துண்டுகள்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-451", name: "Garbage Bag (20 pcs)", tamilName: "கார்பேஜ் பேக் (20 துண்டுகள்)", mrp: 75, retailRate: 70, wholesaleRate: 68, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-452", name: "Cling Wrap (30m)", tamilName: "கிளிங் ரேப் (30மீ)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-453", name: "Aluminum Foil (10m)", tamilName: "அலுமினியம் ஃபாயில் (10மீ)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-454", name: "Butter Paper (10 sheets)", tamilName: "பட்டர் பேப்பர் (10 தாள்கள்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-455", name: "Zip Lock Bag (10 pcs)", tamilName: "ஸிப் லாக் பேக் (10 துண்டுகள்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-456", name: "Plastic Container (500ml)", tamilName: "பிளாஸ்டிக் கன்டெய்னர் (500மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-457", name: "Plastic Container (1L)", tamilName: "பிளாஸ்டிக் கன்டெய்னர் (1லிட்டர்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-458", name: "Water Bottle (1L)", tamilName: "வாட்டர் போட்டில் (1லிட்டர்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-459", name: "Water Bottle (2L)", tamilName: "வாட்டர் போட்டில் (2லிட்டர்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Plastic & Disposables"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },

// // ==================== BATTERIES & ELECTRICALS (15 products) ====================
// { productCode: "GRO-460", name: "AA Battery (2 pcs)", tamilName: "ஏஏ பேட்டரி (2 துண்டுகள்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-461", name: "AA Battery (4 pcs)", tamilName: "ஏஏ பேட்டரி (4 துண்டுகள்)", mrp: 75, retailRate: 70, wholesaleRate: 68, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-462", name: "AAA Battery (2 pcs)", tamilName: "ஏஏஏ பேட்டரி (2 துண்டுகள்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-463", name: "AAA Battery (4 pcs)", tamilName: "ஏஏஏ பேட்டரி (4 துண்டுகள்)", mrp: 75, retailRate: 70, wholesaleRate: 68, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-464", name: "9V Battery (1 piece)", tamilName: "9வி பேட்டரி (1 துண்டு)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-465", name: "LED Bulb (9W)", tamilName: "எல்இடி பல்ப் (9வாட்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-466", name: "LED Bulb (12W)", tamilName: "எல்இடி பல்ப் (12வாட்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-467", name: "Extension Cord (2m)", tamilName: "எக்ஸ்டென்ஷன் கார்டு (2மீ)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-468", name: "Plug Adapter (1 piece)", tamilName: "பிளக் அடாப்டர் (1 துண்டு)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Batteries & Electricals"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },

// // ==================== ORGANIC FOODS (20 products) ====================
// { productCode: "GRO-469", name: "Organic Brown Rice (1kg)", tamilName: "ஆர்கானிக் பிரவுன் ரைஸ் (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Organic Foods"], brand: brandMap["24 Mantra"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-470", name: "Organic Brown Rice (5kg)", tamilName: "ஆர்கானிக் பிரவுன் ரைஸ் (5கிலோ)", mrp: 580, retailRate: 560, wholesaleRate: 540, category: categoryMap["Organic Foods"], brand: brandMap["24 Mantra"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-471", name: "Organic Wheat (1kg)", tamilName: "ஆர்கானிக் கோதுமை (1கிலோ)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Organic Foods"], brand: brandMap["24 Mantra"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-472", name: "Organic Wheat (5kg)", tamilName: "ஆர்கானிக் கோதுமை (5கிலோ)", mrp: 340, retailRate: 330, wholesaleRate: 320, category: categoryMap["Organic Foods"], brand: brandMap["24 Mantra"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-473", name: "Organic Toor Dal (1kg)", tamilName: "ஆர்கானிக் துவரம் பருப்பு (1கிலோ)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Organic Foods"], brand: brandMap["24 Mantra"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-474", name: "Organic Honey (250g)", tamilName: "ஆர்கானிக் தேன் (250கிராம்)", mrp: 200, retailRate: 190, wholesaleRate: 185, category: categoryMap["Organic Foods"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-475", name: "Organic Honey (500g)", tamilName: "ஆர்கானிக் தேன் (500கிராம்)", mrp: 380, retailRate: 370, wholesaleRate: 360, category: categoryMap["Organic Foods"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-476", name: "Organic Jaggery (500g)", tamilName: "ஆர்கானிக் வெல்லம் (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Organic Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-477", name: "Organic Jaggery (1kg)", tamilName: "ஆர்கானிக் வெல்லம் (1கிலோ)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Organic Foods"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-478", name: "Organic Coconut Sugar (500g)", tamilName: "ஆர்கானிக் தேங்காய் சர்க்கரை (500கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Organic Foods"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },

// // ==================== BAKERY ITEMS (20 products) ====================
// { productCode: "GRO-479", name: "Bread (400g)", tamilName: "பிரெட் (400கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Bakery Items"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-480", name: "Brown Bread (400g)", tamilName: "பிரவுன் பிரெட் (400கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Bakery Items"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-481", name: "Pav (6 pcs)", tamilName: "பாவ் (6 துண்டுகள்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Bakery Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-482", name: "Bun (6 pcs)", tamilName: "பன் (6 துண்டுகள்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Bakery Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-483", name: "Cake (500g)", tamilName: "கேக் (500கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Bakery Items"], brand: brandMap["Britannia"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-484", name: "Rusk (200g)", tamilName: "ரஸ்க் (200கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Bakery Items"], brand: brandMap["Britannia"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-485", name: "Rusk (400g)", tamilName: "ரஸ்க் (400கிராம்)", mrp: 75, retailRate: 70, wholesaleRate: 68, category: categoryMap["Bakery Items"], brand: brandMap["Britannia"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-486", name: "Croissant (6 pcs)", tamilName: "குராசண்ட் (6 துண்டுகள்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Bakery Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-487", name: "Donut (4 pcs)", tamilName: "டோனட் (4 துண்டுகள்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Bakery Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-488", name: "Muffin (4 pcs)", tamilName: "மஃபின் (4 துண்டுகள்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Bakery Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },

// // ==================== ADDITIONAL SPICES (20 products) ====================
// { productCode: "GRO-489", name: "Bay Leaf (50g)", tamilName: "பிரிஞ்சி இலை (50கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-490", name: "Star Anise (50g)", tamilName: "அன்னாசி பூ (50கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-491", name: "Mace (50g)", tamilName: "ஜாதிப்பத்திரி (50கிராம்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-492", name: "Nutmeg (50g)", tamilName: "ஜாதிக்காய் (50கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-493", name: "Carom Seeds (100g)", tamilName: "ஓமம் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-494", name: "Carom Seeds (200g)", tamilName: "ஓமம் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 49, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-495", name: "Nigella Seeds (100g)", tamilName: "கரும் சீரகம் (100கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-496", name: "Poppy Seeds (100g)", tamilName: "கசகசா (100கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-497", name: "Sesame Seeds (200g)", tamilName: "எள் (200கிராம்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-498", name: "Sesame Seeds (500g)", tamilName: "எள் (500கிராம்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-499", name: "White Pepper (100g)", tamilName: "வெள்ளை மிளகு (100கிராம்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
// { productCode: "GRO-500", name: "White Pepper (200g)", tamilName: "வெள்ளை மிளகு (200கிராம்)", mrp: 230, retailRate: 220, wholesaleRate: 210, category: categoryMap["Spices"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
   
   

// // Then add vegetable products - with productCode and uom (Kg)
// { productCode: "VEG-001", name: "Tomato", tamilName: "தக்காளி", mrp: 40, retailRate: 35, wholesaleRate: 30, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-002", name: "Onion", tamilName: "வெங்காயம்", mrp: 35, retailRate: 30, wholesaleRate: 25, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-003", name: "Small Onion", tamilName: "சின்ன வெங்காயம்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-004", name: "Potato", tamilName: "உருளைக்கிழங்கு", mrp: 30, retailRate: 25, wholesaleRate: 22, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-005", name: "Carrot", tamilName: "கேரட்", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-006", name: "Beans", tamilName: "பீன்ஸ்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-007", name: "Cluster Beans", tamilName: "கொத்தவரங்காய்", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-008", name: "Broad Beans", tamilName: "அவரைக்காய்", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-009", name: "Cabbage", tamilName: "முட்டைக்கோஸ்", mrp: 25, retailRate: 20, wholesaleRate: 18, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-010", name: "Cauliflower", tamilName: "காலிஃபிளவர்", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-011", name: "Brinjal - Big", tamilName: "கத்திரிக்காய் (பெரியது)", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-012", name: "Brinjal - Small", tamilName: "கத்திரிக்காய் (சின்னது)", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-013", name: "Brinjal - Green", tamilName: "பச்சை கத்திரிக்காய்", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-014", name: "Ladies Finger", tamilName: "வெண்டைக்காய்", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-015", name: "Ridge Gourd", tamilName: "பீர்க்கங்காய்", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-016", name: "Snake Gourd", tamilName: "புடலங்காய்", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-017", name: "Bitter Gourd", tamilName: "பாகற்காய்", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-018", name: "Drumstick", tamilName: "முருங்கைக்காய்", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-019", name: "Capsicum - Green", tamilName: "பச்சை குடைமிளகாய்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-020", name: "Capsicum - Red", tamilName: "சிவப்பு குடைமிளகாய்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-021", name: "Capsicum - Yellow", tamilName: "மஞ்சள் குடைமிளகாய்", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-022", name: "Green Chilli", tamilName: "பச்சை மிளகாய்", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-023", name: "Coriander Leaves", tamilName: "கொத்தமல்லி", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-024", name: "Mint Leaves", tamilName: "புதினா", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-025", name: "Curry Leaves", tamilName: "கறிவேப்பிலை", mrp: 15, retailRate: 12, wholesaleRate: 10, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-026", name: "Beetroot", tamilName: "பீட்ரூட்", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-027", name: "Radish - White", tamilName: "முள்ளங்கி (வெள்ளை)", mrp: 30, retailRate: 25, wholesaleRate: 22, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-028", name: "Radish - Pink", tamilName: "முள்ளங்கி (பிங்க்)", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-029", name: "Ash Gourd", tamilName: "பூசணிக்காய்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-030", name: "Pumpkin", tamilName: "பரங்கிக்காய்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-031", name: "Elephant Yam", tamilName: "சேனைக்கிழங்கு", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-032", name: "Sweet Potato", tamilName: "சக்கரை வள்ளிகிழங்கு", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-033", name: "Tapioca", tamilName: "மரவள்ளிகிழங்கு", mrp: 30, retailRate: 25, wholesaleRate: 22, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-034", name: "Colocasia", tamilName: "சேப்பங்கிழங்கு", mrp: 40, retailRate: 35, wholesaleRate: 32, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-035", name: "Knol Khol", tamilName: "நூல்கோல்", mrp: 35, retailRate: 30, wholesaleRate: 28, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-036", name: "Green Peas", tamilName: "பச்சை பட்டாணி", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-037", name: "Corn", tamilName: "சோளம்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-038", name: "Baby Corn", tamilName: "பேபி கார்ன்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-039", name: "Broccoli", tamilName: "ப்ரோக்கோலி", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-040", name: "Zucchini", tamilName: "சுச்சினி", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-041", name: "Cucumber", tamilName: "வெள்ளரிக்காய்", mrp: 30, retailRate: 25, wholesaleRate: 22, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-042", name: "Lemon", tamilName: "எலுமிச்சை", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-043", name: "Ginger", tamilName: "இஞ்சி", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-044", name: "Garlic", tamilName: "பூண்டு", mrp: 120, retailRate: 110, wholesaleRate: 100, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-045", name: "Raw Banana", tamilName: "வாழைக்காய்", mrp: 40, retailRate: 35, wholesaleRate: 32, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-046", name: "Banana Stem", tamilName: "வாழைத்தண்டு", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-047", name: "Banana Flower", tamilName: "வாழைப்பூ", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-048", name: "Mango - Raw", tamilName: "மாங்காய்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-049", name: "Ivy Gourd", tamilName: "கோவைக்காய்", mrp: 40, retailRate: 35, wholesaleRate: 32, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-050", name: "Parwal", tamilName: "பர்வால்", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-051", name: "Tindora", tamilName: "கொவ்வைக்காய்", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-052", name: "Spinach", tamilName: "கீரை", mrp: 15, retailRate: 12, wholesaleRate: 10, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-053", name: "Amaranth Leaves", tamilName: "முளைக்கீரை", mrp: 15, retailRate: 12, wholesaleRate: 10, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-054", name: "Drumstick Leaves", tamilName: "முருங்கைக்கீரை", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-055", name: "Gongura", tamilName: "புளிச்சக் கீரை", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-056", name: "Sorrel Leaves", tamilName: "புளிக்கீரை", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-057", name: "Celery", tamilName: "செலரி", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-058", name: "Leeks", tamilName: "லீக்ஸ்", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-059", name: "Spring Onion", tamilName: "ஸ்பிரிங் வெங்காயம்", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
// { productCode: "VEG-060", name: "Jackfruit - Raw", tamilName: "பலாச்சுளை", mrp: 40, retailRate: 35, wholesaleRate: 32, category: categoryMap["Fresh Vegetables"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
   
   
//     ]);
    
    
//     res.status(200).json({
//       success: true,
//       message: 'Database seeded successfully',
//       data: {
//         companyId: COMPANY_ID,
//         companyName: companyExists.companyName,
//         brands: brands.length,
//         categories: categories.length,
//         uoms: uoms.length,
//         products: products.length
//       }
//     });
    
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;


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
    
    // Get or create UOMs (global, not company-specific)
    const defaultUoms = [
      { name: "Piece", isActive: true },
      { name: "Kg", isActive: true },
      { name: "Gram", isActive: true },
      { name: "Meter", isActive: true },
      { name: "Feet", isActive: true },
      { name: "Inch", isActive: true },
      { name: "Liter", isActive: true },
      { name: "Pack", isActive: true },
      { name: "Box", isActive: true },
      { name: "Roll", isActive: true },
      { name: "Bundle", isActive: true },
      { name: "Set", isActive: true },
      { name: "Pair", isActive: true },
      { name: "Dozen", isActive: true },
      { name: "Sheet", isActive: true },
      { name: "Tube", isActive: true },
      { name: "Can", isActive: true },
      { name: "Bucket", isActive: true },
      { name: "Bag", isActive: true }
    ];
    
    // Insert UOMs only if they don't exist
    const uoms = [];
    for (const uomData of defaultUoms) {
      let uom = await Uom.findOne({ name: uomData.name });
      if (!uom) {
        uom = await Uom.create(uomData);
      }
      uoms.push(uom);
    }

    // Insert Brands for Hardware Shop
    const brands = await Brand.insertMany([
      { name: "Asian Paints", isActive: true, companyId: COMPANY_ID },
      { name: "Berger Paints", isActive: true, companyId: COMPANY_ID },
      { name: "Nerolac", isActive: true, companyId: COMPANY_ID },
      { name: "Indigo Paints", isActive: true, companyId: COMPANY_ID },
      { name: "Shalimar Paints", isActive: true, companyId: COMPANY_ID },
      { name: "JSW Steel", isActive: true, companyId: COMPANY_ID },
      { name: "Tata Steel", isActive: true, companyId: COMPANY_ID },
      { name: "SAIL", isActive: true, companyId: COMPANY_ID },
      { name: "UltraTech Cement", isActive: true, companyId: COMPANY_ID },
      { name: "ACC Cement", isActive: true, companyId: COMPANY_ID },
      { name: "Ambuja Cement", isActive: true, companyId: COMPANY_ID },
      { name: "Ramco Cement", isActive: true, companyId: COMPANY_ID },
      { name: "Birla Cement", isActive: true, companyId: COMPANY_ID },
      { name: "Jaquar", isActive: true, companyId: COMPANY_ID },
      { name: "Hindware", isActive: true, companyId: COMPANY_ID },
      { name: "Cera", isActive: true, companyId: COMPANY_ID },
      { name: "Parryware", isActive: true, companyId: COMPANY_ID },
      { name: "Kajaria Ceramics", isActive: true, companyId: COMPANY_ID },
      { name: "Johnson Tiles", isActive: true, companyId: COMPANY_ID },
      { name: "Somany Ceramics", isActive: true, companyId: COMPANY_ID },
      { name: "Orient Fans", isActive: true, companyId: COMPANY_ID },
      { name: "Havells", isActive: true, companyId: COMPANY_ID },
      { name: "Crompton", isActive: true, companyId: COMPANY_ID },
      { name: "Bajaj", isActive: true, companyId: COMPANY_ID },
      { name: "Philips", isActive: true, companyId: COMPANY_ID },
      { name: "Syska", isActive: true, companyId: COMPANY_ID },
      { name: "Finolex", isActive: true, companyId: COMPANY_ID },
      { name: "Polycab", isActive: true, companyId: COMPANY_ID },
      { name: "Anchor", isActive: true, companyId: COMPANY_ID },
      { name: "Legrand", isActive: true, companyId: COMPANY_ID },
      { name: "Pidilite", isActive: true, companyId: COMPANY_ID },
      { name: "Fevicol", isActive: true, companyId: COMPANY_ID },
      { name: "Bosch", isActive: true, companyId: COMPANY_ID },
      { name: "Stanley", isActive: true, companyId: COMPANY_ID },
      { name: "Taparia", isActive: true, companyId: COMPANY_ID },
      { name: "JK Cement", isActive: true, companyId: COMPANY_ID },
      { name: "Local", isActive: true, companyId: COMPANY_ID }
    ]);
    
    // Insert Categories for Hardware Shop
    const categories = await Category.insertMany([
      { name: "Cement & Construction", isActive: true, companyId: COMPANY_ID },
      { name: "Steel & TMT Bars", isActive: true, companyId: COMPANY_ID },
      { name: "Paints & Coatings", isActive: true, companyId: COMPANY_ID },
      { name: "Sanitary & Plumbing", isActive: true, companyId: COMPANY_ID },
      { name: "Tiles & Flooring", isActive: true, companyId: COMPANY_ID },
      { name: "Electrical", isActive: true, companyId: COMPANY_ID },
      { name: "Wires & Cables", isActive: true, companyId: COMPANY_ID },
      { name: "Fans & Lighting", isActive: true, companyId: COMPANY_ID },
      { name: "Switches & Sockets", isActive: true, companyId: COMPANY_ID },
      { name: "Tools & Hardware", isActive: true, companyId: COMPANY_ID },
      { name: "Adhesives & Sealants", isActive: true, companyId: COMPANY_ID },
      { name: "Lubricants", isActive: true, companyId: COMPANY_ID },
      { name: "Safety Equipment", isActive: true, companyId: COMPANY_ID },
      { name: "Pipe & Fittings", isActive: true, companyId: COMPANY_ID },
      { name: "PVC Pipes", isActive: true, companyId: COMPANY_ID },
      { name: "GI Pipes", isActive: true, companyId: COMPANY_ID },
      { name: "Door & Window Fittings", isActive: true, companyId: COMPANY_ID },
      { name: "Nails & Fasteners", isActive: true, companyId: COMPANY_ID },
      { name: "Locks & Handles", isActive: true, companyId: COMPANY_ID },
      { name: "Water Tanks", isActive: true, companyId: COMPANY_ID },
      { name: "Solar Products", isActive: true, companyId: COMPANY_ID },
      { name: "Hardware Accessories", isActive: true, companyId: COMPANY_ID }
    ]);
    
    // Create lookup maps
    const brandMap = {};
    brands.forEach(brand => { brandMap[brand.name] = brand._id; });
    
    const categoryMap = {};
    categories.forEach(category => { categoryMap[category.name] = category._id; });
    
    const uomMap = {};
    uoms.forEach(uom => { uomMap[uom.name] = uom._id; });
    
    // Insert Products for Hardware Shop
    const products = await Product.insertMany([
      // ==================== CEMENT & CONSTRUCTION ====================
      { productCode: "HW-001", name: "UltraTech Cement 53 Grade (50kg)", tamilName: "அல்ட்ராடெக் சிமென்ட் 53 கிரேடு (50கிலோ)", mrp: 380, retailRate: 370, wholesaleRate: 360, category: categoryMap["Cement & Construction"], brand: brandMap["UltraTech Cement"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-002", name: "ACC Cement 53 Grade (50kg)", tamilName: "ஏசிசி சிமென்ட் 53 கிரேடு (50கிலோ)", mrp: 375, retailRate: 365, wholesaleRate: 355, category: categoryMap["Cement & Construction"], brand: brandMap["ACC Cement"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-003", name: "Ambuja Cement 53 Grade (50kg)", tamilName: "அம்புஜா சிமென்ட் 53 கிரேடு (50கிலோ)", mrp: 378, retailRate: 368, wholesaleRate: 358, category: categoryMap["Cement & Construction"], brand: brandMap["Ambuja Cement"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-004", name: "Ramco Cement 53 Grade (50kg)", tamilName: "ராம்கோ சிமென்ட் 53 கிரேடு (50கிலோ)", mrp: 370, retailRate: 360, wholesaleRate: 350, category: categoryMap["Cement & Construction"], brand: brandMap["Ramco Cement"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-005", name: "UltraTech PPC Cement (50kg)", tamilName: "அல்ட்ராடெக் பிபிசி சிமென்ட் (50கிலோ)", mrp: 365, retailRate: 355, wholesaleRate: 345, category: categoryMap["Cement & Construction"], brand: brandMap["UltraTech Cement"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-006", name: "M-Sand (1 unit)", tamilName: "எம்-மணல் (1 யூனிட்)", mrp: 1200, retailRate: 1150, wholesaleRate: 1100, category: categoryMap["Cement & Construction"], brand: brandMap["Local"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-007", name: "River Sand (1 unit)", tamilName: "ஆற்று மணல் (1 யூனிட்)", mrp: 1500, retailRate: 1450, wholesaleRate: 1400, category: categoryMap["Cement & Construction"], brand: brandMap["Local"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-008", name: "Blue Metal 20mm (1 unit)", tamilName: "ப்ளூ மெட்டல் 20மிமீ (1 யூனிட்)", mrp: 1400, retailRate: 1350, wholesaleRate: 1300, category: categoryMap["Cement & Construction"], brand: brandMap["Local"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-009", name: "Blue Metal 12mm (1 unit)", tamilName: "ப்ளூ மெட்டல் 12மிமீ (1 யூனிட்)", mrp: 1450, retailRate: 1400, wholesaleRate: 1350, category: categoryMap["Cement & Construction"], brand: brandMap["Local"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-010", name: "Brick (Single)", tamilName: "செங்கல் (ஒற்றை)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Cement & Construction"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== STEEL & TMT BARS ====================
      { productCode: "HW-011", name: "TMT Bar 8mm (1 piece)", tamilName: "டிஎம்டி பார் 8மிமீ (1 துண்டு)", mrp: 550, retailRate: 540, wholesaleRate: 530, category: categoryMap["Steel & TMT Bars"], brand: brandMap["JSW Steel"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-012", name: "TMT Bar 10mm (1 piece)", tamilName: "டிஎம்டி பார் 10மிமீ (1 துண்டு)", mrp: 680, retailRate: 670, wholesaleRate: 660, category: categoryMap["Steel & TMT Bars"], brand: brandMap["JSW Steel"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-013", name: "TMT Bar 12mm (1 piece)", tamilName: "டிஎம்டி பார் 12மிமீ (1 துண்டு)", mrp: 820, retailRate: 810, wholesaleRate: 800, category: categoryMap["Steel & TMT Bars"], brand: brandMap["Tata Steel"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-014", name: "TMT Bar 16mm (1 piece)", tamilName: "டிஎம்டி பார் 16மிமீ (1 துண்டு)", mrp: 1100, retailRate: 1080, wholesaleRate: 1060, category: categoryMap["Steel & TMT Bars"], brand: brandMap["Tata Steel"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-015", name: "TMT Bar 20mm (1 piece)", tamilName: "டிஎம்டி பார் 20மிமீ (1 துண்டு)", mrp: 1350, retailRate: 1330, wholesaleRate: 1310, category: categoryMap["Steel & TMT Bars"], brand: brandMap["JSW Steel"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-016", name: "MS Angle 25x25mm (6m)", tamilName: "எம்எஸ் ஆங்கிள் 25x25மிமீ (6மீ)", mrp: 850, retailRate: 830, wholesaleRate: 810, category: categoryMap["Steel & TMT Bars"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-017", name: "MS Angle 40x40mm (6m)", tamilName: "எம்எஸ் ஆங்கிள் 40x40மிமீ (6மீ)", mrp: 1200, retailRate: 1180, wholesaleRate: 1160, category: categoryMap["Steel & TMT Bars"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-018", name: "MS Channel 75x40mm (6m)", tamilName: "எம்எஸ் சேனல் 75x40மிமீ (6மீ)", mrp: 2100, retailRate: 2050, wholesaleRate: 2000, category: categoryMap["Steel & TMT Bars"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== PAINTS & COATINGS ====================
      { productCode: "HW-019", name: "Asian Paints Apcolite (1L)", tamilName: "ஏசியன் பெயிண்ட்ஸ் அப்கோலைட் (1லி)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Paints & Coatings"], brand: brandMap["Asian Paints"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-020", name: "Asian Paints Apcolite (4L)", tamilName: "ஏசியன் பெயிண்ட்ஸ் அப்கோலைட் (4லி)", mrp: 650, retailRate: 640, wholesaleRate: 630, category: categoryMap["Paints & Coatings"], brand: brandMap["Asian Paints"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-021", name: "Berger Easy Clean (1L)", tamilName: "பெர்கர் ஈஸி கிளீன் (1லி)", mrp: 160, retailRate: 155, wholesaleRate: 150, category: categoryMap["Paints & Coatings"], brand: brandMap["Berger Paints"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-022", name: "Nerolac Premium (1L)", tamilName: "நெரோலாக் பிரீமியம் (1லி)", mrp: 170, retailRate: 165, wholesaleRate: 160, category: categoryMap["Paints & Coatings"], brand: brandMap["Nerolac"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-023", name: "Asian Paints Primer (4L)", tamilName: "ஏசியன் பெயிண்ட்ஸ் பிரைமர் (4லி)", mrp: 550, retailRate: 540, wholesaleRate: 530, category: categoryMap["Paints & Coatings"], brand: brandMap["Asian Paints"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-024", name: "Paint Brush 2 inch", tamilName: "பெயிண்ட் பிரஷ் 2 இன்ச்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Paints & Coatings"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-025", name: "Paint Brush 4 inch", tamilName: "பெயிண்ட் பிரஷ் 4 இன்ச்", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Paints & Coatings"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-026", name: "Roller Brush 9 inch", tamilName: "ரோலர் பிரஷ் 9 இன்ச்", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Paints & Coatings"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-027", name: "White Cement (1kg)", tamilName: "வெள்ளை சிமென்ட் (1கிலோ)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Paints & Coatings"], brand: brandMap["JK Cement"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-028", name: "White Cement (5kg)", tamilName: "வெள்ளை சிமென்ட் (5கிலோ)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Paints & Coatings"], brand: brandMap["JK Cement"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== SANITARY & PLUMBING ====================
      { productCode: "HW-029", name: "Jaquar Commode - European", tamilName: "ஜாகுவார் கமோட் - ஐரோப்பியன்", mrp: 5500, retailRate: 5300, wholesaleRate: 5100, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Jaquar"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-030", name: "Jaquar Wash Basin", tamilName: "ஜாகுவார் வாஷ் பேசின்", mrp: 2500, retailRate: 2400, wholesaleRate: 2300, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Jaquar"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-031", name: "Cera Wash Basin", tamilName: "சேரா வாஷ் பேசின்", mrp: 2200, retailRate: 2100, wholesaleRate: 2000, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Cera"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-032", name: "Jaquar Closet (Wall Hung)", tamilName: "ஜாகுவார் குளோசட் (வால் ஹங்)", mrp: 6500, retailRate: 6300, wholesaleRate: 6100, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Jaquar"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-033", name: "Hindware Wash Basin", tamilName: "ஹிந்த்வேர் வாஷ் பேசின்", mrp: 2100, retailRate: 2000, wholesaleRate: 1900, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Hindware"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-034", name: "Parryware Commode", tamilName: "பாரிவேர் கமோட்", mrp: 4800, retailRate: 4700, wholesaleRate: 4600, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Parryware"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-035", name: "Wall Mixer (Jaquar)", tamilName: "வால் மிக்சர் (ஜாகுவார்)", mrp: 1800, retailRate: 1750, wholesaleRate: 1700, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Jaquar"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-036", name: "Health Faucet", tamilName: "ஹெல்த் பாசெட்", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["Sanitary & Plumbing"], brand: brandMap["Jaquar"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== TILES & FLOORING ====================
      { productCode: "HW-037", name: "Kajaria Floor Tile 2x2ft", tamilName: "கஜாரியா ஃப்ளோர் டைல் 2x2அடி", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Tiles & Flooring"], brand: brandMap["Kajaria Ceramics"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-038", name: "Kajaria Wall Tile 2x4ft", tamilName: "கஜாரியா வால் டைல் 2x4அடி", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Tiles & Flooring"], brand: brandMap["Kajaria Ceramics"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-039", name: "Johnson Vitrified Tile 2x4ft", tamilName: "ஜான்சன் விட்ரிஃபைட் டைல் 2x4அடி", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Tiles & Flooring"], brand: brandMap["Johnson Tiles"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-040", name: "Somany Digital Tile 2x2ft", tamilName: "சோமனி டிஜிட்டல் டைல் 2x2அடி", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Tiles & Flooring"], brand: brandMap["Somany Ceramics"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-041", name: "Kajaria Marble Tile 2x4ft", tamilName: "கஜாரியா மார்பிள் டைல் 2x4அடி", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Tiles & Flooring"], brand: brandMap["Kajaria Ceramics"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-042", name: "Kajaria Wooden Tile 2x4ft", tamilName: "கஜாரியா வுடன் டைல் 2x4அடி", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Tiles & Flooring"], brand: brandMap["Kajaria Ceramics"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-043", name: "Tile Adhesive (25kg)", tamilName: "டைல் அடிசிவ் (25கிலோ)", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["Tiles & Flooring"], brand: brandMap["Pidilite"], uom: uomMap["Bag"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-044", name: "Grout Powder (1kg)", tamilName: "கிரௌட் பவுடர் (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Tiles & Flooring"], brand: brandMap["Pidilite"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== ELECTRICAL - WIRES & CABLES ====================
      { productCode: "HW-045", name: "Finolex Wire 1.5 sqmm (90m)", tamilName: "ஃபினோலெக்ஸ் வயர் 1.5 சதுரமிமீ (90மீ)", mrp: 1200, retailRate: 1150, wholesaleRate: 1100, category: categoryMap["Wires & Cables"], brand: brandMap["Finolex"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-046", name: "Finolex Wire 2.5 sqmm (90m)", tamilName: "ஃபினோலெக்ஸ் வயர் 2.5 சதுரமிமீ (90மீ)", mrp: 1900, retailRate: 1850, wholesaleRate: 1800, category: categoryMap["Wires & Cables"], brand: brandMap["Finolex"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-047", name: "Polycab Wire 1.5 sqmm (90m)", tamilName: "பாலிகேப் வயர் 1.5 சதுரமிமீ (90மீ)", mrp: 1150, retailRate: 1100, wholesaleRate: 1050, category: categoryMap["Wires & Cables"], brand: brandMap["Polycab"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-048", name: "Polycab Wire 2.5 sqmm (90m)", tamilName: "பாலிகேப் வயர் 2.5 சதுரமிமீ (90மீ)", mrp: 1850, retailRate: 1800, wholesaleRate: 1750, category: categoryMap["Wires & Cables"], brand: brandMap["Polycab"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-049", name: "Finolex Wire 4 sqmm (90m)", tamilName: "ஃபினோலெக்ஸ் வயர் 4 சதுரமிமீ (90மீ)", mrp: 2900, retailRate: 2850, wholesaleRate: 2800, category: categoryMap["Wires & Cables"], brand: brandMap["Finolex"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-050", name: "Polycab Wire 6 sqmm (90m)", tamilName: "பாலிகேப் வயர் 6 சதுரமிமீ (90மீ)", mrp: 4500, retailRate: 4400, wholesaleRate: 4300, category: categoryMap["Wires & Cables"], brand: brandMap["Polycab"], uom: uomMap["Roll"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== FANS & LIGHTING ====================
      { productCode: "HW-051", name: "Orient Ceiling Fan (1200mm)", tamilName: "ஓரியண்ட் சீலிங் ஃபேன் (1200மிமீ)", mrp: 2200, retailRate: 2100, wholesaleRate: 2000, category: categoryMap["Fans & Lighting"], brand: brandMap["Orient Fans"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-052", name: "Havells Ceiling Fan (1200mm)", tamilName: "ஹேவெல்ஸ் சீலிங் ஃபேன் (1200மிமீ)", mrp: 2400, retailRate: 2300, wholesaleRate: 2200, category: categoryMap["Fans & Lighting"], brand: brandMap["Havells"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-053", name: "Crompton Ceiling Fan (1200mm)", tamilName: "கிராம்ப்டன் சீலிங் ஃபேன் (1200மிமீ)", mrp: 2100, retailRate: 2000, wholesaleRate: 1900, category: categoryMap["Fans & Lighting"], brand: brandMap["Crompton"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-054", name: "Bajaj Wall Fan (400mm)", tamilName: "பஜாஜ் வால் ஃபேன் (400மிமீ)", mrp: 1800, retailRate: 1750, wholesaleRate: 1700, category: categoryMap["Fans & Lighting"], brand: brandMap["Bajaj"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-055", name: "Philips LED Bulb 9W", tamilName: "பிலிப்ஸ் எல்இடி பல்ப் 9W", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Fans & Lighting"], brand: brandMap["Philips"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-056", name: "Syska LED Bulb 12W", tamilName: "சிஸ்கா எல்இடி பல்ப் 12W", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Fans & Lighting"], brand: brandMap["Syska"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-057", name: "Philips LED Tube Light 20W", tamilName: "பிலிப்ஸ் எல்இடி டியூப் லைட் 20W", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Fans & Lighting"], brand: brandMap["Philips"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-058", name: "LED Batten 20W", tamilName: "எல்இடி பேட்டன் 20W", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Fans & Lighting"], brand: brandMap["Havells"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-059", name: "LED Downlight 12W", tamilName: "எல்இடி டவுன்லைட் 12W", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Fans & Lighting"], brand: brandMap["Philips"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== SWITCHES & SOCKETS ====================
      { productCode: "HW-060", name: "Anchor 1 Way Switch", tamilName: "ஆங்கர் 1 வே சுவிட்ச்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-061", name: "Anchor 2 Way Switch", tamilName: "ஆங்கர் 2 வே சுவிட்ச்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-062", name: "Legrand 1 Way Switch", tamilName: "லெக்ரான்ட் 1 வே சுவிட்ச்", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Switches & Sockets"], brand: brandMap["Legrand"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-063", name: "Anchor 6A Socket", tamilName: "ஆங்கர் 6A சாக்கெட்", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-064", name: "Anchor 16A Socket", tamilName: "ஆங்கர் 16A சாக்கெட்", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-065", name: "Anchor 6A Modular Switch", tamilName: "ஆங்கர் 6A மாடுலர் சுவிட்ச்", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-066", name: "Legrand Socket 6A", tamilName: "லெக்ரான்ட் சாக்கெட் 6A", mrp: 60, retailRate: 58, wholesaleRate: 56, category: categoryMap["Switches & Sockets"], brand: brandMap["Legrand"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-067", name: "Distribution Box (4 Way)", tamilName: "டிஸ்ட்ரிபியூஷன் பாக்ஸ் (4 வே)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Switches & Sockets"], brand: brandMap["Anchor"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-068", name: "MCB 6A (Single Pole)", tamilName: "எம்சிபி 6A (சிங்கிள் போல்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Switches & Sockets"], brand: brandMap["Havells"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-069", name: "MCB 16A (Single Pole)", tamilName: "எம்சிபி 16A (சிங்கிள் போல்)", mrp: 130, retailRate: 125, wholesaleRate: 120, category: categoryMap["Switches & Sockets"], brand: brandMap["Havells"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== TOOLS & HARDWARE ====================
      { productCode: "HW-070", name: "Hammer (1kg)", tamilName: "சுத்தி (1கிலோ)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Tools & Hardware"], brand: brandMap["Taparia"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-071", name: "Screwdriver Set (6 pcs)", tamilName: "ஸ்க்ரூடிரைவர் செட் (6 துண்டுகள்)", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["Tools & Hardware"], brand: brandMap["Taparia"], uom: uomMap["Set"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-072", name: "Plier (8 inch)", tamilName: "பிளையர் (8 இன்ச்)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Tools & Hardware"], brand: brandMap["Taparia"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-073", name: "Adjustable Wrench (12 inch)", tamilName: "அட்ஜஸ்டபிள் ரெஞ்ச் (12 இன்ச்)", mrp: 280, retailRate: 270, wholesaleRate: 260, category: categoryMap["Tools & Hardware"], brand: brandMap["Stanley"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-074", name: "Measuring Tape (5m)", tamilName: "டேப் (5மீ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Tools & Hardware"], brand: brandMap["Stanley"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-075", name: "Spirit Level (2ft)", tamilName: "ஸ்பிரிட் லெவல் (2அடி)", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Tools & Hardware"], brand: brandMap["Stanley"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-076", name: "Hacksaw Frame", tamilName: "ஹாக்ஸா ஃப்ரேம்", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Tools & Hardware"], brand: brandMap["Taparia"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-077", name: "Hacksaw Blade (Pack of 10)", tamilName: "ஹாக்ஸா பிளேடு (10 துண்டுகள்)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Tools & Hardware"], brand: brandMap["Taparia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-078", name: "Drill Machine (600W)", tamilName: "டிரில் மெஷின் (600W)", mrp: 2200, retailRate: 2100, wholesaleRate: 2000, category: categoryMap["Tools & Hardware"], brand: brandMap["Bosch"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-079", name: "Drill Bit Set (12 pcs)", tamilName: "டிரில் பிட் செட் (12 துண்டுகள்)", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["Tools & Hardware"], brand: brandMap["Bosch"], uom: uomMap["Set"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== ADHESIVES & SEALANTS ====================
      { productCode: "HW-080", name: "Fevicol SH (1kg)", tamilName: "ஃபெவிகோல் SH (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Adhesives & Sealants"], brand: brandMap["Pidilite"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-081", name: "Fevicol Marine (1kg)", tamilName: "ஃபெவிகோல் மரின் (1கிலோ)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Adhesives & Sealants"], brand: brandMap["Pidilite"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-082", name: "M-Seal (100g)", tamilName: "எம்-சீல் (100கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Adhesives & Sealants"], brand: brandMap["Pidilite"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-083", name: "M-Seal (500g)", tamilName: "எம்-சீல் (500கிராம்)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Adhesives & Sealants"], brand: brandMap["Pidilite"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-084", name: "Quickfix (50ml)", tamilName: "க்விக்ஃபிக்ஸ் (50மிலி)", mrp: 60, retailRate: 58, wholesaleRate: 56, category: categoryMap["Adhesives & Sealants"], brand: brandMap["Pidilite"], uom: uomMap["Tube"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== PVC PIPES & FITTINGS ====================
      { productCode: "HW-085", name: "PVC Pipe 20mm (3m)", tamilName: "பிவிசி பைப் 20மிமீ (3மீ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-086", name: "PVC Pipe 25mm (3m)", tamilName: "பிவிசி பைப் 25மிமீ (3மீ)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-087", name: "PVC Pipe 50mm (3m)", tamilName: "பிவிசி பைப் 50மிமீ (3மீ)", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-088", name: "PVC Pipe 110mm (3m)", tamilName: "பிவிசி பைப் 110மிமீ (3மீ)", mrp: 850, retailRate: 830, wholesaleRate: 810, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-089", name: "PVC Elbow 20mm", tamilName: "பிவிசி எல்போ 20மிமீ", mrp: 8, retailRate: 7, wholesaleRate: 6, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-090", name: "PVC Coupler 20mm", tamilName: "பிவிசி கப்ளர் 20மிமீ", mrp: 6, retailRate: 5, wholesaleRate: 4, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-091", name: "PVC Tee 20mm", tamilName: "பிவிசி டீ 20மிமீ", mrp: 9, retailRate: 8, wholesaleRate: 7, category: categoryMap["PVC Pipes"], brand: brandMap["Finolex"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== NAILS & FASTENERS ====================
      { productCode: "HW-092", name: "GI Nail 1 inch (500g)", tamilName: "ஜிஐ நெயில் 1 இன்ச் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-093", name: "GI Nail 2 inch (500g)", tamilName: "ஜிஐ நெயில் 2 இன்ச் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-094", name: "GI Nail 3 inch (500g)", tamilName: "ஜிஐ நெயில் 3 இன்ச் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-095", name: "Wood Screw 1 inch (100 pcs)", tamilName: "வுட் ஸ்க்ரூ 1 இன்ச் (100 துண்டுகள்)", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-096", name: "Wood Screw 2 inch (100 pcs)", tamilName: "வுட் ஸ்க்ரூ 2 இன்ச் (100 துண்டுகள்)", mrp: 70, retailRate: 68, wholesaleRate: 66, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-097", name: "Nut Bolt 8mm (100 pcs)", tamilName: "நட் போல்ட் 8மிமீ (100 துண்டுகள்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-098", name: "Nut Bolt 10mm (100 pcs)", tamilName: "நட் போல்ட் 10மிமீ (100 துண்டுகள்)", mrp: 180, retailRate: 175, wholesaleRate: 170, category: categoryMap["Nails & Fasteners"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== LOCKS & HANDLES ====================
      { productCode: "HW-099", name: "Almond Lock (40mm)", tamilName: "ஆல்மண்ட் பூட்டு (40மிமீ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Locks & Handles"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-100", name: "Almond Lock (50mm)", tamilName: "ஆல்மண்ட் பூட்டு (50மிமீ)", mrp: 160, retailRate: 155, wholesaleRate: 150, category: categoryMap["Locks & Handles"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-101", name: "Door Handle (SS)", tamilName: "டோர் ஹேண்டில் (எஸ்எஸ்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Locks & Handles"], brand: brandMap["Local"], uom: uomMap["Pair"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-102", name: "Mortise Lock", tamilName: "மோட்டீஸ் பூட்டு", mrp: 350, retailRate: 340, wholesaleRate: 330, category: categoryMap["Locks & Handles"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== WATER TANKS ====================
      { productCode: "HW-103", name: "Water Tank 500L", tamilName: "நீர் தொட்டி 500லி", mrp: 3500, retailRate: 3400, wholesaleRate: 3300, category: categoryMap["Water Tanks"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-104", name: "Water Tank 1000L", tamilName: "நீர் தொட்டி 1000லி", mrp: 6500, retailRate: 6400, wholesaleRate: 6300, category: categoryMap["Water Tanks"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-105", name: "Water Tank 1500L", tamilName: "நீர் தொட்டி 1500லி", mrp: 9000, retailRate: 8800, wholesaleRate: 8600, category: categoryMap["Water Tanks"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      
      // ==================== SAFETY EQUIPMENT ====================
      { productCode: "HW-106", name: "Helmet (Industrial)", tamilName: "ஹெல்மெட் (இண்டஸ்டிரியல்)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Safety Equipment"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-107", name: "Safety Gloves", tamilName: "சேஃப்டி க்ளோவ்ஸ்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Safety Equipment"], brand: brandMap["Local"], uom: uomMap["Pair"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-108", name: "Safety Goggles", tamilName: "சேஃப்டி காக்கிள்ஸ்", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Safety Equipment"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
      { productCode: "HW-109", name: "Face Mask (N95)", tamilName: "ஃபேஸ் மாஸ்க் (N95)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Safety Equipment"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Hardware database seeded successfully',
      data: {
        companyId: COMPANY_ID,
        companyName: companyExists.companyName,
        brands: brands.length,
        categories: categories.length,
        uoms: uoms.length,
        products: products.length
      }
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;