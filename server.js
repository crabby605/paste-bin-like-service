// server.js

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const bodyParser = require('body-parser');

// Initialize express
const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware to handle POST data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (like CSS and JS)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase client
const supabase = createClient(
    'https://your-project-url.supabase.co', // Replace with your Supabase URL
    'your-anon-key' // Replace with your Supabase anon key
);

// Route to serve the main paste page
app.get('/', (req, res) => {
    res.send(`
    <html>
      <head>
        <title>Pastebin - Minimalist</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <h1>Create a New Paste</h1>
          <form action="/create" method="POST">
            <textarea name="content" placeholder="Write your paste here..." rows="10" cols="50"></textarea><br><br>
            <button type="submit">Create Paste</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Route to create a new paste and save it to Supabase
app.post('/create', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const slug = Math.random().toString(36).substr(2, 8); // Generate a random slug
        const { data, error } = await supabase.from('pastes').insert([{ slug, content }]);

        if (error) {
            console.error('Supabase error:', error); // Log Supabase error details
            return res.status(500).json({ error: 'Database error', details: error.message });
        }

        res.json({ url: `${req.protocol}://${req.get('host')}/p/${slug}` });
    } catch (err) {
        console.error('Server error:', err); // Log server-side error details
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});
// Route to fetch and display a paste based on the slug
app.get('/p/:slug', async (req, res) => {
    const slug = req.params.slug;

    // Fetch paste content from Supabase
    const { data, error } = await supabase
        .from('pastes')
        .select('content')
        .eq('slug', slug)
        .single();  // We expect only one result

    if (error || !data) {
        return res.status(404).send('Paste not found');
    }

    // Return the paste content as HTML
    res.send(`
    <html>
      <head>
        <title>Paste - ${slug}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <h2>Paste: ${slug}</h2>
          <pre>${data.content}</pre>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
