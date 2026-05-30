import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_PATH = path.join(__dirname, '../data/local_db.json');

// Ensure data folder exists
const dataDir = path.dirname(LOCAL_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-Memory cache for Local DB Mode
let localDb = {
  users: [],
  products: [],
  categories: [],
  orders: [],
  reviews: [],
  inventory: [],
  recommendations: [],
  forecasts: []
};

// Load existing JSON if it exists
if (fs.existsSync(LOCAL_DB_PATH)) {
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    localDb = { ...localDb, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error reading local DB file, initializing empty:', error.message);
  }
}

// Persist JSON DB changes helper
export const saveLocalDb = () => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save to local DB file:', error.message);
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return { isMongo: true, connection: conn };
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}. Falling back to Local JSON DB.`);
      return { isMongo: false, db: localDb };
    }
  } else {
    console.log('No MONGO_URI provided in env. Operating in Premium Local JSON Database Mode.');
    return { isMongo: false, db: localDb };
  }
};

// Interface mimicking Mongoose models to allow seamless dual-mode interaction
class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get data() {
    return localDb[this.collectionName];
  }

  set data(newData) {
    localDb[this.collectionName] = newData;
    saveLocalDb();
  }

  async find(filter = {}) {
    let results = [...this.data];
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'object' && value !== null) {
        // Simple handle for basic range queries or regex if needed
        if ('$in' in value) {
          results = results.filter(item => value.$in.includes(item[key]));
        }
      } else {
        results = results.filter(item => item[key] === value);
      }
    }
    return results;
  }

  async findOne(filter = {}) {
    const list = await this.find(filter);
    return list.length > 0 ? list[0] : null;
  }

  async findById(id) {
    return (await this.findOne({ id: id })) || (await this.findOne({ _id: id }));
  }

  async create(doc) {
    const newDoc = {
      _id: doc._id || `id_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    const current = this.data;
    current.push(newDoc);
    this.data = current;
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const current = this.data;
    const index = current.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    
    // Support either direct update object or $set operator
    const changes = update.$set ? update.$set : update;
    current[index] = {
      ...current[index],
      ...changes,
      updatedAt: new Date().toISOString()
    };
    this.data = current;
    return current[index];
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const item = await this.findOne(filter);
    if (!item) return null;
    return this.findByIdAndUpdate(item._id, update, options);
  }

  async findByIdAndDelete(id) {
    const current = this.data;
    const index = current.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const removed = current[index];
    current.splice(index, 1);
    this.data = current;
    return removed;
  }

  async deleteMany(filter = {}) {
    let initialCount = this.data.length;
    let keep = [];
    for (const item of this.data) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (item[key] !== value) {
          matches = false;
          break;
        }
      }
      if (!matches) keep.push(item);
    }
    this.data = keep;
    return { deletedCount: initialCount - keep.length };
  }
}

// Export models adapting automatically to Mongo or Local DB mode
export const DB = {
  Users: new LocalModel('users'),
  Products: new LocalModel('products'),
  Categories: new LocalModel('categories'),
  Orders: new LocalModel('orders'),
  Reviews: new LocalModel('reviews'),
  Inventory: new LocalModel('inventory'),
  Recommendations: new LocalModel('recommendations'),
  Forecasts: new LocalModel('forecasts')
};
