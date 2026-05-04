// // backend/seedGrocery.js
// const mongoose = require('mongoose');
// require('dotenv').config();

// // Import your models
// const Brand = require('./models/Brand');
// const Category = require('./models/Category');
// const Uom = require('./models/Uom');
// const Product = require('./models/Product');

// const seedDatabase = async () => {
//   try {
//     // Connect to MongoDB
//     const MONGODB_URI = process.env.MONGO_URI;
//     await mongoose.connect(MONGODB_URI);
//     console.log('✅ Connected to MongoDB');

//     // Use the existing company ID
//     const COMPANY_ID = new mongoose.Types.ObjectId("69f1891e22baf3eba2b07e62");
//     console.log(`✅ Using company ID: ${COMPANY_ID}`);

//     // Clear existing data for this company
//     await Brand.deleteMany({ companyId: COMPANY_ID });
//     await Category.deleteMany({ companyId: COMPANY_ID });
//     await Product.deleteMany({ companyId: COMPANY_ID });
//     console.log('🗑️ Cleared existing company-specific data');

//     // ==================== INSERT UOMs ====================
//     const existingUoms = await Uom.find({});
//     let uoms;
    
//     if (existingUoms.length === 0) {
//       uoms = await Uom.insertMany([
//         { name: "Piece", isActive: true },
//         { name: "Pack", isActive: true },
//         { name: "Kg", isActive: true },
//         { name: "Gram", isActive: true },
//         { name: "Liter", isActive: true },
//         { name: "Ml", isActive: true },
//         { name: "Dozen", isActive: true },
//         { name: "Box", isActive: true },
//         { name: "Bottle", isActive: true },
//         { name: "Packet", isActive: true },
//         { name: "Bag", isActive: true },
//         { name: "Nos", isActive: true },
//         { name: "Tin", isActive: true }
//       ]);
//       console.log(`✅ ${uoms.length} UOMs inserted`);
//     } else {
//       uoms = existingUoms;
//       console.log(`✅ ${uoms.length} UOMs already exist`);
//     }

//     // ==================== INSERT BRANDS (Popular in Tamil Nadu) ====================
//     const brands = await Brand.insertMany([
//       { name: "MTR", isActive: true, companyId: COMPANY_ID },
//       { name: "ID", isActive: true, companyId: COMPANY_ID },
//       { name: "Aashirvaad", isActive: true, companyId: COMPANY_ID },
//       { name: "Patanjali", isActive: true, companyId: COMPANY_ID },
//       { name: "Britannia", isActive: true, companyId: COMPANY_ID },
//       { name: "Parle", isActive: true, companyId: COMPANY_ID },
//       { name: "Sunfeast", isActive: true, companyId: COMPANY_ID },
//       { name: "Kissan", isActive: true, companyId: COMPANY_ID },
//       { name: "Maggi", isActive: true, companyId: COMPANY_ID },
//       { name: "Taj", isActive: true, companyId: COMPANY_ID },
//       { name: "Catch", isActive: true, companyId: COMPANY_ID },
//       { name: "MDH", isActive: true, companyId: COMPANY_ID },
//       { name: "Everest", isActive: true, companyId: COMPANY_ID },
//       { name: "Sakthi", isActive: true, companyId: COMPANY_ID },
//       { name: "Aachi", isActive: true, companyId: COMPANY_ID },
//       { name: "Local", isActive: true, companyId: COMPANY_ID },
//       { name: "Amul", isActive: true, companyId: COMPANY_ID },
//       { name: "Nestle", isActive: true, companyId: COMPANY_ID },
//       { name: "Pepsico", isActive: true, companyId: COMPANY_ID },
//       { name: "Coca-Cola", isActive: true, companyId: COMPANY_ID },
//       { name: "Fortune", isActive: true, companyId: COMPANY_ID },
//       { name: "Saffola", isActive: true, companyId: COMPANY_ID },
//       { name: "Dabur", isActive: true, companyId: COMPANY_ID },
//       { name: "Haldiram's", isActive: true, companyId: COMPANY_ID }
//     ]);
//     console.log(`✅ ${brands.length} brands inserted`);

