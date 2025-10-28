import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

function unwrapFullFence(src: string): string {
  if (!src) return src;
  const trimmed = src.trim();
  // Matches ``` or ```markdown/```md fenced whole-document blocks
  const fenceMatch = trimmed.match(/^```(?:\s*(?:markdown|md))?\s*\n([\s\S]*?)\n```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  const cleaned = unwrapFullFence(content);

  return (
    <div className="markdown-content font-sans">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-6 first:mt-0 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-5 first:mt-0 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent pl-4 italic my-3 text-muted-foreground">{children}</blockquote>
          ),
          hr: () => <hr className="my-6 border-muted" />,
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto">
                <code className="font-mono text-sm">{children}</code>
              </pre>
            ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
};
