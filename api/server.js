const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3001;
// Zmieniamy ścieżkę, aby działała poprawnie na Vercel
const resultsFilePath = path.join(process.cwd(), 'results.json');

// Middleware
app.use(cors()); // Zezwala na żądania z innej domeny (naszego frontendu)
app.use(express.json()); // Pozwala na parsowanie ciała żądania w formacie JSON

// Funkcja pomocnicza do odczytu wyników
const readResults = async () => {
  try {
    // Sprawdź, czy plik istnieje
    await fs.access(resultsFilePath);
    const data = await fs.readFile(resultsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Jeśli plik nie istnieje, zwróć pustą tablicę
    if (error.code === 'ENOENT') {
      return [];
    }
    // W przypadku innego błędu, rzuć go dalej
    throw error;
  }
};

// Endpoint do pobierania wszystkich wyników
app.get('/api/results', async (req, res) => {
  try {
    const results = await readResults();
    // Sortuj wyniki od najnowszych do najstarszych
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(results);
  } catch (error) {
    console.error('Błąd podczas odczytu wyników:', error);
    res.status(500).json({ message: 'Nie udało się pobrać wyników.' });
  }
});

// Endpoint do zapisywania nowego wyniku
app.post('/api/results', async (req, res) => {
  try {
    const newResult = req.body;
    // Podstawowa walidacja
    if (!newResult || !newResult.name || !newResult.score) {
      return res.status(400).json({ message: 'Nieprawidłowe dane wyniku.' });
    }
    
    const results = await readResults();
    results.push(newResult);
    
    await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2), 'utf8');
    
    res.status(201).json({ message: 'Wynik został pomyślnie zapisany.' });
  } catch (error) {
    console.error('Błąd podczas zapisywania wyniku:', error);
    res.status(500).json({ message: 'Nie udało się zapisać wyniku.' });
  }
});


// Jeśli uruchamiamy lokalnie, serwer nasłuchuje na porcie
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
      console.log(`Serwer nasłuchuje na http://localhost:${port}`);
    });
}

// Eksportujemy aplikację, aby Vercel mógł jej użyć jako serverless function
module.exports = app;