//     // ==================== INSERT CATEGORIES ====================
//     const categories = await Category.insertMany([
//       { name: "Rice & Grains", isActive: true, companyId: COMPANY_ID },
//       { name: "Flours", isActive: true, companyId: COMPANY_ID },
//       { name: "Dals & Pulses", isActive: true, companyId: COMPANY_ID },
//       { name: "Spices", isActive: true, companyId: COMPANY_ID },
//       { name: "Oil & Ghee", isActive: true, companyId: COMPANY_ID },
//       { name: "Snacks & Namkeen", isActive: true, companyId: COMPANY_ID },
//       { name: "Biscuits & Cookies", isActive: true, companyId: COMPANY_ID },
//       { name: "Noodles & Pasta", isActive: true, companyId: COMPANY_ID },
//       { name: "Sauces & Ketchup", isActive: true, companyId: COMPANY_ID },
//       { name: "Tea & Coffee", isActive: true, companyId: COMPANY_ID },
//       { name: "Masala & Mixes", isActive: true, companyId: COMPANY_ID },
//       { name: "Pickles", isActive: true, companyId: COMPANY_ID },
//       { name: "Canned Foods", isActive: true, companyId: COMPANY_ID },
//       { name: "Beverages", isActive: true, companyId: COMPANY_ID },
//       { name: "Dairy Products", isActive: true, companyId: COMPANY_ID },
//       { name: "Stationery", isActive: true, companyId: COMPANY_ID },
//       { name: "Household Items", isActive: true, companyId: COMPANY_ID },
//       { name: "Personal Care", isActive: true, companyId: COMPANY_ID }
//     ]);
//     console.log(`✅ ${categories.length} categories inserted`);

//     // Create lookup maps
//     const brandMap = {};
//     brands.forEach(brand => { brandMap[brand.name] = brand._id; });

//     const categoryMap = {};
//     categories.forEach(category => { categoryMap[category.name] = category._id; });

//     const uomMap = {};
//     uoms.forEach(uom => { uomMap[uom.name] = uom._id; });

