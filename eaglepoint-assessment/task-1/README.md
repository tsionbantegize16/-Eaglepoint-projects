# Smart Text Analyzer

A full-stack web application that analyzes text and provides detailed statistics including word count, average word length, longest words, and word frequency.

## Features

- **Total Word Count**: Counts all words in the input text
- **Average Word Length**: Calculates average word length with 2 decimal precision
- **Longest Word(s)**: Finds and displays all words with the maximum length (handles ties)
- **Word Frequency**: Shows case-insensitive word frequency counts

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Node.js, Express
- **API**: RESTful API with CORS support

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

You need to run both the server and client in separate terminal windows:

**Terminal 1 - Start the Server:**
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`

**Terminal 2 - Start the Client:**
```bash
cd client
npm start
```
The client will run on `http://localhost:3000` and automatically open in your browser.

## Usage

1. Open the application in your browser (usually `http://localhost:3000`)
2. Enter or paste text into the textarea
3. Click the "Analyze Text" button
4. View the analysis results including:
   - Total word count
   - Average word length
   - Longest word(s)
   - Word frequency table (sorted by frequency)

## API Endpoint

**POST** `/api/analyze`

Request Body:
```json
{
  "text": "Your text here"
}
```

Response:
```json
{
  "word_count": 10,
  "average_word_length": 4.50,
  "longest_words": ["example"],
  "word_frequency": {
    "the": 2,
    "quick": 1,
    "brown": 1
  }
}
```

## Project Structure

```
task-1/
├── client/          # React frontend application
│   ├── src/
│   │   ├── App.js   # Main application component
│   │   └── index.js # Entry point
│   └── package.json
└── server/          # Express backend server
    ├── index.js     # Server and analysis logic
    └── package.json
```

