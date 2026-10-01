// This module must be imported before any Excalidraw module.
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
    EXCALIDRAW_THROTTLE_RENDER?: boolean;
  }
}

window.EXCALIDRAW_ASSET_PATH = `${window.location.origin}/excalidraw-assets/`;
window.EXCALIDRAW_THROTTLE_RENDER = true;

export {};