//     // ==================== INSERT PRODUCTS WITH VARIANTS ====================
//     const products = [
//       // Rice & Grains (Kg variants)
//       { productCode: "GRO-001", name: "Raw Rice - Ponni (1kg)", tamilName: "பொன்னி அரிசி (1கிலோ)", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-002", name: "Raw Rice - Ponni (5kg)", tamilName: "பொன்னி அரிசி (5கிலோ)", mrp: 290, retailRate: 275, wholesaleRate: 250, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-003", name: "Raw Rice - Ponni (10kg)", tamilName: "பொன்னி அரிசி (10கிலோ)", mrp: 570, retailRate: 540, wholesaleRate: 500, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-004", name: "Sona Masoori Rice (1kg)", tamilName: "சோனா மசூரி அரிசி (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-005", name: "Sona Masoori Rice (5kg)", tamilName: "சோனா மசூரி அரிசி (5கிலோ)", mrp: 365, retailRate: 345, wholesaleRate: 320, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-006", name: "Sona Masoori Rice (10kg)", tamilName: "சோனா மசூரி அரிசி (10கிலோ)", mrp: 720, retailRate: 680, wholesaleRate: 650, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-007", name: "Parboiled Rice (1kg)", tamilName: "புழுங்கல் அரிசி (1கிலோ)", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-008", name: "Parboiled Rice (5kg)", tamilName: "புழுங்கல் அரிசி (5கிலோ)", mrp: 315, retailRate: 295, wholesaleRate: 275, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-009", name: "Idly Rice (1kg)", tamilName: "இட்லி அரிசி (1கிலோ)", mrp: 55, retailRate: 50, wholesaleRate: 45, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-010", name: "Idly Rice (5kg)", tamilName: "இட்லி அரிசி (5கிலோ)", mrp: 265, retailRate: 245, wholesaleRate: 225, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-011", name: "Wheat (1kg)", tamilName: "கோதுமை (1கிலோ)", mrp: 45, retailRate: 40, wholesaleRate: 38, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-012", name: "Wheat (5kg)", tamilName: "கோதுமை (5கிலோ)", mrp: 215, retailRate: 195, wholesaleRate: 185, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-013", name: "Ragi (1kg)", tamilName: "ராகி (1கிலோ)", mrp: 50, retailRate: 45, wholesaleRate: 42, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-014", name: "Ragi (5kg)", tamilName: "ராகி (5கிலோ)", mrp: 240, retailRate: 220, wholesaleRate: 205, category: categoryMap["Rice & Grains"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // Flours (500g & 1kg variants)
//       { productCode: "GRO-015", name: "Wheat Flour - Aashirvaad (500g)", tamilName: "கோதுமை மாவு (500கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Flours"], brand: brandMap["Aashirvaad"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-016", name: "Wheat Flour - Aashirvaad (1kg)", tamilName: "கோதுமை மாவு (1கிலோ)", mrp: 45, retailRate: 42, wholesaleRate: 39, category: categoryMap["Flours"], brand: brandMap["Aashirvaad"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-017", name: "Wheat Flour - Aashirvaad (5kg)", tamilName: "கோதுமை மாவு (5கிலோ)", mrp: 215, retailRate: 200, wholesaleRate: 190, category: categoryMap["Flours"], brand: brandMap["Aashirvaad"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-018", name: "Rice Flour (500g)", tamilName: "அரிசி மாவு (500கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-019", name: "Rice Flour (1kg)", tamilName: "அரிசி மாவு (1கிலோ)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-020", name: "Maida (500g)", tamilName: "மைதா மாவு (500கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-021", name: "Maida (1kg)", tamilName: "மைதா மாவு (1கிலோ)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Flours"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-022", name: "Besan - Gram Flour (500g)", tamilName: "கடலை மாவு (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Flours"], brand: brandMap["Taj"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-023", name: "Besan - Gram Flour (1kg)", tamilName: "கடலை மாவு (1கிலோ)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Flours"], brand: brandMap["Taj"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // Dals & Pulses (500g & 1kg variants)
//       { productCode: "GRO-024", name: "Toor Dal (500g)", tamilName: "துவரம் பருப்பு (500கிராம்)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-025", name: "Toor Dal (1kg)", tamilName: "துவரம் பருப்பு (1கிலோ)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-026", name: "Moong Dal (500g)", tamilName: "பாசிப் பருப்பு (500கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-027", name: "Moong Dal (1kg)", tamilName: "பாசிப் பருப்பு (1கிலோ)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-028", name: "Masoor Dal (500g)", tamilName: "மசூர் பருப்பு (500கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-029", name: "Masoor Dal (1kg)", tamilName: "மசூர் பருப்பு (1கிலோ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-030", name: "Urad Dal (500g)", tamilName: "உளுந்து (500கிராம்)", mrp: 55, retailRate: 50, wholesaleRate: 48, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-031", name: "Urad Dal (1kg)", tamilName: "உளுந்து (1கிலோ)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Dals & Pulses"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // Spices (50g, 100g, 200g variants)
//       { productCode: "GRO-032", name: "Turmeric Powder (50g)", tamilName: "மஞ்சள் தூள் (50கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-033", name: "Turmeric Powder (100g)", tamilName: "மஞ்சள் தூள் (100கிராம்)", mrp: 18, retailRate: 16, wholesaleRate: 15, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-034", name: "Turmeric Powder (200g)", tamilName: "மஞ்சள் தூள் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Spices"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-035", name: "Red Chilli Powder (50g)", tamilName: "மிளகாய் தூள் (50கிராம்)", mrp: 12, retailRate: 11, wholesaleRate: 10, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-036", name: "Red Chilli Powder (100g)", tamilName: "மிளகாய் தூள் (100கிராம்)", mrp: 22, retailRate: 20, wholesaleRate: 18, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-037", name: "Red Chilli Powder (200g)", tamilName: "மிளகாய் தூள் (200கிராம்)", mrp: 42, retailRate: 38, wholesaleRate: 36, category: categoryMap["Spices"], brand: brandMap["Aachi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-038", name: "Coriander Powder (100g)", tamilName: "தனியா தூள் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-039", name: "Coriander Powder (200g)", tamilName: "தனியா தூள் (200கிராம்)", mrp: 28, retailRate: 26, wholesaleRate: 24, category: categoryMap["Spices"], brand: brandMap["MDH"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-040", name: "Cumin Seeds (100g)", tamilName: "சீரகம் (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-041", name: "Cumin Seeds (200g)", tamilName: "சீரகம் (200கிராம்)", mrp: 48, retailRate: 45, wholesaleRate: 42, category: categoryMap["Spices"], brand: brandMap["Everest"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // Oil & Ghee (500ml, 1L, 2L variants)
//       { productCode: "GRO-042", name: "Sunflower Oil (500ml)", tamilName: "சூரியகாந்தி எண்ணெய் (500மிலி)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-043", name: "Sunflower Oil (1L)", tamilName: "சூரியகாந்தி எண்ணெய் (1லிட்டர்)", mrp: 120, retailRate: 115, wholesaleRate: 110, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-044", name: "Sunflower Oil (2L)", tamilName: "சூரியகாந்தி எண்ணெய் (2லிட்டர்)", mrp: 235, retailRate: 225, wholesaleRate: 215, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-045", name: "Sunflower Oil (5L)", tamilName: "சூரியகாந்தி எண்ணெய் (5லிட்டர்)", mrp: 580, retailRate: 560, wholesaleRate: 540, category: categoryMap["Oil & Ghee"], brand: brandMap["Fortune"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-046", name: "Groundnut Oil (500ml)", tamilName: "நிலக்கடலை எண்ணெய் (500மிலி)", mrp: 80, retailRate: 75, wholesaleRate: 72, category: categoryMap["Oil & Ghee"], brand: brandMap["Saffola"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-047", name: "Groundnut Oil (1L)", tamilName: "நிலக்கடலை எண்ணெய் (1லிட்டர்)", mrp: 150, retailRate: 145, wholesaleRate: 140, category: categoryMap["Oil & Ghee"], brand: brandMap["Saffola"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-048", name: "Coconut Oil (500ml)", tamilName: "தேங்காய் எண்ணெய் (500மிலி)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-049", name: "Coconut Oil (1L)", tamilName: "தேங்காய் எண்ணெய் (1லிட்டர்)", mrp: 180, retailRate: 170, wholesaleRate: 160, category: categoryMap["Oil & Ghee"], brand: brandMap["Local"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-050", name: "Ghee (500ml)", tamilName: "நெய் (500மிலி)", mrp: 240, retailRate: 230, wholesaleRate: 220, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-051", name: "Ghee (1L)", tamilName: "நெய் (1லிட்டர்)", mrp: 450, retailRate: 430, wholesaleRate: 400, category: categoryMap["Oil & Ghee"], brand: brandMap["Amul"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
      
