import React from 'react';
import { FileText, ExternalLink, Calendar, Users, Award, BookOpen } from 'lucide-react';

const PublicationsSection = () => {
  const publications = [
    {
      title: "Investigating the Influence of Psychologists' Recommendations on Thai Juvenile Court Judgements",
      authors: "Praingcharoenkit, C., Sangkhao, S., Kawto, W., Rutherford, A. T., & Tachaiya, J.",
      venue: "2024 21st International Joint Conference on Computer Science and Software Engineering (JCSSE)",
      year: "2024",
      type: "Conference Paper",
      status: "Published",
      doi: "https://doi.org/10.1109/jcsse61278.2024.10613718",
      location: "Bangkok, Thailand"
    },
    {
      title: "IKEA: Unsupervised domain-specific keyword-expansion",
      authors: "Tachaiya, J., Gharibshah, J., Imani, A., Papalexakis, E. E., & Faloutsos, M.",
      venue: "2022 IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM)",
      year: "2022",
      type: "Conference Paper",
      status: "Published",
      doi: "https://doi.org/10.1109/asonam55973.2022.10088556",
      location: "Istanbul, Turkey"
    },
    {
      title: "SentiStance: quantifying the intertwined changes of sentiment and stance in response to an event in online forums",
      authors: "Tachaiya, J., Gharibshah, J., Irani, A., Esterling, K. M., & Faloutsos, M.",
      venue: "Proceedings of the 2021 IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM)",
      year: "2021",
      type: "Conference Paper",
      status: "Published",
      doi: "https://doi.org/10.1145/3467351.3490966",
      location: "The Hague, Netherlands"
    },
    {
      title: "RAFFMAN: Measuring and Analyzing Sentiment in Online Political Forum Discussions with an Application to the Trump Impeachment",
      authors: "Tachaiya, J., Gharibshah, J., & Esterling, K. M.",
      venue: "Proceedings of the International AAAI Conference on Web and Social Media (ICWSM)",
      year: "2020",
      type: "Conference Paper",
      status: "Published",
      doi: "https://doi.org/10.1609/icwsm.v15i1.18096",
      location: "Atlanta, Georgia"
    },
    {
      title: "RThread: A thread-centric analysis of security forums",
      authors: "Tachaiya, J., Gharibshah, J., Papalexakis, E. E., & Faloutsos, M.",
      venue: "2020 IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM)",
      year: "2020",
      type: "Conference Paper",
      status: "Published",
      doi: "https://doi.org/10.1109/asonam49781.2020.9381312",
      location: "The Hague, Netherlands"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Conference Paper':
        return 'bg-purple-100 text-purple-800';
      case 'Journal Article':
        return 'bg-indigo-100 text-indigo-800';
      case 'Workshop Paper':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Publications</h1>
        <div className="w-16 h-1 bg-blue-600 mb-4 lg:mb-6"></div>
        <p className="text-gray-600 text-base sm:text-lg">
          Research publications in natural language processing, machine learning, and computational linguistics.
        </p>
      </div>

      {/* ORCID ID Section */}
      <div className="mb-8 lg:mb-12">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">ORCID Profile</h2>
              <p className="text-gray-600">View my complete publication record and research contributions</p>
            </div>
            <a 
              href="https://orcid.org/0000-0001-9779-1571"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-300 px-6 py-3 rounded-lg transition-all shadow-sm hover:shadow-md w-fit"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="text-green-600" size={16} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">ORCID iD</div>
                <div className="text-sm text-gray-600">0000-0001-9779-1571</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Publications List */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
          <FileText className="text-purple-600" size={20} sm:size={24} />
          Recent Publications
        </h2>
        <div className="space-y-4 lg:space-y-6">
          {publications.map((pub, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                {/* Title and External Link */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight flex-1">
                    {pub.title}
                  </h3>
                </div>

                {/* Authors and Venue */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={14} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base">{pub.authors}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={14} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium">{pub.venue}</span>
                  </div>
                  {pub.location && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span className="text-sm">{pub.location}</span>
                    </div>
                  )}
                </div>

                {/* Tags and Year */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
                    <Calendar size={14} className="flex-shrink-0" />
                    <span>{pub.year}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(pub.type)}`}>
                    {pub.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pub.status)}`}>
                    {pub.status}
                  </span>
                </div>

                {/* DOI Link */}
              </div>
            </div>
          ))}
        </div>
      </div>

    
      
    </div>
  );
};

export default PublicationsSection;