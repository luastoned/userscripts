// ==UserScript==
// @name        23° Context Switcher
// @description Switch 23° Context
// @author      @SpaceGregor
// @version     1.9
// @namespace   @SpaceGregor
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @noframes
// @require     https://cdn.jsdelivr.net/npm/tweakpane@3.1.10/dist/tweakpane.min.js
// @require     https://cdn.jsdelivr.net/npm/@tweakpane/plugin-essentials@0.1.8/dist/tweakpane-plugin-essentials.min.js
// @icon        https://doh.23degrees.io/assets/favicon-32x32.png
// @updateURL   https://raw.githubusercontent.com/luastoned/userscripts/main/dist/23degrees.user.js
// @downloadURL https://raw.githubusercontent.com/luastoned/userscripts/main/dist/23degrees.user.js
// ==/UserScript==

// @require     https://unpkg.com/tweakpane@4.0.5/dist/tweakpane.js
// @require     https://unpkg.com/@tweakpane/plugin-essentials@0.2.1/dist/tweakpane-plugin-essentials.js

// https://cocopon.github.io/tweakpane/migration/v4/

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
  io: 1,
  eu: 2,
};

const subDomains = {
  doh: 0,
  next: 1,
  pre: 2,
  app: 3,
};

const domainLabels = ['local', '.io', '.eu'];
const subDomainLabels = ['Doh', 'Next', 'Pre', 'App'];

const domainValues = ['local', 'io', 'eu'];
const subDomainValues = ['doh', 'next', 'pre', 'app'];

const settings = {
  domain: domains[GM_getValue('23ctx-domain', 'io')],
  subDomain: subDomains[GM_getValue('23ctx-subDomain', 'app')],
  switchFrames: GM_getValue('23ctx-iframes', false),
  switchScripts: GM_getValue('23ctx-scripts', false),
};

// version 2
if (!settings.domain) {
  settings.domain = 1;
}

const monitors = {
  foundFrames: 0,
  foundScripts: 0,
  switchedFrames: 0,
  switchedScripts: 0,
};

const pane = new Tweakpane.Pane({
  title: '23° Context Switcher',
  container: paneHost,
  expanded: false,
});

pane.registerPlugin(TweakpaneEssentialsPlugin);

pane.addInput(settings, 'switchFrames', { label: 'iFrames' }).on('change', (event) => {
  GM_setValue('23ctx-iframes', event.value);
});

pane.addInput(settings, 'switchScripts', { label: 'Scripts' }).on('change', (event) => {
  GM_setValue('23ctx-scripts', event.value);
});

pane
  .addInput(settings, 'domain', {
    view: 'radiogrid',
    groupName: 'domain',
    size: [domainLabels.length, 1],
    cells: (x, y) => ({
      title: domainLabels[x + y * domainLabels.length],
      value: x + y * domainLabels.length,
    }),
    label: 'Domain',
  })
  .on('change', (event) => {
    if (event.value >= 0) {
      GM_setValue('23ctx-domain', domainValues[event.value]);
    }
  });

pane
  .addInput(settings, 'subDomain', {
    view: 'radiogrid',
    groupName: 'subDomain',
    size: [subDomainValues.length, 1],
    cells: (x, y) => ({
      title: subDomainLabels[x + y * subDomainValues.length],
      value: x + y * subDomainValues.length,
    }),
    label: 'Version',
  })
  .on('change', (event) => {
    if (event.value >= 0) {
      GM_setValue('23ctx-subDomain', subDomainValues[event.value]);
    }
  });

const switchFramesButton = pane.addButton({
  title: 'Switch Frames',
  label: 'Action', // optional
});

const switchScriptsButton = pane.addButton({
  title: 'Switch Scripts',
  label: 'Action', // optional
});

switchFramesButton.on('click', () => {
  const domain = domainValues[settings.domain];
  const subDomain = subDomainValues[settings.subDomain];
  switchFrames(domain, subDomain);
});

switchScriptsButton.on('click', () => {
  const domain = domainValues[settings.domain];
  const subDomain = subDomainValues[settings.subDomain];
  switchScripts(domain, subDomain);
});

const statusFolder = pane.addFolder({
  title: 'Status',
  expanded: false,
});

