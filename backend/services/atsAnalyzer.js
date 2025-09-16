class ATSAnalyzer {
    analyzeATSCompatibility(resumeData) {
        let score = 0;
        const feedback = [];

        // Check for contact information
        if (resumeData.email) score += 15;
        else feedback.push("Add email address");

        if (resumeData.phone) score += 10;
        else feedback.push("Add phone number");

        // Check for skills section
        if (resumeData.skills.length > 0) score += 25;
        else feedback.push("Add skills section");

        // Check for keywords density
        const keywordDensity = this.calculateKeywordDensity(resumeData.rawText);
        score += Math.min(keywordDensity * 2, 20);

        // Check formatting (simple text analysis)
        if (this.hasGoodFormatting(resumeData.rawText)) score += 15;
        else feedback.push("Improve formatting and structure");

        // Check length
        const wordCount = resumeData.rawText.split(' ').length;
        if (wordCount >= 300 && wordCount <= 800) score += 15;
        else feedback.push("Optimize resume length (300-800 words)");

        return {
            score: Math.min(score, 100),
            feedback,
            improvements: this.generateImprovements(score)
        };
    }

    calculateKeywordDensity(text) {
        const techKeywords = [
            'javascript', 'python', 'react', 'node.js', 'mongodb',
            'sql', 'git', 'aws', 'docker', 'kubernetes', 'agile'
        ];
        
        const lowerText = text.toLowerCase();
        const foundKeywords = techKeywords.filter(keyword => 
            lowerText.includes(keyword)
        );
        
        return (foundKeywords.length / techKeywords.length) * 100;
    }

    hasGoodFormatting(text) {
        const sections = ['experience', 'education', 'skills', 'projects'];
        const foundSections = sections.filter(section => 
            text.toLowerCase().includes(section)
        );
        return foundSections.length >= 3;
    }

    generateImprovements(score) {
        if (score >= 80) return ["Excellent ATS compatibility!"];
        if (score >= 60) return ["Good compatibility with minor improvements needed"];
        return ["Significant improvements needed for ATS compatibility"];
    }
}

module.exports = new ATSAnalyzer();
