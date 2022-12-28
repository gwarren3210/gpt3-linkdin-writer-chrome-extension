
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

const sendMessage = (content) => {
   console.log(content)
   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
      chrome.tabs.sendMessage(
         activeTab,
         { message: 'inject', content },
         (response) => {
            if (response.status === 'failed') {
               console.log('injection failed.');
            }
         }
      );
   });
};

const generate = async (prompt) => {
   const key = await getKey();
   const url = 'https://api.openai.com/v1/completions';

   const completionResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const completion = await completionResponse.json();
    
    return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
   try {
      sendMessage('generating...');

      const { selectionText } = info;
      const basePromptPrefix = 
      `
      Generate 1 linkdin title from the idea below.

      Idea:
      `;

     const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
     
     const secondPrompt = `
     Take the idea and titles and generate write a concise inspirational linkdin post in the style of Neil Patel and Gary Vaynerchuk. Make sure to include a personal anecdote and lessons learned from said story that relates to the title. The post should convey confidence and authenticity. Include trending hashtags in a new line at the end related to the content in the post.

     Idea: ${selectionText}
     
     Titles: ${baseCompletion.text}
     
     LinkdIn Post:
     `;

     const secondPromptCompletion = await generate(secondPrompt);
     sendMessage(secondPromptCompletion.text);
    } catch (error) {
      console.log(error);
      sendMessage(error.toString());
    }
};

chrome.runtime.onInstalled.addListener(() => {
   chrome.contextMenus.create({
     id: 'context-run',
     title: 'Generate LinkdIn post',
     contexts: ['selection'],
   });
 });
 
 chrome.contextMenus.onClicked.addListener(generateCompletionAction);