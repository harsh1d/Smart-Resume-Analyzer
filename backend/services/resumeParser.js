const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class ResumeParser {
    async parseResume(file) {
        let text = '';
        
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        }

        return this.extractResumeData(text);
    }

    extractResumeData(text) {
        // Extract contact information
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const phoneRegex = /(\+\d{1,3}[- ]?)?\d{10}/;
        
        // Extract skills (basic pattern matching)
        const skillsSection = text.match(/skills?:?\s*(.*?)(?:\n\n|\n[A-Z])/is);
        const skills = skillsSection ? skillsSection[1].split(/[,\n]/).map(s => s.trim()) : [];

        // Extract experience years
        const experienceRegex = /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i;
        const experienceMatch = text.match(experienceRegex);

        return {
            email: text.match(emailRegex)?.[0] || '',
            phone: text.match(phoneRegex)?.[0] || '',
            skills: skills.filter(skill => skill.length > 0),
            experience: experienceMatch ? parseInt(experienceMatch[1]) : 0,
            rawText: text
        };
    }
}

module.exports = new ResumeParser();