//       // Snacks & Namkeen (50g, 100g, 200g variants)
//       { productCode: "GRO-052", name: "Mixture (100g)", tamilName: "மிக்சர் (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 16, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-053", name: "Mixture (200g)", tamilName: "மிக்சர் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-054", name: "Mixture (500g)", tamilName: "மிக்சர் (500கிராம்)", mrp: 85, retailRate: 80, wholesaleRate: 75, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Haldiram's"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-055", name: "Murukku (200g)", tamilName: "முறுக்கு (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-056", name: "Murukku (500g)", tamilName: "முறுக்கு (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-057", name: "Kara Sev (100g)", tamilName: "கார சேவ் (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Patanjali"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-058", name: "Kara Sev (200g)", tamilName: "கார சேவ் (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Snacks & Namkeen"], brand: brandMap["Patanjali"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // Biscuits & Cookies (Individual packs & Family packs)
//       { productCode: "GRO-059", name: "Parle-G (50g)", tamilName: "பார்லே-ஜி (50கிராம்)", mrp: 5, retailRate: 4, wholesaleRate: 3.5, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-060", name: "Parle-G (100g)", tamilName: "பார்லே-ஜி (100கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-061", name: "Parle-G (500g)", tamilName: "பார்லே-ஜி (500கிராம்)", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-062", name: "Marie Gold (100g)", tamilName: "மேரி கோல்ட் (100கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-063", name: "Marie Gold (250g)", tamilName: "மேரி கோல்ட் (250கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 31, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-064", name: "Good Day (75g)", tamilName: "குட் டே (75கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-065", name: "Good Day (150g)", tamilName: "குட் டே (150கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // Noodles & Pasta (Small & Large packs)
//       { productCode: "GRO-066", name: "Maggi Noodles (70g)", tamilName: "மக்கி நூடுல்ஸ் (70கிராம்)", mrp: 12, retailRate: 10, wholesaleRate: 9, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-067", name: "Maggi Noodles (140g)", tamilName: "மக்கி நூடுல்ஸ் (140கிராம்)", mrp: 24, retailRate: 22, wholesaleRate: 20, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-068", name: "Maggi Noodles (280g)", tamilName: "மக்கி நூடுல்ஸ் (280கிராம்)", mrp: 48, retailRate: 46, wholesaleRate: 44, category: categoryMap["Noodles & Pasta"], brand: brandMap["Maggi"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-069", name: "Yippee Noodles (70g)", tamilName: "யிப்பீ நூடுல்ஸ் (70கிராம்)", mrp: 10, retailRate: 9, wholesaleRate: 8, category: categoryMap["Noodles & Pasta"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-070", name: "Yippee Noodles (280g)", tamilName: "யிப்பீ நூடுல்ஸ் (280கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Noodles & Pasta"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // Sauces & Ketchup (Small & Large bottles)
//       { productCode: "GRO-071", name: "Tomato Ketchup (200g)", tamilName: "தக்காளி கெட்ச்அப் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Kissan"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-072", name: "Tomato Ketchup (500g)", tamilName: "தக்காளி கெட்ச்அப் (500கிராம்)", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Kissan"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-073", name: "Tomato Ketchup (1kg)", tamilName: "தக்காளி கெட்ச்அப் (1கிலோ)", mrp: 150, retailRate: 140, wholesaleRate: 135, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Kissan"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-074", name: "Red Chilli Sauce (200g)", tamilName: "சிவப்பு மிளகாய் சாஸ் (200கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Maggi"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-075", name: "Red Chilli Sauce (500g)", tamilName: "சிவப்பு மிளகாய் சாஸ் (500கிராம்)", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Sauces & Ketchup"], brand: brandMap["Maggi"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
      
