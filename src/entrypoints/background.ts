export default defineBackground(() => {
  let activeTabId: number | undefined;
  let offscreenWindowId: number | undefined;

  function sendStopMessage() {
    void browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((tabs) => {
        if (tabs.length === 0) return;
        const tab = tabs[0];
        if (tab.id !== activeTabId) {
          setTimeout(() => {
            if (activeTabId) {
              browser.tabs.sendMessage(activeTabId, null).catch((e) => void e);
            }
            activeTabId = tab.id;
          }, 100);
        }
      });
  }

  function openOffscreenWindow() {
    if (offscreenWindowId) {
      void browser.windows.update(offscreenWindowId, { focused: true });
    } else {
      void browser.windows.create({
        url: browser.runtime.getURL("/offscreen.html"),
        type: "popup",
        width: 400,
        height: 380,
      });
    }
  }

  browser.runtime.onInstalled.addListener(({ reason }) => {
    // Also fired on update and browser_update
    if (reason !== "install") return;
    void browser.tabs.create({
      url: browser.runtime.getURL("/welcome.html"),
      active: true,
    });
  });

  browser.windows.onFocusChanged.addListener(sendStopMessage);

  browser.tabs.onActivated.addListener(sendStopMessage);

  browser.action.onClicked.addListener(openOffscreenWindow);

  browser.runtime.onMessage.addListener(
    (message: { id: number | undefined; running: boolean; from: string }) => {
      if (message.from === "welcome") openOffscreenWindow();
      if (message.from !== "offscreen") return;
      offscreenWindowId = message.id;
      void browser.action.setIcon({
        path: {
          16: message.running ? "/icon/16-enabled.png" : "/icon/16.png",
          32: message.running ? "/icon/32-enabled.png" : "/icon/32.png",
          48: message.running ? "/icon/48-enabled.png" : "/icon/48.png",
          96: message.running ? "/icon/96-enabled.png" : "/icon/96.png",
          128: message.running ? "/icon/128-enabled.png" : "/icon/128.png",
        },
      });
    },
  );
});
