import React from 'react';
import { 
  Paper, Typography, Box, Grid, Chip, LinearProgress, 
  Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  CheckCircle, Warning, TrendingUp, School, 
  Work, Star, ExpandMore 
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const AnalysisResults = ({ analysisData }) => {
  const { 
    skillsAnalysis, 
    missingSkills, 
    atsScore, 
    improvements, 
    projectSuggestions,
    resumeData 
  } = analysisData;

  const skillsData = Object.entries(skillsAnalysis || {}).map(([skill, level]) => ({
    skill,
    level: typeof level === 'number' ? level : 70
  }));

  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        Resume Analysis Results
      </Typography>

      <Grid container spacing={3}>
        {/* ATS Score Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ATS Compatibility Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h2" sx={{ color: getScoreColor(atsScore), mr: 1 }}>
                  {atsScore}
                </Typography>
                <Typography variant="h4" color="textSecondary">
                  /100
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={atsScore} 
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  backgroundColor: '#f0f0f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(atsScore),
                    borderRadius: 6
                  }
                }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Resume Overview */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resume Overview
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Skills Identified" 
                    secondary={`${resumeData?.skills?.length || 0} skills found`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Work color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Experience Level" 
                    secondary={`${resumeData?.experience || 0} years`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Star color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Missing Skills" 
                    secondary={`${missingSkills?.length || 0} skills to improve`} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Analysis Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Skills Proficiency Analysis
            </Typography>
            {skillsData.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsData}>
                    <XAxis dataKey="skill" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="level" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="textSecondary">No skills data available for visualization</Typography>
            )}
          </Paper>
        </Grid>

        {/* Detailed Analysis Sections */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Skills Gap Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Based on 2025 tech trends and your target role, consider learning these skills:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {missingSkills?.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    color="warning" 
                    variant="outlined" 
                    size="small"
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <TrendingUp color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Improvement Recommendations
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {improvements?.map((improvement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={improvement} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <School color="secondary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Project Suggestions
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Consider adding these projects to strengthen your resume:
              </Typography>
              <List>
                {projectSuggestions?.map((project, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Star color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary={project} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisResults;
