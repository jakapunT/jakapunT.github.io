import React from 'react';
import { Building, Calendar, ExternalLink, Users, MapPin, GraduationCap, BookOpen, Award, User } from 'lucide-react';

const LabsSection = () => {
  const currentMembers = [
    { name: "Chinjuta Sa-Ngasaeng", program: "LangTech BA student" },
    { name: "Thanete Wutiwan", program: "LangTech BA student" },
    { name: "Jirapach Rungruengsrisang", program: "LangTech BA student" },
  ];

  const alumni = [
    { name: "Nanthipat Kongborrirak", program: "LangTech BA", year: "2024", note:"Assessment of a Large Language Model’s Reading and Comprehension Proficiency in the Thai Language"},
    { name: "Tayawat Songcharoensuk", program: "ComSci, KMITL", year: "2024", note: "Developing Aspect-Based Sentiment Analysis Methods Through Prompt Engineering" },
    { name: "Witchaya Panpradit", program: "ComSci, KMITL", year: "2024", note: "Developing Aspect-Based Sentiment Analysis Methods Through Prompt Engineering" },
    { name: "Chonnasat Gunngam", program: "ComSci, KMITL", year: "2024", note: "Evaluating Techniques and Methods for Text-to-Image Generation" },
    { name: "Chaichan Sampaosong", program: "ComSci, KMITL", year: "2024", note: "Evaluating Techniques and Methods for Text-to-Image Generation" },
    { name: "Rachata Phuphirom", program: "ComSci, KMITL", year: "2024", note: "Developing Chatbot for School of Science KMITL With Retrieval Augmented Generation" },
    { name: "Akesila Potong", program: "ComSci, KMITL", year: "2024", note: "Developing Chatbot for School of Science KMITL With Retrieval Augmented Generation" },
    { name: "Chadathip Prangkulcharoenkit ", program: "ComSci, KMITL", year: "2023", note:"Court Verdict Classification and Prediction in Thai Juvenile and Family Courts" },
    { name: "Sirirat Sanghkao", program: "ComSci, KMITL", year: "2023",note:"Court Verdict Classification and Prediction in Thai Juvenile and Family Courts" },
    { name: "Wanwisa Kawto", program: "ComSci, KMITL", year: "2023", note:"Automated Expert Recommendation Generation for Thai Juvenile Cases using Natural Language Processing"  },
    { name: "Tanawat Kaewmanee", program: "ComSci, KMITL", year: "2023" ,note:"Headlines Generation for Thai News: Engaging Readers with AI-Generated Titles with Emotions"  },
    { name: "Tuntorn Chongsakul", program: "ComSci, KMITL", year: "2023",note:"Headlines Generation for Thai News: Engaging Readers with AI-Generated Titles with Emotions"  },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Enhanced Header Section */}
      <div className="mb-8 lg:mb-12 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-50 -z-10"></div>
        
        <div className="relative p-6 lg:p-8">
          {/* Main Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              NLP Research Lab
              <span className="text-blue-600">@Chula</span>
            </h1>
            
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 mb-6">
              <Building size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Department of Linguistics, Faculty of Arts, Chulalongkorn University
              </span>
            </div>
            
            {/* Decorative line */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>

          {/* Description Paragraphs with better spacing */}
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed font-light">
              The Natural Language Processing Lab focuses on advancing Thai NLP infrastructure, 
              including automated linguistic analysis and the development of Large Language Models 
              specifically for the Thai language.
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <GraduationCap className="text-green-600" size={16} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Master's Program</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Prospective Master's students interested in joining the lab are encouraged to consider 
                    the Linguistics program's <span className="font-medium text-blue-600">"แผน วิชาชีพ"</span> for its flexibility. 
                    This program provides comprehensive training, from foundational programming to the 
                    implementation of neural language models. A sample study plan is available for{' '}
                    <a 
                      href="https://www.arts.chula.ac.th/ling/index.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                    >
                      reference
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Award className="text-purple-600" size={16} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">PhD Program</h3>
                  <p className="text-gray-700 leading-relaxed">
                    For those pursuing a PhD, a strong background in programming and machine learning 
                    is generally expected, though direct discussion via email for potential projects 
                    is also welcome.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Principal Investigator */}
      <div className="mb-8 lg:mb-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={24} />
            Principal Investigator
          </h2>
          <div className="text-lg text-gray-700 font-medium">
            Jakapun Tachaiya
          </div>
        </div>
      </div>

      {/* Current Lab Members */}
      <div className="mb-8 lg:mb-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-green-600" size={24} />
              Current Lab Members
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              {currentMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{member.name}</span>
                    <span className="text-gray-600 ml-2">-- {member.program}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lab Alumni */}
      <div className="mb-8 lg:mb-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={24} />
              Lab Alumni
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              {alumni.map((alum, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{alum.name}</span>
                      <span className="text-gray-600">-- {alum.program} {alum.year}</span>
                    </div>
                    {alum.note && (
                      <div className="text-sm text-gray-500 mt-1 italic">
                        {alum.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabsSection;