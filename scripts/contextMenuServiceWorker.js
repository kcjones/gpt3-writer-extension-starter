// Function to get + decode API key
const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
    if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
    }
    });
  });
};

const setLastResponse = (response) => {
    chrome.storage.local.set({ 'last-response': response }, () => {});
}

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
    activeTab,
    { message: 'inject', content },
    (response) => {
      if (response.status === 'failed') {
        console.log(response);
        console.log('injection failed.');
      }
    }
    );
  });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const siteSummaryPrompt = function (pageUrl) {
    return `
    Write the page title, url, summary, and detailed outline for the website: ${pageUrl}
    `;

};
const selectedSummaryPrompt = function (selectionText) {
    return `
    Generate a title, and summary of the following text. The generated text should be shorter than the provided text.
    
    ${selectionText}
    `;

};
const customerResponsePrompt = function (selectionText) {
    return `
    Generate a response to a customer from the following email.
    
    Email:
    ${selectionText}
    `;
};
const customerResponseResolvedPrompt = function (selectionText) {
    return `
    Generate a response to a customer from the following email. Reply saying the issue has been resolved.
    
    Email:
    ${selectionText}
    `;
};
const blogPostFirstPrompt = function (selectionText) {
    return `
    Write me a detailed table of contents for a blog post with the title below.
			
    Title: ${selectionText}
    `;
};
const blogPostSecondPrompt = function (title, outline) {
    return `
    Take the table of contents and title of the blog post below and generate a blog post written in the style of Paul Graham. Make it feel like a story. Don't just list the points. Go deep into each one. Explain why.
    
    Title: ${title}
    
    Table of Contents: ${outline}
    
    Blog Post:
    `
}
const generateCompletionAction = async (info) => {
  try {
    setLastResponse('generating...');
    // sendMessage('generating...');

    console.log(info);
    const { selectionText, menuItemId, pageUrl } = info;

    let promptPrefix = "";
    let actionMessage = "";
    
    switch (menuItemId) {
        case 'context-selected':
            promptPrefix = selectedSummaryPrompt(selectionText);
            break;
        case 'context-customer-response':
            promptPrefix = customerResponsePrompt(selectionText);
            break;
        case 'context-customer-response-resolved':
            promptPrefix = customerResponseResolvedPrompt(selectionText);
            break;
        case 'context-generate-blog':
            promptPrefix = blogPostFirstPrompt(selectionText);
            break;
        default:
            promptPrefix = siteSummaryPrompt(pageUrl);
    }
    console.log(promptPrefix);
    // Add this to call GPT-3
    let completion = await generate(`${promptPrefix}`);
    actionMessage = completion.text;
    console.log(actionMessage);
    setLastResponse(actionMessage);
    // sendMessage(actionMessage);

    if (menuItemId == 'context-generate-blog') {
        promptPrefix = blogPostSecondPrompt(selectionText, completion.text);
        completion = await generate(`${promptPrefix}`);
        actionMessage = actionMessage.concat(completion.text); 
        console.log(actionMessage);
        setLastResponse(actionMessage);
        // sendMessage(actionMessage);
    }

  } catch (error) {
    console.log(error);
    // sendMessage(error.toString());
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-site',
    title: 'Site Summary',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'context-selected',
    title: 'Selected Text Summary',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'context-customer-response',
    title: 'Generate Customer Response',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'context-customer-response-resolved',
    title: 'Generate Customer Response - Issue Resolved',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'context-generate-blog',
    title: 'Generate Blog Post',
    contexts: ['selection'],
  });
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);