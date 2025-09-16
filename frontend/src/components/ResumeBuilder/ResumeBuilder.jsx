import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Grid, TextField, Button, Box, Chip, 
  Stepper, Step, StepLabel, Card, CardContent, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { Add, Delete, Download, Preview, ArrowBack, ArrowForward } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ResumeBuilder = ({ analysisData, onBack }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      location: ''
    },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: []
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = ['Personal Info', 'Summary', 'Skills', 'Experience', 'Education', 'Projects'];

  // Auto-populate data from analysis
  useEffect(() => {
    if (analysisData?.resumeData) {
      const data = analysisData.resumeData;
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          location: prev.personalInfo.location
        },
        summary: data.summary || `Experienced ${analysisData.targetRole} with ${data.totalExperience || 2}+ years of experience`,
        skills: data.skills || [],
        experience: data.experience.length > 0 ? data.experience : [{ 
          company: '', 
          role: '', 
          duration: '', 
          description: '' 
        }],
        education: data.education.length > 0 ? data.education : [{ 
          institution: '', 
          degree: '', 
          year: '' 
        }],
        projects: data.projects.length > 0 ? data.projects : [{ 
          title: '', 
          description: '',
          technologies: ''
        }]
      }));
    }
  }, [analysisData]);

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Info
        if (!formData.personalInfo.name) newErrors.name = 'Name is required';
        if (!formData.personalInfo.email) newErrors.email = 'Email is required';
        if (!formData.personalInfo.phone) newErrors.phone = 'Phone is required';
        break;
      case 1: // Summary
        if (!formData.summary || formData.summary.length < 50) {
          newErrors.summary = 'Summary should be at least 50 characters';
        }
        break;
      case 2: // Skills
        if (formData.skills.length < 3) {
          newErrors.skills = 'Add at least 3 skills';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Input handlers
  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleArrayChange = (section, index, field, value) => {
    const updated = [...formData[section]];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const addArrayItem = (section) => {
    const newItems = {
      experience: { company: '', role: '', duration: '', description: '' },
      education: { institution: '', degree: '', year: '' },
      projects: { title: '', description: '', technologies: '' }
    };
    
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newItems[section]]
    }));
  };

  const removeArrayItem = (section, index) => {
    const updated = [...formData[section]];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  // Skills management
  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      if (errors.skills) setErrors(prev => ({ ...prev, skills: null }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // PDF Generation with professional formatting
  const generatePDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header - Name and Contact Info
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(formData.personalInfo.name, 20, yPosition);
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const contactInfo = [
      formData.personalInfo.email,
      formData.personalInfo.phone,
      formData.personalInfo.linkedin,
      formData.personalInfo.location
    ].filter(Boolean).join(' | ');
    
    doc.text(contactInfo, 20, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFESSIONAL SUMMARY', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(formData.summary, 170);
    doc.text(summaryLines, 20, yPosition);
    yPosition += summaryLines.length * 4 + 10;

    // Skills Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICAL SKILLS', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const skillsText = formData.skills.join(' • ');
    const skillsLines = doc.splitTextToSize(skillsText, 170);
    doc.text(skillsLines, 20, yPosition);
    yPosition += skillsLines.length * 4 + 10;

    // Experience Section
    if (formData.experience.some(exp => exp.role || exp.company)) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL EXPERIENCE', 20, yPosition);
      yPosition += 8;

      formData.experience.forEach(exp => {
        if (exp.role || exp.company) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${exp.role} - ${exp.company}`, 20, yPosition);
          
          if (exp.duration) {
            doc.setFont('helvetica', 'normal');
            doc.text(`(${exp.duration})`, 120, yPosition);
          }
          
          yPosition += 6;

          if (exp.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(exp.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += descLines.length * 4 + 6;
          }
        }
      });
      yPosition += 5;
    }

    // Education Section
    if (formData.education.some(edu => edu.degree || edu.institution)) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCATION', 20, yPosition);
      yPosition += 8;

      formData.education.forEach(edu => {
        if (edu.degree || edu.institution) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${edu.degree}`, 20, yPosition);
          
          doc.setFont('helvetica', 'normal');
          doc.text(`${edu.institution}`, 20, yPosition + 5);
          
          if (edu.year) {
            doc.text(`(${edu.year})`, 120, yPosition);
          }
          
          yPosition += 12;
        }
      });
      yPosition += 5;
    }

    // Projects Section
    if (formData.projects.some(proj => proj.title)) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECTS', 20, yPosition);
      yPosition += 8;

      formData.projects.forEach(proj => {
        if (proj.title) {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(proj.title, 20, yPosition);
          yPosition += 6;

          if (proj.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const projLines = doc.splitTextToSize(proj.description, 170);
            doc.text(projLines, 20, yPosition);
            yPosition += projLines.length * 4;
          }

          if (proj.technologies) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(`Technologies: ${proj.technologies}`, 20, yPosition + 3);
            yPosition += 8;
          }
          
          yPosition += 5;
        }
      });
    }

    // Save the PDF
    doc.save(`${formData.personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Personal Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.personalInfo.name}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.personalInfo.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.personalInfo.location}
                onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="LinkedIn Profile"
                value={formData.personalInfo.linkedin}
                onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/yourprofile"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GitHub Profile"
                value={formData.personalInfo.github}
                onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                placeholder="github.com/yourusername"
              />
            </Grid>
          </Grid>
        );

      case 1: // Summary
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Professional Summary</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Professional Summary"
                placeholder="Write a compelling summary highlighting your key strengths, experience, and career objectives..."
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                error={!!errors.summary}
                helperText={errors.summary || `${formData.summary.length} characters`}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Tip:</strong> Include your years of experience, key skills, and what you can offer to employers. 
                  Keep it between 50-150 words.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      case 2: // Skills
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Technical Skills</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Skills ({formData.skills.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    color="primary"
                  />
                ))}
              </Box>
              {errors.skills && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.skills}
                </Typography>
              )}
            </Grid>
            
            {analysisData?.missingSkills && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Recommended Skills for {analysisData.targetRole}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysisData.missingSkills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      onClick={() => addSkill(skill)}
                      color="secondary"
                      variant="outlined"
                      clickable
                    />
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Add Custom Skill"
                placeholder="Type a skill and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
            </Grid>
          </Grid>
        );

      case 3: // Experience
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Work Experience</Typography>
            </Grid>
            {formData.experience.map((exp, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Experience {index + 1}</Typography>
                      <IconButton 
                        color="error" 
                        onClick={() => removeArrayItem('experience', index)}
                        disabled={formData.experience.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Job Title"
                          value={exp.role}
                          onChange={(e) => handleArrayChange('experience', index, 'role', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Company"
                          value={exp.company}
                          onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Duration"
                          placeholder="Jan 2020 - Present"
                          value={exp.duration}
                          onChange={(e) => handleArrayChange('experience', index, 'duration', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          placeholder="Describe your responsibilities, achievements, and impact..."
                          value={exp.description}
                          onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => addArrayItem('experience')}
              >
                Add Experience
              </Button>
            </Grid>
          </Grid>
        );

      case 4: // Education
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Education</Typography>
            </Grid>
            {formData.education.map((edu, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Education {index + 1}</Typography>
                      <IconButton 
                        color="error" 
                        onClick={() => removeArrayItem('education', index)}
                        disabled={formData.education.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Degree"
                          placeholder="Bachelor of Science in Computer Science"
                          value={edu.degree}
                          onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Institution"
                          value={edu.institution}
                          onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Year"
                          placeholder="2018-2022"
                          value={edu.year}
                          onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => addArrayItem('education')}
              >
                Add Education
              </Button>
            </Grid>
          </Grid>
        );

      case 5: // Projects
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Projects</Typography>
            </Grid>
            {formData.projects.map((proj, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Project {index + 1}</Typography>
                      <IconButton 
                        color="error" 
                        onClick={() => removeArrayItem('projects', index)}
                        disabled={formData.projects.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Project Title"
                          value={proj.title}
                          onChange={(e) => handleArrayChange('projects', index, 'title', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          placeholder="Describe what the project does, your role, and the impact..."
                          value={proj.description}
                          onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Technologies Used"
                          placeholder="React, Node.js, MongoDB, AWS..."
                          value={proj.technologies}
                          onChange={(e) => handleArrayChange('projects', index, 'technologies', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => addArrayItem('projects')}
              >
                Add Project
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Suggested Projects for {analysisData?.targetRole}:</strong>
                  <ul style={{ margin: '8px 0' }}>
                    {analysisData?.projectSuggestions?.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mr: 2 }}>
            Back to Analysis
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Resume Builder
          </Typography>
          <Button 
            onClick={() => setPreviewOpen(true)} 
            startIcon={<Preview />}
            variant="outlined"
          >
            Preview
          </Button>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card sx={{ mb: 3, minHeight: 400 }}>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            disabled={activeStep === 0} 
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Previous
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                <Button 
                  variant="outlined" 
                  onClick={() => setPreviewOpen(true)}
                  startIcon={<Preview />}
                  sx={{ mr: 2 }}
                >
                  Preview Resume
                </Button>
                <Button 
                  variant="contained" 
                  onClick={generatePDF}
                  startIcon={<Download />}
                >
                  Download PDF
                </Button>
              </>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Resume Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: 'grey.50', minHeight: 400 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              {formData.personalInfo.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {[formData.personalInfo.email, formData.personalInfo.phone, formData.personalInfo.location]
                .filter(Boolean).join(' | ')}
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Summary</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>{formData.summary}</Typography>
            
            <Typography variant="h6" sx={{ mb: 1 }}>Skills</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formData.skills.join(' • ')}
            </Typography>

            {/* Experience preview */}
            {formData.experience.some(exp => exp.role) && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>Experience</Typography>
                {formData.experience.map((exp, index) => (
                  exp.role && (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">
                        {exp.role} - {exp.company} ({exp.duration})
                      </Typography>
                      <Typography variant="body2">{exp.description}</Typography>
                    </Box>
                  )
                ))}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" onClick={generatePDF} startIcon={<Download />}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeBuilder;
