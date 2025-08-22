// 测试通知功能的脚本
// 在浏览器控制台中运行以下代码来测试通知功能

// 方法1: 直接发送消息到后台脚本
chrome.runtime.sendMessage({
  type: 'testNotification'
});

// 方法2: 检查通知权限
chrome.notifications.getPermissionLevel((level) => {
  console.log('通知权限级别:', level);
});

// 方法3: 检查图标路径
console.log('图标路径测试:');
console.log('src/assets/img/icon-128.png ->', chrome.runtime.getURL("src/assets/img/icon-128.png"));
console.log('assets/img/icon-128.png ->', chrome.runtime.getURL("assets/img/icon-128.png"));
console.log('icon-128.png ->', chrome.runtime.getURL("icon-128.png"));

// 方法4: 直接创建通知（如果权限允许）
chrome.notifications.create('test-notification', {
  type: 'basic',
  title: '直接测试通知',
  message: '这是直接从控制台创建的通知',
  priority: 2
}, (notificationId) => {
  console.log('直接通知创建结果:', notificationId);
});