// Bootstrap Service Worker at root scope
// Delegates to the actual implementation under /assets/js to allow root scope control
// and keep implementation code organized.
/* eslint-disable no-undef */
self.importScripts('/assets/js/sw-enhanced.js');


