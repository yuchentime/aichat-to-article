export const setBadgeText = (text: string) => {
  let badgeText = text ? text.trim(): "";
  if (Number(badgeText) === 0) {
    badgeText = "";
  }
  chrome.action.setBadgeText({ text });
  if (badgeText) {
    chrome.action.setBadgeBackgroundColor({ color: '#f25f20ff' });
  }
};

