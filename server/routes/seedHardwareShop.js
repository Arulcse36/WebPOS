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