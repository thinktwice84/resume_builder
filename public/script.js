let customResumeData; // Declare this at the top to make it accessible across functions

async function generateResume() {
  const genericResume = document.getElementById('generic-resume').files[0]; // Updated to handle file input
  const jobDescription = document.getElementById('job-description').value;
  console.log('Sending data:', { genericResume, jobDescription });

  // Since genericResume is a file, you need to use FormData to send it
  const formData = new FormData();
  formData.append('genericResume', genericResume);
  formData.append('jobDescription', jobDescription);

  try {
    const response = await fetch('/generate-resume', {
      method: 'POST',
      body: formData, // Updated to send formData
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    customResumeData = await response.json(); // Assuming the server responds with JSON
    console.log('Received custom resume data:', customResumeData);
    displayCustomResumePreview(customResumeData);
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayCustomResumePreview(data) {
  console.log('Displaying custom resume data:', data);
  // Assuming you have elements with these IDs to display the preview
  const skillsPreview = document.getElementById('skills-preview');
  const addBulletsPreview = document.getElementById('add-bullets-preview');
  const rephraseBulletsPreview = document.getElementById('rephrase-bullets-preview');

  skillsPreview.innerHTML = data.skills.map(skill => `<li>${skill}</li>`).join('');
  addBulletsPreview.innerHTML = data.addBullets.map(bullet => `<li>${bullet}</li>`).join('');
  rephraseBulletsPreview.innerHTML = data.rephraseBullets.map(bullet => 
    `<li>
      <strong>Original:</strong> ${bullet.original}<br>
      <strong>Revised:</strong> ${bullet.revised}
    </li>`
  ).join('');

  document.getElementById('custom-resume-preview').style.display = 'block';
}

async function sendToGoogleAppsScript(customResumeData) {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbxIyLeLG30y9mzuQqrDR-gw32sjaQXeQ5N69c3HcCKVxFiUDBaEeCsZTU-531hn8ewjCg/exec';
  
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors', // Adjust this depending on your CORS setup
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customResumeData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.text();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Attach event listeners to buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generate-resume-button').addEventListener('click', generateResume);
  document.getElementById('final-resume-button').addEventListener('click', () => sendToGoogleAppsScript(customResumeData));
});