//       // Tea & Coffee (Small & Large packs)
//       { productCode: "GRO-076", name: "Tea Dust (100g)", tamilName: "டீ தூசி (100கிராம்)", mrp: 25, retailRate: 23, wholesaleRate: 21, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-077", name: "Tea Dust (500g)", tamilName: "டீ தூசி (500கிராம்)", mrp: 110, retailRate: 105, wholesaleRate: 100, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-078", name: "Tea Dust (1kg)", tamilName: "டீ தூசி (1கிலோ)", mrp: 200, retailRate: 190, wholesaleRate: 180, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-079", name: "Coffee Powder (100g)", tamilName: "காபி பொடி (100கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-080", name: "Coffee Powder (250g)", tamilName: "காபி பொடி (250கிராம்)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-081", name: "Coffee Powder (500g)", tamilName: "காபி பொடி (500கிராம்)", mrp: 170, retailRate: 160, wholesaleRate: 150, category: categoryMap["Tea & Coffee"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // Masala & Mixes (Small & Family packs)
//       { productCode: "GRO-082", name: "Idly Podi (100g)", tamilName: "இட்லி பொடி (100கிராம்)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Masala & Mixes"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-083", name: "Idly Podi (200g)", tamilName: "இட்லி பொடி (200கிராம்)", mrp: 38, retailRate: 35, wholesaleRate: 33, category: categoryMap["Masala & Mixes"], brand: brandMap["Sakthi"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-084", name: "Sambar Mix (100g)", tamilName: "சாம்பார் மிக்ஸ் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Masala & Mixes"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-085", name: "Sambar Mix (200g)", tamilName: "சாம்பார் மிக்ஸ் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Masala & Mixes"], brand: brandMap["MTR"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-086", name: "Dosa Mix (500g)", tamilName: "தோசை மிக்ஸ் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-087", name: "Dosa Mix (1kg)", tamilName: "தோசை மிக்ஸ் (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-088", name: "Idli Mix (500g)", tamilName: "இட்லி மிக்ஸ் (500கிராம்)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-089", name: "Idli Mix (1kg)", tamilName: "இட்லி மிக்ஸ் (1கிலோ)", mrp: 75, retailRate: 70, wholesaleRate: 65, category: categoryMap["Masala & Mixes"], brand: brandMap["ID"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
      
