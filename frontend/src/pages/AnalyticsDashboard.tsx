import React, { useState, useEffect } from 'react';
import { fetchProcessingResults } from '../api/analytics';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ArrowLeft, Download, FileText, Users, AlertTriangle, CheckCircle, 
  TrendingUp, Database, Search, RefreshCw, Calendar,
  MapPin, Shield, Zap, Activity
} from 'lucide-react';

interface GeneratedFile {
  filename: string;
  filepath: string;
  step: string;
  timestamp: string;
  records: number;
  columns: number;
  size_mb: number;
}

interface ProcessingResults {
  status: 'success' | 'error';
  message: string;
  pipeline_statistics?: any;
  summary?: {
    total_final_records: number;
    ca_final_shape?: [number, number];
    ny_final_shape?: [number, number];
  };
}

const API_BASE = 'http://localhost:5000';

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  const [pipelineStats, setPipelineStats] = useState<{
    totalColumns: number;
    beforeCount: number;
    afterCount: number;
    removed: number;
    dedupBefore: number;
    dedupAfter: number;
    dedupRemoved: number;
    statusDistribution?: {
      ca_status: Record<string, number>;
      ny_status: Record<string, number>;
    };
    providerDistribution?: {
      ca_providers: number;
      ny_providers: number;
      total_providers: number;
    };
    npiValidation?: {
      valid_count: number;
      invalid_count: number;
      total_count: number;
      valid_percentage: number;
      invalid_percentage: number;
      ca_stats: {
        valid: number;
        invalid: number;
        total: number;
      };
      ny_stats: {
        valid: number;
        invalid: number;
        total: number;
      };
    };
    pipelineSteps?: Array<{
      step: string;
      records: number;
      description?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'records' | 'size'>('timestamp');
  const [filterStep, setFilterStep] = useState<string>('all');
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  useEffect(() => {
    // Get processing time from navigation state if available
    if (location.state && (location.state as any).processingTime) {
      setProcessingTime((location.state as any).processingTime);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch generated files
      const filesResponse = await fetch(`${API_BASE}/files/list`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        if (filesData.status === 'success') {
          setGeneratedFiles(filesData.generated_files || []);
        }
      }

      // Fetch pipeline stats using axios
      try {
        const stats = await fetchProcessingResults();
        setPipelineStats(stats);
      } catch (err) {
        setPipelineStats(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_BASE}/files/download/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Filter and sort files
  const filteredFiles = generatedFiles
    .filter(file => {
      const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.step.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStep === 'all' || file.step === filterStep;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'records':
          return b.records - a.records;
        case 'size':
          return b.size_mb - a.size_mb;
        case 'timestamp':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  // Get unique steps for filter
  const uniqueSteps = Array.from(new Set(generatedFiles.map(file => file.step)));


  // Debugging logs for NPI validation data
  useEffect(() => {
    // Log pipelineStats and npiValidation when pipelineStats changes
    if (pipelineStats) {
      // eslint-disable-next-line no-console
      console.log('pipelineStats:', pipelineStats);
      // eslint-disable-next-line no-console
      console.log('pipelineStats.npiValidation:', pipelineStats.npiValidation);
    }
  }, [pipelineStats]);

  // Mock data for charts
  const stateDistribution = [
    { name: 'California', value: pipelineStats?.providerDistribution?.ca_providers || 0, color: '#EC4899' },
    { name: 'New York', value: pipelineStats?.providerDistribution?.ny_providers || 0, color: '#06B6D4' }
  ];

  // NPI Validation data for pie chart
  const npiValidationData = [
    { 
      name: 'Valid NPI', 
      value: pipelineStats?.npiValidation?.valid_count || 0, 
      color: '#10B981',
      percentage: pipelineStats?.npiValidation?.valid_percentage || 0
    },
    { 
      name: 'Invalid NPI', 
      value: pipelineStats?.npiValidation?.invalid_count || 0, 
      color: '#EF4444',
      percentage: pipelineStats?.npiValidation?.invalid_percentage || 0
    }
  ];

  // Use dynamic pipeline steps from backend or fallback to mock data
  const processingSteps = pipelineStats?.pipelineSteps || [
    { step: 'Initial Upload', records: 0, description: 'Raw data uploaded to system' },
    { step: 'Standardization', records: 0, description: 'Name and address standardization' },
    { step: 'Misspelling Correction', records: 0, description: 'Fuzzy matching and correction' },
    { step: 'Deduplication', records: 0, description: 'Duplicate record removal' },
    { step: 'Quality Check', records: 0, description: 'Final quality validation and merging' }
  ];

  // Prepare status distribution data for pie charts
  const getStatusChartData = (statusData: Record<string, number>, colorPalette: string[]) => {
    return Object.entries(statusData).map(([status, count], index) => ({
      name: status,
      value: count,
      color: colorPalette[index % colorPalette.length]
    }));
  };

  const caStatusColors = ['#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
  const nyStatusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const caStatusData = pipelineStats?.statusDistribution?.ca_status 
    ? getStatusChartData(pipelineStats.statusDistribution.ca_status, caStatusColors)
    : [];
  
  const nyStatusData = pipelineStats?.statusDistribution?.ny_status 
    ? getStatusChartData(pipelineStats.statusDistribution.ny_status, nyStatusColors)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl text-white font-semibold">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 border border-purple-400/30"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Upload</span>
            </button>
            <div className="h-6 w-px bg-purple-400/50"></div>
            <div>
              <h1 className="text-4xl font-black text-white">Analytics Dashboard</h1>
              <p className="text-gray-300">Provider credentialing data analysis results</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            
            <button
              onClick={fetchData}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl px-4 py-2 text-cyan-300 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 border border-cyan-400/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-cyan-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-300">Total Records</p>
                <p className="text-3xl font-black text-white">
                  {pipelineStats?.afterCount?.toLocaleString() ?? '—'}
                </p>
                
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Database className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-semibold">
                {pipelineStats ? `${pipelineStats.beforeCount - pipelineStats.afterCount} rows dropped` : '—'}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">Data Quality</p>
                <p className="text-3xl font-black text-white">98.5%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Shield className="w-4 h-4 text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-semibold">Excellent quality</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-orange-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-300">Duplicates Removed</p>
                <p className="text-3xl font-black text-white">{pipelineStats ? pipelineStats.dedupRemoved : '—'}</p>
                
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Zap className="w-4 h-4 text-orange-400 mr-1" />
              <span className="text-orange-400 font-semibold">
                {pipelineStats && pipelineStats.dedupBefore > 0
                  ? `${((pipelineStats.dedupRemoved / pipelineStats.dedupBefore) * 100).toFixed(2)}% of total records`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-300">Processing Time</p>
                <p className="text-3xl font-black text-white">{processingTime !== null ? `${processingTime} ms` : '—'}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* State Distribution */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">Provider Distribution by State</h3>
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Providers']} 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  labelStyle={{
                    color: 'white'
                  }}
                  itemStyle={{
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {stateDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-300 font-semibold">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NPI Validation */}
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-cyan-400/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">NPI Validation Distribution</h3>
              <CheckCircle className="w-5 h-5 text-cyan-400" />
            </div>
            {npiValidationData.length > 0 && (npiValidationData[0].value > 0 || npiValidationData[1].value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={npiValidationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {npiValidationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} providers (${npiValidationData.find(d => d.name === name)?.percentage.toFixed(1)}%)`, 
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                      labelStyle={{
                        color: 'white'
                      }}
                      itemStyle={{
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-6 mt-4">
                  {npiValidationData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-300 font-semibold">
                        {item.name} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-400 text-lg">No NPI validation data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Provider Status Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* California Status Distribution */}
          <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-pink-400/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">California Provider Status Distribution</h3>
              <Shield className="w-5 h-5 text-pink-400" />
            </div>
            {caStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={caStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {caStatusData.map((entry, index) => (
                        <Cell key={`ca-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString(), 'Providers']} 
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                      labelStyle={{
                        color: 'white'
                      }}
                      itemStyle={{
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {caStatusData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-300 font-semibold">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No California status data available</p>
              </div>
            )}
          </div>

          {/* New York Status Distribution */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-400/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">New York Provider Status Distribution</h3>
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            {nyStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={nyStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {nyStatusData.map((entry, index) => (
                        <Cell key={`ny-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString(), 'Providers']} 
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                      labelStyle={{
                        color: 'white'
                      }}
                      itemStyle={{
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {nyStatusData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-300 font-semibold">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No New York status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-400/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white">Data Processing Pipeline</h3>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {processingSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-400/30 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{step.step}</span>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black text-emerald-300">{step.records.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{step.description || 'records processed'}</p>
                  </div>
                </div>
                {index < processingSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generated Files Section */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-indigo-400/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white">Generated Files</h3>
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-indigo-400/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
            
            
          </div>

          {/* Files Grid */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file, index) => (
                <div key={index} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-black text-white text-lg mb-2">{file.step}</h4>
                      <p className="text-sm text-gray-400 break-all">{file.filename}</p>
                    </div>
                    <button
                      onClick={() => downloadFile(file.filename)}
                      className="ml-3 p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-300">
                        <Users className="w-4 h-4 mr-2 text-cyan-400" />
                        {file.records.toLocaleString()} records
                      </span>
                      <span className="text-purple-300 font-semibold">{file.columns} columns</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-300">
                        <Database className="w-4 h-4 mr-2 text-emerald-400" />
                        {file.size_mb} MB
                      </span>
                      <span className="flex items-center text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-pink-400" />
                        {new Date(file.timestamp.replace(/_/g, '').replace(/(\d{8})(\d{6})/, '$1T$2')).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No files found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;