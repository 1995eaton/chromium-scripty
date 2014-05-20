function parseHeader(value) {
  var m = value.match(/\/\/\s+==UserScript==[^=]+==\/UserScript==/);
  if (!m) return false;
  var data = {};
  m = m[0].replace(/ +/g, " ").replace(/\/\/ +@/g, "").split("\n").slice(1, m[0].split("\n").length - 1);
  for (var i = 0, l = m.length; i < l; ++i) {
    var key = m[i].match(/^\S+/);
    if (!key) return;
    key = key[0];
    value = m[i].match(/\s\S+/);
    if (!value) return;
    value = value[0].substring(1, value[0].length);
    data[key] = value;
  }
  return data;
}

function matchLocation(header) {

  var pattern = header.match,
      protocol, hostname, path, pathMatch, hostMatch;

  protocol = pattern.match(/.*:\/\//);
  if (!protocol) {
    return false;
  }

  protocol = protocol[0].slice(0, -2);
  pattern = pattern.slice(protocol.length + 2);
  if (protocol !== "*:" && window.location.protocol !== protocol) {
    console.error("Invalid protocol in pattern: %s", pattern);
    return false;
  }

  if (window.location.protocol !== "file:") {
    hostname = pattern.match(/^(\*|((\*|[a-zA-Z][a-zA-Z0-9]*)\.)?[a-zA-Z0-9\-]+(\.((?![\/])[a-zA-Z])+))\//g);
    if (!hostname) {
      console.error("Invalid host in pattern: %s", pattern);
      return false;
    }
    pattern = pattern.slice(hostname[0].length);
    hostname = hostname[0].slice(0, -1);
    hostMatch = window.location.hostname.match(new RegExp(hostname.replace(/\*/g, ".*"), "i"));
    if (!hostMatch || hostMatch[0].length !== window.location.hostname.length) {
      return false;
    }
  }

  if (pattern.length) {
    path = pattern.replace(/([.&\\\/\(\)\[\]!?])/g, "\\$1").replace(/\*/g, ".*");
    pathMatch = window.location.pathname.match(new RegExp(path));
    if (!pathMatch || pathMatch[0].length !== window.location.pathname.length) {
      return false;
    }
  }
  return true;

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
