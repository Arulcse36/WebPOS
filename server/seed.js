// backend/seed.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const Brand = require('./models/Brand');
const Category = require('./models/Category');
const Uom = require('./models/Uom');
const Product = require('./models/Product');

const seedDatabase = async () => {
  try {

    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Uom.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // ==================== INSERT BRANDS ====================
    const brands = await Brand.insertMany([
      { name: "Perfect Breads", isActive: true },
      { name: "Fresh Bake", isActive: true },
      { name: "Daily Delight", isActive: true },
      { name: "Royal Bakery", isActive: true },
      { name: "Golden Crust", isActive: true },
      { name: "Britannia", isActive: true },
      { name: "Parle", isActive: true },
      { name: "Sunfeast", isActive: true },
      { name: "Mrs. Bector's", isActive: true },
      { name: "Local Bakery", isActive: true }
    ]);
    console.log(`✅ ${brands.length} brands inserted`);

    // ==================== INSERT CATEGORIES ====================
    const categories = await Category.insertMany([
      { name: "Bread", isActive: true },
      { name: "Biscuits & Cookies", isActive: true },
      { name: "Cakes", isActive: true },
      { name: "Pastries", isActive: true },
      { name: "Puffs & Savories", isActive: true },
      { name: "Buns & Rolls", isActive: true },
      { name: "Rusk & Toast", isActive: true },
      { name: "Muffins & Cupcakes", isActive: true },
      { name: "Donuts", isActive: true },
      { name: "Pizza Base", isActive: true },
      { name: "Sandwiches", isActive: true },
      { name: "Indian Breads", isActive: true }
    ]);
    console.log(`✅ ${categories.length} categories inserted`);

    // ==================== INSERT UOMs ====================
    const uoms = await Uom.insertMany([
      { name: "Piece", isActive: true },
      { name: "Pack", isActive: true },
      { name: "Kg", isActive: true },
      { name: "Gram", isActive: true },
      { name: "Dozen", isActive: true },
      { name: "Box", isActive: true },
      { name: "Loaf", isActive: true },
      { name: "Slice", isActive: true }
    ]);
    console.log(`✅ ${uoms.length} UOMs inserted`);

    // Create lookup maps
    const brandMap = {};
    brands.forEach(brand => { brandMap[brand.name] = brand._id; });

    const categoryMap = {};
    categories.forEach(category => { categoryMap[category.name] = category._id; });

    const uomMap = {};
    uoms.forEach(uom => { uomMap[uom.name] = uom._id; });

    // ==================== INSERT 100 PRODUCTS ====================
    const products = [
      // Breads (0010-0020)
      { productCode: "0001", name: "White Bread", tamilName: "வெள்ளை ரொட்டி", mrp: 35, retailRate: 33, wholesaleRate: 30, category: categoryMap["Bread"], brand: brandMap["Perfect Breads"], uom: uomMap["Loaf"], isActive: true },
      { productCode: "0002", name: "Brown Bread", tamilName: "பழுப்பு ரொட்டி", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Bread"], brand: brandMap["Fresh Bake"], uom: uomMap["Loaf"], isActive: true },
      { productCode: "0003", name: "Multigrain Bread", tamilName: "மல்டிகிரைன் ரொட்டி", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Bread"], brand: brandMap["Daily Delight"], uom: uomMap["Loaf"], isActive: true },
      { productCode: "0004", name: "Milk Bread", tamilName: "பால் ரொட்டி", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Bread"], brand: brandMap["Golden Crust"], uom: uomMap["Loaf"], isActive: true },
      { productCode: "0005", name: "Whole Wheat Bread", tamilName: "முழு கோதுமை ரொட்டி", mrp: 55, retailRate: 52, wholesaleRate: 48, category: categoryMap["Bread"], brand: brandMap["Perfect Breads"], uom: uomMap["Loaf"], isActive: true },
      { productCode: "0006", name: "Garlic Bread", tamilName: "பூண்டு ரொட்டி", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Bread"], brand: brandMap["Fresh Bake"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0007", name: "Baguette", tamilName: "பகெட்", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Bread"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0008", name: "Croissant", tamilName: "குராசண்ட்", mrp: 45, retailRate: 40, wholesaleRate: 35, category: categoryMap["Bread"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0009", name: "French Bread", tamilName: "பிரஞ்சு ரொட்டி", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Bread"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0010", name: "Rye Bread", tamilName: "ரை ரொட்டி", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Bread"], brand: brandMap["Daily Delight"], uom: uomMap["Loaf"], isActive: true },
      
      // Biscuits & Cookies (0011-0025)
      { productCode: "0011", name: "Butter Cookies", tamilName: "வெண்ணெய் குக்கீஸ்", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0012", name: "Oatmeal Cookies", tamilName: "ஓட்ஸ் குக்கீஸ்", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0013", name: "Choco Chip Cookies", tamilName: "சாக்லேட் சிப் குக்கீஸ்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0014", name: "Marie Biscuit", tamilName: "மேரி பிஸ்கட்", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0015", name: "Cream Biscuit", tamilName: "கிரீம் பிஸ்கட்", mrp: 25, retailRate: 23, wholesaleRate: 20, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0016", name: "Digestive Biscuit", tamilName: "டைஜெஸ்டிவ் பிஸ்கட்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0017", name: "Shortbread Cookies", tamilName: "ஷார்ட்பிரெட் குக்கீஸ்", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0018", name: "Ginger Biscuit", tamilName: "இஞ்சி பிஸ்கட்", mrp: 25, retailRate: 23, wholesaleRate: 20, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0019", name: "Coconut Cookies", tamilName: "தேங்காய் குக்கீஸ்", mrp: 65, retailRate: 60, wholesaleRate: 55, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0020", name: "Almond Cookies", tamilName: "பாதாம் குக்கீஸ்", mrp: 120, retailRate: 110, wholesaleRate: 100, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0021", name: "Cashew Cookies", tamilName: "முந்திரி குக்கீஸ்", mrp: 130, retailRate: 120, wholesaleRate: 110, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0022", name: "Pista Cookies", tamilName: "பிஸ்தா குக்கீஸ்", mrp: 140, retailRate: 130, wholesaleRate: 120, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0023", name: "Chocolate Cream Biscuit", tamilName: "சாக்லேட் கிரீம் பிஸ்கட்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0024", name: "Vanilla Cream Biscuit", tamilName: "வெனிலா கிரீம் பிஸ்கட்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0025", name: "Orange Cookies", tamilName: "ஆரஞ்சு குக்கீஸ்", mrp: 55, retailRate: 50, wholesaleRate: 45, category: categoryMap["Biscuits & Cookies"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      
      // Cakes (0026-0040)
      { productCode: "0026", name: "Chocolate Cake", tamilName: "சாக்லேட் கேக்", mrp: 250, retailRate: 240, wholesaleRate: 220, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0027", name: "Vanilla Cake", tamilName: "வெண்ணிலா கேக்", mrp: 220, retailRate: 210, wholesaleRate: 200, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0028", name: "Black Forest Cake", tamilName: "பிளாக் ஃபாரஸ்ட் கேக்", mrp: 350, retailRate: 330, wholesaleRate: 300, category: categoryMap["Cakes"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0029", name: "Butterscotch Cake", tamilName: "பட்டர்ஸ்காட்ச் கேக்", mrp: 320, retailRate: 300, wholesaleRate: 280, category: categoryMap["Cakes"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0030", name: "Red Velvet Cake", tamilName: "ரெட் வெல்வெட் கேக்", mrp: 400, retailRate: 380, wholesaleRate: 350, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0031", name: "Pineapple Cake", tamilName: "அன்னாசி கேக்", mrp: 280, retailRate: 260, wholesaleRate: 240, category: categoryMap["Cakes"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0032", name: "Strawberry Cake", tamilName: "ஸ்ட்ராபெர்ரி கேக்", mrp: 300, retailRate: 280, wholesaleRate: 260, category: categoryMap["Cakes"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0033", name: "Mango Cake", tamilName: "மாம்பழ கேக்", mrp: 280, retailRate: 260, wholesaleRate: 240, category: categoryMap["Cakes"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0034", name: "Lemon Cake", tamilName: "எலுமிச்சை கேக்", mrp: 250, retailRate: 230, wholesaleRate: 210, category: categoryMap["Cakes"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0035", name: "Carrot Cake", tamilName: "கேரட் கேக்", mrp: 270, retailRate: 250, wholesaleRate: 230, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0036", name: "Cheese Cake", tamilName: "சீஸ் கேக்", mrp: 450, retailRate: 420, wholesaleRate: 400, category: categoryMap["Cakes"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0037", name: "Chocolate Truffle Cake", tamilName: "சாக்லேட் ட்ரஃபிள் கேக்", mrp: 500, retailRate: 480, wholesaleRate: 450, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0038", name: "Fruit Cake", tamilName: "பழ கேக்", mrp: 320, retailRate: 300, wholesaleRate: 280, category: categoryMap["Cakes"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0039", name: "Walnut Cake", tamilName: "வால்நட் கேக்", mrp: 380, retailRate: 360, wholesaleRate: 340, category: categoryMap["Cakes"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0040", name: "Coffee Cake", tamilName: "காபி கேக்", mrp: 290, retailRate: 270, wholesaleRate: 250, category: categoryMap["Cakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      
      // Pastries (0041-0050)
      { productCode: "0041", name: "Chocolate Pastry", tamilName: "சாக்லேட் பேஸ்ட்ரி", mrp: 45, retailRate: 40, wholesaleRate: 35, category: categoryMap["Pastries"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0042", name: "Pineapple Pastry", tamilName: "அன்னாசி பேஸ்ட்ரி", mrp: 45, retailRate: 40, wholesaleRate: 35, category: categoryMap["Pastries"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0043", name: "Strawberry Pastry", tamilName: "ஸ்ட்ராபெர்ரி பேஸ்ட்ரி", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Pastries"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0044", name: "Black Forest Pastry", tamilName: "பிளாக் ஃபாரஸ்ட் பேஸ்ட்ரி", mrp: 55, retailRate: 50, wholesaleRate: 45, category: categoryMap["Pastries"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0045", name: "Butterscotch Pastry", tamilName: "பட்டர்ஸ்காட்ச் பேஸ்ட்ரி", mrp: 55, retailRate: 50, wholesaleRate: 45, category: categoryMap["Pastries"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0046", name: "Red Velvet Pastry", tamilName: "ரெட் வெல்வெட் பேஸ்ட்ரி", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Pastries"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0047", name: "Mango Pastry", tamilName: "மாம்பழ பேஸ்ட்ரி", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Pastries"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0048", name: "Vanilla Pastry", tamilName: "வெனிலா பேஸ்ட்ரி", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Pastries"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0049", name: "Lemon Pastry", tamilName: "எலுமிச்சை பேஸ்ட்ரி", mrp: 45, retailRate: 40, wholesaleRate: 35, category: categoryMap["Pastries"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0050", name: "Coffee Pastry", tamilName: "காபி பேஸ்ட்ரி", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Pastries"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      
      // Puffs & Savories (0051-0060)
      { productCode: "0051", name: "Veg Puff", tamilName: "வெஜ் பஃப்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Puffs & Savories"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0052", name: "Chicken Puff", tamilName: "சிக்கன் பஃப்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Puffs & Savories"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0053", name: "Egg Puff", tamilName: "முட்டை பஃப்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Puffs & Savories"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0054", name: "Samosa", tamilName: "சமோசா", mrp: 15, retailRate: 12, wholesaleRate: 10, category: categoryMap["Puffs & Savories"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0055", name: "Paneer Puff", tamilName: "பன்னீர் பஃப்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Puffs & Savories"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0056", name: "Mushroom Puff", tamilName: "காளான் பஃப்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Puffs & Savories"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0057", name: "Corn Puff", tamilName: "சோள பஃப்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Puffs & Savories"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0058", name: "Kachori", tamilName: "கச்சோரி", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Puffs & Savories"], brand: brandMap["Local Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0059", name: "Cutlet", tamilName: "கட்லெட்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Puffs & Savories"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0060", name: "Spring Roll", tamilName: "ஸ்பிரிங் ரோல்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Puffs & Savories"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      
      // Buns & Rolls (0061-0070)
      { productCode: "0061", name: "Dinner Roll", tamilName: "டின்னர் ரோல்", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Buns & Rolls"], brand: brandMap["Perfect Breads"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0062", name: "Sweet Bun", tamilName: "ஸ்வீட் பன்", mrp: 15, retailRate: 13, wholesaleRate: 10, category: categoryMap["Buns & Rolls"], brand: brandMap["Perfect Breads"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0063", name: "Burger Bun", tamilName: "பர்கர் பன்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Buns & Rolls"], brand: brandMap["Fresh Bake"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0064", name: "Hot Dog Roll", tamilName: "ஹாட் டாக் ரோல்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Buns & Rolls"], brand: brandMap["Golden Crust"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0065", name: "Pav Bun", tamilName: "பாவ் பன்", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Buns & Rolls"], brand: brandMap["Daily Delight"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0066", name: "Masala Bun", tamilName: "மசாலா பன்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Buns & Rolls"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0067", name: "Cheese Bun", tamilName: "சீஸ் பன்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Buns & Rolls"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0068", name: "Garlic Bun", tamilName: "பூண்டு பன்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Buns & Rolls"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0069", name: "Cinnamon Roll", tamilName: "இலவங்கப்பட்டை ரோல்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Buns & Rolls"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0070", name: "Chocolate Roll", tamilName: "சாக்லேட் ரோல்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Buns & Rolls"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      
      // Rusk & Toast (0071-0075)
      { productCode: "0071", name: "Rusk", tamilName: "ரஸ்க்", mrp: 30, retailRate: 28, wholesaleRate: 25, category: categoryMap["Rusk & Toast"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0072", name: "Sweet Rusk", tamilName: "ஸ்வீட் ரஸ்க்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Rusk & Toast"], brand: brandMap["Parle"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0073", name: "Jeera Rusk", tamilName: "ஜீரா ரஸ்க்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Rusk & Toast"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0074", name: "Bread Toast", tamilName: "பிரெட் டோஸ்ட்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Rusk & Toast"], brand: brandMap["Sunfeast"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0075", name: "Garlic Toast", tamilName: "பூண்டு டோஸ்ட்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Rusk & Toast"], brand: brandMap["Britannia"], uom: uomMap["Pack"], isActive: true },
      
      // Muffins & Cupcakes (0076-0082)
      { productCode: "0076", name: "Chocolate Muffin", tamilName: "சாக்லேட் மஃபின்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0077", name: "Blueberry Muffin", tamilName: "புளுபெர்ரி மஃபின்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0078", name: "Vanilla Cupcake", tamilName: "வெனிலா கப்கேக்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0079", name: "Chocolate Cupcake", tamilName: "சாக்லேட் கப்கேக்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0080", name: "Strawberry Muffin", tamilName: "ஸ்ட்ராபெர்ரி மஃபின்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0081", name: "Banana Muffin", tamilName: "வாழைப்பழ மஃபின்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0082", name: "Red Velvet Cupcake", tamilName: "ரெட் வெல்வெட் கப்கேக்", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Muffins & Cupcakes"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      
      // Donuts (0083-0088)
      { productCode: "0083", name: "Glazed Donut", tamilName: "கிளேஸ்ட் டோனட்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Donuts"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0084", name: "Chocolate Donut", tamilName: "சாக்லேட் டோனட்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Donuts"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0085", name: "Strawberry Donut", tamilName: "ஸ்ட்ராபெர்ரி டோனட்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Donuts"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0086", name: "Sugar Donut", tamilName: "சர்க்கரை டோனட்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Donuts"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0087", name: "Cinnamon Donut", tamilName: "இலவங்கப்பட்டை டோனட்", mrp: 45, retailRate: 42, wholesaleRate: 40, category: categoryMap["Donuts"], brand: brandMap["Royal Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0088", name: "Jelly Donut", tamilName: "ஜெல்லி டோனட்", mrp: 50, retailRate: 48, wholesaleRate: 45, category: categoryMap["Donuts"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      
      // Pizza Base (0089-0092)
      { productCode: "0089", name: "Pizza Base - Small", tamilName: "பீஸ்ஸா பேஸ் - சிறியது", mrp: 60, retailRate: 55, wholesaleRate: 50, category: categoryMap["Pizza Base"], brand: brandMap["Perfect Breads"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0090", name: "Pizza Base - Medium", tamilName: "பீஸ்ஸா பேஸ் - மீடியம்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Pizza Base"], brand: brandMap["Golden Crust"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0091", name: "Pizza Base - Large", tamilName: "பீஸ்ஸா பேஸ் - பெரியது", mrp: 100, retailRate: 95, wholesaleRate: 90, category: categoryMap["Pizza Base"], brand: brandMap["Fresh Bake"], uom: uomMap["Pack"], isActive: true },
      { productCode: "0092", name: "Whole Wheat Pizza Base", tamilName: "முழு கோதுமை பீஸ்ஸா பேஸ்", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Pizza Base"], brand: brandMap["Daily Delight"], uom: uomMap["Pack"], isActive: true },
      
      // Sandwiches (0093-0096)
      { productCode: "0093", name: "Veg Sandwich", tamilName: "வெஜ் சாண்ட்விச்", mrp: 50, retailRate: 45, wholesaleRate: 40, category: categoryMap["Sandwiches"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0094", name: "Grilled Sandwich", tamilName: "கிரில்ல்ட் சாண்ட்விச்", mrp: 70, retailRate: 65, wholesaleRate: 60, category: categoryMap["Sandwiches"], brand: brandMap["Golden Crust"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0095", name: "Club Sandwich", tamilName: "கிளப் சாண்ட்விச்", mrp: 90, retailRate: 85, wholesaleRate: 80, category: categoryMap["Sandwiches"], brand: brandMap["Daily Delight"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0096", name: "Chicken Sandwich", tamilName: "சிக்கன் சாண்ட்விச்", mrp: 80, retailRate: 75, wholesaleRate: 70, category: categoryMap["Sandwiches"], brand: brandMap["Fresh Bake"], uom: uomMap["Piece"], isActive: true },
      
      // Indian Breads (0097-0100)
      { productCode: "0097", name: "Naan", tamilName: "நான்", mrp: 25, retailRate: 22, wholesaleRate: 20, category: categoryMap["Indian Breads"], brand: brandMap["Local Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0098", name: "Butter Naan", tamilName: "பட்டர் நான்", mrp: 35, retailRate: 32, wholesaleRate: 30, category: categoryMap["Indian Breads"], brand: brandMap["Local Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0099", name: "Garlic Naan", tamilName: "பூண்டு நான்", mrp: 40, retailRate: 38, wholesaleRate: 35, category: categoryMap["Indian Breads"], brand: brandMap["Local Bakery"], uom: uomMap["Piece"], isActive: true },
      { productCode: "0100", name: "Tandoori Roti", tamilName: "தந்தூரி ரொட்டி", mrp: 20, retailRate: 18, wholesaleRate: 15, category: categoryMap["Indian Breads"], brand: brandMap["Local Bakery"], uom: uomMap["Piece"], isActive: true }
    ];

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products inserted`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Brands: ${brands.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - UOMs: ${uoms.length}`);
    console.log(`   - Products: ${products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();