import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
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
          code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
