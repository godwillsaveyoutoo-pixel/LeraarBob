/* Connect platform menu actions to the existing game controls. */
(() => {
  const actions = { worldMenuCrumb: 'progressButton', proLevels: 'progressButton', proOverview: 'overview', proBattleSetup: 'battleMenu', proSound: 'battleSound' };
  for (const [source, target] of Object.entries(actions)) {
    document.getElementById(source)?.addEventListener('click', () => document.getElementById(target)?.click());
  }
})();
