import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Container, CssBaseline, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import ResumeUpload from './components/ResumeUpload/ResumeUpload';
import AnalysisResults from './components/Analysis/AnalysisResults';
import ResumeBuilder from './components/ResumeBuilder/ResumeBuilder';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [view, setView] = useState('upload'); // upload, results, builder

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setView('results');
  };

  const handleBuildResume = () => {
    setView('builder');
  };

  const handleBackToUpload = () => {
    setAnalysisData(null);
    setView('upload');
  };

  return (
    <Router>
      <CssBaseline />
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Smart Resume Analyzer
          </Typography>
          {view !== 'upload' && (
            <Button color="inherit" onClick={handleBackToUpload}>
              Upload Another
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        {view === 'upload' && <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />}
        {view === 'results' && analysisData && (
          <>
            <AnalysisResults analysisData={analysisData} />
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button variant="contained" onClick={handleBuildResume}>
                Build Resume
              </Button>
            </Box>
          </>
        )}
        {view === 'builder' && analysisData && (
          <ResumeBuilder analysisData={analysisData} onBack={handleBackToUpload} />
        )}
      </Container>
    </Router>
  );
}

export default App;
