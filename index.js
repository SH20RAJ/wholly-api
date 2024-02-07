// index.js

const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.post('/upload', async (req, res) => {
  try {
    const file = req.body.file;

    // Save the file temporarily
    const tempPath = `./temp/${file.name}`;
    fs.writeFileSync(tempPath, file.data, 'binary');

    // Import node-fetch dynamically
    const { default: fetch } = await import('node-fetch');

    // Upload the file to GitHub repository
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = "sopdrive";
    const repo = "images";
    const filePath = `images/${file.name}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const base64Data = fs.readFileSync(tempPath, 'base64');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Upload image',
        content: base64Data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    // Construct the URL of the uploaded file
    const uploadedFileUrl = jsonResponse.content.html_url;

    // Respond with the URL of the uploaded file
    res.status(200).json({ url: uploadedFileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
