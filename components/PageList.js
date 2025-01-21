import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle, XCircle, Award, Globe, Download } from 'lucide-react';

const PageList = ({ accessId }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  const [languageScore, setLanguageScore] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(40);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const calculatePageScore = (page) => {
    let score = 0;
    const title = String(page.title || '');
    const description = String(page.description || '');
    const content = (title + description).toLowerCase();
    
    if (page.searchTerms[0] && content.includes(page.searchTerms[0].toLowerCase())) score++;
    if (page.searchTerms[1] && content.includes(page.searchTerms[1].toLowerCase())) score++;
    if (page.searchTerms[2] && content.includes(page.searchTerms[2].toLowerCase())) score++;
    if (page.lang_check === "match") score++;
    return score;
  };

  const calculateOverallScores = (pages) => {
    const totalPossibleScore = pages.length * 4; // 3 for keywords, 1 for language
    const totalScore = pages.reduce((sum, page) => sum + page.score, 0);
    const overallPercentage = Math.round((totalScore / totalPossibleScore) * 100);
    
    const languageMatches = pages.filter(page => page.lang_check === "match").length;
    const languagePercentage = Math.round((languageMatches / pages.length) * 100);

    return { totalScore: overallPercentage, langScore: languagePercentage };
  };

  const downloadCSV = () => {
    const headers = ['url', 'title', 'description'];
    const csvData = pages.map(page => ({
      url: page.url,
      title: page.title,
      description: page.description
    }));

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => 
          `"${row[header]?.replace(/"/g, '""') || ''}"`)
        .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'page_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPages = pages.filter(page => {
    const search = searchTerm.toLowerCase();
    const title = String(page.title || '').toLowerCase();
    const description = String(page.description || '').toLowerCase();
    const url = String(page.url || '').toLowerCase();
    
    return title.includes(search) || 
           description.includes(search) || 
           url.includes(search);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (pages.length === 0) return <div>No pages found for this domain.</div>;

  return (
    <div className="overflow-x-auto w-full max-w-[95vw] mx-auto">
      <div className="mb-4 p-4 bg-blue-100 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Overall SEO Score</h2>
          <p className="text-3xl font-bold text-blue-600">{overallScore}%</p>
          <p className="text-sm text-gray-600">Language Score: {languageScore}%</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
          <Award className={`w-12 h-12 ${overallScore >= 80 ? 'text-yellow-400' : 'text-gray-400'}`} />
        </div>
      </div>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search in URLs, titles, and meta descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Found {filteredPages.length} of {pages.length} pages
          </div>
        )}
      </div>
      <table className="w-full table-fixed bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Meta / URL</th>
            <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW1</th>
            <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW2</th>
            <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW3</th>
            <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lang</th>
            <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {currentItems.map((page) => (
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
                <KeywordStatus keyword={page.searchTerms[2]} title={page.title} description={page.description} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <LanguageStatus langCheck={page.lang_check} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{page.score}/4</div>
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
      <PaginationControls 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        filteredPages={filteredPages}
      />
    </div>
  );
};

const KeywordStatus = ({ keyword, title, description }) => {
  const safeTitle = String(title || '');
  const safeDescription = String(description || '');
  const content = (safeTitle + safeDescription).toLowerCase();
  const isPresent = keyword && content.includes(keyword.toLowerCase());
  
  return (
    <div className="flex items-center space-x-2 overflow-hidden">
      {isPresent ? (
        <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="flex-shrink-0 w-5 h-5 text-red-500" />
      )}
      <span className="text-sm text-gray-900 truncate">{keyword || 'N/A'}</span>
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

const PaginationControls = ({ currentPage, setCurrentPage, totalPages, indexOfFirstItem, indexOfLastItem, filteredPages }) => {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
            currentPage === 1 
              ? 'text-gray-300'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
            currentPage === totalPages
              ? 'text-gray-300'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastItem, filteredPages.length)}
            </span>{' '}
            of <span className="font-medium">{filteredPages.length}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="sr-only">Previous</span>
              ←
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  currentPage === index + 1
                    ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                currentPage === totalPages ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="sr-only">Next</span>
              →
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PageList;