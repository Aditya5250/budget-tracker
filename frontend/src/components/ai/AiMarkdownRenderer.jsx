import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Modern, clean Markdown & text renderer for Aura Financial AI:
 * Removes awkward markdown artifacts (excessive hashes, raw pipe syntax)
 * and formats advice with clean modern cards, pills, and typography.
 */
export default function AiMarkdownRenderer({ content }) {
  if (!content) return null;

  // Clean and normalize text:
  // 1. Strip raw markdown hash symbols at line starts (#, ##, ###)
  // 2. Normalize excessive asterisks
  // 3. Ensure markdown tables have empty lines before and after for proper GFM rendering
  let sanitizedContent = content
    .replace(/^#{1,6}\s+/gm, "") // remove leading #, ##, ### from lines
    .replace(/\*{3,}/g, "**")    // normalize excessive asterisks
    .replace(/([^\n])\n(\|.+?\|)\n/g, "$1\n\n$2\n") // ensure newline before table
    .trim();

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
            <div className="ai-markdown-quote" {...props}>
              <div className="quote-accent-bar" />
              <div className="quote-content">{children}</div>
            </div>
          ),
          code: ({ node, inline, children, ...props }) => (
            <span className="ai-markdown-inline-code" {...props}>
              {children}
            </span>
          ),
          h1: ({ node, children, ...props }) => <div className="ai-markdown-h1" {...props}>{children}</div>,
          h2: ({ node, children, ...props }) => <div className="ai-markdown-h2" {...props}>{children}</div>,
          h3: ({ node, children, ...props }) => <div className="ai-markdown-h3" {...props}>{children}</div>,
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
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
