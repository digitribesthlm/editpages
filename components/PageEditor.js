import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function PageEditor({ id, accessId }) {
  const router = useRouter();
  const [pageInfo, setPageInfo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerms, setSearchTerms] = useState([]);
  const [saveNotification, setSaveNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageInfo = async () => {
      try {
        const response = await fetch(`/api/pages?accessId=${accessId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch page information');
        }
        const pages = await response.json();
        const page = pages.find(p => p.pageId === Number(id));
        if (page) {
          setPageInfo(page);
          setTitle(page.title);
          setDescription(page.description);
          // Convert searchTerms to new format if necessary
          if (Array.isArray(page.searchTerms) && page.searchTerms.every(term => typeof term === 'string')) {
            setSearchTerms(page.searchTerms.map(term => ({ term, quoted: term.includes(' ') })));
          } else {
            setSearchTerms(page.searchTerms);
          }
        } else {
          throw new Error('Page not found');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (id && accessId) {
      fetchPageInfo();
    }
  }, [id, accessId]);

  const handleSave = async () => {
    if (pageInfo) {
      const { _id, ...updateData } = pageInfo;
      const updatedPageInfo = {
        ...updateData,
        pageId: Number(id),
        title,
        description,
        searchTerms: searchTerms.map(({ term }) => term), // Convert back to simple array of strings for API
      };
      try {
        const response = await fetch(`/api/pages?accessId=${accessId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPageInfo),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Save response:', data);

        setSaveNotification('Changes saved successfully!');
        setTimeout(() => {
          router.push(`/?accessId=${accessId}`);
        }, 1500);
      } catch (err) {
        console.error('Save error:', err);
        setSaveNotification(`Error: ${err.message}`);
      }
    }
  };

  const isTermPresentInTitle = (term) => {
    return title.toLowerCase().includes(term.toLowerCase());
  };

  const isTermPresentInDescription = (term) => {
    return description.toLowerCase().includes(term.toLowerCase());
  };

  const KeywordIndicator = ({ isPresent }) => {
    return isPresent ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const splitSearchTerms = (input) => {
    const regex = /[^\s,"]+|"([^"]*)"/g;
    let terms = [];
    let match;
    
    while ((match = regex.exec(input)) !== null) {
      if (match[1]) {
        terms.push({ term: match[1], quoted: true });  // Quoted term
      } else {
        terms.push({ term: match[0], quoted: match[0].includes(' ') });  // Unquoted term
      }
    }
    
    return terms.filter(({ term }) => term.trim() !== '');
  };

  const joinSearchTerms = (terms) => {
    return terms.map(({ term, quoted }) => quoted || term.includes(' ') ? `"${term}"` : term).join(', ');
  };

  const handleAddSearchTerm = (newTerm) => {
    const existingTerms = searchTerms.map(({ term }) => term);
    if (!existingTerms.includes(newTerm.term)) {
      setSearchTerms([...searchTerms, newTerm]);
    }
  };

  const handleRemoveSearchTerm = (termToRemove) => {
    setSearchTerms(searchTerms.filter(({ term }) => term !== termToRemove));
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4">Edit Page</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
          Title (Recommended max: 70 characters; Current: {title.length})
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex mt-2">
          {searchTerms.map((term, index) => (
            <KeywordIndicator key={index} isPresent={isTermPresentInTitle(term.term)} />
          ))}
        </div>
      </div>
  
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description (Recommended max: 155 characters; Current: {description.length})
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex mt-2">
          {searchTerms.map((term, index) => (
            <KeywordIndicator key={index} isPresent={isTermPresentInDescription(term.term)} />
          ))}
        </div>
      </div>
  
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="searchTerms">
          Search Terms (comma-separated, use quotes for multi-word terms)
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="searchTerms"
          type="text"
          value={joinSearchTerms(searchTerms)}
          onChange={(e) => setSearchTerms(splitSearchTerms(e.target.value))}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mt-2"
          onClick={() => handleAddSearchTerm({ term: 'New Term', quoted: false })}
        >
          Add New Term
        </button>
        <ul className="list-disc pl-4 mt-2">
          {searchTerms.map((term, index) => (
            <li key={index}>
              {term.term}
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2"
                onClick={() => handleRemoveSearchTerm(term.term)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
  
      {saveNotification && (
        <div className={`mb-4 p-2 rounded ${saveNotification.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {saveNotification.includes('Error') ? <AlertCircle className="inline mr-2" /> : <CheckCircle className="inline mr-2" />}
          {saveNotification}
        </div>
      )}
  
      <div className="flex justify-between">
        <Link href={`/?accessId=${accessId}`} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Back to List
        </Link>
        
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
  }
  
  export default PageEditor;