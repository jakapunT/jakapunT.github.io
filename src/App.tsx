import React, { useState } from 'react';
import { User, Building, BookOpen, FileText, Mail, Github, Linkedin, Twitter, MapPin, ExternalLink, Phone, Home, Menu, X } from 'lucide-react';
import AboutSection from './components/AboutSection';
import LabsSection from './components/LabsSection';
import ActivitiesSection from './components/ActivitiesSection';
import PublicationsSection from './components/PublicationsSection';
import CVSection from './components/CVSection';

function App() {
  const [activeTab, setActiveTab] = useState('about');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'labs', label: 'Research Labs', icon: Building },
    { id: 'publications', label: 'Publications', icon: FileText },
    { id: 'activities', label: 'Teaching', icon: BookOpen },
    { id: 'cv', label: 'CV', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutSection />;
      case 'labs':
        return <LabsSection />;
      case 'activities':
        return <ActivitiesSection />;
      case 'publications':
        return <PublicationsSection />;
      case 'cv':
        return <CVSection />;
      default:
        return <AboutSection />;
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-8 rounded-lg overflow-hidden shadow-md">
              <img 
                src="IMG_5438.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">jakapun Tachaiya</h1>
              <p className="text-xs text-gray-600">NLP Researcher</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMobileMenu}>
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 overflow-y-auto h-full">
              {/* Profile Section */}
              <div className="text-center mb-6 pt-20">
                <div className="w-32 h-40 mx-auto rounded-lg overflow-hidden shadow-lg mb-4">
                  <img 
                    src="IMG_5438.jpg" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Jakapun Tachaiya</h1>
              </div>


            {/* Contact Info */}
            <div className="space-y-3 mb-8 text-sm">
              <div className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <Home size={16} className="text-gray-500" />
                <span>Linguistic Department, Chulalongkorn University</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <MapPin size={16} className="text-gray-500" />
                <span>Bangkok, Thailand</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-500" />
                <a href="mailto:your.email@university.edu" className="text-blue-600 hover:text-blue-800 transition-colors">
                 jakapun.t@chula.ac.th
                </a>
              </div>
            </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        closeMobileMenu();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar - Fixed Position */}
        <div className="hidden lg:block w-80 bg-gray-50 border-r border-gray-200 min-h-screen fixed left-0 top-0 overflow-y-auto z-30 shadow-sm">
          <div className="p-6">
            {/* Profile Image */}
            <div className="text-center mb-6">
              <div className="w-48 h-60 mx-auto rounded-lg overflow-hidden shadow-lg mb-4 transition-transform duration-300 hover:scale-105 ring-4 ring-white">
                <img 
                  src="IMG_5438.jpg" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Jakapun Tachaiya</h1>
              <p className="text-gray-600 text-sm">Natural Language Processing Researcher</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-8 text-sm">
              <div className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <Home size={16} className="text-gray-500" />
                <span>Linguistic Department, Chulalongkorn University</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <MapPin size={16} className="text-gray-500" />
                <span>Bangkok, Thailand</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-500" />
                <a href="mailto:your.email@university.edu" className="text-blue-600 hover:text-blue-800 transition-colors">
                 jakapun.t@chula.ac.th
                </a>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600 shadow-sm transform translate-x-1'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content - Properly offset for sidebar */}
        <div className="flex-1 lg:ml-80 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;