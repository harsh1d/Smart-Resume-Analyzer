const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/analysis', require('./routes/analysis'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            success: false,
            message: 'File too large. Please upload a file smaller than 5MB.' 
        });
    }
    
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong on the server!',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Analysis health: http://localhost:${PORT}/api/analysis/health`);
});
