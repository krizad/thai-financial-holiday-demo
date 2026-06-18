import type { ReactNode } from "react";

/**
 * Simple TypeScript syntax highlighter mimicking VS Code Dark+ theme.
 * Tokenizes source code and wraps tokens with appropriate CSS class spans.
 */

type Token = { type: string; value: string };

const RULES: [string, RegExp][] = [
  ["comment", /^\/\/[^\n]*/],
  ["comment", /^\/\*[\s\S]*?\*\//],
  ["comment", /^#[^\n]*/],
  ["string", /^'[^']*'/],
  ["string", /^"[^"]*"/],
  ["string", /^`[^`]*`/],
  ["number", /^-?\b\d+\.?\d*\b/],
  ["keyword", /^\b(import|export|from|const|let|var|function|return|if|else|type|interface|new|true|false|null|undefined|void|typeof|instanceof)\b/],
  ["type", /^\b(string|number|boolean|Date|BOTHoliday|DateInput)\b/],
  ["function", /^\b([a-zA-Z_]\w*)\s*(?=\()/],
  ["property", /^\b([A-Z][a-zA-Z]*[A-Z][a-zA-Z]*)\b/],
  ["punctuation", /^[{}()[\];:.,|=<>?!&+\-*/\\@]+/],
  ["plain", /^[a-zA-Z_]\w*/],
  ["whitespace", /^\s+/],
];

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    let matched = false;
    for (const [type, regex] of RULES) {
      const match = regex.exec(remaining);
      if (match?.index === 0) {
        tokens.push({ type, value: match[0] });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "plain", value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

const CLASS_MAP: Record<string, string> = {
  keyword: "tk-keyword",
  string: "tk-string",
  number: "tk-number",
  comment: "tk-comment",
  type: "tk-type",
  function: "tk-function",
  property: "tk-property",
  punctuation: "tk-punctuation",
};

interface CodeBlockProps {
  readonly code: string;
}

export default function CodeBlock({ code }: CodeBlockProps): ReactNode {
  const tokens = tokenize(code);

  return (
    <div className="code-block">
      <pre>
        <code>
          {tokens.map((token, i) => {
            const className = CLASS_MAP[token.type];
            // Combine type, index and value to form a deterministic key
            const key = `${token.type}-${i}`;
            if (className) {
              return (
                <span key={key} className={className}>
                  {token.value}
                </span>
              );
            }
            return <span key={key}>{token.value}</span>;
          })}
        </code>
      </pre>
    </div>
  );
}
