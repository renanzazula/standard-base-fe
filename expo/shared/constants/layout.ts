// Caps content width on wide viewports (web desktop, tablets in landscape)
// so screens don't stretch full-bleed. Native phone widths sit well under
// both values, so this only ever engages on tablet/web.
export const MAX_FORM_WIDTH = 480;
export const MAX_CONTENT_WIDTH = 720;

// Viewport widths at or below this are treated as a phone-sized browser
// window. Shared by the mobile-web layout hook and background selection.
export const MOBILE_WEB_MAX_WIDTH = 768;
