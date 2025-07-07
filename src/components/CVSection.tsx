import React from 'react';
import { Download, GraduationCap, Briefcase, Award, FileText, ExternalLink, Calendar, MapPin } from 'lucide-react';

const CVSection = () => {
  const education = [
    {
      degree: "Ph.D. in Computer Science",
      institution: "The University of California, Riverside",
      period: "2017 - 2022",
      location: "USA",
      advisor: "Michalis Faloutsos"
    },
    {
      degree: "M.S. in Computer Science",
      institution: "The University of Southern California",
      period: "2014 - 2016",
      location: "USA"
    },
    {
      degree: "B.E. in Computer Engineering",
      institution: "Chulalongkorn University",
      period: "2009 - 2012",
      location: "Thailand"
    }
  ];

  const experience = [
    {
      position: "Full-time lecturer",
      organization: "Linguistics Department, Chulalongkorn University",
      period: "2025 - ongoing",
      location: "Thailand",
      responsibilities: [
      ]
    },
    {
      position: "Full-time lecturer",
      organization: "Computer Science Department, KMITL",
      period: "2023 - 2025",
      location: "Thailand",
      responsibilities: [
      ]
    },
    {
      position: "Research Lab Leader",
      organization: "UC Riverside",
      period: "2021 - 2022",
      location: "USA",
      responsibilities: [
        "Spearheaded a team of students in executing data science projects focused on the analysis of social media information",
        "Played a pivotal role in securing and contributing to a grant awarded by the National Science Foundation (NSF)"
      ]
    },
    {
      position: "Research Assistant",
      organization: "Spatial Sciences Institute, USC",
      period: "2016 - 2017",
      location: "USA",
      responsibilities: [
        "Specialized in the interpretation and analysis of spatial data utilizing advanced NoSQL techniques"
      ]
    }
  ];

  const publications = [
    {
      title: "Efficient Fine-tuning of Large Language Models with Parameter-Efficient Methods",
      authors: "[Your Name], et al.",
      venue: "International Conference on Learning Representations (ICLR)",
      year: "2024",
      type: "Conference Paper"
    },
    {
      title: "Multilingual Neural Machine Translation with Language-Specific Adapters",
      authors: "[Your Name], et al.",
      venue: "Association for Computational Linguistics (ACL)",
      year: "2023",
      type: "Conference Paper"
    },
    {
      title: "A Survey of Low-Resource Machine Translation Techniques",
      authors: "[Your Name], et al.",
      venue: "Computational Linguistics Journal",
      year: "2023",
      type: "Journal Article"
    },
    {
      title: "Cross-lingual Transfer Learning for Natural Language Understanding",
      authors: "[Your Name], et al.",
      venue: "Empirical Methods in Natural Language Processing (EMNLP)",
      year: "2022",
      type: "Conference Paper"
    },
    {
      title: "Interpretable Neural Machine Translation with Attention Mechanisms",
      authors: "[Your Name], et al.",
      venue: "Neural Information Processing Systems (NeurIPS)",
      year: "2022",
      type: "Conference Paper"
    }
  ];

  const awards = [
    {
      title: "Outstanding Paper Award",
      organization: "International Conference on Learning Representations (ICLR)",
      year: "2024"
    },
    {
      title: "NSF CAREER Award",
      organization: "National Science Foundation",
      year: "2023"
    },
    {
      title: "Best Paper Award",
      organization: "European Chapter of the Association for Computational Linguistics (EACL)",
      year: "2017"
    },
    {
      title: "Google PhD Fellowship",
      organization: "Google AI",
      year: "2016"
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Curriculum Vitae</h1>
          <div className="w-16 h-1 bg-blue-600"></div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-fit">
          <Download size={16} sm:size={20} />
          <a href="Jakapun CV.pdf" download="Jakapun_Tachaiya_CV.pdf" className="flex items-center gap-2">
            Download PDF
          </a>
        </button>
      </div>

      {/* Education */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
          <GraduationCap className="text-blue-600" size={20} sm:size={24} />
          Education
        </h2>
        <div className="space-y-4 lg:space-y-6">
          {education.map((edu, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{edu.degree}</h3>
                  <p className="text-gray-600 font-medium mt-1 text-sm sm:text-base">{edu.institution}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span>{edu.period}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span>{edu.location}</span>
                    </div>
                  </div>
                  {edu.advisor && (
                    <div className="mt-3">
                      <p className="text-gray-700 text-xs sm:text-sm">
                        <span className="font-medium">Advisor:</span> {edu.advisor}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
          <Briefcase className="text-green-600" size={20} sm:size={24} />
          Work History
        </h2>
        <div className="space-y-4 lg:space-y-6">
          {experience.map((exp, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{exp.position}</h3>
                  <p className="text-gray-600 font-medium mt-1 text-sm sm:text-base">{exp.organization}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span>{exp.period}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span>{exp.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              {exp.responsibilities.length > 0 && (
                <div>
                  <ul className="space-y-2">
                    {exp.responsibilities.map((resp, respIndex) => (
                      <li key={respIndex} className="flex items-start gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm sm:text-base">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>



    </div>
  );
};

export default CVSection;