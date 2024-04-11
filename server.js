import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { generateCustomResumeData } from './ai_call.js';
import path from 'path';
import morgan from 'morgan';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

// Simplified function to read the content of the resume file assuming it's a .txt file
async function readResumeFile(filePath) {
  console.log(`Reading file: ${filePath}`);
  try {
    return fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading text file:', error);
    throw error;
  }
}

// Function to store the API response locally and send it to the Google Apps Script
async function storeApiResponseLocallyAndSend(data) {
  const filePath = `./apiResponses/response-${Date.now()}.json`;
  const fileData = JSON.stringify(data, null, 2);
  try {
    await fs.promises.writeFile(filePath, fileData);
    console.log(`API response stored locally at ${filePath}`);
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbzu3LQ49SZRyILqjXMqOqDcEIommqIMoDB6W7yWdi1Amemu7UB7KJPiH6sQmfMgLPFTiw/exec';
    console.log('Sending POST request to:', webAppUrl);

    const response = await fetch(webAppUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    
      if (response.ok) {
        const responseText = await response.text(); // Get the response text
        console.log('Response text:', responseText); // Log the response text
    
        const result = JSON.parse(responseText); // Parse the response text as JSON
        console.log('Success:', result);
      } else {
        console.error('Error:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response text:', text);
      }
  } catch (error) {
    console.error('Error storing API response or sending:', error);
  }
}

// Convert the URL of the current module to a file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.post('/generate-resume', upload.fields([{ name: 'genericResume', maxCount: 1 }, { name: 'jobDescriptionFile', maxCount: 1 }]), async (req, res) => {
  console.log('Received /generate-resume request.');

  try {
    const { jobDescription } = req.body;
    const { files } = req;

    console.log('Files:', files ? 'Received' : 'Not Received', 'Job Description:', jobDescription ? 'Received' : 'Not Received');

    if (!files || !files.genericResume || files.genericResume.length === 0) {
      console.error('No resume file uploaded with the request.');
      return res.status(400).send('No resume file uploaded.');
    }

    const jobDescriptionPath = `uploads/jobDescription-${Date.now()}.txt`;
    await fs.promises.writeFile(jobDescriptionPath, jobDescription);

    const resumeContent = await readResumeFile(files.genericResume[0].path);
    const customResumeData = await generateCustomResumeData(resumeContent, jobDescription);
    res.json(customResumeData);

    storeApiResponseLocallyAndSend(customResumeData).catch(error => {
      console.error('Error storing API response locally and sending:', error);
    });
  } catch (error) {
    console.error('Error processing /generate-resume request:', error);
    if (!res.headersSent) {
      res.status(500).send('An error occurred processing your request.');
    }
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});