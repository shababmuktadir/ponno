// Build-time injected values
export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

export const BUILD_ID =
  typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

export const BUILD_TIME =
  typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "";

// GitHub — for APK release checking
export const GITHUB_REPO = "shababmuktadir/ponno";

// GitHub Releases API
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;