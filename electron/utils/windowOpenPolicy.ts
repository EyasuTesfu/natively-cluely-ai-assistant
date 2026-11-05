// What a renderer's window.open / target="_blank" may do.
//
// Nothing in the app wants a second Electron window from a link: every
// window.open() caller is a fallback for electronAPI.openExternal. Without a
// handler, Electron opened a default BrowserWindow — its own taskbar button on
// Windows and no content protection, so it showed up even in undetectable mode
// and in screen shares. Every such request is now denied, and https links go
// to the default browser — the same rule as the 'open-external' IPC for web
// URLs. Pure module; wired through app.on('web-contents-created') in main.ts.

export function shouldOpenExternally(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

// Whether a navigation the page itself started (a clicked link, a dropped URL,
// a location change) must be stopped. It would move a window that shows the
// app to another page while keeping the window's preload, the full
// electronAPI. App pages are the Vite dev server on loopback and the packaged
// file:// index.html; a window showing anything else is left alone.
export function shouldBlockNavigation(currentUrl: string, targetUrl: string): boolean {
  let current: URL;
  try {
    current = new URL(currentUrl);
  } catch {
    return false;
  }
  const isLoopback = current.hostname === '127.0.0.1' || current.hostname === 'localhost';
  const onAppPage = current.protocol === 'file:' || (current.protocol === 'http:' && isLoopback);
  if (!onAppPage) return false;
  try {
    const target = new URL(targetUrl);
    if (current.protocol === 'file:') {
      return target.protocol !== 'file:' || target.pathname !== current.pathname;
    }
    return target.origin !== current.origin;
  } catch {
    return true;
  }
}
