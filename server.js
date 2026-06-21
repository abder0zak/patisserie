const express = require('express');
const Datastore = require('nedb-promises');
const path = require('path');
const multer = require('multer'); 
const fs = require('fs');

const app = express();
const PORT = 3000;
const ADMIN_SECRET = "Maison2026"; 

// Set up local file-based database (creates a 'pastries.db' file automatically)
const db = Datastore.create({ filename: 'pastries.db', autoload: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Automatically construct the local directory for saved uploads if it doesn't exist
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Dynamic paths that adapt whether you are running locally or on Render
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

const dbPath = isProduction 
    ? '/opt/render/project/src/data/pastries.db' 
    : path.join(__dirname, 'pastries.db');

const uploadDir = isProduction 
    ? '/opt/render/project/src/data/uploads' 
    : path.join(__dirname, 'public', 'uploads');

// Initialize DB with the smart path
const db = Datastore.create({ filename: dbPath, autoload: true });

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Update your multer configuration destination to use the dynamic directory variable
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
// Configure multer storage engine properties
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Security gate check middleware
function authorizeAdmin(req, res, next) {
    const userSecret = req.headers['x-admin-secret'];
    if (userSecret === ADMIN_SECRET) {
        next();
    } else {
        res.status(401).json({ error: "Invalid Admin Passcode. Access Denied." });
    }
}

// Seed database with initial items if empty
const seedData = async () => {
    const count = await db.count({});
    if (count === 0) {
        await db.insert([
            { name: "Almond Croissant", price: "4.75", status: "Freshly Baked", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80" },
            { name: "Raspberry Tart", price: "6.20", status: "Only 3 Left!", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80" }
        ]);
        console.log("Database seeded with baseline pastries!");
    }
};
seedData();

// API: Get all pastries
app.get('/api/pastries', async (req, res) => {
    try {
        const pastries = await db.find({});
        res.json(pastries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Add a new pastry item (Admin with Device Upload capability)
app.post('/api/pastries', authorizeAdmin, upload.single('imageFile'), async (req, res) => {
    try {
        const { name, price, status } = req.body;
        if (!name || !price) return res.status(400).json({ error: "Missing required fields" });
        
        // Use device upload path if available, otherwise apply standard placeholder fallback
        let imageLocation = "https://placehold.co/400x300/f5f5f4/a8a29e?text=No+Photo";
        if (req.file) {
            imageLocation = `/uploads/${req.file.filename}`;
        }

        const newItem = await db.insert({ 
            name, 
            price, 
            status: status || "Freshly Baked", 
            image: imageLocation
        });
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Delete a pastry item (Admin with Local Image cleanup)
app.delete('/api/pastries/:id', authorizeAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Locate the item first to check if a local image file needs to be deleted from disk
        const item = await db.findOne({ _id: itemId });
        if (item && item.image && item.image.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, 'public', item.image);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        const numRemoved = await db.remove({ _id: itemId }, {}); 
        if (numRemoved === 0) return res.status(404).json({ error: "Item not found" });
        res.json({ success: true, message: "Item removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Patisserie Server running at http://localhost:${PORT}`));