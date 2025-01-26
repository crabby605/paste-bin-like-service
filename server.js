// server.js
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { nanoid } = require('nanoid');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Save paste endpoint
app.post('/api/save-paste', async (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Paste content is required' });
    }

    try {
        // Generate a unique slug
        const slug = nanoid(8);

        // Save paste to Supabase
        const { data, error } = await supabase
            .from('pastes')
            .insert([{ content, slug }]);

        if (error) {
            throw error;
        }

        // Respond with the slug
        res.status(200).json({ slug });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error saving paste' });
    }
});

// Display a saved paste by slug
app.get('/paste/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const { data, error } = await supabase
            .from('pastes')
            .select('content')
            .eq('slug', slug)
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).send('Paste not found');
        }

        res.send(`
      <html>
        <body>
          <h1>Pastebin</h1>
          <pre>${data.content}</pre>
        </body>
      </html>
    `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving paste');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
