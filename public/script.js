let customResumeData; // Declare this at the top to make it accessible across functions

async function generateResume(event) {
  event.preventDefault(); // Add this line to prevent form submission
  const genericResume = document.getElementById('generic-resume').files[0];
  const jobDescription = document.getElementById('job-description').value;

  // Clear previous JSON content when the button is clicked
  const jsonContent = document.getElementById('json-content');
  if (jsonContent) {
    jsonContent.innerHTML = '';
  } else {
    console.error('Failed to find the JSON content element.');
  }

  if (!genericResume || !jobDescription) {
    alert('Please provide both the generic resume and job description.');
    return;
  }

  console.log('Sending data:', { genericResume, jobDescription });

  // Since genericResume is a file, you need to use FormData to send it
  const formData = new FormData();
  formData.append('genericResume', genericResume);
  formData.append('jobDescription', jobDescription);

  try {
    const response = await fetch('/generate-resume', { method: 'POST', body: formData });
    if (response.ok) {
      const customResumeData = await response.json();
      displayCustomResumeData(customResumeData);
    } else {
      console.error('Failed to fetch resume data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayCustomResumeData(customResumeData) {
  const jsonPreview = document.getElementById('json-preview');
  const jsonContent = document.getElementById('json-content');

  jsonContent.innerHTML = ''; // Clear previous content

  // Convert JSON object to HTML
  const htmlContent = jsonToHtml(customResumeData);
  jsonContent.appendChild(htmlContent);

  // Make sure to display the container
  jsonPreview.style.display = 'block';
}

function jsonToHtml(jsonObject) {
  const container = document.createElement('ul');
  container.className = 'json-list';

  for (const key in jsonObject) {
    if (jsonObject.hasOwnProperty(key)) {
      const element = jsonObject[key];
      const listItem = document.createElement('li');

      if (key === 'description') {
        // Handle description differently by splitting into sentences and making each a list item
        listItem.innerHTML = `<strong>${key}:</strong>`;
        const descriptionList = document.createElement('ul');
        const sentences = element.match(/[^\.!\?]+[\.!\?]+/g) || []; // Regex to split into sentences

        sentences.forEach(sentence => {
          const sentenceItem = document.createElement('li');
          sentenceItem.textContent = sentence.trim();
          descriptionList.appendChild(sentenceItem);
        });

        listItem.appendChild(descriptionList);
      } else if (Array.isArray(element)) {
        listItem.innerHTML = `<strong>${key}:</strong>`;
        const sublist = document.createElement('ul');
        element.forEach(subElement => {
          const subListItem = document.createElement('li');
          // Check if subElement is an object and handle recursively
          if (typeof subElement === 'object' && !Array.isArray(subElement)) {
            subListItem.appendChild(jsonToHtml(subElement));
          } else {
            subListItem.textContent = subElement;
          }
          sublist.appendChild(subListItem);
        });
        listItem.appendChild(sublist);
      } else if (typeof element === 'object') {
        listItem.innerHTML = `<strong>${key}:</strong>`;
        listItem.appendChild(jsonToHtml(element)); // Handle nested objects recursively
      } else {
        listItem.innerHTML = `<strong>${key}:</strong> ${element}`;
      }

      container.appendChild(listItem);
    }
  }
  return container;
}

// Attach event listener to the generate resume button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generate-resume-button').addEventListener('click', generateResume);
  // If you have functionality for final-resume-button, ensure it's correctly implemented
  // document.getElementById('final-resume-button').addEventListener('click', () => sendToGoogleAppsScript(customResumeData));
});