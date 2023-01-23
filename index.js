

const encode = (input) => {
    return btoa(input);
};
  
const saveKey = () => {
    const input = document.getElementById('key_input');
    
    if (input) {
        const { value } = input;
    
        // Encode String
        const encodedValue = encode(value);
    
        // Save to google storage
        chrome.storage.local.set({ 'openai-key': encodedValue }, () => {
        document.getElementById('key_needed').style.display = 'none';
        document.getElementById('key_entered').style.display = 'block';
        });
    }
};
    
const changeKey = () => {
    document.getElementById('key_needed').style.display = 'block';
    document.getElementById('key_entered').style.display = 'none';
  };

const checkForKey = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['openai-key'], (result) => {
        resolve(result['openai-key']);
      });
    });
};

const checkForLastResponse = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['last-response'], (result) => {
      resolve(result['last-response']);
    });
  });
};

const lastResponseLoop = () => {
    console.log("response loop");
    checkForLastResponse().then((response) => {
        if (response) {
          console.log(response);
          const element = document.getElementById('last_response').value = response;
        }
    })
}

document.getElementById('save_key_button').addEventListener('click', saveKey);
document
  .getElementById('change_key_button')
  .addEventListener('click', changeKey);

//   console.log("getting response");
  setInterval(lastResponseLoop, 1000);

  checkForKey().then((response) => {
    if (response) {
      document.getElementById('key_needed').style.display = 'none';
      document.getElementById('key_entered').style.display = 'block';
    }
  });
