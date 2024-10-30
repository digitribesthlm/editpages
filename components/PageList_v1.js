import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle, XCircle, Award, Globe } from 'lucide-react';

const PageList = ({ accessId }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  const [languageScore, setLanguageScore] = useState(0);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        console.log('Fetching pages with accessId:', accessId);
        const response = await fetch(`/api/pages?accessId=${accessId}`);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        console.log('Fetched pages:', data);
        const pagesWithScores = data.map(page => ({
          ...page,
          score: calculatePageScore(page)
        }));
        setPages(pagesWithScores);
        const { totalScore, langScore } = calculateOverallScores(pagesWithScores);
        setOverallScore(totalScore);
        setLanguageScore(langScore);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pages:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPages();
  }, [accessId]);

  const calculatePageScore = (page) => {
    let score = 0;
    if (page.searchTerms[0] && (page.title + page.description).toLowerCase().includes(page.searchTerms[0].toLowerCase())) score++;
    if (page.searchTerms[1] && (page.title + page.description).toLowerCase().includes(page.searchTerms[1].toLowerCase())) score++;
    if (page.lang_check === "match") score++;
    return score;
  };

  const calculateOverallScores = (pages) => {
    const totalPossibleScore = pages.length * 3; // 2 for keywords, 1 for language
    const totalScore = pages.reduce((sum, page) => sum + page.score, 0);
    const overallPercentage = Math.round((totalScore / totalPossibleScore) * 100);
    
    const languageMatches = pages.filter(page => page.lang_check === "match").length;
    const languagePercentage = Math.round((languageMatches / pages.length) * 100);

    return { totalScore: overallPercentage, langScore: languagePercentage };
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (pages.length === 0) return <div>No pages found for this domain.</div>;

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 p-4 bg-blue-100 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Overall SEO Score</h2>
          <p className="text-3xl font-bold text-blue-600">{overallScore}%</p>
          <p className="text-sm text-gray-600">Language Score: {languageScore}%</p>
        </div>
        <div>
          <Award className={`w-12 h-12 ${overallScore >= 80 ? 'text-yellow-400' : 'text-gray-400'}`} />
        </div>
      </div>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Meta / URL</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW1</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW2</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pages.map((page) => (
            <tr key={page.pageId}>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{page.title}</div>
                <div className="text-sm text-gray-500">{page.description}</div>
                <div className="text-xs text-gray-400">{page.url}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <KeywordStatus keyword={page.searchTerms[0]} title={page.title} description={page.description} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <KeywordStatus keyword={page.searchTerms[1]} title={page.title} description={page.description} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <LanguageStatus langCheck={page.lang_check} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{page.score}/3</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link href={`/edit/${page.pageId}?accessId=${accessId}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                  Edit
                </Link>
                <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                  <ExternalLink className="inline-block w-4 h-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const KeywordStatus = ({ keyword, title, description }) => {
  const isPresent = keyword && (title + description).toLowerCase().includes(keyword.toLowerCase());
  return (
    <div className="flex items-center">
      {isPresent ? (
        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 mr-2" />
      )}
      <span className="text-sm text-gray-900">{keyword || 'N/A'}</span>
    </div>
  );
};

const LanguageStatus = ({ langCheck }) => {
  return (
    <div className="flex items-center">
      {langCheck === "match" ? (
        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 mr-2" />
      )}
      <Globe className="w-5 h-5 text-blue-500" />
    </div>
  );
};

export default PageList;