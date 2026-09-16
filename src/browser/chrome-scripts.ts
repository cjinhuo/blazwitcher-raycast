/** JXA 在 macOS 自动化层执行，不向网页注入 JavaScript。 */
export const LIST_TABS_SCRIPT = String.raw`
function run(argv) {
  var chrome = Application("com.google.Chrome");
  if (!chrome.running()) return JSON.stringify({ running: false, tabs: [] });
  var result = [];
  var windows = chrome.windows();
  for (var w = 0; w < windows.length; w++) {
    var window = windows[w];
    var incognito = window.mode() === "incognito";
    if (incognito && argv[0] !== "true") continue;
    var tabs = window.tabs();
    for (var t = 0; t < tabs.length; t++) {
      result.push({
        id: "tab:" + tabs[t].id(), source: "tab", tabId: String(tabs[t].id()),
        windowId: String(window.id()), active: window.activeTabIndex() === t + 1,
        title: tabs[t].title(), url: tabs[t].url(), incognito: incognito
      });
    }
  }
  return JSON.stringify({ running: true, tabs: result });
}
`;

export const FOCUS_TAB_SCRIPT = String.raw`
function run(argv) {
  var target = String(argv[0] || "");
  if (!/^[1-9][0-9]*$/.test(target)) throw new Error("INVALID_TAB_ID");
  var chrome = Application("com.google.Chrome");
  if (!chrome.running()) throw new Error("CHROME_NOT_RUNNING");
  for (var attempt = 0; attempt < 3; attempt++) {
    var windows = chrome.windows();
    var found = false;
    for (var w = 0; w < windows.length; w++) {
      var window = windows[w];
      var tabs = window.tabs();
      for (var t = 0; t < tabs.length; t++) {
        if (String(tabs[t].id()) !== target) continue;
        found = true;
        window.activeTabIndex = t + 1;
        if (String(window.activeTab.id()) !== target) break;
        window.minimized = false;
        window.index = 1;
        chrome.activate();
        if (String(window.activeTab.id()) === target) return target;
        break;
      }
      if (found) break;
    }
    if (!found) throw new Error("TAB_NOT_FOUND");
  }
  throw new Error("TAB_MOVED_DURING_FOCUS");
}
`;
