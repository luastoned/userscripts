// ==UserScript==
// @name        Import std-kit
// @description Exposes std-kit to the global window object for console debugging via esm.sh
// @author      @SpaceGregor
// @namespace   @SpaceGregor
// @version     1.0
// @grant       none
// @match       *://localhost/*
// @match       *://localhost:*/*
// @match       *://127.0.0.1/*
// @match       *://127.0.0.1:*/*
// @match       *://f1594d5c-2ac4-46e2-bdc3-a04751e9e69b/index.html
// @icon        https://github.com/favicon.ico
// @updateURL   https://raw.githubusercontent.com/luastoned/userscripts/main/dist/std-kit.user.js
// @downloadURL https://raw.githubusercontent.com/luastoned/userscripts/main/dist/std-kit.user.js
// ==/UserScript==

(async () => {
  'use strict';

  const TAG = '[std-kit]';
  const SUCCESS_STYLE = 'color:#00aa00;font-weight:bold;';
  const PATCH_STYLE = 'color:#00aaff;font-weight:bold;';

  try {
    const std = await import('https://esm.sh/std-kit');
    window.std = std;

    window.kit = () => {
      for (const [key, value] of Object.entries(window.std)) {
        if (key in window) {
          console.warn(`${TAG} Overwriting existing global: ${key}`);
        }

        window[key] = value;
      }

      console.log(`%c${TAG} globals patched`, PATCH_STYLE);
      return window.std;
    };

    console.log(`%c${TAG} loaded!`, SUCCESS_STYLE);
  } catch (error) {
    console.error(`${TAG} Failed to load module:`, error);
  }
})();