statusFolder.addMonitor(monitors, 'foundFrames', { readOnly: true, label: 'Found iFrames', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'foundScripts', { readOnly: true, label: 'Found Scripts', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'switchedFrames', { readOnly: true, label: 'Switched iFrames', format: (obj) => obj.toFixed(0) });
statusFolder.addMonitor(monitors, 'switchedScripts', { readOnly: true, label: 'Switched Scripts', format: (obj) => obj.toFixed(0) });

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
  return iFrames.filter(
    (obj) =>
      obj.src.includes('localhost:2385') ||
      obj.src.includes('23degrees.io') ||
      obj.src.includes('23degrees.eu') ||
      obj.dataset['src']?.includes('localhost:2385') ||
      obj.dataset['src']?.includes('23degrees.io') ||
      obj.dataset['src']?.includes('23degrees.eu') ||
      obj.dataset['23src']?.includes('localhost:2385') ||
      obj.dataset['23src']?.includes('23degrees.io') ||
      obj.dataset['23src']?.includes('23degrees.eu'),
  );
};

const findScripts = () => {
  const scripts = Array.from(document.querySelectorAll('script'));
  return scripts.filter((obj) => obj.src.includes('localhost:2385') || obj.src.includes('23degrees.io') || obj.src.includes('23degrees.eu'));
};

monitors.foundFrames = findFrames().length;
monitors.foundScripts = findScripts().length;

const switchFrames = (domain, subDomain) => {
  let fullDomain = `https://${subDomain}.23degrees.${domain}`;
  if (domain === 'local') fullDomain = 'http://localhost:2385';

  const head = document.getElementsByTagName('head')[0];
  const body = document.getElementsByTagName('body')[0];

  for (const frame of findFrames()) {
    const parent = frame.parentNode;
    const frameClone = frame.cloneNode(true);

    if (frame.getAttribute('src')) {
      let frameSrc = frame.getAttribute('src').replace(/https?:\/\/(localhost:2385|(app|doh|next|pre).23degrees.(io|eu))/, fullDomain);
      if (!frameSrc.includes('log23')) {
        frameSrc += frameSrc.includes('?') ? '&log23=true' : '?log23=true';
      }

      frameClone.src = frameSrc;
    }

    if (frame.getAttribute('data-23src')) {
      let frameSrc = frame.getAttribute('data-23src').replace(/https?:\/\/(localhost:2385|(app|doh|next|pre).23degrees.(io|eu))/, fullDomain);
      if (!frameSrc.includes('log23')) {
        frameSrc += frameSrc.includes('?') ? '&log23=true' : '?log23=true';
      }

      frameClone.dataset['23src'] = frameSrc;
    }

    frame.remove();
    (parent || body).appendChild(frameClone);

    monitors.switchedFrames++;
  }
};

const switchScripts = (domain, subDomain) => {
  let fullDomain = `https://${subDomain}.23degrees.${domain}`;
  if (domain === 'local') fullDomain = 'http://localhost:2385';

  const head = document.getElementsByTagName('head')[0];
  const body = document.getElementsByTagName('body')[0];

  for (const script of findScripts()) {
    const parent = script.parentNode;
    let scriptSrc = script.src.replace(/https?:\/\/(localhost:2385|(app|doh|next|pre).23degrees.(io|eu))/, fullDomain);
    script.remove();

    if (!scriptSrc.includes('raw=true')) {
      scriptSrc += scriptSrc.includes('?') ? '&raw=true' : '?raw=true';
    }

    const newScript = document.createElement('script');
    newScript.src = scriptSrc;
    (parent || head).appendChild(newScript);

    monitors.switchedScripts++;
  }
};

const switchAll = () => {
  if (settings.switchFrames) {
    const domain = domainValues[settings.domain];
    const subDomain = subDomainValues[settings.subDomain];
    switchFrames(domain, subDomain);
  }

  if (settings.switchScripts) {
    const domain = domainValues[settings.domain];
    const subDomain = subDomainValues[settings.subDomain];
    switchScripts(domain, subDomain);
  }
};

if (document.readyState === 'loading') {
  // DOM is still loading, wait for the event
  document.addEventListener('DOMContentLoaded', switchAll);
} else {
  // DOM is already ready, run immediately
  switchAll();
}
