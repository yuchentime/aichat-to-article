export const setBadgeText = (text: string) => {
  chrome.action.setBadgeText({ text });
  if (text) {
    chrome.action.setBadgeBackgroundColor({ color: '#f25f20ff' });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#808080' });
  }
};

