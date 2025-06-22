import React from 'react';
import { useParams } from 'react-router-dom';
import RequiredDocumentsListEnhanced from '../components/RequiredDocumentsListEnhanced';

const DocumentsEnhancedDemo: React.FC = () => {
  const { subsidyType = 'it-donyu' } = useParams<{ subsidyType: string }>();
  
  const subsidyNames = {
    'it-donyu': 'IT導入補助金',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '持続化補助金'
  };

  return (
    <RequiredDocumentsListEnhanced
      subsidyType={subsidyType}
      subsidyName={subsidyNames[subsidyType as keyof typeof subsidyNames] || 'IT導入補助金'}
    />
  );
};

export default DocumentsEnhancedDemo;