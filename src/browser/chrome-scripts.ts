/** JXA 在 macOS 自动化层执行，不向网页注入 JavaScript。 */
export const LIST_TABS_SCRIPT = String.raw`
function run(argv) {
  var chrome = Application("com.google.Chrome");
  function sameIds(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function tabValues(window, name) {
    var collection = window.tabs;
    if (typeof collection[name] === "function") return collection[name]();
    return window.tabs().map(function(tab) { return tab[name](); });
  }
  for (var attempt = 0; attempt < 3; attempt++) {
    if (!chrome.running()) return JSON.stringify({ running: false, tabs: [] });
    try {
      var result = [];
      var windows = chrome.windows();
      var windowIds = windows.map(function(window) { return window.id(); });
      for (var w = 0; w < windows.length; w++) {
        var window = windows[w];
        var incognito = window.mode() === "incognito";
        if (incognito && argv[0] !== "true") continue;
        var ids = tabValues(window, "id");
        var active = window.activeTabIndex();
        var titles = tabValues(window, "title");
        if (!sameIds(ids, tabValues(window, "id"))) throw new Error("TABS_CHANGED_DURING_READ");
        var urls = tabValues(window, "url");
        // 不只校验数量；相同数量的标签换位也会让标题和 URL 错配。
        if (!sameIds(ids, tabValues(window, "id")) || titles.length !== ids.length || urls.length !== ids.length)
          throw new Error("TABS_CHANGED_DURING_READ");
        for (var t = 0; t < ids.length; t++) {
          result.push({
            id: "tab:" + ids[t], source: "tab", tabId: String(ids[t]),
            windowId: String(windowIds[w]), active: active === t + 1,
            title: titles[t], url: urls[t], incognito: incognito
          });
        }
      }
      if (!sameIds(windowIds, chrome.windows().map(function(window) { return window.id(); })))
        throw new Error("TABS_CHANGED_DURING_READ");
      return JSON.stringify({ running: true, tabs: result });
    } catch (error) {
      // 只重试对象消失或顺序变化；权限等错误直接交给调用方。
      if (error.errorNumber !== -1728 && !/TABS_CHANGED_DURING_READ/.test(String(error))) throw error;
    }
  }
  throw new Error("TABS_CHANGED_DURING_READ");
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
