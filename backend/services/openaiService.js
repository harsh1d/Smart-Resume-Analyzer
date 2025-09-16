const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OpenAI API key not found. Service will return mock data.');
            this.client = null;
            return;
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async analyzeResume(resumeText, targetRole) {
        // Return mock data if no API key
        if (!this.client) {
            return this.getMockAnalysis(targetRole);
        }

        try {
            const prompt = `
            Analyze this resume for a ${targetRole} position and provide analysis in JSON format:

            Resume Text: ${resumeText}
            
            Please provide your response as a valid JSON object with these fields:
            {
                "skillsAnalysis": {"skill1": 85, "skill2": 70},
                "missingSkills": ["skill1", "skill2"],
                "improvements": ["improvement1", "improvement2"],
                "projectSuggestions": ["project1", "project2"]
            }
            `;

            const response = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            const content = response.choices[0].message.content;
            
            // Parse JSON response
            try {
                return JSON.parse(content);
            } catch (parseError) {
                console.error('Failed to parse OpenAI response:', parseError);
                return this.getMockAnalysis(targetRole);
            }

        } catch (error) {
            console.error('OpenAI API error:', error);
            
            if (error.code === 'invalid_api_key') {
                throw new Error('Invalid OpenAI API key');
            }
            
            // Return mock data as fallback
            return this.getMockAnalysis(targetRole);
        }
    }

    getMockAnalysis(targetRole) {
        const mockData = {
            'Software Developer': {
                skillsAnalysis: {
                    'JavaScript': 85,
                    'Python': 75,
                    'React': 80,
                    'Node.js': 70,
                    'SQL': 65
                },
                missingSkills: ['Docker', 'Kubernetes', 'AWS', 'TypeScript', 'GraphQL'],
                improvements: [
                    'Add more specific technical achievements with metrics',
                    'Include relevant certifications (AWS, Google Cloud)',
                    'Optimize keywords for ATS systems',
                    'Add links to GitHub projects'
                ],
                projectSuggestions: [
                    'Build a full-stack e-commerce application',
                    'Create a real-time chat application',
                    'Develop a REST API with authentication'
                ]
            },
            'Data Scientist': {
                skillsAnalysis: {
                    'Python': 85,
                    'SQL': 75,
                    'Machine Learning': 70,
                    'Statistics': 80,
                    'Data Visualization': 65
                },
                missingSkills: ['TensorFlow', 'PyTorch', 'Apache Spark', 'MLOps', 'Deep Learning'],
                improvements: [
                    'Highlight specific ML models and their performance metrics',
                    'Include experience with big data tools',
                    'Add certifications in data science or cloud platforms',
                    'Showcase end-to-end ML project deployment'
                ],
                projectSuggestions: [
                    'Build a predictive analytics dashboard',
                    'Create a recommendation system',
                    'Develop a computer vision application'
                ]
            }
        };

        return mockData[targetRole] || mockData['Software Developer'];
    }
}

module.exports = new OpenAIService();
