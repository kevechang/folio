import tokensCss from "../../../styles/tokens.css?inline";

export function lightTokens(selector = ":root"): string {
  const block = tokensCss.slice(0, tokensCss.indexOf("@property"));
  return block.replace(/^:root,\s*\[data-theme="light"\]/, selector);
}
