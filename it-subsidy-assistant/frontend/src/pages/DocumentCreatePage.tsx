import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { documentApi, subsidyApi } from '../lib/api';
import { TemplateSelector } from '../components/document/TemplateSelector';
import { DocumentForm } from '../components/document/DocumentForm';
import { Template, DocumentGenerationRequest } from '../types/api';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DocumentCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const subsidyId = location.state?.subsidyId;
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>();
  const [step, setStep] = useState<'template' | 'form'>('template');

  // Fetch templates
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useQuery({
    queryKey: ['templates'],
    queryFn: documentApi.getTemplates,
  });

  // Fetch subsidy details if subsidyId is provided
  const {
    data: subsidy,
    isLoading: isLoadingSubsidy,
  } = useQuery({
    queryKey: ['subsidy', subsidyId],
    queryFn: () => subsidyApi.getById(subsidyId),
    enabled: !!subsidyId,
  });

  // Document generation mutation
  const generateDocumentMutation = useMutation({
    mutationFn: documentApi.generate,
    onSuccess: (document) => {
      navigate(`/document/${document.id}`, {
        state: { generated: true }
      });
    },
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setStep('form');
  };

  const handleFormSubmit = (formData: Omit<DocumentGenerationRequest, 'templateId' | 'subsidyId'>) => {
    if (!selectedTemplate) return;
    
    const request: DocumentGenerationRequest = {
      templateId: selectedTemplate.id,
      subsidyId: subsidyId || '',
      ...formData,
    };

    generateDocumentMutation.mutate(request);
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('template');
    } else {
      navigate(-1);
    }
  };

  if (isLoadingTemplates || isLoadingSubsidy) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            テンプレートの読み込みに失敗しました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              onClick={handleBack}
              variant="secondary"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              戻る
            </Button>
            
            <div className="flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  申請資料作成
                </h1>
                {subsidy && (
                  <p className="text-gray-600 dark:text-gray-400">
                    対象補助金: {subsidy.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex items-center ${step === 'template' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                step === 'template' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">テンプレート選択</span>
            </div>
            
            <div className={`w-16 h-1 ${step === 'form' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${step === 'form' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                step === 'form' ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">情報入力</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {step === 'template' ? (
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              isLoading={isLoadingTemplates}
            />
          ) : (
            <div>
              {selectedTemplate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        選択されたテンプレート: {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DocumentForm
                onSubmit={handleFormSubmit}
                isLoading={generateDocumentMutation.isPending}
              />

              {generateDocumentMutation.error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {generateDocumentMutation.error instanceof Error 
                    ? generateDocumentMutation.error.message 
                    : '資料生成に失敗しました'
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};