//       // Beverages (Small, Medium, Large bottles)
//       { productCode: "GRO-090", name: "Coca-Cola (250ml)", tamilName: "கோகோ கோலா (250மிலி)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-091", name: "Coca-Cola (600ml)", tamilName: "கோகோ கோலா (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-092", name: "Coca-Cola (1.25L)", tamilName: "கோகோ கோலா (1.25லிட்டர்)", mrp: 70, retailRate: 65, wholesaleRate: 62, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-093", name: "Pepsi (250ml)", tamilName: "பெப்சி (250மிலி)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Beverages"], brand: brandMap["Pepsico"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-094", name: "Pepsi (600ml)", tamilName: "பெப்சி (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Pepsico"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-095", name: "Sprite (250ml)", tamilName: "ஸ்ப்ரைட் (250மிலி)", mrp: 20, retailRate: 18, wholesaleRate: 17, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-096", name: "Sprite (600ml)", tamilName: "ஸ்ப்ரைட் (600மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-097", name: "Maaza (250ml)", tamilName: "மாசா (250மிலி)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-098", name: "Maaza (600ml)", tamilName: "மாசா (600மிலி)", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Beverages"], brand: brandMap["Coca-Cola"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
      
//       // Dairy Products (500ml, 1L, 2L variants)
//       { productCode: "GRO-099", name: "Milk (500ml)", tamilName: "பால் (500மிலி)", mrp: 25, retailRate: 23, wholesaleRate: 22, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-100", name: "Milk (1L)", tamilName: "பால் (1லிட்டர்)", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-101", name: "Milk (2L)", tamilName: "பால் (2லிட்டர்)", mrp: 98, retailRate: 95, wholesaleRate: 90, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Liter"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-102", name: "Curd (200g)", tamilName: "தயிர் (200கிராம்)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-103", name: "Curd (500g)", tamilName: "தயிர் (500கிராம்)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-104", name: "Curd (1kg)", tamilName: "தயிர் (1கிலோ)", mrp: 68, retailRate: 65, wholesaleRate: 62, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-105", name: "Paneer (200g)", tamilName: "பன்னீர் (200கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-106", name: "Paneer (500g)", tamilName: "பன்னீர் (500கிராம்)", mrp: 135, retailRate: 130, wholesaleRate: 125, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-107", name: "Paneer (1kg)", tamilName: "பன்னீர் (1கிலோ)", mrp: 250, retailRate: 240, wholesaleRate: 230, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-108", name: "Butter (100g)", tamilName: "வெண்ணெய் (100கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-109", name: "Butter (500g)", tamilName: "வெண்ணெய் (500கிராம்)", mrp: 140, retailRate: 135, wholesaleRate: 130, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-110", name: "Cheese (200g)", tamilName: "சீஸ் (200கிராம்)", mrp: 60, retailRate: 55, wholesaleRate: 52, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-111", name: "Cheese (500g)", tamilName: "சீஸ் (500கிராம்)", mrp: 140, retailRate: 135, wholesaleRate: 130, category: categoryMap["Dairy Products"], brand: brandMap["Amul"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
      
