// task-1/server/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- Task 1: Smart Text Analyzer Core Logic (Node.js) ---
// Requirements:
// 1. Total word count
// 2. Average word length (2 decimals)
// 3. Longest word(s) (all if tied)
// 4. Word frequency (case-insensitive)

function analyzeText(text) {
    let totalWordCount = 0;
    let totalCharacterCount = 0;
    let maxWordLength = 0;
    const wordFrequency = new Map(); // Case-insensitive word frequency
    const longestWordsSet = new Set(); // Store unique longest words

    // Handle empty input
    if (!text || text.trim() === "") {
         return {
            "word_count": 0,
            "average_word_length": 0.00,
            "longest_words": [],
            "word_frequency": {}
        };
    }
    
    // Use regex to split text by any non-alphanumeric character (removes punctuation, spaces, etc.)
    const words = text
        .split(/[^a-z0-9]+/i)
        .filter(word => word.length > 0);
        
    if (words.length === 0) {
        return {
            "word_count": 0,
            "average_word_length": 0.00,
            "longest_words": [],
            "word_frequency": {}
        };
    }

    // Process each word
    for (const word of words) {
        // Normalize to lowercase for case-insensitive frequency counting
        const normalizedWord = word.toLowerCase();

        // 1. Total word count
        totalWordCount++;
        
        // Track character count for average calculation
        totalCharacterCount += word.length;

        // 4. Word frequency (case-insensitive)
        wordFrequency.set(normalizedWord, (wordFrequency.get(normalizedWord) || 0) + 1);

        // 3. Longest word(s) tracking - find all words with maximum length
        if (word.length > maxWordLength) {
            maxWordLength = word.length;
            longestWordsSet.clear(); // Clear previous longest words
            longestWordsSet.add(word); // Add new longest word
        } else if (word.length === maxWordLength) {
            longestWordsSet.add(word); // Add tied longest word
        }
    }
    
    // 2. Calculate average word length with 2 decimal precision
    const rawAverage = totalCharacterCount / totalWordCount;
    const averageWordLength = parseFloat(rawAverage.toFixed(2)); 
    
    // Convert Map to object for JSON response
    const frequencyObject = Object.fromEntries(wordFrequency);
    
    // Convert Set to array for longest words (preserves original case)
    const longestWordsArray = Array.from(longestWordsSet);
    
    return {
        "word_count": totalWordCount,
        "average_word_length": averageWordLength,
        "longest_words": longestWordsArray,
        "word_frequency": frequencyObject
    };
}


// --- API Endpoints ---

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Text analysis endpoint
app.post('/api/analyze', (req, res) => {
    const { text } = req.body;
    
    if (text === undefined) {
        return res.status(400).json({ error: "Missing 'text' field in request body." });
    }

    try {
        const results = analyzeText(text);
        res.json(results);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: "Internal server error during analysis." });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});