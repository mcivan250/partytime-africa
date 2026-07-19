// Metro resolves CSS imports (Expo SDK 57 web CSS support); these ambient
// declarations keep `tsc --noEmit` in sync with what Metro accepts.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';
