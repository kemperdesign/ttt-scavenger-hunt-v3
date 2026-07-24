// Ambient module declaration for CSS imports that Next.js's bundler resolves
// at runtime (including code-split dynamic import()s), but which tsc cannot
// resolve on its own since CSS has no JS module exports.
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
