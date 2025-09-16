import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Paper, Typography, Box, Button, CircularProgress, 
  Alert, TextField, MenuItem, Chip 
} from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import axiosInstance from '../../services/axiosInstance';

const ResumeUpload = ({ onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [targetRole, setTargetRole] = useState('Software Developer');
  const [uploadProgress, setUploadProgress] = useState(0);

  const jobRoles = [
    'Software Developer',
    'Data Scientist',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'ML Engineer',
    'Product Manager'
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File too large. Please upload files smaller than 5MB.');
        } else {
          setError('Unsupported file type. Please upload PDF or DOCX only.');
        }
        return;
      }
      setFile(acceptedFiles[0]);
      setError('');
    }
  });

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      const response = await axiosInstance.post('/api/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      onAnalysisComplete(response.data);
    } catch (error) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Upload Your Resume
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Get AI-powered insights and improve your resume for better job opportunities
        </Typography>

        {/* Target Role Selection */}
        <TextField
          select
          label="Target Role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          sx={{ mb: 3, minWidth: 200 }}
        >
          {jobRoles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>

        {/* File Upload Area */}
        <Box {...getRootProps()} sx={{ 
          border: '2px dashed #ccc', 
          p: 4, 
          borderRadius: 2,
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#e3f2fd' : 'transparent',
          transition: 'all 0.3s ease',
          '&:hover': { 
            borderColor: 'primary.main',
            backgroundColor: '#f5f5f5'
          }
        }}>
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop your resume here' : 'Drag & drop or click to upload'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Supports PDF and DOCX files (max 5MB)
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selected File Display */}
        {file && (
          <Paper elevation={1} sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <InsertDriveFile sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                {file.name}
              </Typography>
              <Chip 
                label="Remove" 
                size="small" 
                onClick={removeFile}
                sx={{ ml: 2 }}
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Paper>
        )}

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Uploading: {uploadProgress}%</Typography>
            <Box sx={{ width: '100%', height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, mt: 1 }}>
              <Box sx={{ 
                width: `${uploadProgress}%`, 
                height: '100%', 
                backgroundColor: 'primary.main', 
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </Box>
          </Box>
        )}

        {/* Analyze Button */}
        <Button 
          variant="contained" 
          size="large"
          onClick={handleAnalyze}
          disabled={!file || loading}
          sx={{ mt: 3, px: 4, py: 1.5 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Analyzing...
            </Box>
          ) : (
            'Analyze Resume'
          )}
        </Button>
      </Paper>
    </Box>
  );
};

export default ResumeUpload;