//       // Household Items (Small, Medium, Large)
//       { productCode: "GRO-112", name: "Detergent Powder (500g)", tamilName: "சலவைத்தூள் (500கிராம்)", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Household Items"], brand: brandMap["Local"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-113", name: "Detergent Powder (1kg)", tamilName: "சலவைத்தூள் (1கிலோ)", mrp: 65, retailRate: 60, wholesaleRate: 57, category: categoryMap["Household Items"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-114", name: "Detergent Powder (2kg)", tamilName: "சலவைத்தூள் (2கிலோ)", mrp: 125, retailRate: 118, wholesaleRate: 112, category: categoryMap["Household Items"], brand: brandMap["Local"], uom: uomMap["Kg"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-115", name: "Liquid Soap (200ml)", tamilName: "திரவ சோப்பு (200மிலி)", mrp: 40, retailRate: 38, wholesaleRate: 36, category: categoryMap["Household Items"], brand: brandMap["Patanjali"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-116", name: "Liquid Soap (500ml)", tamilName: "திரவ சோப்பு (500மிலி)", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Household Items"], brand: brandMap["Patanjali"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-117", name: "Dishwash Bar (1 piece)", tamilName: "டிஷ்வாஷ் பார் (1 துண்டு)", mrp: 15, retailRate: 14, wholesaleRate: 13, category: categoryMap["Household Items"], brand: brandMap["Local"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-118", name: "Dishwash Bar (4 pack)", tamilName: "டிஷ்வாஷ் பார் (4 துண்டுகள்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Household Items"], brand: brandMap["Local"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
      
//       // Personal Care
//       { productCode: "GRO-119", name: "Soap (1 piece)", tamilName: "சோப் (1 துண்டு)", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Piece"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-120", name: "Soap (4 pack)", tamilName: "சோப் (4 துண்டுகள்)", mrp: 130, retailRate: 125, wholesaleRate: 118, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Pack"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-121", name: "Shampoo (100ml)", tamilName: "ஷாம்பூ (100மிலி)", mrp: 50, retailRate: 48, wholesaleRate: 46, category: categoryMap["Personal Care"], brand: brandMap["Patanjali"], uom: uomMap["Ml"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-122", name: "Shampoo (200ml)", tamilName: "ஷாம்பூ (200மிலி)", mrp: 95, retailRate: 90, wholesaleRate: 85, category: categoryMap["Personal Care"], brand: brandMap["Patanjali"], uom: uomMap["Bottle"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-123", name: "Toothpaste (50g)", tamilName: "டூத்பேஸ்ட் (50கிராம்)", mrp: 30, retailRate: 28, wholesaleRate: 26, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-124", name: "Toothpaste (100g)", tamilName: "டூத்பேஸ்ட் (100கிராம்)", mrp: 55, retailRate: 52, wholesaleRate: 50, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID },
//       { productCode: "GRO-125", name: "Toothpaste (200g)", tamilName: "டூத்பேஸ்ட் (200கிராம்)", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Personal Care"], brand: brandMap["Dabur"], uom: uomMap["Gram"], isActive: true, companyId: COMPANY_ID }
//     ];

//     await Product.insertMany(products);
//     console.log(`✅ ${products.length} products inserted`);

//     console.log('\n🎉 Grocery Database seeding completed successfully!');
//     console.log(`📊 Summary:`);
//     console.log(`   - Company ID: ${COMPANY_ID}`);
//     console.log(`   - Brands: ${brands.length}`);
//     console.log(`   - Categories: ${categories.length}`);
//     console.log(`   - UOMs: ${uoms.length}`);
//     console.log(`   - Products: ${products.length}`);
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding database:', error);
//     process.exit(1);
//   }
// };

// seedDatabase();