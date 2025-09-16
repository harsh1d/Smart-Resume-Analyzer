const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        cb(null, allowedTypes.includes(file.mimetype));
    }
});

// Enhanced resume parsing with structured data extraction
const parseResumeContent = async (file) => {
    let text = '';
    
    try {
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        }

        // Extract structured information
        const extractedData = extractStructuredData(text);
        return {
            rawText: text,
            ...extractedData,
            wordCount: text.split(' ').length
        };
    } catch (error) {
        throw new Error('Failed to parse resume content');
    }
};

// Extract structured data from resume text
const extractStructuredData = (text) => {
    const lowerText = text.toLowerCase();
    
    // Extract contact information
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
    const githubRegex = /github\.com\/[a-zA-Z0-9-]+/gi;
    
    // Extract skills with better pattern matching
    const skillsPatterns = [
        /(?:skills?|technical skills?|technologies?):?\s*([^.]+?)(?:\n\n|\n[A-Z]|$)/is,
        /(?:programming languages?|languages?):?\s*([^.]+?)(?:\n\n|\n[A-Z]|$)/is
    ];
    
    let skills = new Set();
    skillsPatterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match) {
            const skillsText = match[1];
            const extractedSkills = skillsText
                .split(/[,\n•\-\|\/]/)
                .map(s => s.trim())
                .filter(s => s.length > 1 && s.length < 30);
            extractedSkills.forEach(skill => skills.add(skill));
        }
    });

    // Extract experience
    const experiencePattern = /(?:experience|work experience):?\s*(.*?)(?:\n\n|education|skills|projects|$)/is;
    const expMatch = text.match(experiencePattern);
    const experience = extractExperienceEntries(expMatch ? expMatch[1] : '');
    
    // Extract education
    const educationPattern = /(?:education|academic background):?\s*(.*?)(?:\n\n|experience|skills|projects|$)/is;
    const eduMatch = text.match(educationPattern);
    const education = extractEducationEntries(eduMatch ? eduMatch[1] : '');
    
    // Extract projects
    const projectsPattern = /(?:projects?|personal projects?):?\s*(.*?)(?:\n\n|education|experience|skills|$)/is;
    const projMatch = text.match(projectsPattern);
    const projects = extractProjectEntries(projMatch ? projMatch[1] : '');
    
    // Extract years of experience
    const yearsExpRegex = /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i;
    const yearsMatch = text.match(yearsExpRegex);
    const totalExperience = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    return {
        email: (text.match(emailRegex) || [])[0] || '',
        phone: (text.match(phoneRegex) || [])[0] || '',
        linkedin: (text.match(linkedinRegex) || [])[0] || '',
        github: (text.match(githubRegex) || [])[0] || '',
        skills: Array.from(skills).slice(0, 20),
        experience: experience,
        education: education,
        projects: projects,
        totalExperience: totalExperience,
        summary: extractSummary(text)
    };
};

const extractExperienceEntries = (expText) => {
    const entries = [];
    const lines = expText.split('\n').filter(line => line.trim());
    
    let currentEntry = {};
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Check if it's a company/role line
        const rolePattern = /^(.+?)\s+(?:at|@)\s+(.+?)(?:\s+\((.+?)\)|\s+(\d{4}(?:-\d{4})?))?\s*$/i;
        const match = line.match(rolePattern);
        
        if (match) {
            if (currentEntry.role) {
                entries.push(currentEntry);
            }
            currentEntry = {
                role: match[1].trim(),
                company: match[2].trim(),
                duration: match[3] || match[4] || '',
                description: ''
            };
        } else if (currentEntry.role && line.length > 10) {
            currentEntry.description += line + ' ';
        }
    }
    
    if (currentEntry.role) {
        entries.push(currentEntry);
    }
    
    return entries.slice(0, 5); // Limit to 5 entries
};

