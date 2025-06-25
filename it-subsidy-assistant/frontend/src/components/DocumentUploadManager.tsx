import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  id: string;
  documentId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  file: File;
}

interface Document {
  id: string;
  name: string;
  required: boolean;
  category: string;
}

interface DocumentUploadManagerProps {
  subsidyType: string;
  subsidyName: string;
  documents: Document[];
  onComplete?: (uploadedFiles: UploadedFile[]) => void;
}

// カテゴリ名の日本語マッピング
const categoryLabels: Record<string, string> = {
  application: '申請基本書類',
  financial: '財務関係書類',
  project: '事業計画関連',
  company: '企業情報',
  quotation: '見積・仕様書',
  support: '支援機関関連',
  other: 'その他',
  alert: '⚠️ 重要確認事項'
};

const categoryIcons: Record<string, string> = {
  application: '📋',
  financial: '💰',
  project: '📊',
  company: '🏢',
  quotation: '📄',
  support: '🤝',
  other: '📎',
  alert: '⚠️'
};

export const DocumentUploadManager: React.FC<DocumentUploadManagerProps> = ({
  subsidyType,
  subsidyName,
  documents,
  onComplete
}) => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // カテゴリ別にドキュメントをグループ化
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  // 必須書類のアップロード進捗を計算
  const requiredDocs = documents.filter(doc => doc.required);
  const uploadedRequiredDocs = requiredDocs.filter(doc => 
    uploadedFiles.some(file => file.documentId === doc.id)
  );
  const completionRate = requiredDocs.length > 0 
    ? Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)
    : 0;

  const handleFileSelect = (documentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const newUploadedFile: UploadedFile = {
      id: `${documentId}_${Date.now()}`,
      documentId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      file
    };

    // 同じドキュメントIDの既存ファイルを置き換え
    setUploadedFiles(prev => [
      ...prev.filter(f => f.documentId !== documentId),
      newUploadedFile
    ]);
  };

  const handleDragOver = (e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    setDraggedOver(documentId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    setDraggedOver(null);
    
    const files = e.dataTransfer.files;
    handleFileSelect(documentId, files);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  // ZIPファイルとしてダウンロード
  const downloadAllFiles = async () => {
    // JSZipライブラリを動的にインポート
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // カテゴリ別にフォルダを作成してファイルを追加
    for (const file of uploadedFiles) {
      const doc = documents.find(d => d.id === file.documentId);
      if (doc) {
        const folderName = categoryLabels[doc.category] || 'その他';
        const fileName = `${doc.name}_${file.name}`;
        zip.file(`${folderName}/${fileName}`, file.file);
      }
    }

    // 申請書類リストをCSVで追加
    const csvContent = createDocumentListCSV();
    zip.file('申請書類チェックリスト.csv', csvContent);

    // ZIPファイルを生成してダウンロード
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subsidyName}_申請書類_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 書類チェックリストCSVを作成
  const createDocumentListCSV = (): string => {
    const headers = ['カテゴリ', '書類名', '必須', 'アップロード状態', 'ファイル名'];
    const rows = documents.map(doc => {
      const uploadedFile = uploadedFiles.find(f => f.documentId === doc.id);
      return [
        categoryLabels[doc.category] || doc.category,
        doc.name,
        doc.required ? '必須' : '任意',
        uploadedFile ? '✓ 完了' : (doc.required ? '✗ 未完了' : '-'),
        uploadedFile ? uploadedFile.name : ''
      ];
    });

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(uploadedFiles);
    }
    // アップロードしたファイル情報をsessionStorageに保存
    sessionStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    navigate(`/input-form/${subsidyType}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {subsidyName} 必要書類アップロード
          </h1>
          
          {/* 進捗バー */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <span>必須書類アップロード進捗</span>
              <span>{uploadedRequiredDocs.length} / {requiredDocs.length} 完了 ({completionRate}%)</span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#e5e7eb',
              borderRadius: '100px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${completionRate}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.5s ease',
                borderRadius: '100px'
              }} />
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={downloadAllFiles}
              disabled={uploadedFiles.length === 0}
              style={{
                padding: '12px 24px',
                background: uploadedFiles.length > 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: uploadedFiles.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: uploadedFiles.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span>📦</span>
              アップロード済みファイルを一括ダウンロード
            </button>
            
            <button
              onClick={handleComplete}
              disabled={uploadedRequiredDocs.length < requiredDocs.length}
              style={{
                padding: '12px 24px',
                background: uploadedRequiredDocs.length >= requiredDocs.length
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: uploadedRequiredDocs.length >= requiredDocs.length ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: uploadedRequiredDocs.length >= requiredDocs.length 
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                  : 'none',
                transition: 'all 0.2s'
              }}
            >
              次へ進む
              <span>→</span>
            </button>
          </div>
        </div>

        {/* カテゴリ別書類アップロードエリア */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {Object.entries(documentsByCategory).map(([category, categoryDocs]) => (
            <div
              key={category}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#1f2937'
              }}>
                <span style={{ fontSize: '24px' }}>{categoryIcons[category]}</span>
                {categoryLabels[category] || category}
                <span style={{
                  fontSize: '14px',
                  padding: '4px 12px',
                  background: '#f3f4f6',
                  borderRadius: '100px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {categoryDocs.filter(d => d.required).length}個必須
                </span>
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                {categoryDocs.map(doc => {
                  const uploadedFile = uploadedFiles.find(f => f.documentId === doc.id);
                  const isRequired = doc.required;
                  const isDraggedOver = draggedOver === doc.id;

                  return (
                    <div
                      key={doc.id}
                      style={{
                        border: `2px ${isDraggedOver ? 'solid' : 'dashed'} ${
                          uploadedFile ? '#10b981' : (isDraggedOver ? '#667eea' : '#e5e7eb')
                        }`,
                        borderRadius: '12px',
                        padding: '20px',
                        background: uploadedFile ? '#f0fdf4' : (isDraggedOver ? '#f0f4ff' : '#fafafa'),
                        transition: 'all 0.2s'
                      }}
                      onDragOver={(e) => handleDragOver(e, doc.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, doc.id)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: uploadedFile ? '12px' : '0'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {doc.name}
                            {isRequired && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '4px',
                                fontWeight: '500'
                              }}>
                                必須
                              </span>
                            )}
                            {uploadedFile && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#d1fae5',
                                color: '#059669',
                                borderRadius: '4px',
                                fontWeight: '500'
                              }}>
                                ✓ アップロード済み
                              </span>
                            )}
                          </h4>
                          
                          {!uploadedFile && (
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              margin: '8px 0'
                            }}>
                              クリックまたはドラッグ&ドロップでファイルを選択
                            </p>
                          )}
                        </div>

                        <input
                          ref={el => fileInputRefs.current[doc.id] = el}
                          type="file"
                          onChange={(e) => handleFileSelect(doc.id, e.target.files)}
                          style={{ display: 'none' }}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />

                        {!uploadedFile ? (
                          <button
                            onClick={() => fileInputRefs.current[doc.id]?.click()}
                            style={{
                              padding: '10px 20px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                          >
                            <span>📤</span>
                            ファイル選択
                          </button>
                        ) : (
                          <button
                            onClick={() => fileInputRefs.current[doc.id]?.click()}
                            style={{
                              padding: '8px 16px',
                              background: '#f3f4f6',
                              color: '#4b5563',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            変更
                          </button>
                        )}
                      </div>

                      {uploadedFile && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span style={{ fontSize: '24px' }}>📎</span>
                            <div>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '2px'
                              }}>
                                {uploadedFile.name}
                              </p>
                              <p style={{
                                fontSize: '12px',
                                color: '#6b7280'
                              }}>
                                {formatFileSize(uploadedFile.size)} • {new Date(uploadedFile.uploadedAt).toLocaleString('ja-JP')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(uploadedFile.id)}
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadManager;