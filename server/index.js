const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

console.log('STARTING EATSAFE SERVER index.js', __filename);
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../client')));

// Sending venue data to user
app.get('/venues', (req, res) => {
    const file = path.join(__dirname, 'data', 'venues.json');
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'failed to read venues' });
        try {
            const json = JSON.parse(data);
            return res.json(json);
        } catch (e) {
            return res.status(500).json({ error: 'invalid JSON' });
        }
    });
});

// When user deletes a review
app.post('/delete-review', (req, res) => {
    const { venueName, reviewerName } = req.body;
    if (!venueName || !reviewerName) return res.status(400).json({ error: 'venueName and reviewerName required' });

    const file = path.join(__dirname, 'data', 'venues.json');
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'failed to read venues' });
        let json;
        try {
            json = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'invalid JSON' });
        }

        const venues = json.Venues || [];
        const venue = venues.find(v => v['display-name'] === venueName); // Finding correct venue
        if (!venue) return res.status(404).json({ error: 'venue not found' });

        // Determing the reviews to remove and filtering them out
        const originalCount = (venue.reviews || []).length;
        venue.reviews = (venue.reviews || []).filter(r => r.name !== reviewerName);
        const newCount = venue.reviews.length;

        fs.writeFile(file, JSON.stringify(json, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'failed to write venues' });
            return res.json({ success: true, removed: originalCount - newCount });
        });
    });
});

// When user wants to post a review
app.post('/post-review', (req, res) => {
    console.log('start')
    const { venueName, reviewerName, reviewStars, reviewContent } = req.body;
    if (!venueName || !reviewerName || !reviewStars || !reviewContent) return res.status(400).json({ error: "Missing credentials"});

    const file = path.join(__dirname, 'data', 'venues.json');

    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'failed to read venues' });
        let json;
        try {
            json = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'invalid JSON' });
        }

        const venues = json.Venues || [];
        const venue = venues.find(v => v['display-name'] === venueName);
        if (!venue) return res.status(404).json({ error: 'venue not found' });

        const newReview = {
            name: reviewerName,
            stars: Number(reviewStars),
            content: reviewContent
        };

        if (!Array.isArray(venue.reviews)) venue.reviews = [];

        venue.reviews.push(newReview); // Add review to list

        fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8', (err) => {
            console.log('end');
            if (err) return res.status(500).json({ error: 'failed to write venues' });
            return res.json({ success: true, review: newReview });
        });

})
});

const HOST = "127.0.0.1"
const PORT = 5500;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});