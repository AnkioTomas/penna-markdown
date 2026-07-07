declare module "*.scss" {
  const content: any;
  export default content;
}

declare module "*.css" {
  const content: any;
  export default content;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
