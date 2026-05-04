// // backend/seedUOMs.js (Alternative version using insertMany)
// const mongoose = require('mongoose');
// require('dotenv').config();

// const Uom = require('./models/Uom');

// const seedUOMs = async () => {
//   try {
//     const MONGODB_URI = process.env.MONGO_URI;
//     await mongoose.connect(MONGODB_URI);
//     console.log('✅ Connected to MongoDB');

//     const uoms = [
//         { name: "Piece", isActive: true },
//             { name: "Pack", isActive: true },
//             { name: "Kg", isActive: true },
//             { name: "Gram", isActive: true },
//             { name: "Liter", isActive: true },
//             { name: "Ml", isActive: true },
//             { name: "Dozen", isActive: true },
//             { name: "Box", isActive: true },
//             { name: "Bottle", isActive: true },
//             { name: "Packet", isActive: true },
//             { name: "Bag", isActive: true },
//                         { name: "Test", isActive: true },
//             { name: "Tin", isActive: true }
//     ];

 

//     // Check which UOMs already exist
//     const existingUOMs = await Uom.find({ name: { $in: uoms.map(u => u.name) } });
//     const existingNames = existingUOMs.map(u => u.name);
    
//     const newUOMs = uoms.filter(u => !existingNames.includes(u.name));

//     if (newUOMs.length > 0) {
//       await Uom.insertMany(newUOMs);
//       console.log(`✅ Inserted ${newUOMs.length} new UOMs:`);
//       newUOMs.forEach(uom => console.log(`   - ${uom.name}`));
//     } else {
//       console.log('⚠️  All UOMs already exist in database');
//     }

//     if (existingUOMs.length > 0) {
//       console.log(`\n📋 Existing UOMs (${existingUOMs.length}):`);
//       existingUOMs.forEach(uom => console.log(`   - ${uom.name}`));
//     }

//     console.log('\n🎉 UOM seeding completed successfully!');
//     console.log(`📊 Total UOMs in database: ${await Uom.countDocuments()}`);
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding UOMs:', error);
//     process.exit(1);
//   }
// };

// seedUOMs();