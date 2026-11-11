/** Replace these URLs ONLY after affiliate approval. Never put passwords or keys here. */
export const AFFILIATE_LINKS = {
  installer: '',
  equipment: '',
  offgrid: '',
};

export function configurePartnerLinks() {
  const fallbacks = {
    installer: 'https://www.solar.com/',
    equipment: 'https://a1solarstore.com/',
    offgrid: 'https://www.renogy.com/',
  };
  for (const anchor of document.querySelectorAll('[data-partner]')) {
    const partner = anchor.dataset.partner;
    const affiliate = AFFILIATE_LINKS[partner];
    const href = affiliate || fallbacks[partner];
    if (!href) continue;
    // Only allow https: navigation, including user-provided tracked links.
    try {
      const u = new URL(href);
      if (u.protocol !== 'https:') continue;
      anchor.href = u.href;
      anchor.rel = affiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
      anchor.target = '_blank';
    } catch { /* Invalid URL: leave link disabled. */ }
  }
  const disclosed = Object.values(AFFILIATE_LINKS).some(Boolean);
  for (const el of document.querySelectorAll('[data-affiliate-disclosure]')) {
    el.textContent = disclosed
      ? 'Disclosure: We may earn a commission if you use some partner links, at no additional cost to you. Editorial recommendations remain independent.'
      : 'Disclosure: These are currently ordinary resource links, not paid affiliate links. We may participate in affiliate programs later and will disclose those relationships clearly.';
  }
}
