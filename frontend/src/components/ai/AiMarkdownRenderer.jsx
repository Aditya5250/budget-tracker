import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Custom Markdown renderer tailored for Aura Financial AI responses:
 * Beautifully formats tables, bullet points, budget calculations, and advice callouts.
 */
export default function AiMarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="ai-markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="ai-markdown-table-wrapper">
              <table className="ai-markdown-table" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="ai-markdown-th" {...props} />,
          td: ({ node, ...props }) => <td className="ai-markdown-td" {...props} />,
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="ai-markdown-quote" {...props}>
              <div className="quote-accent-bar" />
              <div className="quote-content">{children}</div>
            </blockquote>
          ),
          code: ({ node, inline, children, ...props }) => (
            <code className="ai-markdown-inline-code" {...props}>
              {children}
            </code>
          ),
          h1: ({ node, ...props }) => <h3 className="ai-markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h4 className="ai-markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h5 className="ai-markdown-h3" {...props} />,
          ul: ({ node, ...props }) => <ul className="ai-markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="ai-markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="ai-markdown-li" {...props} />,
          strong: ({ node, ...props }) => <strong className="ai-markdown-strong" {...props} />,
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="ai-markdown-link"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
