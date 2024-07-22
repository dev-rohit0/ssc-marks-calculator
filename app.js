const express = require('express');
const { startBrowser, scrapeData } = require('./scraper');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/result', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const { browser, page } = await startBrowser();
    await page.goto(url, { waitUntil: 'load', timeout: 0 });

    const data = await scrapeData(page);

    await browser.close();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while scraping the data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
