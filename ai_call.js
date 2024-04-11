import axios from 'axios';

const apiKey = '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';

async function generateCustomResumeData(genericResume, jobDescription) {
  const requestBody = {
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant tasked with tailoring a generic resume to a specific job description. Your role is to identify and highlight the most relevant skills and experiences from the generic resume that align with the job description provided. You must not add new skills or experiences or alter any personal details or existing job titles, companies, locations, or date ranges.

Given the following generic resume:
${genericResume}

And the following job description:
${jobDescription}

Generate a tailored resume in JSON format that enhances the generic resume with details relevant to the job description. The output JSON object should have the following structure for easy integration into a Google Sheets project:
{
  "summary": "Tailored based on job description. Highlight existing skills but feel free to be creative based on the user's skillset",
  "skills": [
    "Selected from the existing skills on the generic resume. Choose the top 20 most relevant skills."
  ],
  "experience": [
    {
      "company": "Extracted from generic resume",
      "role": "Extracted from generic resume",
      "location": "Extracted from generic resume",
      "dateRange": "Extracted from generic resume",
      "description": "Tailored based on job description using existing details from the generic resume. Feel free to be creative based on the user's skillset."
    }
  ]
}

You are to strictly adhere to the information provided in the generic resume. Only the 'description' field of each experience entry should be modified to better match the job description. The 'skills' array should only include skills that are already listed on the generic resume and are relevant to the job description. Do not introduce any new information or modify existing details other than the 'description' field as specified.`,
      },
      { role: "user", content: "Generate custom resume data" },
    ],
    response_format: { type: "json_object" },
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('API response:', response.data);
    // Adjust based on the actual structure of the response
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

export { generateCustomResumeData };