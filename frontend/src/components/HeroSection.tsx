
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, Users, Shield, ArrowRight, Sparkles, Zap, Activity } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 z-10">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500/20 to-violet-500/20 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-white border border-pink-300/30 shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>ClearCred</span>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight">
                Smart Provider
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                  {' '}Credentialing{' '}
                </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Analytics
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-xl text-gray-200 max-w-xl leading-relaxed">
                Instantly identify and resolve provider data quality issues. Ensure accuracy and compliance with our 
                <span className="text-cyan-400 font-semibold"> HealthCare analytics dashboard</span>.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-200">99.7% Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse animation-delay-1000"></div>
                <span className="text-gray-200">Real-time Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse animation-delay-2000"></div>
                <span className="text-gray-200">HIPAA Compliant</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold px-10 py-5 rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300"
                onClick={() => navigate('/upload')}
              >
                <span className="text-xl">Analyze Provider Roster Now</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Right Visualization */}
          <div className="relative h-[600px] lg:h-[700px]">
            {/* Main Network Visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <NetworkVisualization />
            </div>

            {/* Floating UI Elements */}
            <FloatingCharts />
          </div>
        </div>
      </div>
    </div>
  );
};

const NetworkVisualization = () => {
  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 500 500">
        {/* Connection Lines */}
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#F59E0B', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#EF4444', stopOpacity: 0.4 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Animated Connection Lines */}
        <g className="animate-pulse">
          <line x1="150" y1="200" x2="350" y2="180" stroke="url(#lineGradient1)" strokeWidth="3" opacity="0.8" />
          <line x1="200" y1="150" x2="300" y2="300" stroke="url(#lineGradient2)" strokeWidth="3" opacity="0.7" />
          <line x1="100" y1="300" x2="250" y2="250" stroke="url(#lineGradient1)" strokeWidth="3" opacity="0.6" />
          <line x1="350" y1="200" x2="400" y2="350" stroke="url(#lineGradient2)" strokeWidth="3" opacity="0.5" />
          <line x1="250" y1="100" x2="350" y2="180" stroke="url(#lineGradient1)" strokeWidth="3" opacity="0.7" />
          <line x1="150" y1="350" x2="300" y2="300" stroke="url(#lineGradient2)" strokeWidth="3" opacity="0.8" />
        </g>

        {/* Network Nodes */}
        <g filter="url(#glow)">
          {/* Primary Nodes */}
          <circle cx="250" cy="250" r="15" fill="#EC4899" className="animate-pulse">
            <animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="150" cy="200" r="12" fill="#8B5CF6" className="animate-pulse animation-delay-1000">
            <animate attributeName="r" values="12;16;12" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="180" r="13" fill="#06B6D4" className="animate-pulse animation-delay-2000">
            <animate attributeName="r" values="13;18;13" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="150" r="10" fill="#10B981" className="animate-pulse animation-delay-500" />
          <circle cx="300" cy="300" r="11" fill="#F59E0B" className="animate-pulse animation-delay-1500" />
          <circle cx="100" cy="300" r="9" fill="#EF4444" className="animate-pulse animation-delay-3000" />
          <circle cx="400" cy="350" r="12" fill="#EC4899" className="animate-pulse animation-delay-2500" />
          <circle cx="250" cy="100" r="10" fill="#8B5CF6" className="animate-pulse animation-delay-1000" />
          <circle cx="150" cy="350" r="9" fill="#06B6D4" className="animate-pulse animation-delay-2000" />
        </g>

        {/* Duplicate Detection Indicators */}
        <g className="opacity-90">
          <circle cx="148" cy="198" r="20" fill="none" stroke="#F59E0B" strokeWidth="3" opacity="0.9" strokeDasharray="6,6" className="animate-spin" />
          <circle cx="352" cy="182" r="20" fill="none" stroke="#EF4444" strokeWidth="3" opacity="0.9" strokeDasharray="6,6" className="animate-spin animation-delay-1000" />
        </g>
      </svg>
    </div>
  );
};

const FloatingCharts = () => {
  return (
    <>
      {/* Floating Bar Chart */}
      <div className="absolute top-16 right-8 bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-purple-400/30 animate-float">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white">Data Quality Score</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-lg shadow-emerald-400/50"></div>
            <span className="text-sm text-gray-200 font-semibold">98%</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-400/50"></div>
            <span className="text-sm text-gray-200 font-semibold">85%</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full shadow-lg shadow-red-400/50"></div>
            <span className="text-sm text-gray-200 font-semibold">72%</span>
          </div>
        </div>
      </div>

      {/* Compliance Checkmarks */}
      <div className="absolute bottom-32 left-8 bg-gradient-to-br from-blue-900/90 to-cyan-900/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-400/30 animate-float animation-delay-2000">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-white">Compliance Status</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-gray-200 font-semibold">HIPAA</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-200 font-semibold">SOC 2</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-pink-400" />
            <span className="text-sm text-gray-200 font-semibold">GDPR</span>
          </div>
        </div>
      </div>

      {/* Provider Count */}
      <div className="absolute top-1/2 right-4 bg-gradient-to-br from-emerald-900/90 to-teal-900/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-emerald-400/30 animate-float animation-delay-4000">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-5 h-5 text-teal-400" />
          <span className="text-sm font-bold text-white">Active Providers</span>
        </div>
        <div className="text-3xl font-black text-white mb-2">2,847</div>
        <div className="text-sm text-emerald-400 flex items-center font-semibold">
          <TrendingUp className="w-4 h-4 mr-1" />
          +12% this month
        </div>
      </div>

      {/* Duplicate Detection Alert */}
      <div className="absolute bottom-16 right-16 bg-gradient-to-br from-orange-900/90 to-red-900/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-orange-400/30 animate-float animation-delay-1000">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-white">12 Duplicates Found</span>
        </div>
      </div>

      {/* Processing Speed Indicator */}
      <div className="absolute top-1/4 left-4 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-indigo-400/30 animate-float animation-delay-3000">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-white">Processing Speed</span>
        </div>
        <div className="text-lg font-black text-white">{`<`}2000ms</div>
        <div className="text-xs text-purple-300">Lightning fast</div>
      </div>
    </>
  );
};

export default HeroSection;