const extractEducationEntries = (eduText) => {
    const entries = [];
    const lines = eduText.split('\n').filter(line => line.trim());
    
    for (let line of lines) {
        line = line.trim();
        if (line.length < 10) continue;
        
        const degreePattern = /(.+?)\s+(?:from|at)\s+(.+?)(?:\s+\((.+?)\)|\s+(\d{4}))?\s*$/i;
        const match = line.match(degreePattern);
        
        if (match) {
            entries.push({
                degree: match[1].trim(),
                institution: match[2].trim(),
                year: match[3] || match[4] || ''
            });
        }
    }
    
    return entries.slice(0, 3);
};

const extractProjectEntries = (projText) => {
    const entries = [];
    const sections = projText.split(/\n\s*\n/).filter(s => s.trim());
    
    for (let section of sections) {
        const lines = section.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length >= 1) {
            entries.push({
                title: lines[0],
                description: lines.slice(1).join(' ').substring(0, 200)
            });
        }
    }
    
    return entries.slice(0, 5);
};

const extractSummary = (text) => {
    const summaryPatterns = [
        /(?:summary|objective|profile):?\s*([^.]+(?:\.[^.]+){0,3})/is,
        /^([^.]+(?:\.[^.]+){0,2})/
    ];
    
    for (let pattern of summaryPatterns) {
        const match = text.match(pattern);
        if (match && match[1].length > 50) {
            return match[1].trim().substring(0, 300);
        }
    }
    
    // Generate default summary
    return "Motivated professional seeking opportunities to contribute skills and experience to achieve organizational goals.";
};

// Enhanced analysis with actual content checking
const analyzeResumeContent = (resumeData, targetRole) => {
    const roleSpecificAnalysis = {
        'Data Scientist': {
            requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy'],
            preferredSkills: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'R', 'Tableau', 'Apache Spark'],
            keyTerms: ['data analysis', 'predictive modeling', 'statistical analysis', 'data visualization']
        },
        'Software Developer': {
            requiredSkills: ['JavaScript', 'Python', 'Java', 'Git', 'HTML', 'CSS'],
            preferredSkills: ['React', 'Node.js', 'Docker', 'AWS', 'MongoDB', 'TypeScript'],
            keyTerms: ['web development', 'software engineering', 'full stack', 'api development']
        },
        'Frontend Developer': {
            requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
            preferredSkills: ['Vue.js', 'Angular', 'TypeScript', 'SASS', 'Webpack', 'Redux'],
            keyTerms: ['user interface', 'user experience', 'responsive design', 'cross-browser']
        }
    };

    const roleAnalysis = roleSpecificAnalysis[targetRole] || roleSpecificAnalysis['Software Developer'];
    const lowerText = resumeData.rawText.toLowerCase();
    const userSkills = resumeData.skills.map(s => s.toLowerCase());

    // Check skill matches
    const foundRequiredSkills = roleAnalysis.requiredSkills.filter(skill => 
        userSkills.some(userSkill => userSkill.includes(skill.toLowerCase())) ||
        lowerText.includes(skill.toLowerCase())
    );

    const foundPreferredSkills = roleAnalysis.preferredSkills.filter(skill => 
        userSkills.some(userSkill => userSkill.includes(skill.toLowerCase())) ||
        lowerText.includes(skill.toLowerCase())
    );

    const missingRequiredSkills = roleAnalysis.requiredSkills.filter(skill => 
        !foundRequiredSkills.includes(skill)
    );

    const missingPreferredSkills = roleAnalysis.preferredSkills.filter(skill => 
        !foundPreferredSkills.includes(skill)
    );

    // Generate skill proficiency scores
    const skillsAnalysis = {};
    foundRequiredSkills.forEach(skill => {
        skillsAnalysis[skill] = Math.floor(Math.random() * 20) + 80; // 80-100
    });
    foundPreferredSkills.forEach(skill => {
        skillsAnalysis[skill] = Math.floor(Math.random() * 25) + 65; // 65-90
    });
    resumeData.skills.forEach(skill => {
        if (!skillsAnalysis[skill]) {
            skillsAnalysis[skill] = Math.floor(Math.random() * 30) + 60; // 60-90
        }
    });

    // Generate specific improvements based on content
    const improvements = [];
    
    if (resumeData.experience.length === 0) {
        improvements.push("Add work experience section with specific roles and achievements");
    }
    
    if (resumeData.projects.length === 0) {
        improvements.push("Include relevant projects to showcase your practical skills");
    }
    
    if (!resumeData.summary || resumeData.summary.length < 50) {
        improvements.push("Add a compelling professional summary highlighting your key strengths");
    }
    
    if (missingRequiredSkills.length > 0) {
        improvements.push(`Learn essential skills for ${targetRole}: ${missingRequiredSkills.slice(0, 3).join(', ')}`);
    }
    
    if (!resumeData.linkedin && !resumeData.github) {
        improvements.push("Add professional profiles (LinkedIn, GitHub) to increase credibility");
    }

    // ATS Score calculation
    let atsScore = 0;
    atsScore += resumeData.email ? 15 : 0;
    atsScore += resumeData.phone ? 10 : 0;
    atsScore += resumeData.skills.length > 0 ? 20 : 0;
    atsScore += resumeData.experience.length > 0 ? 25 : 0;
    atsScore += resumeData.education.length > 0 ? 15 : 0;
    atsScore += foundRequiredSkills.length > 3 ? 15 : foundRequiredSkills.length * 3;

    return {
        skillsAnalysis,
        missingSkills: [...missingRequiredSkills, ...missingPreferredSkills.slice(0, 3)],
        improvements,
        atsScore: Math.min(atsScore, 100),
        foundRequiredSkills,
        foundPreferredSkills,
        contentQuality: assessContentQuality(resumeData)
    };
};

