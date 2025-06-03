const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // For password hashing
const session = require('express-session'); // For session management

const app = express();
// Configure CORS for all routes
app.use(cors({
    origin: true, // Allow requests from any origin - you can specify exact origin in production
    methods: ['GET', 'POST'], // Allow GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true // Allow cookies to be sent with requests
}));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image data
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session
app.use(session({
    secret: 'resume_builder_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Make sure templates and static files are served (usually at the top)
app.use(express.static(__dirname));
// Serve PDFs from the pdfs directory
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cvbuilder');

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to hash passwords
UserSchema.pre('save', async function(next) {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password using the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', UserSchema);

// CV Schema
const CvSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    firstName: String,
    lastName: String,
    professionalTitle: String,
    email: String,
    phone: String,
    location: String,
    website: String,
    linkedin: String,
    github: String,
    summary: String,
    workExperience: Array,
    education: Array,
    skills: String,
    languages: Array,
    certifications: Array,
    template: {
        name: String,
        image: String
    }
});
const Cv = mongoose.model('Cv', CvSchema);

// Portfolio Schema
const PortfolioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, default: 'portfolio' },
    personalInfo: {
        firstName: String,
        lastName: String,
        fullName: String,
        professionalTitle: String,
        email: String,
        phone: String,
        location: String,
        website: String,
        linkedin: String,
        github: String,
        summary: String
    },
    experiences: Array,
    projects: Array,
    education: Array,
    skills: Array,
    certifications: Array,
    template: {
        name: String,
        file: String,
        image: String
    },
    createdAt: { type: Date, default: Date.now }
});
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

// UserStats Schema - to track user activity
const UserStatsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    cvCount: { type: Number, default: 0 },
    portfolioCount: { type: Number, default: 0 },
    cvHistory: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cv' 
    }],
    portfolioHistory: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Portfolio' 
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const UserStats = mongoose.model('UserStats', UserStatsSchema);

