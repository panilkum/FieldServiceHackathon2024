document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startJourneyButton').addEventListener('click', async () => {
    debugger;
    const inputText = document.getElementById('inputText').value;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if the URL is accessible
    if (tab.url.startsWith('chrome://')) {
      document.getElementById('responseText').innerText = 'Cannot capture screenshots of Chrome internal pages.';
      return;
    }

    // Show loading icon
    document.getElementById('loading').style.display = 'block';

    // chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   func: captureScreenshot,
    //   args: [inputText],
    // });

    debugger;
    chrome.tabs.captureVisibleTab(null, {}, async (dataUrl) => {
      console.log(dataUrl)
      const imageEncodedBase64 = dataUrl.split(',')[1];
      console.log("ok")
      const response = await getNextInstruction(dataUrl, inputText);
      
      // Hide loading icon and display response
      document.getElementById('loading').style.display = 'none';
      debugger;
      document.getElementById('responseText').innerHTML=""

      document.getElementById('responseText').insertAdjacentHTML('beforeend', response);
      document.getElementById('responseText').style.display = 'block';

      
      document.getElementById('startJourneyButton').style.display = 'none';
      document.getElementById('doneButton').style.display = 'block';
      document.getElementById('inputText').style.display = 'none'
    });

  });


  document.getElementById('doneButton').addEventListener('click', async () => {
    debugger;
    const inputText = "What should I do next?";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if the URL is accessible
    if (tab.url.startsWith('chrome://')) {
      document.getElementById('responseText').innerText = 'Cannot capture screenshots of Chrome internal pages.';
      return;
    }

    // Show loading icon
    document.getElementById('loading').style.display = 'block';

    // chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   func: captureScreenshot,
    //   args: [inputText],
    // });

    debugger;
    chrome.tabs.captureVisibleTab(null, {}, async (dataUrl) => {
      console.log(dataUrl)
      const imageEncodedBase64 = dataUrl.split(',')[1];
      console.log("ok")
      const response = await getNextInstruction(dataUrl, inputText);
      
      // Hide loading icon and display response
      document.getElementById('loading').style.display = 'none';
      document.getElementById('responseText').innerHTML=""
      document.getElementById('responseText').insertAdjacentHTML('beforeend', response);
      document.getElementById('responseText').style.display = 'block';
      
      document.getElementById('startJourneyButton').style.display = 'none';
      document.getElementById('doneButton').style.display = 'block';
    });

  });



  document.getElementById('closeButton').addEventListener('click', () => {
    window.close(); // Close the popup
  });
});

// function captureScreenshot(inputText) {
//   // Your captureScreenshot function implementation
// }


function captureScreenshot(inputText) {
  debugger;
  console.log(inputText);
  chrome.tabs.captureVisibleTab(null, {}, async (dataUrl) => {
    const imageEncodedBase64 = dataUrl.split(',')[1];
    debugger;
    const response = await getNextInstruction(imageEncodedBase64, inputText);


    
    // Hide loading icon and display response
    document.getElementById('loading').style.display = 'none';
    document.getElementById('responseText').innerHTML=""

    document.getElementById('responseText').insertAdjacentHTML('beforeend', response);
    
    document.getElementById('startJourneyButton').style.display = 'none';
    document.getElementById('doneButton').style.display = 'block';
  });
}

let  messages = [];

async function getNextInstruction(imageEncodedBase64, textMessage) {
  const CHAT_KEY = "";
  debugger;
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `USE THE OFFICIAL SALESFORCE DOCS TO HELP THE ADMIN DO WHAT HE ASKS. GIVE ONE STEP AT A TIME. Read the screenshot shared by the user to know what to do next. Keep instructions brief`
      },
      ...messages,
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
    const responseText = data.choices[0].message.content;
    messages.push({
      role: "user",
      content: [{ type: "text", text: textMessage }]
    });
    messages.push({
      role: "assistant",
      content: responseText
    });

const renderedHTML = markdownToHtml(responseText);

// const parser = new DOMParser();
//     const doc = parser.parseFromString(renderedHTML, 'text/html');
//     return doc.body.firstChild;
    return renderedHTML;
  } catch (error) {
    console.error(`Error calling GPT-4 Vision API: ${JSON.stringify(error)}`, error);
    return 'Error: Unable to process the request';
  }
}


function markdownToHtml(markdown) {
  // Helper function to escape HTML special characters
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  var html = '';
  var lines = markdown.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // Headers
    if (line.match(/^#{1,6}/)) {
      var level = line.match(/^#+/)[0].length;
      var text = line.replace(/^#+\s/, '');
      html += '<h' + level + '>' + escapeHtml(text) + '</h' + level + '>';
    }
    // Bold
    else if (line.match(/\*\*.+\*\*/)) {
      html += '<p>' + line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>';
    }
    // Italic
    else if (line.match(/\*.+\*/)) {
      html += '<p>' + line.replace(/\*(.+?)\*/g, '<em>$1</em>') + '</p>';
    }
    // Links
    else if (line.match(/\[.+\]\(.+\)/)) {
      html += '<p>' + line.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>') + '</p>';
    }
    // Lists
    else if (line.match(/^[-*+]/)) {
      html += '<ul><li>' + escapeHtml(line.replace(/^[-*+]\s/, '')) + '</li></ul>';
    }
    // Paragraphs
    else if (line !== '') {
      html += '<p>' + escapeHtml(line) + '</p>';
    }
  }
  html = html.replace(/['"]/g, '')
  return html;
}
