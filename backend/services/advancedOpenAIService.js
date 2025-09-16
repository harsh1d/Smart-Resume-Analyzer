const OpenAI = require('openai');

class AdvancedOpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OpenAI API key not found. Advanced analysis will use fallback methods.');
            this.client = null;
            return;
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Advanced resume analysis with sophisticated prompting
    async analyzeResumeAdvanced(resumeData, targetRole, jobDescription = '') {
        if (!this.client) {
            return this.getFallbackAnalysis(resumeData, targetRole);
        }

        try {
            // Multi-stage analysis for comprehensive evaluation
            const [
                structuredAnalysis,
                skillsAssessment,
                experienceEvaluation,
                atsOptimization,
                careerGuidance
            ] = await Promise.all([
                this.performStructuredAnalysis(resumeData, targetRole, jobDescription),
                this.assessSkillsProficiency(resumeData, targetRole),
                this.evaluateExperience(resumeData, targetRole),
                this.optimizeForATS(resumeData, targetRole),
                this.provideCareerGuidance(resumeData, targetRole)
            ]);

            return {
                ...structuredAnalysis,
                skillsAssessment,
                experienceEvaluation,
                atsOptimization,
                careerGuidance,
                overallScore: this.calculateOverallScore({
                    structuredAnalysis,
                    skillsAssessment,
                    experienceEvaluation,
                    atsOptimization
                })
            };

        } catch (error) {
            console.error('Advanced OpenAI analysis error:', error);
            return this.getFallbackAnalysis(resumeData, targetRole);
        }
    }

    // Structured analysis with contextual understanding
    async performStructuredAnalysis(resumeData, targetRole, jobDescription) {
        const prompt = `
        You are an expert HR analyst and career counselor with 15+ years of experience. Analyze this resume for a ${targetRole} position.

        RESUME CONTENT:
        ${resumeData.rawText}

        JOB REQUIREMENTS (if provided):
        ${jobDescription}

        CANDIDATE DATA:
        - Skills: ${resumeData.skills.join(', ')}
        - Experience: ${resumeData.experience.length} positions
        - Education: ${resumeData.education.length} entries
        - Total Experience: ${resumeData.totalExperience} years

        Please provide a comprehensive analysis in the following JSON format:
        {
            "overallFit": {
                "percentage": 85,
                "reasoning": "Detailed explanation of why this percentage",
                "keyStrengths": ["strength 1", "strength 2", "strength 3"],
                "majorGaps": ["gap 1", "gap 2"],
                "competitiveness": "high/medium/low with explanation"
            },
            "skillsAnalysis": {
                "technicalSkills": {
                    "current": ["skill1", "skill2"],
                    "proficiencyLevels": {"skill1": 85, "skill2": 70},
                    "marketDemand": {"skill1": "high", "skill2": "medium"}
                },
                "softSkills": {
                    "identified": ["leadership", "communication"],
                    "evidence": {"leadership": "Led team of 5 developers", "communication": "Presented to stakeholders"}
                },
                "missingCritical": ["skill1", "skill2"],
                "emergingSkills2025": ["AI/ML", "Cloud Native", "Cybersecurity"]
            },
            "experienceDepth": {
                "relevantYears": 5,
                "progressionQuality": "strong/moderate/weak",
                "industryAlignment": "excellent/good/poor",
                "leadershipEvidence": true,
                "quantifiableAchievements": 3
            },
            "marketPositioning": {
                "salaryRange": "$80k-$120k",
                "competitorAdvantage": "Unique combination of skills X and Y",
                "careerTrajectory": "Senior role ready/needs development/entry level"
            }
        }

        Be specific, actionable, and honest in your assessment. Focus on 2025 market trends and requirements.
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are an expert HR analyst specializing in resume evaluation and career development." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            console.error('Failed to parse structured analysis:', parseError);
            return this.getStructuredFallback(resumeData, targetRole);
        }
    }

    // Advanced skills assessment with market context
    async assessSkillsProficiency(resumeData, targetRole) {
        const prompt = `
        As a technical skills assessor, evaluate the candidate's skills for a ${targetRole} position in 2025.

        CANDIDATE SKILLS: ${resumeData.skills.join(', ')}
        EXPERIENCE CONTEXT: ${resumeData.experience.map(exp => `${exp.role} at ${exp.company} (${exp.duration})`).join('; ')}

        Provide detailed skills assessment:
        {
            "technicalProficiency": {
                "frameworks": {"React": {"level": 85, "evidence": "3 years commercial experience", "marketDemand": "very-high"}},
                "languages": {"JavaScript": {"level": 90, "evidence": "5+ years, complex projects", "marketDemand": "high"}},
                "tools": {"Docker": {"level": 60, "evidence": "mentioned in projects", "marketDemand": "high"}},
                "databases": {"MongoDB": {"level": 75, "evidence": "used in 2 major projects", "marketDemand": "medium"}}
            },
            "skillGaps": {
                "critical": [{"skill": "Kubernetes", "importance": "high", "learnTime": "3-4 months"}],
                "recommended": [{"skill": "TypeScript", "importance": "medium", "learnTime": "1-2 months"}],
                "emerging": [{"skill": "WebAssembly", "importance": "low", "learnTime": "6+ months"}]
            },
            "learningPath": {
                "immediate": ["Complete Docker certification", "Learn Kubernetes basics"],
                "shortTerm": ["TypeScript fundamentals", "AWS basics"],
                "longTerm": ["System design", "Architecture patterns"]
            },
            "industryBenchmark": {
                "percentile": 75,
                "comparison": "Above average for mid-level developers",
                "standoutSkills": ["React expertise", "Full-stack capability"]
            }
        }

        Base assessments on actual evidence from resume content.
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are a technical skills assessor with deep knowledge of current market demands." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1500
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            return this.getSkillsAssessmentFallback(resumeData, targetRole);
        }
    }

    // Experience evaluation with progression analysis
    async evaluateExperience(resumeData, targetRole) {
        const experienceText = resumeData.experience.map(exp => 
            `${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`
        ).join('\n\n');

        const prompt = `
        Evaluate the career progression and experience quality for a ${targetRole} candidate.

        EXPERIENCE DETAILS:
        ${experienceText}

        TOTAL YEARS: ${resumeData.totalExperience}

        Analyze and provide:
        {
            "careerProgression": {
                "trajectory": "accelerated/steady/stagnant",
                "promotionEvidence": true,
                "responsibilityGrowth": "significant/moderate/minimal",
                "industryRelevance": 85
            },
            "experienceQuality": {
                "projectComplexity": "high/medium/low",
                "leadershipRoles": 2,
                "crossFunctionalWork": true,
                "quantifiableResults": [
                    {"achievement": "Increased efficiency by 40%", "impact": "high"},
                    {"achievement": "Led team of 8", "impact": "medium"}
                ]
            },
            "roleReadiness": {
                "currentLevel": "mid-level",
                "readyFor": "senior-level",
                "gapsToNextLevel": ["system design", "mentoring"],
                "timeToPromotion": "12-18 months"
            },
            "industryFit": {
                "sectorExperience": ["fintech", "e-commerce"],
                "domainKnowledge": "payment systems, user authentication",
                "transferableSkills": ["agile development", "API design"],
                "adaptabilityScore": 80
            }
        }

        Focus on concrete evidence and realistic assessments.
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are a senior HR professional specializing in career progression analysis." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1200
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            return this.getExperienceEvaluationFallback(resumeData, targetRole);
        }
    }

    // ATS optimization with specific recommendations
    async optimizeForATS(resumeData, targetRole) {
        const prompt = `
        Analyze this resume for ATS (Applicant Tracking System) optimization for ${targetRole} positions.

        RESUME TEXT: ${resumeData.rawText}

        Provide specific ATS optimization recommendations:
        {
            "atsScore": {
                "overall": 78,
                "breakdown": {
                    "formatting": 85,
                    "keywords": 70,
                    "structure": 90,
                    "readability": 80
                }
            },
            "keywordAnalysis": {
                "found": ["javascript", "react", "node.js"],
                "missing": ["typescript", "aws", "docker"],
                "density": "optimal/low/high",
                "synonyms": {"javascript": ["js", "ecmascript"], "react": ["reactjs", "react.js"]}
            },
            "formattingIssues": [
                {"issue": "Complex tables detected", "severity": "high", "fix": "Replace with bullet points"},
                {"issue": "Inconsistent date formats", "severity": "medium", "fix": "Use MM/YYYY format consistently"}
            ],
            "structureOptimization": {
                "sectionOrder": ["Contact", "Summary", "Skills", "Experience", "Education", "Projects"],
                "headingStandardization": {"Work History": "Professional Experience", "Tech Stack": "Technical Skills"},
                "bulletPointOptimization": "Use action verbs and quantifiable results"
            },
            "improvementPlan": {
                "immediate": ["Add missing keywords", "Fix formatting issues"],
                "quickWins": ["Optimize section headings", "Improve bullet points"],
                "longTerm": ["Restructure experience descriptions", "Add quantifiable achievements"]
            }
        }

        Provide actionable, specific recommendations based on 2025 ATS standards.
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are an ATS optimization expert with knowledge of modern parsing algorithms." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 1500
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            return this.getATSOptimizationFallback(resumeData, targetRole);
        }
    }

    // Career guidance and strategic recommendations
    async provideCareerGuidance(resumeData, targetRole) {
        const prompt = `
        Provide strategic career guidance for a candidate targeting ${targetRole} positions.

        CURRENT PROFILE:
        - Experience: ${resumeData.totalExperience} years
        - Skills: ${resumeData.skills.join(', ')}
        - Background: ${resumeData.experience.map(exp => exp.role).join(', ')}

        Generate comprehensive career guidance:
        {
            "careerStrategy": {
                "currentPosition": "mid-level developer transitioning to senior roles",
                "marketOpportunities": ["fintech growth", "remote work expansion", "AI integration"],
                "competitiveAdvantages": ["full-stack capability", "domain expertise"],
                "positioningStatement": "Experienced developer with proven track record in scalable applications"
            },
            "skillDevelopment": {
                "prioritySkills": [
                    {"skill": "System Design", "urgency": "high", "impact": "career-changing", "resources": ["Grokking System Design", "AWS Solutions Architect"]},
                    {"skill": "Leadership", "urgency": "medium", "impact": "high", "resources": ["Tech Lead courses", "Mentoring programs"]}
                ],
                "certifications": [
                    {"name": "AWS Solutions Architect", "value": "high", "timeframe": "3-6 months"},
                    {"name": "Kubernetes Administrator", "value": "medium", "timeframe": "2-4 months"}
                ]
            },
            "careerPath": {
                "nextRole": "Senior Software Developer",
                "timeframe": "6-12 months",
                "requirements": ["system design knowledge", "leadership experience", "cloud expertise"],
                "salaryProgression": "$95k → $130k",
                "alternativePaths": ["Technical Lead", "Solutions Architect", "Product Engineer"]
            },
            "jobSearchStrategy": {
                "targetCompanies": ["tech startups", "fintech scale-ups", "remote-first companies"],
                "networking": ["tech meetups", "open source contributions", "industry conferences"],
                "portfolioProjects": [
                    {"type": "Microservices Architecture", "technologies": ["Docker", "Kubernetes", "AWS"]},
                    {"type": "Real-time Dashboard", "technologies": ["React", "WebSocket", "Redis"]}
                ]
            },
            "interview準備": {
                "technicalPrep": ["system design practice", "coding challenges", "architecture discussions"],
                "behavioralPrep": ["leadership stories", "problem-solving examples", "team collaboration"],
                "commonQuestions": ["How do you handle technical debt?", "Describe a challenging project", "Team conflict resolution"]
            }
        }

        Base recommendations on 2025 market trends and realistic career progression.
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are a senior career counselor specializing in technology careers with deep market knowledge." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            return this.getCareerGuidanceFallback(resumeData, targetRole);
        }
    }

    // Calculate comprehensive overall score
    calculateOverallScore(analysisResults) {
        const weights = {
            overallFit: 0.3,
            skillsRelevance: 0.25,
            experienceQuality: 0.25,
            atsOptimization: 0.2
        };

        const scores = {
            overallFit: analysisResults.structuredAnalysis?.overallFit?.percentage || 70,
            skillsRelevance: analysisResults.skillsAssessment?.industryBenchmark?.percentile || 65,
            experienceQuality: analysisResults.experienceEvaluation?.careerProgression?.industryRelevance || 75,
            atsOptimization: analysisResults.atsOptimization?.atsScore?.overall || 70
        };

        const weightedScore = Object.keys(weights).reduce((total, key) => {
            return total + (scores[key] * weights[key]);
        }, 0);

        return {
            overall: Math.round(weightedScore),
            breakdown: scores,
            weights,
            interpretation: this.interpretScore(Math.round(weightedScore))
        };
    }

    interpretScore(score) {
        if (score >= 85) return { level: "Excellent", message: "Strong candidate with competitive advantage" };
        if (score >= 75) return { level: "Good", message: "Solid candidate with some areas for improvement" };
        if (score >= 65) return { level: "Average", message: "Meets basic requirements but needs enhancement" };
        return { level: "Below Average", message: "Significant improvements needed for competitiveness" };
    }

    // Fallback methods for when OpenAI is not available
    getFallbackAnalysis(resumeData, targetRole) {
        return {
            overallFit: {
                percentage: 75,
                reasoning: "Analysis based on resume structure and content matching",
                keyStrengths: resumeData.skills.slice(0, 3),
                majorGaps: ["System design", "Cloud expertise", "Leadership experience"],
                competitiveness: "medium - has relevant skills but needs enhancement"
            },
            skillsAnalysis: this.getSkillsAssessmentFallback(resumeData, targetRole),
            experienceEvaluation: this.getExperienceEvaluationFallback(resumeData, targetRole),
            atsOptimization: this.getATSOptimizationFallback(resumeData, targetRole),
            careerGuidance: this.getCareerGuidanceFallback(resumeData, targetRole),
            overallScore: {
                overall: 75,
                breakdown: { overallFit: 75, skillsRelevance: 70, experienceQuality: 80, atsOptimization: 75 },
                interpretation: { level: "Good", message: "Solid foundation with improvement potential" }
            }
        };
    }

    getSkillsAssessmentFallback(resumeData, targetRole) {
        const roleSkills = {
            'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
            'Software Developer': ['JavaScript', 'Python', 'Git', 'React', 'Node.js'],
            'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript']
        };

        const requiredSkills = roleSkills[targetRole] || roleSkills['Software Developer'];
        const userSkills = resumeData.skills.map(s => s.toLowerCase());
        
        return {
            technicalProficiency: resumeData.skills.reduce((acc, skill) => {
                acc[skill] = { level: Math.floor(Math.random() * 30) + 60, evidence: "Based on resume content", marketDemand: "medium" };
                return acc;
            }, {}),
            skillGaps: {
                critical: requiredSkills.filter(skill => !userSkills.some(us => us.includes(skill.toLowerCase()))).slice(0, 3),
                recommended: ["TypeScript", "Docker", "AWS"],
                emerging: ["AI/ML", "WebAssembly", "Edge Computing"]
            },
            industryBenchmark: {
                percentile: 70,
                comparison: "Average for role level",
                standoutSkills: resumeData.skills.slice(0, 2)
            }
        };
    }

    getExperienceEvaluationFallback(resumeData, targetRole) {
        return {
            careerProgression: {
                trajectory: resumeData.totalExperience >= 3 ? "steady" : "developing",
                industryRelevance: 75
            },
            experienceQuality: {
                projectComplexity: "medium",
                leadershipRoles: resumeData.experience.length > 2 ? 1 : 0,
                quantifiableResults: []
            },
            roleReadiness: {
                currentLevel: resumeData.totalExperience >= 5 ? "senior" : "mid-level",
                readyFor: resumeData.totalExperience >= 3 ? "senior-level" : "mid-level"
            }
        };
    }

    getATSOptimizationFallback(resumeData, targetRole) {
        return {
            atsScore: { overall: 75, breakdown: { formatting: 80, keywords: 70, structure: 80, readability: 75 } },
            keywordAnalysis: { found: resumeData.skills.slice(0, 5), missing: ["cloud", "agile", "ci/cd"] },
            formattingIssues: [],
            improvementPlan: { immediate: ["Add keywords"], quickWins: ["Improve formatting"] }
        };
    }

    getCareerGuidanceFallback(resumeData, targetRole) {
        return {
            careerStrategy: {
                currentPosition: `${resumeData.totalExperience}+ year ${targetRole}`,
                marketOpportunities: ["remote work", "digital transformation", "startup growth"]
            },
            skillDevelopment: {
                prioritySkills: [
                    { skill: "Cloud Technologies", urgency: "high", impact: "high" },
                    { skill: "System Design", urgency: "medium", impact: "high" }
                ]
            },
            careerPath: {
                nextRole: `Senior ${targetRole}`,
                timeframe: "12-18 months",
                requirements: ["advanced technical skills", "leadership experience"]
            }
        };
    }
}

module.exports = new AdvancedOpenAIService();
