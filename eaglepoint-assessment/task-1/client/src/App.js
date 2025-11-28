// task-1/client/src/App.js
import React, { useState } from 'react';

const API_URL = 'http://localhost:5000/api/analyze';

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverConnected, setServerConnected] = useState(null);

  // Check server connection on mount
  React.useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setServerConnected(true);
        } else {
          setServerConnected(false);
        }
      } catch (err) {
        setServerConnected(false);
      }
    };
    checkServer();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);

    } catch (err) {
      // Provide more helpful error messages
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to server. Please make sure the server is running on http://localhost:5000');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    // Sort frequency array by count (descending)
    const frequencyArray = Object.entries(results.word_frequency)
      .sort(([, countA], [, countB]) => countB - countA); 

    return (
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>
          📈 Analysis Results
        </h2>
        
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          
          {/* Word Count */}
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>
              Total Word Count
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2563eb' }}>
              {results.word_count}
            </p>
          </div>
          
          {/* Avg. Word Length */}
          <div style={{
            backgroundColor: '#d1fae5',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>
              Avg. Word Length
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#059669' }}>
              {results.average_word_length.toFixed(2)}
            </p>
          </div>
          
          {/* Longest Word(s) */}
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>
              Longest Word(s)
            </h3>
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', wordBreak: 'break-word' }}>
              {results.longest_words.length > 0 ? results.longest_words.join(', ') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Word Frequency Table */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          📊 Word Frequency
        </h3>
        <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderCollapse: 'collapse'
            }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr>
                        <th style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid #d1d5db', 
                          textAlign: 'left', 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#4b5563' 
                        }}>
                          Word
                        </th>
                        <th style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid #d1d5db', 
                          textAlign: 'left', 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#4b5563' 
                        }}>
                          Count
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {frequencyArray.map(([word, count], index) => (
                        <tr 
                          key={word} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb'}
                        >
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                              {word}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#1f2937' }}>
                              {count}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="max-w-4xl mx-auto my-10 p-6 bg-white shadow-xl rounded-xl" style={{ 
        maxWidth: '900px', 
        margin: '20px auto', 
        padding: '30px', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800" style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '24px', 
          textAlign: 'center', 
          color: '#1f2937' 
        }}>
          📊 Smart Text Analyzer
        </h1>
        
        {/* Input Area */}
        <textarea
          placeholder="Enter your text here for analysis..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows="8"
          className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition duration-150 ease-in-out"
          style={{
            width: '100%',
            padding: '16px',
            marginBottom: '16px',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        ></textarea>
        
        {/* Analyze Button */}
        <button 
          onClick={handleAnalyze} 
          disabled={loading || inputText.trim() === ''}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: loading || inputText.trim() === '' ? '#9ca3af' : '#4f46e5',
            color: 'white',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: loading || inputText.trim() === '' ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading && inputText.trim() !== '') {
              e.target.style.backgroundColor = '#4338ca';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && inputText.trim() !== '') {
              e.target.style.backgroundColor = '#4f46e5';
            }
          }}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze Text'}
        </button>

        {/* Server Status */}
        {serverConnected === false && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            color: '#92400e'
          }}>
            <strong>⚠️ Server Not Connected:</strong> Please make sure the server is running on port 5000. 
            Run <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>npm start</code> in the server directory.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {renderResults()}
      </div>
    </div>
  );
}

export default App;