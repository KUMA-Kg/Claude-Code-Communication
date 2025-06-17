import React from 'react';
import { Template } from '../../types/api';
import { Clock, FileText, CheckCircle } from 'lucide-react';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate?: Template;
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">テンプレートを選択</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-500 mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {template.name}
                </h4>
              </div>
              {selectedTemplate?.id === template.id && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {template.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>約{template.estimatedTime}分</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {template.subsidyTypes.slice(0, 2).map((type, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs"
                  >
                    {type}
                  </span>
                ))}
                {template.subsidyTypes.length > 2 && (
                  <span className="text-gray-400">
                    +{template.subsidyTypes.length - 2}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">必要な情報:</p>
              <div className="flex flex-wrap gap-1">
                {template.requiredFields.slice(0, 3).map((field, index) => (
                  <span
                    key={index}
                    className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
                  >
                    {field === 'companyInfo' ? '企業情報' :
                     field === 'businessPlan' ? '事業計画' :
                     field === 'itInvestmentPlan' ? 'IT投資計画' : field}
                  </span>
                ))}
                {template.requiredFields.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{template.requiredFields.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">利用可能なテンプレートがありません</p>
        </div>
      )}
    </div>
  );
};