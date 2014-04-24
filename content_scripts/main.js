function parseHeader(value) {
  var m = value.match(/\/\/\s+==UserScript==[^=]+==\/UserScript==/);
  if (!m) return false;
  var data = {};
  m = m[0].replace(/ +/g, " ").replace(/\/\/ +@/g, "").split("\n").slice(1, m[0].split("\n").length - 1);
  for (var i = 0, l = m.length; i < l; ++i) {
    var key = m[i].match(/^\S+/);
    if (!key) return;
    key = key[0];
    var value = m[i].match(/\s\S+/);
    if (!value) return;
    value = value[0].substring(1, value[0].length);
    data[key] = value;
  }
  return data;
}

function matchLocation(header, url) {
  var m = header.match;
  if (m[0] === "*") {
    // m = m.replace(/^\*:\/\//, "");
  //   url = url.replace(/^[a-zA-Z0-9]+:\/\//, "");
  }
  if (m === "*") return true;
  if (/^\*\./.test(m)) {
    m = m.replace(/^\*\./, "");
    url = url.replace(/^[a-zA-Z0-9]+\./, "");
  }
  m = new RegExp(m.replace(/([.\/\\])/g, "\\$1").replace(/\*/g, ".*").replace(/\\\/$/, "") + "(\/)?$");
  if (m.test(url)) {
    return true;
  }
}

chrome.extension.onMessage.addListener(function(data) {
  if (data === undefined || !Array.isArray(data)) return false;
  for (var i = 0; i < data.length; ++i) {
    if (matchLocation(parseHeader(data[i]), document.URL)) {
      var script = document.createElement("script");
      script.innerText = data[i].replace(/\/\/\s+==UserScript==[^=]+==\/UserScript==/, "");
      document.head.appendChild(script);
    }
  }
});

document.addEventListener("DOMContentLoaded", function() {
  chrome.runtime.sendMessage({message: "retrieve"});
}, false);
