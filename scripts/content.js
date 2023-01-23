
const insertCalmly = (content) => {
  // Find Calmly editor input section
  const elements = document.getElementsByClassName('droid');

  if (elements.length === 0) {
    return;
  }

  const element = elements[0];

  // Split content by \n
  const splitContent = content.split('\n');

  // Wrap in p tags
  splitContent.forEach((content) => {
    const p = document.createElement('p');

    if (content === '') {
      const br = document.createElement('br');
      p.appendChild(br);
    } else {
      p.textContent = content;
    }
    // Insert into HTML one at a time
    element.value(p);
  });
    // On success return true
  return true;
};

chrome.runtime.onMessage.addListener(
  // This is the message listener
  (request, sender, sendResponse) => {
    if (request.message === 'inject') {
      const { content } = request;
      // Call this insert function
      const result = insertX(content);
			
      // If something went wrong, send a failed status
      if (!result) {
        sendResponse({ status: 'failed' });
      }

      sendResponse({ status: 'success' });
    }
  }
);

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'report_back') {
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse(document.all[0].outerHTML);
    }
});
