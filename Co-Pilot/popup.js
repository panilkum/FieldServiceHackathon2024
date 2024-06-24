document.getElementById('startJourneyButton').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if the URL is accessible
  if (tab.url.startsWith('chrome://')) {
    document.getElementById('responseText').innerText = 'Cannot capture screenshots of Chrome internal pages.';
    return;
  }

  // Show loading icon
  document.getElementById('loading').style.display = 'block';

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: captureScreenshot,
    args: [inputText],
  });
});

document.getElementById('closeButton').addEventListener('click', () => {
  window.close(); // Close the popup
});

function captureScreenshot(inputText) {
  chrome.tabs.captureVisibleTab(null, {}, async (dataUrl) => {
    const imageEncodedBase64 = dataUrl.split(',')[1];
    const response = await getNextInstruction(imageEncodedBase64, inputText);
    
    // Hide loading icon and display response
    document.getElementById('loading').style.display = 'none';
    document.getElementById('responseText').innerText = response;
    
    document.getElementById('startJourneyButton').style.display = 'none';
    document.getElementById('doneButton').style.display = 'block';
  });
}

async function getNextInstruction(imageEncodedBase64, textMessage) {
  const CHAT_KEY = "sk-proj-SGJBNqk5aq5VR2CSig8DT3BlbkFJP2iF9gKhoCe5WZKXRAvM";
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `USE THE OFFICIAL SALESFORCE DOCS TO HELP THE ADMIN. The admin wants to create a new user named XYZ. GIVE ONE STEP AT A TIME. Read the screenshot shared by the user to know what to do next.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: textMessage },
          { type: "image_url", image_url: { url: `${imageEncodedBase64}` } }
        ]
      }
    ],
    max_tokens: 300
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CHAT_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling GPT-4 Vision API:', error);
    return 'Error: Unable to process the request';
  }
}
