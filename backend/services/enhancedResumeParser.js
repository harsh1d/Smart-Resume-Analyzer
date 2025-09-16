const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class EnhancedResumeParser {
    async parseResumeAdvanced(file) {
        try {
            let text = '';
            
            if (file.mimetype === 'application/pdf') {
                const data = await pdf(file.buffer);
                text = data.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            }

            return {
                rawText: text,
                ...this.extractAdvancedStructure(text),
                metadata: {
                    wordCount: text.split(' ').length,
                    pageCount: this.estimatePages(text),
                    complexity: this.assessComplexity(text),
                    parseQuality: this.assessParseQuality(text)
                }
            };

        } catch (error) {
            throw new Error(`Failed to parse resume: ${error.message}`);
        }
    }

    extractAdvancedStructure(text) {
        return {
            personalInfo: this.extractPersonalInfo(text),
            summary: this.extractSummary(text),
            skills: this.extractSkillsAdvanced(text),
            experience: this.extractExperienceAdvanced(text),
            education: this.extractEducationAdvanced(text),
            projects: this.extractProjectsAdvanced(text),
            certifications: this.extractCertifications(text),
            achievements: this.extractAchievements(text),
            languages: this.extractLanguages(text),
            totalExperience: this.calculateTotalExperience(text)
        };
    }

    extractPersonalInfo(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const linkedinRegex = /(?:linkedin\.com\/in\/|li\.com\/)([a-zA-Z0-9-]+)/gi;
        const githubRegex = /(?:github\.com\/)([a-zA-Z0-9-]+)/gi;
        const nameRegex = /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/m;

        return {
            name: this.extractName(text),
            email: (text.match(emailRegex) || [])[0] || '',
            phone: (text.match(phoneRegex) || [])[0] || '',
            linkedin: (text.match(linkedinRegex) || [])[0] || '',
            github: (text.match(githubRegex) || [])[0] || '',
            location: this.extractLocation(text),
            website: this.extractWebsite(text)
        };
    }

    extractName(text) {
        // Try multiple approaches to extract name
        const lines = text.split('\n').filter(line => line.trim());
        
        // First non-empty line is often the name
        const firstLine = lines[0]?.trim() || '';
        if (firstLine && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(firstLine)) {
            return firstLine.split(/\s{2,}|,/)[0]; // Remove extra info
        }

        // Look for name patterns
        const namePatterns = [
            /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m,
            /name[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i
        ];

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }

        return '';
    }

    extractSkillsAdvanced(text) {
        const skillsSections = [
            /(?:technical\s+)?skills?[:\s]+(.*?)(?:\n\s*\n|\n[A-Z]|\n•|\nEducation|\nExperience|\nWork|\nProjects?|$)/is,
            /technologies?[:\s]+(.*?)(?:\n\s*\n|\n[A-Z]|$)/is,
            /(?:programming\s+)?languages?[:\s]+(.*?)(?:\n\s*\n|\n[A-Z]|$)/is,
            /tools?\s+(?:and\s+)?technologies?[:\s]+(.*?)(?:\n\s*\n|\n[A-Z]|$)/is
        ];

        const skillsSet = new Set();
        
        skillsSections.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                const skillsText = match[1];
                this.parseSkillsText(skillsText).forEach(skill => skillsSet.add(skill));
            }
        });

        // Also extract skills from job descriptions
        this.extractSkillsFromContext(text).forEach(skill => skillsSet.add(skill));

        return Array.from(skillsSet).slice(0, 25); // Limit to 25 skills
    }

    parseSkillsText(text) {
        return text
            .split(/[,\n•\-\|\/]/)
            .map(skill => skill.trim())
            .filter(skill => 
                skill.length > 1 && 
                skill.length < 30 && 
                !skill.match(/^\d+$/) && // Not just numbers
                !skill.match(/^(and|or|the|in|at|for|with)$/i) // Not common words
            )
            .map(skill => skill.replace(/[()[\]]/g, '')) // Remove brackets
            .slice(0, 20);
    }

    extractSkillsFromContext(text) {
        const techSkills = [
            'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
            'HTML', 'CSS', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
            'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
            'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
            'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum'
        ];

        const lowerText = text.toLowerCase();
        return techSkills.filter(skill => 
            lowerText.includes(skill.toLowerCase())
        );
    }

    extractExperienceAdvanced(text) {
        const experienceSection = this.extractSection(text, /(?:professional\s+)?experience|work\s+(?:history|experience)|employment/i);
        
        if (!experienceSection) return [];

        const experiences = [];
        const entries = experienceSection.split(/\n\s*\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const experience = this.parseExperienceEntry(entry);
            if (experience.role || experience.company) {
                experiences.push(experience);
            }
        }

        return experiences.slice(0, 8); // Limit to 8 experiences
    }

    parseExperienceEntry(entry) {
        const lines = entry.split('\n').map(line => line.trim()).filter(line => line);
        
        let role = '';
        let company = '';
        let duration = '';
        let location = '';
        let description = '';

        // Parse first line for role and company
        const firstLine = lines[0] || '';
        const roleCompanyPatterns = [
            /^(.+?)\s+(?:at|@|-)\s+(.+?)(?:\s*\|\s*(.+?))?(?:\s*\((.+?)\))?\s*$/,
            /^(.+?),\s*(.+?)(?:\s*\((.+?)\))?\s*$/,
            /^(.+?)\s*-\s*(.+?)(?:\s*\((.+?)\))?\s*$/
        ];

        for (const pattern of roleCompanyPatterns) {
            const match = firstLine.match(pattern);
            if (match) {
                role = match[1].trim();
                company = match[2].trim();
                duration = match[3] || match[4] || '';
                break;
            }
        }

        // Extract duration if not found
        if (!duration) {
            for (const line of lines) {
                const durationMatch = line.match(/(\d{4}(?:\s*-\s*(?:\d{4}|present|current))|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}(?:\s*-\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}|present|current)))/i);
                if (durationMatch) {
                    duration = durationMatch[1];
                    break;
                }
            }
        }

        // Combine remaining lines as description
        description = lines.slice(1).join(' ').trim();

        return {
            role: role || '',
            company: company || '',
            duration: duration || '',
            location: location || '',
            description: description || '',
            responsibilities: this.extractResponsibilities(description),
            achievements: this.extractQuantifiableAchievements(description)
        };
    }

    extractResponsibilities(description) {
        const bulletPoints = description.split(/[•\-\*]\s*/).filter(point => point.trim());
        return bulletPoints.slice(0, 5); // Limit to 5 responsibilities
    }

    extractQuantifiableAchievements(description) {
        const patterns = [
            /(\d+(?:\.\d+)?%)/g, // Percentages
            /(\$\d+(?:,\d{3})*(?:\.\d{2})?[kmb]?)/gi, // Money amounts
            /(\d+(?:,\d{3})*)\s+(?:users|customers|clients|people|team|members)/gi, // Numbers of people
            /(?:increased|improved|reduced|decreased|grew|built|managed|led)\s+[^.]*?(\d+(?:\.\d+)?[%kmb]?)/gi
        ];

        const achievements = [];
        patterns.forEach(pattern => {
            const matches = description.match(pattern) || [];
            achievements.push(...matches.slice(0, 3));
        });

        return achievements.slice(0, 5);
    }

    extractEducationAdvanced(text) {
        const educationSection = this.extractSection(text, /education|academic/i);
        if (!educationSection) return [];

        const educations = [];
        const entries = educationSection.split(/\n\s*\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const education = this.parseEducationEntry(entry);
            if (education.degree || education.institution) {
                educations.push(education);
            }
        }

        return educations.slice(0, 5);
    }

    parseEducationEntry(entry) {
        const lines = entry.split('\n').map(line => line.trim()).filter(line => line);
        
        let degree = '';
        let institution = '';
        let year = '';
        let gpa = '';
        let major = '';

        // Common degree patterns
        const degreePatterns = [
            /(bachelor|master|phd|doctorate|associate|diploma|certificate).+?(?:in|of)\s+(.+?)(?:\s+from|\s+at|\s*\n|$)/i,
            /(b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?)\s*(?:in|of)?\s*(.+?)(?:\s+from|\s+at|\s*\n|$)/i
        ];

        for (const line of lines) {
            // Extract year
            const yearMatch = line.match(/\b(19|20)\d{2}\b/);
            if (yearMatch && !year) {
                year = yearMatch[0];
            }

            // Extract GPA
            const gpaMatch = line.match(/gpa[:\s]*(\d+\.\d+)/i);
            if (gpaMatch) {
                gpa = gpaMatch[1];
            }

            // Extract degree and major
            for (const pattern of degreePatterns) {
                const match = line.match(pattern);
                if (match) {
                    degree = match[1];
                    major = match[2];
                    break;
                }
            }

            // Extract institution
            if (!institution && line.length > 5 && !line.match(/\d{4}/) && !line.match(/gpa/i)) {
                institution = line;
            }
        }

        return {
            degree: degree || '',
            major: major || '',
            institution: institution || '',
            year: year || '',
            gpa: gpa || ''
        };
    }

    extractProjectsAdvanced(text) {
        const projectsSection = this.extractSection(text, /projects?|portfolio/i);
        if (!projectsSection) return [];

        const projects = [];
        const entries = projectsSection.split(/\n\s*\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const project = this.parseProjectEntry(entry);
            if (project.title) {
                projects.push(project);
            }
        }

        return projects.slice(0, 6);
    }

    parseProjectEntry(entry) {
        const lines = entry.split('\n').map(line => line.trim()).filter(line => line);
        
        const title = lines[0] || '';
        const description = lines.slice(1).join(' ').trim();
        
        return {
            title,
            description,
            technologies: this.extractTechnologiesFromProject(description),
            url: this.extractURL(description),
            github: this.extractGitHubURL(description)
        };
    }

    extractTechnologiesFromProject(text) {
        const techPattern = /(?:technologies?|tech\s+stack|built\s+with|using)[:\s]+(.*?)(?:\.|$)/i;
        const match = text.match(techPattern);
        
        if (match) {
            return match[1].split(/[,\|\s]+/).filter(tech => tech.length > 1).slice(0, 8);
        }

        return [];
    }

    extractCertifications(text) {
        const certSection = this.extractSection(text, /certifications?|certificates?/i);
        if (!certSection) return [];

        const certifications = [];
        const lines = certSection.split('\n').filter(line => line.trim());

        for (const line of lines) {
            if (line.length > 5) {
                const yearMatch = line.match(/\b(19|20)\d{2}\b/);
                certifications.push({
                    name: line.replace(/\b(19|20)\d{2}\b/, '').trim(),
                    year: yearMatch ? yearMatch[0] : '',
                    issuer: this.extractCertIssuer(line)
                });
            }
        }

        return certifications.slice(0, 5);
    }

    extractSection(text, sectionRegex) {
        const sectionMatch = text.match(new RegExp(`(${sectionRegex.source})[:\n](.+?)(?=\n[A-Z][a-z]+:|$)`, 'is'));
        return sectionMatch ? sectionMatch[2].trim() : null;
    }

    calculateTotalExperience(text) {
        const currentYear = new Date().getFullYear();
        let totalMonths = 0;
        
        // Extract all date ranges
        const dateRanges = text.match(/(\d{4})\s*[-–]\s*(?:(\d{4})|present|current)/gi) || [];
        
        for (const range of dateRanges) {
            const match = range.match(/(\d{4})\s*[-–]\s*(?:(\d{4})|present|current)/i);
            if (match) {
                const startYear = parseInt(match[1]);
                const endYear = match[2] ? parseInt(match[2]) : currentYear;
                totalMonths += (endYear - startYear) * 12;
            }
        }

        return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
    }

    assessComplexity(text) {
        const factors = {
            length: text.length > 5000 ? 2 : text.length > 2000 ? 1 : 0,
            sections: (text.match(/\n[A-Z][a-z]+:/g) || []).length,
            bulletPoints: (text.match(/[•\-\*]\s/g) || []).length,
            technicalTerms: this.countTechnicalTerms(text)
        };

        const score = factors.length + factors.sections + Math.min(factors.bulletPoints / 5, 3) + Math.min(factors.technicalTerms / 10, 3);
        
        if (score >= 8) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    }

    assessParseQuality(text) {
        const indicators = {
            hasStructure: /\n[A-Z][a-z]+:/.test(text),
            hasContact: /@/.test(text),
            hasExperience: /\d{4}/.test(text),
            hasSkills: /skills?|technologies?/i.test(text),
            readable: text.length > 500
        };

        const quality = Object.values(indicators).filter(Boolean).length;
        return quality >= 4 ? 'high' : quality >= 2 ? 'medium' : 'low';
    }

    countTechnicalTerms(text) {
        const techTerms = [
            'API', 'REST', 'GraphQL', 'microservices', 'database', 'SQL', 'NoSQL',
            'cloud', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
            'machine learning', 'AI', 'algorithm', 'data structure', 'framework',
            'library', 'frontend', 'backend', 'full stack', 'mobile', 'web',
            'agile', 'scrum', 'git', 'version control', 'testing', 'deployment'
        ];

        const lowerText = text.toLowerCase();
        return techTerms.filter(term => lowerText.includes(term.toLowerCase())).length;
    }

    estimatePages(text) {
        // Rough estimation: 250-300 words per page
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 275);
    }

    extractURL(text) {
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : '';
    }

    extractGitHubURL(text) {
        const githubMatch = text.match(/(?:github\.com\/[^\s]+|git@github\.com:[^\s]+)/);
        return githubMatch ? githubMatch[0] : '';
    }

    extractLocation(text) {
        const locationPatterns = [
            /(?:address|location|based in)[:\s]+([^,\n]+(?:,\s*[^,\n]+)*)/i,
            /([A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z][a-z]+)/
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }

        return '';
    }

    extractWebsite(text) {
        const websiteMatch = text.match(/(?:website|portfolio)[:\s]+([^\s\n]+)/i);
        return websiteMatch ? websiteMatch[1] : '';
    }

    extractCertIssuer(text) {
        const issuers = ['AWS', 'Google', 'Microsoft', 'Oracle', 'Salesforce', 'CompTIA', 'Cisco'];
        const lowerText = text.toLowerCase();
        
        for (const issuer of issuers) {
            if (lowerText.includes(issuer.toLowerCase())) {
                return issuer;
            }
        }
        
        return '';
    }

    extractAchievements(text) {
        const achievementPatterns = [
            /(?:achieved|accomplished|delivered|increased|improved|reduced|built|led|managed)[^.]*?(\d+[%kmb]?)/gi,
            /(?:award|recognition|honor|achievement)[:\s]+([^.\n]+)/gi
        ];

        const achievements = [];
        
        achievementPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            achievements.push(...matches.slice(0, 5));
        });

        return achievements.slice(0, 8);
    }

    extractLanguages(text) {
        const languageSection = this.extractSection(text, /languages?/i);
        if (!languageSection) return [];

        const languages = [];
        const commonLanguages = [
            'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
            'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
        ];

        const lowerSection = languageSection.toLowerCase();
        
        commonLanguages.forEach(lang => {
            if (lowerSection.includes(lang.toLowerCase())) {
                const proficiencyMatch = languageSection.match(new RegExp(`${lang}[^,\n]*?(native|fluent|advanced|intermediate|basic|conversational)`, 'i'));
                languages.push({
                    language: lang,
                    proficiency: proficiencyMatch ? proficiencyMatch[1] : 'unspecified'
                });
            }
        });

        return languages.slice(0, 5);
    }
}

module.exports = new EnhancedResumeParser();
