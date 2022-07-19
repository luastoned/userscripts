// ==UserScript==
// @name        23° Context Switcher
// @version     1.0
// @namespace   @SpaceGregor
// @author      @SpaceGregor
// @description Switch 23° Context
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @noframes
// @require     https://unpkg.com/tweakpane@3.0.7/dist/tweakpane.js
// @require     https://unpkg.com/@tweakpane/plugin-essentials@0.1.4/dist/tweakpane-plugin-essentials.js
// @icon        https://doh.23degrees.io/assets/favicon-32x32.png
// @updateURL   https://raw.githubusercontent.com/luastoned/userscripts/main/dist/23degrees.user.js
// @downloadURL https://raw.githubusercontent.com/luastoned/userscripts/main/dist/23degrees.user.js
// ==/UserScript==

// Setup Tweakpane Container
const paneHost = document.createElement('div');
paneHost.id = 'context-switcher';
paneHost.style.position = 'fixed';
// paneHost.style.cursor = 'move';
paneHost.style.top = '0';
paneHost.style.right = '0';
paneHost.style.zIndex = '666666';
paneHost.style.display = 'block';
paneHost.style.userSelect = 'none';

document.body.appendChild(paneHost);

const domains = {
  local: 0,
  doh: 1,
  app: 2,
  dohEU: 3,
  appEU: 4,
};

const domainLabels = ['Local', 'Doh.io', 'App.io', '', 'Doh.eu', 'App.eu'];

const domainValues = ['local', 'doh', 'app', 'dohEU', 'appEU'];

const domainUrls = {
  local: 'http://localhost:2385',
  doh: 'https://doh.23degrees.io',
  app: 'https://app.23degrees.io',
  dohEU: 'https://doh.23degrees.eu',
  appEU: 'https://app.23degrees.eu',
};

const settings = {
  domain: domains[GM_getValue('23ctx-domain', 'app')],
  autoSwitch: GM_getValue('23ctx-switch', false),
};

const monitors = {
  foundFrames: 0,
  foundScripts: 0,
  switchedFrames: 0,
  switchedScripts: 0,
};

const pane = new Tweakpane.Pane({
  title: '23° Context Switcher',
  container: paneHost,
});

pane.registerPlugin(TweakpaneEssentialsPlugin);

pane.addInput(settings, 'autoSwitch', { label: 'Auto Switch' }).on('change', (event) => {
  GM_setValue('23ctx-switch', event.value);
});

pane
  .addInput(settings, 'domain', {
    view: 'radiogrid',
    groupName: 'domain',
    size: [3, 2],
    cells: (x, y) => ({
      title: domainLabels[x + y * 3],
      value: [0, 1, 2, -1, 3, 4][x + y * 3],
    }),
    label: 'Domain',
  })
  .on('change', (event) => {
    if (event.value >= 0) {
      GM_setValue('23ctx-domain', domainValues[event.value]);
    }
  });

const switchButton = pane.addButton({
  title: 'Switch Context',
  label: 'Action', // optional
});

switchButton.on('click', () => switchContext(domainValues[settings.domain]));

const statusFolder = pane.addFolder({
  title: 'Status',
  expanded: false,
});

statusFolder.addMonitor(monitors, 'foundFrames', { label: 'Found iFrames', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'foundScripts', { label: 'Found Scripts', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'switchedFrames', { label: 'Switched iFrames', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'switchedScripts', { label: 'Switched Scripts', format: (obj) => obj.toFixed(0) });

/*
pane.addSeparator();

const fpsGraph = pane.addBlade({
  label: 'FPS',
  view: 'fpsgraph',
  lineCount: 2,
});

const fpsRender = () => {
  fpsGraph.begin();
  fpsGraph.end();
  requestAnimationFrame(fpsRender);
}

requestAnimationFrame(fpsRender);
*/

const dragElement = (element) => {
  let x = 0;
  let y = 0;

  // Handle the mousedown event that's triggered when user drags the element
  const mouseDownHandler = (event) => {
    // Get the current mouse position
    x = event.clientX;
    y = event.clientY;

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = (event) => {
    // How far the mouse has been moved
    const dx = event.clientX - x;
    const dy = event.clientY - y;

    const offsetRight = document.children[0].clientWidth - (element.offsetLeft + element.offsetWidth);

    // Set the position of element
    element.style.top = `${element.offsetTop + dy}px`;
    // element.style.left = `${element.offsetLeft + dx}px`;
    element.style.right = `${offsetRight - dx}px`;

    // Reassign the position of mouse
    x = event.clientX;
    y = event.clientY;
  };

  const mouseUpHandler = () => {
    // Remove the handlers of `mousemove` and `mouseup`
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };

  element.addEventListener('mousedown', mouseDownHandler);
};

dragElement(paneHost);

const findFrames = () => {
  const iFrames = Array.from(document.querySelectorAll('iframe'));
  return iFrames.filter((obj) => obj.src.includes('localhost:2385') || obj.src.includes('23degrees.io') || obj.src.includes('23degrees.eu'));
};

const findScripts = () => {
  const scripts = Array.from(document.querySelectorAll('script'));
  return scripts.filter((obj) => obj.src.includes('localhost:2385') || obj.src.includes('23degrees.io') || obj.src.includes('23degrees.eu'));
};

monitors.foundFrames = findFrames().length;
monitors.foundScripts = findScripts().length;

const switchContext = (domain) => {
  const fullDomain = domainUrls[domain];
  const head = document.getElementsByTagName('head')[0];

  for (const frame of findFrames()) {
    const parent = frame.parentNode;
    const frameSrc = frame.src.replace(/https?:\/\/(localhost:2385|(app|doh).23degrees.(io|eu))/, fullDomain) + "?log23=true";
    const frameClone = frame.cloneNode(true);
    frame.remove();

    frameClone.src = frameSrc;
    parent.appendChild(frameClone);

    monitors.switchedFrames++;
  }

  for (const script of findScripts()) {
    const scriptSrc = script.src.replace(/https?:\/\/(localhost:2385|(app|doh).23degrees.(io|eu))/, fullDomain);
    script.remove();

    const newScript = document.createElement('script');
    newScript.src = scriptSrc;
    head.appendChild(newScript);

    monitors.switchedScripts++;
  }
};

if (settings.autoSwitch) {
  switchContext(domainValues[settings.domain]);
}
