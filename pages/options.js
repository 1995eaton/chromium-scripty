var editor, toggle, sidebar, scripts;
var log;
log = console.log.bind(console);

var def = "// ==UserScript==\n// @name       Untitled\n// @description  ...\n// @match      *://*.*.com/*\n// ==/UserScript==";

function slideHorizontal(element, start, end, duration) {
  var i = 0,
      offset = 0,
      total = Math.abs(end - start),
      direction = start < end ? 1 : -1;
  end *= direction;
  var loop = function() {
    offset = start + direction * total * Math.sin(i / duration * (Math.PI / 2));
    element.style.right = offset + "px";
    i++;
    if (direction * offset < end) {
      requestAnimationFrame(loop);
    }
  };
  loop();
}

function saveData() {
  scripts[sidebar.activeItem] = editor.getValue();
  var newData = [];
  for (var i = 0; i < scripts.length; ++i) {
    if (typeof scripts[i] === "string" && scripts[i].trim() !== "") {
      newData.push(scripts[i]);
    }
  }
  chrome.runtime.sendMessage({scriptId: sidebar.activeItem.toString(), message: "save", data: newData});
  var parsed = parseHeader(scripts[sidebar.activeItem]);
  if (!parsed) return false;
  if (parsed.hasOwnProperty("name")) sidebar.list.children[sidebar.activeItem].firstElementChild.innerText = parsed.name;
}

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

function Sidebar(main, items, list) {
  this.list = list;
  this.main = main;
  this.items = [];
  this.activeItem = 0;
  this.refresh = function() {
    for (var i = 0; i < items.length; ++i) {
      this.items.push(items[i]);
      items[i].contenteditable= "false";
    }
  }.bind(this);
  this.refresh();
  this.item = function(n) {
    return this.items[n];
  };
  this.newItem = function(name) {
    var li = document.createElement("li");
    li.className = "list-item";
    var title = document.createElement("span");
    title.innerText = name;
    li.appendChild(title);
    var delButton = document.createElement("span");
    delButton.className = "delete-button";
    delButton.innerText = "delete";
    delButton.contenteditable = false;
    li.appendChild(delButton);
    this.list.appendChild(li);
    this.items.push(li);
    var self = this;
    li.addEventListener("mousedown", function(ev) {
      var index;
      if (ev.target.className === "delete-button") {
        index = sidebar.items.indexOf(this);
        sidebar.items.splice(index, 1);
        this.parentNode.removeChild(this);
        scripts.splice(index, 1);
        if (sidebar.items.length === 0) {
          sidebar.newItem("Untitled");
        }
        sidebar.activeItem = 0;
        editor.setValue(scripts[0] || def);
      } else {
        index = sidebar.items.indexOf(this);
        if (scripts[index] === undefined) scripts.push(def);
        if (index < 0) index = 0;
        self.activeItem = index;
        editor.setValue(scripts[index]);
      }
    });
  }.bind(this);
}

function mouseDown(ev) {
  if (ev.target === toggle) {
    if (toggle.getAttribute("visible") === "false") {
      slideHorizontal(sidebar.main, -400, 0, 20);
      toggle.setAttribute("visible", true);
    }
  } else if (toggle.getAttribute("visible") === "true" && ev.x < window.innerWidth - 400) {
    slideHorizontal(sidebar.main, 0, -400, 20);
    toggle.setAttribute("visible", false);
  }
}

chrome.extension.onMessage.addListener(function(data) {
  if (data === undefined || !Array.isArray(data)) return false;
  if (data.length === 0) {
    data.push(def);
  }
  scripts = data;
  if (scripts[0].trim() === "") {
    scripts[0] = def;
  }
  editor.setValue(scripts[0]);
  sidebar = new Sidebar(document.getElementById("sidebar"), document.getElementsByClassName("list-item"), document.getElementById("sidebar").firstElementChild);
  for (var i = 0; i < scripts.length; i++) {
    if (typeof scripts[i] === "string" && scripts[i].trim() !== "") {
      var parsed = parseHeader(scripts[i]);
      if (parsed !== undefined && parsed.hasOwnProperty("name")) {
        sidebar.newItem(parsed.name, scripts[i]);
      } else {
        sidebar.newItem("Untitled", scripts[i]);
      }
    }
  }
  slideHorizontal(sidebar.main, -400, 0, 20);
});

document.addEventListener("DOMContentLoaded", function() {
  editor = CodeMirror.fromTextArea(document.getElementById("scriptbox"), {
    lineNumbers: true,
    extraKeys: {"Tab": "autocomplete"},
    showCursorWhenSelecting: true,
    mode: {name: "javascript", globalVars: true},
  });
  editor.setOption("keyMap", "vim");
  editor.setOption("theme", "monokai");
  editor.setSize(window.innerWidth, window.innerHeight);
  toggle = document.getElementById("scriptbar");
  document.addEventListener("mousedown", mouseDown, false);
  toggle.setAttribute("visible", false);
  editor.save = saveData;
  editor.focus();
  chrome.runtime.sendMessage({message: "retrieve"});
  toggle.setAttribute("visible", true);
  document.getElementById("sidebar-footer").onmousedown = function() {
    scripts.push(def);
    sidebar.newItem("Untitled");
  };
}, false);
