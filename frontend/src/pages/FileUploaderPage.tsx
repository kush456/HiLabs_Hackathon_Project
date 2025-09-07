import React, { useState, useCallback } from 'react';
import { runProcessingPipeline } from '../api/processingPipeline';
import type { UploadResponse, ProcessingResponse } from '../api/types';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Shield, Zap, Sparkles, Activity, TrendingUp, Database } from 'lucide-react';


// ...types moved to src/api/types.ts

interface FileUploadState {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

  const API_BASE = 'http://localhost:5000';

  const FileUploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [uploadState, setUploadState] = useState<FileUploadState>({
      file: null,
      uploading: false,
      uploaded: false,
      error: null
    });
    const [processing, setProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // --- ProviderDataUploader logic ---
    const validateFile = (file: File): string | null => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return 'Please upload a CSV file';
      }
      if (file.size > 16 * 1024 * 1024) {
        return 'File size must be less than 16MB';
      }
      return null;
    };

    const uploadFile = async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload/initial-dataset`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    };

    const handleFileSelect = async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setUploadState(prev => ({ ...prev, error }));
        return;
      }

      setUploadState({ file, uploading: true, uploaded: false, error: null });

      try {
        const response = await uploadFile(file);
        if (response.status === 'success') {
          setUploadState(prev => ({ ...prev, uploading: false, uploaded: true }));
        } else {
          setUploadState(prev => ({ 
            ...prev, 
            uploading: false, 
            error: response.error || 'Upload failed' 
          }));
        }
      } catch (error) {
        setUploadState(prev => ({ 
          ...prev, 
          uploading: false, 
          error: error instanceof Error ? error.message : 'Upload failed'
        }));
      }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      handleFileSelect(file);
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleFileSelect(file);
    };

    const runCompleteProcessing = async () => {
      if (!uploadState.uploaded) {
        return;
      }
      setProcessing(true);
      const { result, error, processingTimeMs } = await runProcessingPipeline(uploadState.file);
      if (result && result.status === 'success') {
        navigate('/dashboard', { state: { processingTime: processingTimeMs } });
      } else {
        setUploadState(prev => ({
          ...prev,
          error: error || result?.error || 'Processing failed',
        }));
      }
      setProcessing(false);
    };


  // --- END ProviderDataUploader logic ---
  // UI as specified in the user request
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-pink-400 rotate-45 animate-spin animation-delay-3000" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-ping animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/4 w-5 h-5 bg-emerald-400 rounded-full animate-pulse animation-delay-1500"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500/20 to-violet-500/20 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-white border border-pink-300/30 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Secure AI-Powered Processing</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6">
            Upload Provider
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              {' '}Roster Data
            </span>
          </h1>
          
          <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Upload your provider credentialing CSV file to begin the 
            <span className="text-cyan-400 font-semibold"> automated data quality analysis</span> and 
            <span className="text-pink-400 font-semibold"> processing pipeline</span>.
          </p>
        </div>

        {/* Creative Upload Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          {/* Left Side - Upload Area */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl shadow-2xl border border-purple-400/30 p-8">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 ${
                  dragActive 
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 scale-105' 
                    : uploadState.uploaded 
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-400/20 to-green-500/20'
                      : uploadState.error
                        ? 'border-red-400 bg-gradient-to-br from-red-400/20 to-pink-500/20'
                        : 'border-purple-400/50 hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-400/10 hover:to-purple-400/10 hover:scale-105'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadState.uploading ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                      <Upload className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-2xl font-bold text-white">Uploading Magic...</p>
                      <div className="w-full bg-gray-700/50 rounded-full h-3 max-w-sm mx-auto overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-lg text-gray-300 font-semibold">{uploadProgress}% complete</p>
                    </div>
                  </div>
                ) : uploadState.uploaded ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-3">Upload Successful! 🎉</p>
                      <p className="text-cyan-400 font-semibold text-lg">{uploadState.file?.name}</p>
                      <p className="text-gray-300 mt-2">
                        {uploadState.file && (uploadState.file.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                      </p>
                    </div>
                  </div>
                ) : uploadState.error ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                      <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-3">Upload Failed</p>
                      <p className="text-red-300">{uploadState.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-3">
                        Drop your CSV file here
                      </p>
                      <p className="text-gray-300 mb-6 text-lg">or click to browse files</p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        className="inline-flex items-center space-x-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-lg">Choose File</span>
                      </label>
                    </div>
                    <div className="text-sm text-gray-400 space-y-2 bg-black/20 rounded-lg p-4">
                      <p className="flex items-center"><span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>Supported format: CSV files only</p>
                      <p className="flex items-center"><span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>Maximum file size: 16MB</p>
                      <p className="flex items-center"><span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>Your data is processed securely</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Creative Visualization */}
          <div className="relative h-[500px]">
            <CreativeDataVisualization />
          </div>
        </div>

        {/* Processing Section */}
        {uploadState.uploaded && (
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-lg rounded-3xl shadow-2xl border border-cyan-400/30 p-8">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white">Ready to Process! 🚀</h3>
                <p className="text-xl text-gray-200 max-w-2xl mx-auto">
                  Your file has been uploaded successfully. Click below to start the 
                  <span className="text-cyan-400 font-semibold"> automated AI processing pipeline</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-400/30">
                  <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <p className="text-lg font-bold text-white">Data Validation</p>
                  <p className="text-sm text-gray-300">Verify data integrity & format</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-400/30">
                  <Shield className="w-8 h-8 text-pink-400 mx-auto mb-3" />
                  <p className="text-lg font-bold text-white">Duplicate Detection</p>
                  <p className="text-sm text-gray-300">AI-powered duplicate identification</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl p-6 border border-emerald-400/30">
                  <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg font-bold text-white">Quality Analysis</p>
                  <p className="text-sm text-gray-300">Generate comprehensive insights</p>
                </div>
              </div>

              <button
                onClick={runCompleteProcessing}
                disabled={processing}
                className="group relative inline-flex items-center space-x-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-black px-12 py-6 rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 disabled:transform-none disabled:shadow-none text-xl"
              >
                {processing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing Magic in Progress...</span>
                  </>
                ) : (
                  <>
                    <span>Start AI Data Processing</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {processing && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 max-w-2xl mx-auto border border-purple-400/30">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse animation-delay-500"></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse animation-delay-1000"></div>
                  </div>
                  <p className="text-lg text-white font-semibold">
                    🤖 AI is analyzing your data... This may take a few moments. You'll be automatically redirected to the analytics dashboard when complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CreativeDataVisualization = () => {
  return (
    <div className="relative w-full h-full">
      {/* Central Processing Hub */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full animate-spin shadow-2xl shadow-purple-500/50" style={{animationDuration: '10s'}}></div>
          <div className="absolute inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full animate-spin shadow-xl" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
          <div className="absolute inset-8 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-12 bg-white rounded-full flex items-center justify-center">
            <Database className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Orbiting Data Points */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-bounce shadow-lg shadow-pink-400/50"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-ping shadow-lg shadow-emerald-400/50"></div>
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce animation-delay-1000 shadow-lg shadow-yellow-400/50"></div>
      </div>

      {/* Floating Stats Cards */}
      <div className="absolute top-8 right-8 bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-purple-400/30 animate-float">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Processing Speed</span>
        </div>
        <div className="text-lg font-black text-white">16.3s</div>
        <div className="text-xs text-purple-300">Lightning fast ⚡</div>
      </div>

      <div className="absolute bottom-8 left-8 bg-gradient-to-br from-blue-900/90 to-cyan-900/90 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-cyan-400/30 animate-float animation-delay-2000">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Security</span>
        </div>
        <div className="text-lg font-black text-white">100%</div>
        <div className="text-xs text-cyan-300">HIPAA Compliant 🔒</div>
      </div>

      <div className="absolute top-1/2 left-4 bg-gradient-to-br from-emerald-900/90 to-teal-900/90 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-emerald-400/30 animate-float animation-delay-1000">
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-white">Accuracy</span>
        </div>
        <div className="text-lg font-black text-white">99.7%</div>
        <div className="text-xs text-emerald-300">AI Powered 🤖</div>
      </div>
    </div>
  );
};

export default FileUploadPage;