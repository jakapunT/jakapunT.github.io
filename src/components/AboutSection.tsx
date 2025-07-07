import React from 'react';
import { Brain, Users, Globe, BookOpen, GraduationCap } from 'lucide-react';

const AboutSection = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Me</h1>
        <div className="w-16 h-1 bg-blue-600 mb-4 lg:mb-6"></div>
      </div>

      <div className="prose prose-lg max-w-none mb-8 lg:mb-12 text-gray-700 leading-relaxed">
        <p className="text-lg sm:text-xl mb-4 lg:mb-6">
          I am a faculty member in the Linguistics Department at the Faculty of Arts, Chulalongkorn University. I'm really interested in how computers are taught to understand what we say. It's a tough problem because even we humans often misunderstand each other, even when using the exact same words!
        </p>
        
        <p className="mb-4 lg:mb-6">
          This deep interest drives my work as a dedicated researcher with a primary focus on Natural Language Processing (NLP), the technology enabling computers to comprehend and execute language-based tasks such as question answering, text translation, and large-scale text analysis. My current research interests revolve around developing NLP with Large Language Models (LLMs), specifically focusing on the Thai language. Please feel free to contact me if you are interested in a collaboration in this related field.
        </p>
      </div>

      {/* Research Highlights */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Research Highlights</h2>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="text-blue-600" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">NLP Research</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Advancing natural language understanding and generation through novel architectures and methodologies.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Collaborations</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Working with leading research institutions and industry partners globally.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="text-orange-600" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Impact</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Research applied in real-world settings, benefiting a large number of users.</p>
          </div>
        </div>
      </div>

      {/* Research Interests */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Research Interests</h2>
        <div className="bg-gray-50 rounded-lg p-4 lg:p-6 border border-gray-200">
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                Core Areas
              </h3>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li>• Large Language Models</li>
                <li>• Retrieval-Augmented Generation (RAG)</li>
                <li>• Sentiment Analysis</li>
                <li>• Social trend and behavior analysis</li>
                <li>• Machine Learning</li>

 
                


              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-green-600" />
                Applications
              </h3>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li>• Conversational AI</li>
                <li>• Information Extraction</li>
                <li>• Text Summarization</li>
                <li>• Multilingual NLP</li>
                <li>• Educational Technology</li>
                <li>• Healthcare NLP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;