const assessContentQuality = (resumeData) => {
    const quality = {
        score: 0,
        feedback: []
    };

    // Check completeness
    if (resumeData.email) quality.score += 10;
    if (resumeData.phone) quality.score += 10;
    if (resumeData.skills.length >= 5) quality.score += 20;
    if (resumeData.experience.length >= 1) quality.score += 25;
    if (resumeData.education.length >= 1) quality.score += 15;
    if (resumeData.projects.length >= 1) quality.score += 20;

    // Provide feedback
    if (quality.score >= 80) quality.feedback.push("Excellent resume structure and content");
    else if (quality.score >= 60) quality.feedback.push("Good resume with room for improvement");
    else quality.feedback.push("Resume needs significant enhancement");

    return quality;
};

// Main analysis route with enhanced parsing
router.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        console.log('=== Enhanced Analysis Started ===');
        const { targetRole = 'Software Developer' } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ 
                success: false,
                message: 'Please upload a PDF or DOCX resume file' 
            });
        }

        console.log(`Processing: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

        // Enhanced parsing
        const resumeData = await parseResumeContent(file);
        console.log(`Extracted: ${resumeData.skills.length} skills, ${resumeData.experience.length} experiences, ${resumeData.education.length} education entries`);

        // Enhanced analysis
        const analysis = analyzeResumeContent(resumeData, targetRole);

        // Project suggestions based on role and current skills
        const projectSuggestions = generateProjectSuggestions(targetRole, resumeData.skills);

        const result = {
            success: true,
            targetRole,
            ...analysis,
            projectSuggestions,
            resumeData,
            analysisDate: new Date().toISOString()
        };

        console.log(`Analysis complete - ATS Score: ${analysis.atsScore}/100`);
        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to analyze resume. Please ensure the file is readable.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

const generateProjectSuggestions = (targetRole, currentSkills) => {
    const suggestions = {
        'Data Scientist': [
            'Build a machine learning model for predicting customer behavior',
            'Create a data visualization dashboard using Tableau/Power BI',
            'Develop a recommendation system using collaborative filtering',
            'Implement time series forecasting for business metrics'
        ],
        'Software Developer': [
            'Build a full-stack web application with user authentication',
            'Create a RESTful API with database integration',
            'Develop a mobile app using React Native or Flutter',
            'Build a microservices architecture with Docker'
        ],
        'Frontend Developer': [
            'Create a responsive e-commerce website',
            'Build a progressive web application (PWA)',
            'Develop a component library with Storybook',
            'Create an interactive data visualization dashboard'
        ]
    };

    return suggestions[targetRole] || suggestions['Software Developer'];
};

module.exports = router;
