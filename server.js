import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { generateCustomResumeData } from './ai_call.js';
import path from 'path';
import morgan from 'morgan';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { promisify } from 'util';

const app = express();
const port = 3000;

// Promisify fs.readdir and fs.unlink for use with async/await
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

// Function to clear files in a directory
async function clearDirectory(directoryPath) {
  try {
    const files = await readdir(directoryPath);
    const unlinkPromises = files.map(file => unlink(path.join(directoryPath, file)));
    await Promise.all(unlinkPromises);
    console.log(`Cleared all files in ${directoryPath}.`);
  } catch (error) {
    console.error(`Error clearing directory ${directoryPath}:`, error);
  }
}

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
  } catch (error) {
    console.error('Error storing API response:', error);
  }
}

// Convert the URL of the current module to a file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.post('/generate-resume', async (req, res) => {
  // Clear files in the directories before handling new request
  await clearDirectory('./uploads');
  await clearDirectory('./apiResponses');

  upload.fields([{ name: 'genericResume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }])(req, res, async (error) => {
    if (error) {
      console.error('Multer error:', error);
      return res.status(500).send('Failed to upload files.');
    }

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
      const rawData = await generateCustomResumeData(resumeContent, jobDescription);
      const cleanData = cleanJsonString(rawData);

      if (cleanData) {
        res.json(JSON.parse(cleanData));  // Send cleaned JSON object to client
      } else {
        res.status(500).send('Failed to process JSON data');
      }

      storeApiResponseLocallyAndSend(JSON.parse(cleanData)).catch(error => {
        console.error('Error storing API response locally and sending:', error);
      });
    } catch (error) {
      console.error('Error processing /generate-resume request:', error);
      if (!res.headersSent) {
        res.status(500).send('An error occurred processing your request.');
      }
    }
  });
});

function cleanJsonString(inputString) {
  try {
    // Parse the input string as JSON
    const jsonObj = JSON.parse(inputString);
    // Stringify the JSON object to ensure proper formatting
    return JSON.stringify(jsonObj, null, 2);
  } catch (error) {
    console.error('Failed to clean JSON string:', error);
    return null;  // or handle the error as appropriate
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});