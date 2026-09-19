// TypeScript 6 checks side-effect imports for module/type declarations by
// default (TS2882). Next.js's own types only declare `*.module.css` (CSS
// Modules); plain side-effect CSS imports (global stylesheets, vendor CSS
// such as leaflet/react-quill) need an explicit ambient declaration.
declare module '*.css';