// User registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Create new user
        const user = new User({
            email,
            password, // Will be hashed by the pre-save middleware
            firstName,
            lastName        });
        
        await user.save();
        
        // Create user stats entry
        const userStats = new UserStats({
            userId: user._id,
            cvCount: 0,
            portfolioCount: 0,
            cvHistory: [],
            portfolioHistory: []
        });
        
        await userStats.save();
        
        // Don't send the password back in the response
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// User login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Set user session
        req.session.userId = user._id;
        
        // Return user info (without password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        res.status(200).json({
            message: 'Login successful',
            user: userResponse
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    console.log('Logout endpoint called, session before:', req.session);
    
    // Clear the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        console.log('Session destroyed successfully');
        
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// CV Endpoint
app.post('/submit-cv', async (req, res) => {
    try {
        const cv = new Cv(req.body);
        await cv.save();
        
        // Update user stats
        if (req.body.userId) {
            await UserStats.findOneAndUpdate(
                { userId: req.body.userId },
                { 
                    $inc: { cvCount: 1 },
                    $push: { cvHistory: cv._id },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
            );
        }
        
        res.status(200).send({ message: 'CV saved successfully', cvId: cv._id });
    } catch (err) {
        res.status(500).send({ error: 'Failed to save CV', details: err });
    }
});

// Portfolio Endpoint
app.post('/submit-portfolio', async (req, res) => {
    console.log('Received portfolio submission request');
    try {
        console.log('Portfolio personal info:', req.body.personalInfo);        const portfolio = new Portfolio(req.body);
        await portfolio.save();
        
        // Update user stats for portfolio
        if (req.body.userId) {
            await UserStats.findOneAndUpdate(
                { userId: req.body.userId },
                { 
                    $inc: { portfolioCount: 1 },
                    $push: { portfolioHistory: portfolio._id },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
            );
        }
        
        console.log('Portfolio saved successfully');
        res.status(200).send({ message: 'Portfolio saved successfully', portfolioId: portfolio._id });
    } catch (err) {
        console.error('Error saving portfolio:', err);
        res.status(500).send({ error: 'Failed to save portfolio', details: err.message });
    }
});

app.post('/generate-pdf', async (req, res) => {
    try {
        // Create directory for PDFs if it doesn't exist
        const pdfDir = path.join(__dirname, 'pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir);
        }
        
        // Create user-specific directory if it doesn't exist
        const userId = req.body.userId || 'guest';
        const userDir = path.join(pdfDir, userId);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cv_${timestamp}.pdf`;
        const filePath = path.join(userDir, filename);
        
        // Prepare localStorage script to inject data
        const storageScript = `
            (function() {
                localStorage.clear();
                var data = ${JSON.stringify(req.body)};
                localStorage.setItem('fullName', data.fullName || '');
                localStorage.setItem('title', data.professionalTitle || '');
                localStorage.setItem('objective', data.summary || '');
                localStorage.setItem('contact', data.contact || '');
                localStorage.setItem('workExperience', JSON.stringify(data.workExperience || []));
                localStorage.setItem('education', JSON.stringify(data.education || []));
                localStorage.setItem('skills', data.skills || '');
                localStorage.setItem('languages', JSON.stringify(data.languages || []));
                localStorage.setItem('certifications', JSON.stringify(data.certifications || []));
                localStorage.setItem('website', data.website || '');
            })();
        `;

        // Get template path
        let templatePath = req.body.templatePath || 'classicBold_temp.html';
        templatePath = path.isAbsolute(templatePath)
            ? templatePath
            : path.join(__dirname, templatePath);

        // Puppeteer for HTML→PDF
        const browser = await puppeteer.launch({
            headless: "new", // or true for older Puppeteer versions
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Go to the template file
        await page.goto('file://' + templatePath, { waitUntil: 'networkidle0' });

        // Inject data into localStorage
        await page.addScriptTag({ content: storageScript });

        // Reload so the template uses the localStorage values
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 700));

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });        await browser.close();

        // Save PDF to file
        fs.writeFileSync(filePath, pdfBuffer);
        
        // If we have a CV ID, add this file to a mapping
        if (req.body.userId && req.body.cvId) {
            // Create a file to track CV to PDF mappings
            const mappingFile = path.join(userDir, 'mapping.json');
            let mappings = {};
            
            // Load existing mappings if any
            if (fs.existsSync(mappingFile)) {
                mappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            }
            
            // Add this CV to PDF mapping
            mappings[req.body.cvId] = filename;
            fs.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
        }

        // Send PDF file
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).send({ error: 'Failed to generate PDF', details: err.message });
    }
});


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

// Get user stats endpoint - for dashboard
app.get('/user-stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find user stats
        let userStats = await UserStats.findOne({ userId })
            .populate('cvHistory')
            .populate('portfolioHistory');
        
        if (!userStats) {
            // Create default stats if none exist
            userStats = new UserStats({
                userId,
                cvCount: 0,
                portfolioCount: 0,
                cvHistory: [],
                portfolioHistory: []
            });
            await userStats.save();
        }
        
        res.status(200).json(userStats);
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ error: 'Failed to fetch user stats', details: err.message });
    }
});

// Get user CV PDFs endpoint
app.get('/user-pdfs/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const userDir = path.join(__dirname, 'pdfs', userId);
        
        // Check if user directory exists
        if (!fs.existsSync(userDir)) {
            return res.status(200).json({ pdfs: [] });
        }
        
        // Read all PDF files in the directory
        const files = fs.readdirSync(userDir)
            .filter(file => file.endsWith('.pdf'))
            .map(file => ({
                filename: file,
                path: `/pdfs/${userId}/${file}`,
                created: fs.statSync(path.join(userDir, file)).birthtime
            }))
            .sort((a, b) => b.created - a.created); // Sort by date descending
        
        // Read mapping file if it exists
        const mappingFile = path.join(userDir, 'mapping.json');
        let mappings = {};
        
        if (fs.existsSync(mappingFile)) {
            mappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
        }
        
        // Add mapping information to each file
        const pdfsWithInfo = files.map(file => {
            // Find CV ID for this file if any
            const cvId = Object.keys(mappings).find(key => mappings[key] === file.filename);
            return {
                ...file,
                cvId: cvId || null
            };
        });
        
        res.status(200).json({ pdfs: pdfsWithInfo });
    } catch (err) {
        console.error('Error fetching user PDFs:', err);
        res.status(500).json({ error: 'Failed to fetch PDFs', details: err.message });
    }
});

// Get a specific CV by ID endpoint
app.get('/cv/:id', async (req, res) => {
    try {
        const cvId = req.params.id;
        const cv = await Cv.findById(cvId);
        
        if (!cv) {
            return res.status(404).json({ error: 'CV not found' });
        }
        
        res.status(200).json(cv);
    } catch (err) {
        console.error('Error fetching CV:', err);
        res.status(500).json({ error: 'Failed to fetch CV', details: err.message });
    }
});

// Get a portfolio by ID endpoint
app.get('/portfolio/:id', async (req, res) => {
    try {
        const portfolioId = req.params.id;
        const portfolio = await Portfolio.findById(portfolioId);
        
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' });
        }
        
        res.status(200).json(portfolio);
    } catch (err) {
        console.error('Error fetching portfolio:', err);
        res.status(500).json({ error: 'Failed to fetch portfolio', details: err.message });
    }
});

// Add a test endpoint for connectivity testing
app.get('/test', (req, res) => {
    res.status(200).send({ message: 'Server is running correctly' });
});

