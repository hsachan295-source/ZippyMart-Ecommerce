import bcrypt from 'bcryptjs';
import { DB, saveLocalDb } from '../config/db.js';

export const runSeed = async () => {
  try {
    const existingProducts = await DB.Products.find();
    // If database already contains a scaled catalog of 500+ items, skip seeding
    if (existingProducts.length > 500) {
      console.log('Database already populated with scaled 500+ catalog. Skipping seeding.');
      return;
    }

    console.log('Scaling database catalog up to 530+ ZippyMart products across 10 Blinkit/Amazon departments...');

    // Clear old data
    await DB.Products.deleteMany({});
    await DB.Categories.deleteMany({});
    await DB.Reviews.deleteMany({});
    await DB.Orders.deleteMany({});

    // 1. Seed 10 Detailed Categories
    const categories = [
      { name: 'Fruits', image: 'https://images.unsplash.com/photo-1610832958506-ee56336191d1?w=500&auto=format&fit=crop&q=60' },
      { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=60' },
      { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60' },
      { name: 'Laptops', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60' },
      { name: 'Household', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60' },
      { name: 'Personal Care', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60' },
      { name: 'Snacks', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60' },
      { name: 'Beverages', image: 'https://images.unsplash.com/photo-1548965518-d15d2491a5ef?w=500&auto=format&fit=crop&q=60' }
    ];

    for (const cat of categories) {
      await DB.Categories.create(cat);
    }

    // 2. Seed Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const users = [
      { _id: 'usr_admin', name: 'ZippyMart Manager', email: 'admin@grocery.com', password: adminPassword, role: 'admin' },
      { _id: 'usr_premium', name: 'Aarav Sharma', email: 'user@grocery.com', password: userPassword, role: 'user', preferences: { categories: ['Fruits', 'Electronics'], dietary: 'organic' } },
      { _id: 'usr_budget', name: 'Sneha Patel', email: 'sneha@grocery.com', password: userPassword, role: 'user' }
    ];

    for (const usr of users) {
      await DB.Users.create(usr);
    }

    // 3. Define Product Data Templates
    const baseFruits = [
      { name: 'Apple', basePrice: 120, unit: '1 kg', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Crisp and sweet fresh apples sourced from high-altitude orchards.' },
      { name: 'Banana', basePrice: 50, unit: '1 Dozen', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Ripe, sweet Robusta bananas loaded with energy.' },
      { name: 'Mango', basePrice: 200, unit: '1 kg', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=60', brand: 'KingFruits', desc: 'Sweet, pulpy premium mangoes plucked at optimal ripeness.' },
      { name: 'Orange', basePrice: 90, unit: '1 kg', img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=60', brand: 'CitrusGrove', desc: 'Juicy, rich in Vitamin C sweet Nagpur oranges.' },
      { name: 'Grapes', basePrice: 100, unit: '500 g', img: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Sweet, seedless fresh organic green grapes.' },
      { name: 'Watermelon', basePrice: 70, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Refreshing and sweet hydrating large watermelon.' },
      { name: 'Papaya', basePrice: 60, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Ripe, sweet yellow flesh papaya loaded with vitamins.' },
      { name: 'Pineapple', basePrice: 80, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=60', brand: 'KingFruits', desc: 'Tangy and sweet ripe tropical pineapple.' },
      { name: 'Guava', basePrice: 70, unit: '1 kg', img: 'https://images.unsplash.com/photo-1534080391025-a7f0e676507c?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Crisp green guavas with delicious pink flesh.' },
      { name: 'Kiwi', basePrice: 120, unit: '3 Pcs', img: 'https://images.unsplash.com/photo-1585821943808-416cbd880887?w=500&auto=format&fit=crop&q=60', brand: 'CitrusGrove', desc: 'Imported fresh vitamin-dense fuzzy green kiwi.' },
      { name: 'Dragon Fruit', basePrice: 150, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1527324688151-0e627063f291?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Exotic pink skin, white-flesh dragon fruit.' },
      { name: 'Pear', basePrice: 130, unit: '1 kg', img: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Sweet, juicy, and finely textured fresh pears.' },
      { name: 'Peach', basePrice: 140, unit: '500 g', img: 'https://images.unsplash.com/photo-1595124224245-56225a958017?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Aromatic, soft, and pulpy fresh local peaches.' },
      { name: 'Plum', basePrice: 110, unit: '500 g', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Sweet and sour fresh juicy dark plums.' },
      { name: 'Lychee', basePrice: 160, unit: '500 g', img: 'https://images.unsplash.com/photo-1628253909787-8d098e98031d?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Exotic, sweet, and highly juicy fresh lychees.' },
      { name: 'Muskmelon', basePrice: 80, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Highly aromatic and sweet orange muskmelon.' },
      { name: 'Coconut', basePrice: 50, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1584008741698-e575e985871f?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Fresh tender green coconut loaded with water.' },
      { name: 'Strawberry', basePrice: 90, unit: '200 g', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Farm-fresh bright red sweet and tart strawberries.' },
      { name: 'Blueberry', basePrice: 180, unit: '125 g', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Antioxidant-rich organic premium fresh blueberries.' },
      { name: 'Blackberry', basePrice: 190, unit: '125 g', img: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Juicy, plump fresh dark blackberries.' },
      { name: 'Cherry', basePrice: 200, unit: '250 g', img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=60', brand: 'KingFruits', desc: 'Premium deep red sweet whole cherries.' },
      { name: 'Avocado', basePrice: 150, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=60', brand: 'CitrusGrove', desc: 'Buttery, rich imported premium Haas avocados.' },
      { name: 'Fig', basePrice: 110, unit: '250 g', img: 'https://images.unsplash.com/photo-1629986348633-e7f09f0f9c2d?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Soft, sweet, and highly nutritious organic figs.' },
      { name: 'Dates', basePrice: 160, unit: '500 g', img: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&auto=format&fit=crop&q=60', brand: 'KingFruits', desc: 'Premium naturally sweet Arabian Medjool dates.' },
      { name: 'Pomegranate', basePrice: 140, unit: '1 kg', img: 'https://images.unsplash.com/photo-1531169509526-f8f1fdaa4a67?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Juicy ruby red arils, rich in nutrients.' }
    ];

    const baseVegetables = [
      { name: 'Potato', basePrice: 30, unit: '1 kg', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Fresh brown soil local potatoes.' },
      { name: 'Onion', basePrice: 35, unit: '1 kg', img: 'https://images.unsplash.com/photo-1508747705-3df207a84bce?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Pungent, high-quality red skin fresh onions.' },
      { name: 'Tomato', basePrice: 40, unit: '1 kg', img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Firm, greenhouse-grown fresh red tomatoes.' },
      { name: 'Carrot', basePrice: 50, unit: '500 g', img: 'https://images.unsplash.com/photo-1598170845058-32b996a6bd37?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Sweet, crunchy orange carrots.' },
      { name: 'Cabbage', basePrice: 30, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1581447100595-37ffde690d63?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Crisp, fresh green cabbage heads.' },
      { name: 'Cauliflower', basePrice: 40, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ec3?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Farm-fresh, white cauliflower florets.' },
      { name: 'Spinach', basePrice: 20, unit: '250 g', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Green, leafy, iron-rich fresh spinach.' },
      { name: 'Broccoli', basePrice: 80, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Premium, high-fiber fresh green broccoli.' },
      { name: 'Capsicum', basePrice: 45, unit: '250 g', img: 'https://images.unsplash.com/photo-1563565312-82c2179b92e2?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Crisp green bell peppers (capsicum).' },
      { name: 'Beetroot', basePrice: 35, unit: '500 g', img: 'https://images.unsplash.com/photo-1585821943808-416cbd880887?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Deep red, sweet and nutritious beetroots.' },
      { name: 'Radish', basePrice: 30, unit: '500 g', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Crisp, peppery fresh white radishes.' },
      { name: 'Brinjal', basePrice: 35, unit: '500 g', img: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Glossy purple skin eggplants (brinjals).' },
      { name: 'Lady Finger', basePrice: 30, unit: '250 g', img: 'https://images.unsplash.com/photo-1627464016628-98e3b7b25114?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Tender, fresh green lady finger okra.' },
      { name: 'Green Peas', basePrice: 50, unit: '250 g', img: 'https://images.unsplash.com/photo-1587570220970-e64e591cf843?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Sweet, freshly shelled local green peas.' },
      { name: 'Sweet Corn', basePrice: 40, unit: '2 Pcs', img: 'https://images.unsplash.com/photo-1470116840605-69f4c3a23d2c?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Golden sweet corn cobs, perfect for boiling.' },
      { name: 'Pumpkin', basePrice: 45, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Sweet, ripe yellow-orange slicing pumpkin.' },
      { name: 'Bottle Gourd', basePrice: 30, unit: '1 Piece', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Cool, light and highly digestible bottle gourd.' },
      { name: 'Bitter Gourd', basePrice: 35, unit: '250 g', img: 'https://images.unsplash.com/photo-1622484211148-71649989fbff?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Fresh green bitter gourd (karela).' },
      { name: 'Turnip', basePrice: 40, unit: '500 g', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Mild and sweet white turnips.' },
      { name: 'Sweet Potato', basePrice: 40, unit: '500 g', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'High-nutrient, sweet baking potatoes.' },
      { name: 'Garlic', basePrice: 60, unit: '100 g', img: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Aromatic, highly pungent garlic bulbs.' },
      { name: 'Ginger', basePrice: 40, unit: '100 g', img: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=60', brand: 'FreshPick', desc: 'Spicy, warming fresh ginger roots.' },
      { name: 'Green Chilli', basePrice: 20, unit: '100 g', img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=60', brand: 'VeggieCart', desc: 'Hot, spicy, and perfectly fresh green chillies.' },
      { name: 'Lemon', basePrice: 30, unit: '4 Pcs', img: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=500&auto=format&fit=crop&q=60', brand: 'CitrusGrove', desc: 'High-juice, tangy yellow farm lemons.' },
      { name: 'Coriander', basePrice: 15, unit: '100 g', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60', brand: 'BioFarm', desc: 'Fresh, highly fragrant green coriander leaves.' }
    ];

    const laptopsList = [
      { name: 'HP Pavilion 15 Core i5', price: 54990, brand: 'HP', desc: 'Slim everyday laptop with Intel i5, 16GB RAM, 512GB SSD.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'HP Spectre x360 Convertible', price: 124990, brand: 'HP', desc: 'Ultra-premium 2-in-1 touchscreen laptop, Intel i7 OLED.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'HP Victus Gaming Ryzen 5', price: 62990, brand: 'HP', desc: 'Immersive gaming laptop with Ryzen 5, GTX 1650, 144Hz.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell Inspiron 14 Core i3', price: 38990, brand: 'Dell', desc: 'Affordable, compact laptop for students and office tasks.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell XPS 13 Thin & Light', price: 139990, brand: 'Dell', desc: 'Beautiful infinity-edge display, Intel Evo i7, carbon fiber.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell G15 Ryzen 7 Gaming', price: 84990, brand: 'Dell', desc: 'Heavy duty gaming laptop with RTX 3050 Ti, 16GB RAM.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'Lenovo IdeaPad Slim 3', price: 44990, brand: 'Lenovo', desc: 'Lightweight everyday notebook with AMD Ryzen 5, 8GB RAM.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'Lenovo ThinkPad E14 Pro', price: 74990, brand: 'Lenovo', desc: 'Enterprise rugged business laptop with robust keyboard.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'Lenovo Legion 5 Gaming i7', price: 109990, brand: 'Lenovo', desc: 'Elite gaming hardware with Core i7, RTX 4060, dual fans.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'ASUS Vivobook 15 Ryzen 5', price: 41990, brand: 'ASUS', desc: 'Vibrant nanoedge display, Ryzen 5 processor, ergonomic.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'ASUS Zenbook S 13 OLED', price: 99990, brand: 'ASUS', desc: 'Featherlight 1kg laptop, stunning 2.8K HDR OLED screen.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'ASUS ROG Zephyrus G14', price: 129990, brand: 'ASUS', desc: 'Top tier ultraportable gaming machine, Ryzen 9, RTX 4070.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'Acer Aspire 5 Slim', price: 35990, brand: 'Acer', desc: 'Thin metal chassis, Intel i3 processor, upgradable storage.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'Acer Swift Go 14 OLED', price: 69990, brand: 'Acer', desc: 'Vibrant OLED display with Intel Core Ultra 5 AI capability.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'Acer Predator Helios Neo', price: 114990, brand: 'Acer', desc: 'Uncompromised gaming, liquid metal cooling, RTX 4060.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'MSI Modern 14 Thin', price: 37990, brand: 'MSI', desc: 'Ultra-slim stylish laptop, military-grade durable chassis.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'MSI Cyborg 15 Gaming i7', price: 79990, brand: 'MSI', desc: 'Translucent design theme, Core i7, RTX 4050, mechanical feel.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'MSI Katana 17 Premium', price: 134990, brand: 'MSI', desc: '17-inch massive gaming screen, Core i9, RTX 4070 beast.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy Book4 i5', price: 68990, brand: 'Samsung', desc: 'Premium metal body, dynamic AMOLED screen, Galaxy ecosystem.', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy Book4 Pro 360', price: 154990, brand: 'Samsung', desc: 'Premium convertible 2-in-1 with S-pen stylus, Intel Core Ultra 7.', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple MacBook Air M2 256GB', price: 89900, brand: 'Apple', desc: 'Supercharged M2 chip, silent fanless design, up to 18hr battery.', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple MacBook Air M3 512GB', price: 119900, brand: 'Apple', desc: 'All-new M3 chip with support for dual external displays.', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple MacBook Pro M3 Pro', price: 199900, brand: 'Apple', desc: 'Liquid Retina XDR screen, M3 Pro chip, space black finish.', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple MacBook Pro M3 Max', price: 349900, brand: 'Apple', desc: 'Ultimate workstation beast with M3 Max 16-Core CPU, 40-Core GPU.', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      { name: 'ASUS TUF Gaming F15', price: 58990, brand: 'ASUS', desc: 'Standard entry-level gaming laptop, Core i5, GTX 1650.', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60' }
    ];

    const smartphonesList = [
      { name: 'Samsung Galaxy A35 5G', price: 27990, brand: 'Samsung', desc: 'Crisp 120Hz Super AMOLED screen, 50MP triple camera setup.', img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy S24 Plus 5G', price: 99990, brand: 'Samsung', desc: 'Flagship Dynamic AMOLED, Galaxy AI features, high performance.', img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy S24 Ultra 5G', price: 129990, brand: 'Samsung', desc: 'Ultimate device with titanium frame, S-Pen, 200MP sensor.', img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple iPhone 13 128GB', price: 49900, brand: 'Apple', desc: 'Dual camera, A15 Bionic chip, ceramic shield screen.', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple iPhone 15 128GB', price: 79900, brand: 'Apple', desc: 'Dynamic Island interactive notch, 48MP main camera sensor.', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple iPhone 15 Pro Max 256GB', price: 159900, brand: 'Apple', desc: 'Aerospace titanium body, 5x telephoto camera, A17 Pro SoC.', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60' },
      { name: 'Redmi 13C 5G', price: 10490, brand: 'Xiaomi', desc: 'Affordable 5G device, 90Hz refresh rate, 5000mAh battery.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Xiaomi Redmi Note 13 Pro 5G', price: 25990, brand: 'Xiaomi', desc: 'Stunning 1.5K AMOLED display, 200MP camera with OIS.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Xiaomi 14 Ultra 5G', price: 99990, brand: 'Xiaomi', desc: 'Leica co-engineered quad camera, 1-inch sensor, Snapdragon 8 Gen 3.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Vivo T3x 5G Lite', price: 13490, brand: 'Vivo', desc: 'Slim body, fast processor, 6000mAh monster battery life.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Vivo V30 Pro 5G', price: 41990, brand: 'Vivo', desc: 'Zeiss portrait optical system, super slim profile.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Vivo X100 Pro Premium', price: 89990, brand: 'Vivo', desc: 'Zeiss APO telephoto camera, flagship Dimensity 9300 processor.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Oppo A59 5G', price: 13990, brand: 'Oppo', desc: 'Elegant design, fast charging, daily reliability.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Oppo Reno 11 Pro 5G', price: 37990, brand: 'Oppo', desc: 'Camera expert with 32MP telephoto portrait lens, curved screen.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Oppo Find N3 Flip Foldable', price: 94990, brand: 'Oppo', desc: 'Premium vertical flip foldable, Hasselblad camera integrations.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Realme C65 5G', price: 11490, brand: 'Realme', desc: 'Super thin chassis, smooth 120Hz display, fast CPU.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Realme 12 Pro Plus 5G', price: 29990, brand: 'Realme', desc: 'Submarine-style design with periscope portrait lens, vegan leather.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Realme GT 6T 5G', price: 30990, brand: 'Realme', desc: 'High performance gaming device, Snapdragon 7+ Gen 3 chip.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'OnePlus Nord CE4 Lite', price: 19990, brand: 'OnePlus', desc: 'Fast and smooth OnePlus experience, 80W SUPERVOOC charging.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'OnePlus 12R 5G', price: 39990, brand: 'OnePlus', desc: 'Premium flagship features at value price, large battery.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'OnePlus 12 5G', price: 64990, brand: 'OnePlus', desc: 'True flagship with Snapdragon 8 Gen 3, Hasselblad triple camera.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Moto g64 5G Slim', price: 14990, brand: 'Motorola', desc: 'Stock Android UI look, Dimensity 7025 processor, OIS camera.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Moto Edge 50 Pro 5G', price: 31990, brand: 'Motorola', desc: 'Beautiful Pantone validated leather back, curved display.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Moto Razr 50 Ultra Fold', price: 99990, brand: 'Motorola', desc: 'Massive cover screen foldable, leather wrap, AI integration.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Nothing Phone (2a) 5G', price: 23990, brand: 'Nothing', desc: 'Iconic transparent back, Glyph lighting interface, clean OS.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' },
      { name: 'Nothing Phone (2) Premium', price: 39990, brand: 'Nothing', desc: 'Premium glass back, advanced Glyph LED interface, Snapdragon 8+ Gen 1.', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60' }
    ];

    const electronicsList = [
      // Tablets (10 items)
      { name: 'Apple iPad 10.9-inch Wi-Fi', price: 34900, brand: 'Apple', desc: 'Liquid Retina display, A14 Bionic chip, support for Apple Pencil.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple iPad Air M2 11-inch', price: 59900, brand: 'Apple', desc: 'Supercharged Apple M2 chip, high performance graphics.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple iPad Pro M4 Ultra Thin', price: 99900, brand: 'Apple', desc: 'Stunning tandem OLED display, M4 extreme processing unit.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy Tab A9 Plus', price: 16990, brand: 'Samsung', desc: 'Affordable family tablet, quad speaker setup, 90Hz screen.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy Tab S9 FE', price: 36990, brand: 'Samsung', desc: 'IP68 water resistant build, S-pen included in the box.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung Galaxy Tab S9 Ultra', price: 108990, brand: 'Samsung', desc: 'Massive 14.6-inch Dynamic AMOLED display, ultimate tablet workstation.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Xiaomi Pad 6 Wi-Fi', price: 26990, brand: 'Xiaomi', desc: 'Qualcomm Snapdragon 870, crisp 144Hz high refresh rate screen.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Xiaomi Redmi Pad SE', price: 13990, brand: 'Xiaomi', desc: 'Value-oriented tablet with smooth 90Hz metal unibody frame.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Lenovo Tab M10 Gen 3', price: 12990, brand: 'Lenovo', desc: 'Student friendly tablet, IPS screen, Dolby Atmos stereo audio.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Lenovo Tab P12 Pro', price: 34990, brand: 'Lenovo', desc: 'Pro level display, massive battery, active stylus compatible.', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60' },
      // Accessories (40 items)
      { name: 'Logitech M170 Wireless Mouse', price: 699, brand: 'Logitech', desc: 'Comfortable wireless optical mouse with 10m range.', img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell MS116 Wired USB Mouse', price: 299, brand: 'Dell', desc: 'Standard reliable 3-button optical desktop mouse.', img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60' },
      { name: 'HP 150 Wireless Mouse', price: 599, brand: 'HP', desc: 'Ergonomic shape wireless battery operated mouse.', img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60' },
      { name: 'Razer DeathAdder Essential Mouse', price: 1399, brand: 'Razer', desc: 'High precision 6400 DPI optical sensor gaming mouse.', img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60' },
      { name: 'Logitech K120 Wired Keyboard', price: 499, brand: 'Logitech', desc: 'Standard spill resistant desktop layout keyboard.', img: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell KB216 Multimedia Keyboard', price: 599, brand: 'Dell', desc: 'Quiet key profile multimedia wired keyboard.', img: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&auto=format&fit=crop&q=60' },
      { name: 'Keychron K2 Mechanical Keyboard', price: 7499, brand: 'Keychron', desc: 'Wireless mechanical keyboard with Gateron switches, RGB.', img: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&auto=format&fit=crop&q=60' },
      { name: 'HP 230 Wireless Keyboard', price: 1299, brand: 'HP', desc: 'Chiclet keys low profile silent wireless keyboard.', img: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&auto=format&fit=crop&q=60' },
      { name: 'Sony WH-CH520 Wireless Headphones', price: 4490, brand: 'Sony', desc: 'On-ear wireless headphones, 50-hour massive battery.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
      { name: 'JBL Tune 770NC Active ANC', price: 6499, brand: 'JBL', desc: 'Over-ear headphones with active noise cancellation, pure bass.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
      { name: 'Sennheiser HD 350BT Wireless', price: 7990, brand: 'Sennheiser', desc: 'High fidelity audio codecs, USB-C fast charging, wireless design.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
      { name: 'Sony WH-1000XM5 Premium', price: 29990, brand: 'Sony', desc: 'Best-in-class active noise cancellation premium headphones.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
      { name: 'boAt Airdopes 131 TWS Earbuds', price: 999, brand: 'boAt', desc: 'Insta wake n pair TWS earbuds with deep signature bass.', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60' },
      { name: 'OnePlus Buds 3 Pro TWS', price: 4999, brand: 'OnePlus', desc: 'Smart active noise cancellation, high-res audio certification.', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60' },
      { name: 'Realme Buds T300 Active ANC', price: 2199, brand: 'Realme', desc: '30dB active noise cancellation buds, spatial audio effects.', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple AirPods Pro Gen 2', price: 24900, brand: 'Apple', desc: 'Apple designed H2 chip, adaptive audio, spatial tracking.', img: 'https://images.unsplash.com/photo-1588449668338-d1517824e444?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung 980 Pro 1TB M.2 SSD', price: 8990, brand: 'Samsung', desc: 'PCIe Gen4 NVMe internal solid state drive, extreme speed.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'Crucial T500 1TB Gen4 SSD', price: 7990, brand: 'Crucial', desc: 'Pro level internal gaming SSD, PCIe Gen4 7000MB/s speeds.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'SanDisk Extreme Portable 1TB', price: 9990, brand: 'SanDisk', desc: 'Rugged external SSD, water and dust resistant IP55 rating.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'WD Blue SN580 500GB SSD', price: 3990, brand: 'WesternDigital', desc: 'NVMe M.2 internal SSD for everyday system acceleration.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'SanDisk Ultra Dual 64GB Type-C', price: 890, brand: 'SanDisk', desc: 'Dual connector flash drive for USB Type-C and Type-A devices.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'Kingston DataTraveler 128GB', price: 1290, brand: 'Kingston', desc: 'High capacity USB 3.2 metal pen drive.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'HP v236w 32GB Metal Drive', price: 429, brand: 'HP', desc: 'Durable steel casing capless compact pen drive.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'SanDisk Cruzer Blade 16GB USB', price: 299, brand: 'SanDisk', desc: 'Simple pocket-sized plug and play flash storage.', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60' },
      { name: 'Mi Power Bank 3i 20000mAh', price: 2199, brand: 'Xiaomi', desc: 'Dual USB triple outputs, 18W fast charging power bank.', img: 'https://images.unsplash.com/photo-1609592424109-dd825b42d179?w=500&auto=format&fit=crop&q=60' },
      { name: 'Anker PowerCore 10000mAh Slim', price: 1999, brand: 'Anker', desc: 'Slimline heavy duty backup battery pack.', img: 'https://images.unsplash.com/photo-1609592424109-dd825b42d179?w=500&auto=format&fit=crop&q=60' },
      { name: 'Ambrane 10000mAh Compact', price: 999, brand: 'Ambrane', desc: 'Pocket size fast power output backup battery.', img: 'https://images.unsplash.com/photo-1609592424109-dd825b42d179?w=500&auto=format&fit=crop&q=60' },
      { name: 'URBN 20000mAh Fast 22.5W', price: 1699, brand: 'URBN', desc: 'Super fast type-C outputs portable battery bank.', img: 'https://images.unsplash.com/photo-1609592424109-dd825b42d179?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung 25W USB-C Block', price: 1299, brand: 'Samsung', desc: 'Super fast charging wall adapter block.', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Apple 20W USB-C Adapter', price: 1690, brand: 'Apple', desc: 'Official power brick for dynamic charging.', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60' },
      { name: 'Anker Nano II 45W GaN', price: 2999, brand: 'Anker', desc: 'Miniature GaN hardware fast wall adapter block.', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60' },
      { name: 'boAt Dual USB Wall Charger', price: 399, brand: 'boAt', desc: 'Dual outputs smart wall adapter block.', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60' },
      { name: 'LG 24-inch Full HD IPS Monitor', price: 9499, brand: 'LG', desc: 'Color accurate designer display, borderless bezel.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Samsung 27-inch Curved LED', price: 12999, brand: 'Samsung', desc: 'Immersive screen curve, 75Hz refresh rate screen.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Dell 24-inch Professional', price: 11499, brand: 'Dell', desc: 'Fully adjustable height, tilt, swivel office display.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Acer Nitro 23.8-inch 180Hz', price: 10499, brand: 'Acer', desc: 'High speed gaming monitor, 0.5ms response time.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Keychron Premium Wrist Rest', price: 1999, brand: 'Keychron', desc: 'Solid walnut wood mechanical keyboard palm accessory.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Razer Goliathus Gaming Mat', price: 1299, brand: 'Razer', desc: 'Textured fabric gaming mouse mat control pad.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'boAt Aux Audio Cable 1.5m', price: 299, brand: 'boAt', desc: 'Tangle-free braided aux connector cord.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
      { name: 'Anker Powerline Type-C Cable 3ft', price: 699, brand: 'Anker', desc: 'Double braided ultra strong type-c cord.', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' }
    ];

    const baseHousehold = [
      { name: 'Surf Excel Detergent Powder', basePrice: 190, unit: '1 kg', brand: 'SurfExcel', desc: 'Stain removing laundry powder.' },
      { name: 'Ariel Matic Front Load Liquid', basePrice: 220, unit: '1 L', brand: 'Ariel', desc: 'Premium deep clean laundry liquid.' },
      { name: 'Comfort Morning Fresh Conditioner', basePrice: 160, unit: '860 ml', brand: 'Comfort', desc: 'Fragrant post-wash fabric softener.' },
      { name: 'Vim Lemon Dishwash Gel', basePrice: 99, unit: '250 ml', brand: 'Vim', desc: 'Grease-cutting concentrated lemon dish gel.' },
      { name: 'Pril Lime Dishwash Bar', basePrice: 30, unit: '300 g', brand: 'Pril', desc: 'Fast cleaning anti-odor dish bar.' },
      { name: 'Harpic Blue Toilet Cleaner', basePrice: 85, unit: '500 ml', brand: 'Harpic', desc: 'Disinfectant toilet bowl liquid cleaner.' },
      { name: 'Lizol Citrus Floor Cleaner', basePrice: 110, unit: '1 L', brand: 'Lizol', desc: 'Floor disinfecting liquid cleaner.' },
      { name: 'Dettol Antiseptic Liquid', basePrice: 150, unit: '250 ml', brand: 'Dettol', desc: 'First-aid sanitizing antiseptic liquid.' },
      { name: 'Colin Glass and Surface Cleaner', basePrice: 75, unit: '500 ml', brand: 'Colin', desc: 'Streak-free window and table glass spray.' },
      { name: 'Odonil Lavender Air Gel', basePrice: 65, unit: '75 g', brand: 'Odonil', desc: 'Lavender home air odor control block.' },
      { name: 'Godrej Aer Pocket Fresh Lush', basePrice: 55, unit: '10 g', brand: 'Godrej', desc: 'Bathroom fresh lush scent hanger.' },
      { name: 'ZippyMart Heavy Garbage Bags', basePrice: 90, unit: '30 Bags', brand: 'Generic', desc: 'Leak-proof dark garbage liners pack.' },
      { name: 'Kitchen Double-Ply Paper Towels', basePrice: 85, unit: '2 Rolls', brand: 'Generic', desc: 'Absorbent kitchen tissues counter rolls.' },
      { name: 'Dettol Spring Blossom Spray', basePrice: 210, unit: '225 ml', brand: 'Dettol', desc: 'Surface disinfectant multi-purpose aerosol spray.' },
      { name: 'Godrej Hit Crawling Insect Spray', basePrice: 220, unit: '400 ml', brand: 'Godrej', desc: 'Roach and crawling insect killer spray.' },
      { name: 'All Out Mosquito Repellent Refill', basePrice: 75, unit: '45 ml', brand: 'AllOut', desc: 'Mosquito vaporizing machine liquid refill.' },
      { name: 'Good Knight Gold Twin Refill', basePrice: 135, unit: '2 Refills', brand: 'GoodKnight', desc: 'Vaporizing mosquito repellent refill packs.' },
      { name: 'Kitchen Aluminum Foil Wrap', basePrice: 110, unit: '9 Meters', brand: 'Generic', desc: 'Food-grade heat retention wrapping foil.' },
      { name: 'Fresh Wraps Premium Butter Paper', basePrice: 120, unit: '20 Meters', brand: 'Generic', desc: 'Non-stick organic baking paper sheets.' },
      { name: 'Cellophane Tight Cling Wrap', basePrice: 90, unit: '30 Meters', brand: 'Generic', desc: 'Stretchable food sealing cling wraps.' },
      { name: 'Scotch Brite Green Scrub Pads', basePrice: 40, unit: '3 Pcs', brand: 'ScotchBrite', desc: 'Durable nylon abrasive kitchen scrub pads.' },
      { name: 'Gala Grass No-Dust Floor Broom', basePrice: 150, unit: '1 Unit', brand: 'Gala', desc: 'Durable lightweight dust cleaning broom.' },
      { name: 'Gala Cotton Spin Floor Mop', basePrice: 450, unit: '1 Unit', brand: 'Gala', desc: 'Spin cleaning water absorbing floor mop.' },
      { name: 'ZippyMart Clean Microfiber Cloths', basePrice: 199, unit: '3 Pcs', brand: 'Generic', desc: 'Lint-free soft washing microfiber cloths.' },
      { name: 'Dettol Cleaning Surface Wipes', basePrice: 120, unit: '40 Wipes', brand: 'Dettol', desc: 'Sanitizing anti-bacterial household surface wipes.' }
    ];

    const basePersonalCare = [
      { name: 'Head & Shoulders Menthol Shampoo', basePrice: 180, unit: '180 ml', brand: 'HeadShoulders', desc: 'Cool refreshing anti-dandruff daily shampoo.' },
      { name: 'Dove Intense Repair Hair Shampoo', basePrice: 220, unit: '340 ml', brand: 'Dove', desc: 'Keratin active damage restoration daily shampoo.' },
      { name: 'Loreal Color Protect Conditioner', basePrice: 190, unit: '190 ml', brand: 'Loreal', desc: 'Gloss and UV protection color conditioner.' },
      { name: 'Tresemme Smooth Keratin Shampoo', basePrice: 240, unit: '340 ml', brand: 'Tresemme', desc: 'Salon professional straight finish daily shampoo.' },
      { name: 'Dettol Original Handwash Pump', basePrice: 99, unit: '200 ml', brand: 'Dettol', desc: 'Germ protection hygiene soap liquid pump.' },
      { name: 'Dove Creamy Beauty Soap Bar', basePrice: 65, unit: '125 g', brand: 'Dove', desc: 'Moisturizing formula milk skincare soap bar.' },
      { name: 'Dettol Cool Mint Bathing Soap', basePrice: 50, unit: '125 g', brand: 'Dettol', desc: 'Menthol cooling anti-bacterial hygiene soap.' },
      { name: 'Pears Glycerine Pure Bathing Soap', basePrice: 55, unit: '125 g', brand: 'Pears', desc: 'Translucent amber mild glycerine skincare soap.' },
      { name: 'Fiama Peach & Avocado Shower Gel', basePrice: 199, unit: '250 ml', brand: 'Fiama', desc: 'Skin softening fragrant shower gel wash.' },
      { name: 'Himalaya Purifying Neem Face Wash', basePrice: 120, unit: '100 ml', brand: 'Himalaya', desc: 'Turmeric neem anti-acne skincare face wash.' },
      { name: 'Nivea Nourishing Deep Body Milk', basePrice: 210, unit: '200 ml', brand: 'Nivea', desc: 'Intense dry skin deep moisture body lotion.' },
      { name: 'Vaseline Cocoa Glow Body Lotion', basePrice: 220, unit: '200 ml', brand: 'Vaseline', desc: 'Butter hydration glowing skin body lotion.' },
      { name: 'Colgate MaxFresh Peppermint Toothpaste', basePrice: 95, unit: '150 g', brand: 'Colgate', desc: 'Fresh breath active cooling gel toothpaste.' },
      { name: 'Sensodyne Sensitive Mint Toothpaste', basePrice: 130, unit: '100 g', brand: 'Sensodyne', desc: 'Fluoride sensitivity relief daily toothpaste.' },
      { name: 'Colgate Soft Charcoal Toothbrushes', basePrice: 80, unit: '2 Pcs', brand: 'Colgate', desc: 'Infused charcoal flexible slim dental brushes.' },
      { name: 'Listerine Cool Mint Mouthwash Solution', basePrice: 140, unit: '250 ml', brand: 'Listerine', desc: 'Germ killing long lasting minty mouth rinse.' },
      { name: 'Parachute Coconut Hair Oil', basePrice: 110, unit: '200 ml', brand: 'Parachute', desc: 'Pure multi-purpose nourishing coconut hair oil.' },
      { name: 'Almond Drops Nourishing Hair Oil', basePrice: 130, unit: '200 ml', brand: 'Generic', desc: 'Vitamin E non-sticky sweet almond oil.' },
      { name: 'Fog Marco Body Deodorant Spray', basePrice: 220, unit: '150 ml', brand: 'Fogg', desc: 'No-gas long lasting premium men deodorant.' },
      { name: 'Nivea Active Charcoal Men Shower Gel', basePrice: 199, unit: '250 ml', brand: 'Nivea', desc: 'Face body hair active charcoal gel wash.' },
      { name: 'Park Avenue Men Shaving Cream', basePrice: 85, unit: '84 g', brand: 'ParkAvenue', desc: 'Rich lubricated dynamic lather shaving cream.' },
      { name: 'Gillette Mach 3 Razor Kit', basePrice: 299, unit: '1 Unit', brand: 'Gillette', desc: 'Three blade pivot head manual men razor.' },
      { name: 'Dettol Instant Rub Hand Sanitizer', basePrice: 50, unit: '50 ml', brand: 'Dettol', desc: 'Waterless germ killing hand sanitizer liquid.' },
      { name: 'Whisper Ultra Clean Pads Wings', basePrice: 150, unit: '15 Pads', brand: 'Whisper', desc: 'Gel lock ultra thin female hygiene pads.' },
      { name: 'Sofy Anti-Bacterial XL Pads', basePrice: 170, unit: '15 Pads', brand: 'Sofy', desc: 'Anti-bacterial protection female hygiene pads.' }
    ];

    const baseSnacks = [
      { name: 'Parle-G Glucose Tea Biscuits', basePrice: 15, unit: '150 g', brand: 'Parle', desc: 'Traditional crispy sweet energy biscuits.' },
      { name: 'Good Day Rich Butter Cookies', basePrice: 25, unit: '150 g', brand: 'Britannia', desc: 'Rich butter drop crunchy cookies.' },
      { name: 'Oreo Vanilla Sandwich Cookies', basePrice: 35, unit: '120 g', brand: 'Oreo', desc: 'Chocolate cookie circles with vanilla cream.' },
      { name: 'Bourbon Chocolate Cream Biscuits', basePrice: 30, unit: '150 g', brand: 'Britannia', desc: 'Sprinkled sugar crunchy chocolate cream biscuits.' },
      { name: 'Marie Gold Crispy Tea Biscuits', basePrice: 35, unit: '250 g', brand: 'Britannia', desc: 'Semi-sweet light crispy daily tea companion.' },
      { name: 'Kurkure Masala Munch Twists', basePrice: 20, unit: '90 g', brand: 'Kurkure', desc: 'Spicy crunchy corn twists snacks.' },
      { name: 'Lays Classic Salted Potato Chips', basePrice: 30, unit: '90 g', brand: 'Lays', desc: 'Thin crispy salted potato chips.' },
      { name: 'Lays Spanish Tangy Tomato Chips', basePrice: 30, unit: '90 g', brand: 'Lays', desc: 'Sweet and tangy tomato potato chips.' },
      { name: 'Lays Cream & Onion Chips', basePrice: 30, unit: '90 g', brand: 'Lays', desc: 'Rich sour cream and herb potato chips.' },
      { name: 'Bingo Mad Angles Achari Chilli', basePrice: 25, unit: '80 g', brand: 'Bingo', desc: 'Triangle shaped spicy mango pickle chips.' },
      { name: 'Haldirams Aloo Bhujia Namkeen', basePrice: 40, unit: '150 g', brand: 'Haldiram', desc: 'Spiced potato and moth flour thin noodles.' },
      { name: 'Haldirams Spicy Bhujia Sev', basePrice: 40, unit: '150 g', brand: 'Haldiram', desc: 'Crispy gram flour spicy bhujia sev.' },
      { name: 'Haldirams Salty Moong Dal Snack', basePrice: 35, unit: '150 g', brand: 'Haldiram', desc: 'Light salted crunchy fried moong dal beans.' },
      { name: 'Act II Golden Butter Popcorn', basePrice: 45, unit: '90 g', brand: 'ActII', desc: 'Hot instant microwave butter popcorn.' },
      { name: 'Cadbury Dairy Milk Silk Chocolate', basePrice: 80, unit: '150 g', brand: 'Cadbury', desc: 'Velvety smooth milk chocolate bar.' },
      { name: 'Nestle KitKat 4 Finger Bar', basePrice: 40, unit: '38 g', brand: 'Nestle', desc: 'Crispy wafer fingers covered in milk chocolate.' },
      { name: 'Snickers Peanut Hunger Bar', basePrice: 50, unit: '50 g', brand: 'Snickers', desc: 'Satisfying caramel peanut milk chocolate bar.' },
      { name: 'Amul 55% Dark Cocoa Bar', basePrice: 100, unit: '150 g', brand: 'Amul', desc: 'Premium rich dark chocolate block.' },
      { name: 'ZippyMart Premium Salted Cashews', basePrice: 199, unit: '200 g', brand: 'Generic', desc: 'Salted roasted crunch jumbo cashews.' },
      { name: 'ZippyMart California Dry Almonds', basePrice: 180, unit: '200 g', brand: 'Generic', desc: 'Nutrient dense natural almond nut pack.' },
      { name: 'ZippyMart Golden Sweet Raisins', basePrice: 120, unit: '200 g', brand: 'Generic', desc: 'Organic sweet sun-dried golden raisins.' },
      { name: 'ZippyMart Premium Salted Pistachios', basePrice: 220, unit: '200 g', brand: 'Generic', desc: 'Rich salted shell pistachios nut pack.' },
      { name: 'ZippyMart Organic Honey Cashews', basePrice: 240, unit: '200 g', brand: 'Generic', desc: 'Sweet honey glaze crunchy cashews.' },
      { name: 'Snickers Minis Sharing Pack', basePrice: 140, unit: '150 g', brand: 'Snickers', desc: 'Miniature caramel peanut chocolate bars pack.' },
      { name: 'Cadbury Dairy Milk Fruit & Nut Bar', basePrice: 45, unit: '36 g', brand: 'Cadbury', desc: 'Milk chocolate with raisins and chopped almonds.' }
    ];

    const baseBeverages = [
      { name: 'Tata Tea Premium Gold Leaf', basePrice: 140, unit: '250 g', brand: 'Tata', desc: 'Aromatic strong Assam tea leaf blend.' },
      { name: 'Red Label Strong Black Tea', basePrice: 130, unit: '250 g', brand: 'RedLabel', desc: 'Strong flavor CTC tea leaves.' },
      { name: 'Nescafe Classic Instant Coffee Jar', basePrice: 170, unit: '100 g', brand: 'Nescafe', desc: 'Rich instant roasted coffee powder.' },
      { name: 'Bru Gold Filter Coffee Blend', basePrice: 150, unit: '100 g', brand: 'Bru', desc: 'Chicory infused filter coffee powder.' },
      { name: 'Taj Mahal Premium Leaf Tea Bags', basePrice: 190, unit: '50 Bags', brand: 'TajMahal', desc: 'Exquisite aromatic black tea bags.' },
      { name: 'Coca-Cola Chilled Carbonated Drink', basePrice: 40, unit: '750 ml', brand: 'CocaCola', desc: 'Classic fizzy sweet cold drink.' },
      { name: 'Pepsi Cola Chilled Soda Drink', basePrice: 40, unit: '750 ml', brand: 'Pepsi', desc: 'Chilled sweet carbonated soda bottle.' },
      { name: 'Sprite Clean Lemon Lime Soda', basePrice: 40, unit: '750 ml', brand: 'Sprite', desc: 'Refreshing clear lemon lime soda bottle.' },
      { name: 'Thums Up Strong Carbonated Cola', basePrice: 40, unit: '750 ml', brand: 'ThumsUp', desc: 'Strong spicy carbonated cola drink.' },
      { name: 'Fanta Orange Soda Fizzy Bottle', basePrice: 40, unit: '750 ml', brand: 'Fanta', desc: 'Fizzy sweet orange soda soft drink.' },
      { name: 'Red Bull Energy Vitalizing Can', basePrice: 125, unit: '250 ml', brand: 'RedBull', desc: 'Taurine energy boosting caffeine can.' },
      { name: 'Monster Energy Active Fuel Can', basePrice: 125, unit: '350 ml', brand: 'Monster', desc: 'Active caffeine energy booster can.' },
      { name: 'Natural Spring Pure Mineral Water', basePrice: 30, unit: '1 L', brand: 'Generic', desc: 'Himalayan mountain fresh mineral water.' },
      { name: 'Bisleri Purified Daily Water', basePrice: 20, unit: '1 L', brand: 'Bisleri', desc: 'Ozonized pure drinking water bottle.' },
      { name: 'Real 100% Orange Fruit Juice', basePrice: 110, unit: '1 L', brand: 'Real', desc: 'Pasteurized 100% orange pulpy juice.' },
      { name: 'Real 100% Apple Fruit Juice', basePrice: 110, unit: '1 L', brand: 'Real', desc: 'Sweet clear red apple fruit juice.' },
      { name: 'Real 100% Mixed Fruit Juice', basePrice: 110, unit: '1 L', brand: 'Real', desc: 'Tropical cocktail mixed fruit juice.' },
      { name: 'Real 100% Pink Guava Juice', basePrice: 110, unit: '1 L', brand: 'Real', desc: 'Thick sweet pink guava nectar juice.' },
      { name: 'Paper Boat Fresh Tender Coconut Water', basePrice: 50, unit: '200 ml', brand: 'PaperBoat', desc: 'Natural tender coconut water pouch.' },
      { name: 'Paper Boat Aamras Mango Drink', basePrice: 40, unit: '250 ml', brand: 'PaperBoat', desc: 'Thick pulpy sweet green mango dynamic slush.' },
      { name: 'Tata Tea Tulsi Green Tea Bags', basePrice: 150, unit: '25 Bags', brand: 'Tata', desc: 'Antioxidant rich refreshing tulsi green tea.' },
      { name: 'Nescafe Gold Premium Freeze Coffee', basePrice: 320, unit: '50 g', brand: 'Nescafe', desc: 'Premium freeze-dried rich arabica coffee.' },
      { name: 'Lipton Honey Lemon Green Tea Bags', basePrice: 160, unit: '25 Bags', brand: 'Lipton', desc: 'Citrus honey active green tea bags.' },
      { name: 'Tang Instant Orange Drink Powder', basePrice: 120, unit: '500 g', brand: 'Tang', desc: 'Quick water soluble orange beverage powder.' },
      { name: 'Cadbury Drinking Chocolate Powder', basePrice: 180, unit: '200 g', brand: 'Cadbury', desc: 'Sweet rich hot chocolate cocoa powder.' }
    ];

    const baseDairy = [
      { name: 'Amul Taaza Toned Dairy Milk', basePrice: 28, unit: '500 ml', brand: 'Amul', desc: 'Fresh pasteurized low-fat toned milk.' },
      { name: 'Amul Gold Full Cream Dairy Milk', basePrice: 33, unit: '500 ml', brand: 'Amul', desc: 'Fresh pasteurized high-cream milk.' },
      { name: 'Mother Dairy Fresh Cow Milk', basePrice: 27, unit: '500 ml', brand: 'MotherDairy', desc: 'Pure farm fresh cow milk packet.' },
      { name: 'Amul Masti Creamy Set Curd', basePrice: 35, unit: '200 g', brand: 'Amul', desc: 'Thick pasteurized set creamy curd dahi.' },
      { name: 'Nestle A+ Slim Skimmed Milk', basePrice: 90, unit: '1 L', brand: 'Nestle', desc: 'Low-fat skimmed UHT milk.' },
      { name: 'Amul Pasteurized Salted Butter', basePrice: 56, unit: '100 g', brand: 'Amul', desc: 'Classic salted rich cooking table butter.' },
      { name: 'Amul Processed Cheese Slices', basePrice: 135, unit: '200 g', brand: 'Amul', desc: 'Individually wrapped classic cheese slices.' },
      { name: 'Amul Cheddar Block Cheese', basePrice: 140, unit: '200 g', brand: 'Amul', desc: 'Premium hard cheddar cheese block.' },
      { name: 'Britannia Processed Cheese Cubes', basePrice: 145, unit: '200 g', brand: 'Britannia', desc: 'Fun size ready-to-eat cheese cubes.' },
      { name: 'Amul Premium Fresh Paneer Block', basePrice: 95, unit: '200 g', brand: 'Amul', desc: 'Soft and fresh pasteurized paneer block.' },
      { name: 'Amul Fresh Cooking Tetra Cream', basePrice: 70, unit: '250 ml', brand: 'Amul', desc: 'Rich fresh dairy cream for cooking.' },
      { name: 'Mother Dairy Pure Cow Ghee Tin', basePrice: 340, unit: '500 ml', brand: 'MotherDairy', desc: 'Aromatic pure clarifying cooking cow ghee.' },
      { name: 'Amul Spiced Masti Buttermilk', basePrice: 15, unit: '200 ml', brand: 'Amul', desc: 'Spiced cooling buttermilk dahi drink.' },
      { name: 'Amul Sweet Rose Lassi Drink', basePrice: 20, unit: '200 ml', brand: 'Amul', desc: 'Sweet rose flavored thick milk lassi.' },
      { name: 'ZippyMart Organic Farm Fresh Eggs', basePrice: 50, unit: '6 Pcs', brand: 'Generic', desc: 'Pesticide-free organic high-protein table eggs.' }
    ];

    const seededProducts = [];

    // Helper helper to generate and save products
    const seedHelper = async (category, baseList, variantsCount, variantFn) => {
      for (let i = 0; i < baseList.length; i++) {
        const item = baseList[i];
        for (let v = 0; v < variantsCount; v++) {
          const productData = variantFn(item, v, i);
          const finalProduct = {
            ...productData,
            category,
            reviewCount: 2 + (i % 5),
            deliveryTime: category === 'Laptops' || category === 'Smartphones' || category === 'Electronics' ? 'Next Day' : '10 mins'
          };
          const created = await DB.Products.create(finalProduct);
          seededProducts.push(created);
        }
      }
    };

    // 4. Seed Fruits (50 products)
    console.log('Seeding Fruits...');
    await seedHelper('Fruits', baseFruits, 2, (item, v, idx) => {
      const isOrganic = v === 1;
      const finalPrice = isOrganic ? Math.round(item.basePrice * 1.35) : item.basePrice;
      const origPrice = isOrganic ? Math.round(item.basePrice * 1.65) : item.basePrice;
      const discountRate = isOrganic ? Math.round((1 - (finalPrice/origPrice)) * 100) : 0;
      return {
        _id: `prod_fruits_${idx}_v${v}`,
        name: isOrganic ? `Organic Premium ${item.name}` : `Fresh ${item.name}`,
        description: isOrganic ? `USDA Certified Organic top-grade ${item.name}. ${item.desc}` : `Farm-fresh high-quality sweet ${item.name}. ${item.desc}`,
        price: finalPrice,
        originalPrice: origPrice,
        image: item.img,
        stock: isOrganic ? 15 + (idx % 12) : 40 + (idx % 20),
        rating: parseFloat((4.2 + (idx % 8) * 0.1).toFixed(1)),
        unit: isOrganic && !(item.unit.includes('Piece') || item.unit.includes('Dozen')) ? '500 g' : item.unit,
        discount: discountRate,
        brand: isOrganic ? 'BioFarm' : item.brand
      };
    });

    // 5. Seed Vegetables (50 products)
    console.log('Seeding Vegetables...');
    await seedHelper('Vegetables', baseVegetables, 2, (item, v, idx) => {
      const isOrganic = v === 1;
      const finalPrice = isOrganic ? Math.round(item.basePrice * 1.35) : item.basePrice;
      const origPrice = isOrganic ? Math.round(item.basePrice * 1.65) : item.basePrice;
      const discountRate = isOrganic ? Math.round((1 - (finalPrice/origPrice)) * 100) : 0;
      return {
        _id: `prod_veggies_${idx}_v${v}`,
        name: isOrganic ? `Organic ${item.name}` : `Fresh ${item.name}`,
        description: isOrganic ? `Pesticide-free certified organic ${item.name}. ${item.desc}` : `Daily harvested fresh farm ${item.name}. ${item.desc}`,
        price: finalPrice,
        originalPrice: origPrice,
        image: item.img,
        stock: isOrganic ? 12 + (idx % 10) : 45 + (idx % 25),
        rating: parseFloat((4.1 + (idx % 9) * 0.1).toFixed(1)),
        unit: isOrganic && !(item.unit.includes('Piece') || item.unit.includes('Pcs')) ? '250 g' : item.unit,
        discount: discountRate,
        brand: isOrganic ? 'BioFarm' : item.brand
      };
    });

    // 6. Seed Laptops (25 products)
    console.log('Seeding Laptops...');
    for (let i = 0; i < laptopsList.length; i++) {
      const item = laptopsList[i];
      const discountRate = (i % 4) === 0 ? 10 : (i % 4) === 2 ? 15 : 0;
      const origPrice = discountRate > 0 ? Math.round(item.price / (1 - (discountRate/100))) : item.price;
      const laptop = {
        _id: `prod_laptops_${i}`,
        name: item.name,
        description: `${item.desc} Top performing computing hardware ideal for home, gaming, or corporate deployment. Comes with 1-year warranty.`,
        price: item.price,
        originalPrice: origPrice,
        category: 'Laptops',
        image: item.img,
        stock: 5 + (i % 8),
        rating: parseFloat((4.3 + (i % 7) * 0.1).toFixed(1)),
        unit: '1 Unit',
        discount: discountRate,
        brand: item.brand,
        reviewCount: 3 + (i % 4),
        deliveryTime: 'Next Day'
      };
      await DB.Products.create(laptop);
      seededProducts.push(laptop);
    }

    // 7. Seed Smartphones (26 products)
    console.log('Seeding Smartphones...');
    for (let i = 0; i < smartphonesList.length; i++) {
      const item = smartphonesList[i];
      const discountRate = (i % 3) === 0 ? 8 : (i % 3) === 1 ? 12 : 0;
      const origPrice = discountRate > 0 ? Math.round(item.price / (1 - (discountRate/100))) : item.price;
      const smartphone = {
        _id: `prod_smartphones_${i}`,
        name: item.name,
        description: `${item.desc} Elegant smartphone equipped with crisp display, fast processor, dynamic camera lenses, and secure daily locks.`,
        price: item.price,
        originalPrice: origPrice,
        category: 'Smartphones',
        image: item.img,
        stock: 8 + (i % 10),
        rating: parseFloat((4.4 + (i % 6) * 0.1).toFixed(1)),
        unit: '1 Unit',
        discount: discountRate,
        brand: item.brand,
        reviewCount: 4 + (i % 5),
        deliveryTime: 'Next Day'
      };
      await DB.Products.create(smartphone);
      seededProducts.push(smartphone);
    }

    // 8. Seed Electronics (Tablets & Accessories) (50 products)
    console.log('Seeding Electronics Accessories...');
    for (let i = 0; i < electronicsList.length; i++) {
      const item = electronicsList[i];
      const discountRate = (i % 5) === 0 ? 5 : (i % 5) === 3 ? 15 : 0;
      const origPrice = discountRate > 0 ? Math.round(item.price / (1 - (discountRate/100))) : item.price;
      const accessory = {
        _id: `prod_electronics_${i}`,
        name: item.name,
        description: `${item.desc} Engineered with premium materials, ensuring seamless daily durability and state-of-the-art visual or sonic precision.`,
        price: item.price,
        originalPrice: origPrice,
        category: 'Electronics',
        image: item.img,
        stock: 15 + (i % 25),
        rating: parseFloat((4.0 + (i % 10) * 0.1).toFixed(1)),
        unit: '1 Unit',
        discount: discountRate,
        brand: item.brand,
        reviewCount: 2 + (i % 3),
        deliveryTime: 'Next Day'
      };
      await DB.Products.create(accessory);
      seededProducts.push(accessory);
    }

    // 9. Seed Household Essentials (100 products)
    console.log('Seeding Household...');
    await seedHelper('Household', baseHousehold, 4, (item, v, idx) => {
      let finalName = item.name;
      let multiplier = 1.0;
      let unit = item.unit;
      let discountRate = 0;

      if (v === 1) {
        finalName = `Refill Pack: ${item.name}`;
        multiplier = 0.88;
        discountRate = 12;
      } else if (v === 2) {
        finalName = `Double Value Pack: ${item.name}`;
        multiplier = 1.75;
        unit = 'Twin Pack';
        discountRate = 15;
      } else if (v === 3) {
        finalName = `Mega Saver Family Pack: ${item.name}`;
        multiplier = 3.20;
        unit = 'Mega Box';
        discountRate = 20;
      }

      const finalPrice = Math.round(item.basePrice * multiplier);
      const origPrice = discountRate > 0 ? Math.round(finalPrice / (1 - (discountRate/100))) : finalPrice;
      const img = item.name.includes('Detergent') || item.name.includes('Liquid') 
        ? 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=500&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60';

      return {
        _id: `prod_household_${idx}_v${v}`,
        name: finalName,
        description: `Highly effective ${item.name} formulated to wipe stains and eliminate home germs effortlessly. choice selection for all clean rooms.`,
        price: finalPrice,
        originalPrice: origPrice,
        image: img,
        stock: 30 + (idx % 15) - v * 5,
        rating: parseFloat((4.1 + (idx % 9) * 0.1).toFixed(1)),
        unit: unit,
        discount: discountRate,
        brand: item.brand
      };
    });

    // 10. Seed Personal Care (100 products)
    console.log('Seeding Personal Care...');
    await seedHelper('Personal Care', basePersonalCare, 4, (item, v, idx) => {
      let finalName = item.name;
      let multiplier = 1.0;
      let unit = item.unit;
      let discountRate = 0;

      if (v === 1) {
        finalName = `Refill Pack: ${item.name}`;
        multiplier = 0.88;
        discountRate = 12;
      } else if (v === 2) {
        finalName = `Double Value Pack: ${item.name}`;
        multiplier = 1.75;
        unit = 'Twin Pack';
        discountRate = 15;
      } else if (v === 3) {
        finalName = `Mega Saver Family Pack: ${item.name}`;
        multiplier = 3.20;
        unit = 'Mega Box';
        discountRate = 20;
      }

      const finalPrice = Math.round(item.basePrice * multiplier);
      const origPrice = discountRate > 0 ? Math.round(finalPrice / (1 - (discountRate/100))) : finalPrice;
      const img = item.name.includes('Shampoo') || item.name.includes('Conditioner') 
        ? 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop&q=60';

      return {
        _id: `prod_personal_${idx}_v${v}`,
        name: finalName,
        description: `Indulge in nourishing hygiene. ${item.name} formulated to refresh skin, deeply hydrate, and restore hair fibers organically.`,
        price: finalPrice,
        originalPrice: origPrice,
        image: img,
        stock: 30 + (idx % 12) - v * 5,
        rating: parseFloat((4.2 + (idx % 8) * 0.1).toFixed(1)),
        unit: unit,
        discount: discountRate,
        brand: item.brand
      };
    });

    // 11. Seed Snacks (50 products)
    console.log('Seeding Snacks...');
    await seedHelper('Snacks', baseSnacks, 2, (item, v, idx) => {
      const isLarge = v === 1;
      const finalPrice = isLarge ? Math.round(item.basePrice * 1.85) : item.basePrice;
      const discountRate = isLarge ? 10 : 0;
      const origPrice = discountRate > 0 ? Math.round(finalPrice / (1 - (discountRate/100))) : finalPrice;
      const img = item.name.includes('Chocolate') 
        ? 'https://images.unsplash.com/photo-1549007994-cb92ca817bc7?w=500&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=500&auto=format&fit=crop&q=60';

      return {
        _id: `prod_snacks_${idx}_v${v}`,
        name: isLarge ? `Mega Saver ${item.name}` : item.name,
        description: `Delightful crispy tea companion snack bites. ${item.desc} Satisfy your sudden hunger cravings instantly.`,
        price: finalPrice,
        originalPrice: origPrice,
        image: img,
        stock: 50 + (idx % 30),
        rating: parseFloat((4.3 + (idx % 7) * 0.1).toFixed(1)),
        unit: isLarge ? 'Family Pack' : item.unit,
        discount: discountRate,
        brand: item.brand
      };
    });

    // 12. Seed Beverages (50 products)
    console.log('Seeding Beverages...');
    await seedHelper('Beverages', baseBeverages, 2, (item, v, idx) => {
      const isLarge = v === 1;
      const finalPrice = isLarge ? Math.round(item.basePrice * 1.85) : item.basePrice;
      const discountRate = isLarge ? 10 : 0;
      const origPrice = discountRate > 0 ? Math.round(finalPrice / (1 - (discountRate/100))) : finalPrice;
      const img = item.name.includes('Tea') || item.name.includes('Coffee') 
        ? 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&auto=format&fit=crop&q=60';

      return {
        _id: `prod_beverages_${idx}_v${v}`,
        name: isLarge ? `Value Saver ${item.name}` : item.name,
        description: `Refreshing organic thirst quencher. Premium leaf brew or sparkling carbonated liquid soda. ${item.desc}`,
        price: finalPrice,
        originalPrice: origPrice,
        image: img,
        stock: 45 + (idx % 25),
        rating: parseFloat((4.2 + (idx % 8) * 0.1).toFixed(1)),
        unit: isLarge ? 'Jumbo Pack' : item.unit,
        discount: discountRate,
        brand: item.brand
      };
    });

    // 13. Seed Dairy (30 products)
    console.log('Seeding Dairy...');
    await seedHelper('Dairy', baseDairy, 2, (item, v, idx) => {
      const isLarge = v === 1;
      const finalPrice = isLarge ? Math.round(item.basePrice * 1.85) : item.basePrice;
      const discountRate = isLarge ? 8 : 0;
      const origPrice = discountRate > 0 ? Math.round(finalPrice / (1 - (discountRate/100))) : finalPrice;
      const img = item.name.includes('Milk') 
        ? 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60' 
        : item.name.includes('Cheese') || item.name.includes('Butter') 
        ? 'https://images.unsplash.com/photo-1589948184417-2ef690edb184?w=500&auto=format&fit=crop&q=60' 
        : 'https://images.unsplash.com/photo-1519689680058-324335c77eb2?w=500&auto=format&fit=crop&q=60';

      return {
        _id: `prod_dairy_${idx}_v${v}`,
        name: isLarge ? `Large Pack: ${item.name}` : item.name,
        description: `Chilled fresh dairy products sourced from certified local cow farms daily. Pure pasteurized goodness. ${item.desc}`,
        price: finalPrice,
        originalPrice: origPrice,
        image: img,
        stock: 35 + (idx % 20),
        rating: parseFloat((4.3 + (idx % 7) * 0.1).toFixed(1)),
        unit: isLarge ? 'Value Pack' : item.unit,
        discount: discountRate,
        brand: item.brand
      };
    });

    // 14. Seed diverse, realistic reviews for critical products
    const reviews = [
      { productId: 'prod_fruits_0_v0', userName: 'Vikram Mehta', userId: 'usr_premium', rating: 5, comment: 'Absolutely love these apples. Extremely fresh and crunchy, highly recommend!', sentiment: 'Positive', sentimentScore: 0.9 },
      { productId: 'prod_fruits_0_v0', userName: 'Aditi Roy', userId: 'usr_budget', rating: 4, comment: 'Decent apples, but slightly expensive compared to the local street vendor.', sentiment: 'Neutral', sentimentScore: 0.1 },
      { productId: 'prod_dairy_0_v0', userName: 'Sanya Sen', userId: 'usr_premium', rating: 5, comment: 'Super fast delivery. Milk packet was chilled and fresh!', sentiment: 'Positive', sentimentScore: 0.8 },
      { productId: 'prod_smartphones_0', userName: 'Rohan Das', userId: 'usr_premium', rating: 5, comment: 'Excellent display, fast speed, and battery easily lasts all day. Exceptional phone!', sentiment: 'Positive', sentimentScore: 0.95 }
    ];

    for (const rev of reviews) {
      await DB.Reviews.create(rev);
    }

    saveLocalDb();
    console.log(`Successfully seeded ${seededProducts.length} unique scaled products across 10 Blinkit/Amazon departments!`);
  } catch (error) {
    console.error('Error during scaled data seeding:', error.message);
  }
};
