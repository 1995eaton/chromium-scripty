chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  switch (request.message) {
    case "save":
      chrome.storage.sync.set({'scripts': request.data});
      break;
    case "retrieve":
      chrome.storage.sync.get('scripts', function(data) {
        if (!Array.isArray(data.scripts) || !data.scripts.hasOwnProperty(0)) {
          chrome.storage.sync.set({'scripts': []});
          data = {scripts: []}
        }
        chrome.tabs.sendMessage(sender.tab.id, data.scripts);
      });
      break;
    default:
      break;
  }
});
