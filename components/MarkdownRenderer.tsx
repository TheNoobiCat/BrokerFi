import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Normalize common bullet characters (e.g., •) into markdown-friendly dashes
function normalizeBullets(text: string): string {
  return text
    .replace(/^\s*[\u2022]\s+/gm, '- ')
    .replace(/^\s*[\u25E6]\s+/gm, '- ')
    .replace(/^\s*[\u2043]\s+/gm, '- ');
}

/**
 * Professional markdown renderer matching ChatGPT/Claude/Grok quality
 * - Full GFM support (tables, task lists, strikethrough, autolinks)
 * - Syntax highlighting for code blocks
 * - Proper typography and spacing
 * - Safe rendering with sanitization
 * - Handles streaming/incomplete markdown gracefully
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const normalizedContent = normalizeBullets(content);
  const components: Partial<Components> = {
    // Code blocks with syntax highlighting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ className, children, ...props }: any) {
      const inline = props.inline;
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      
      return !inline && match ? (
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={oneDark as any}
          language={match[1]}
          PreTag="div"
          showLineNumbers={false}
          wrapLongLines={true}
          customStyle={{
            margin: '0.75rem 0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }
          }}
        >
          {codeContent}
        </SyntaxHighlighter>
      ) : (
        <code 
          className="inline-code"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            fontSize: '0.875em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {children}
        </code>
      );
    },

        // Headings with proper spacing
        h1: ({ children, ...props }) => (
          <h1 
            className="text-2xl font-bold mt-6 mb-4 first:mt-0" 
            style={{ lineHeight: '1.3' }}
            {...props}
          >
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 
            className="text-xl font-bold mt-5 mb-3 first:mt-0" 
            style={{ lineHeight: '1.35' }}
            {...props}
          >
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 
            className="text-lg font-semibold mt-4 mb-2 first:mt-0" 
            style={{ lineHeight: '1.4' }}
            {...props}
          >
            {children}
          </h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 
            className="text-base font-semibold mt-3 mb-2 first:mt-0" 
            style={{ lineHeight: '1.4' }}
            {...props}
          >
            {children}
          </h4>
        ),
        h5: ({ children, ...props }) => (
          <h5 
            className="text-sm font-semibold mt-3 mb-1.5 first:mt-0" 
            style={{ lineHeight: '1.4' }}
            {...props}
          >
            {children}
          </h5>
        ),
        h6: ({ children, ...props }) => (
          <h6 
            className="text-sm font-medium mt-2 mb-1.5 first:mt-0" 
            style={{ lineHeight: '1.4' }}
            {...props}
          >
            {children}
          </h6>
        ),

        // Paragraphs with breathing room
        p: ({ children, ...props }) => (
          <p 
            className="my-3 first:mt-0 last:mb-0" 
            style={{ lineHeight: '1.65' }}
            {...props}
          >
            {children}
          </p>
        ),

        // Lists with proper bullets and spacing
        ul: ({ children, ...props }) => (
          <ul 
            style={{ 
              paddingLeft: '1.5rem',
              listStyleType: 'disc',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              lineHeight: '1.65',
            }}
            {...props}
          >
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol 
            style={{ 
              paddingLeft: '1.5rem',
              listStyleType: 'decimal',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              lineHeight: '1.65',
            }}
            {...props}
          >
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li 
            style={{ 
              lineHeight: '1.65',
              paddingLeft: '0.25rem',
              marginTop: '0.375rem',
              marginBottom: '0.375rem',
              display: 'list-item',
            }}
            {...props}
          >
            {children}
          </li>
        ),

        // Task lists (GitHub-style checkboxes)
        input: ({ type, checked, disabled, ...props }) => {
          if (type === 'checkbox') {
            return (
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                className="mr-2 align-middle"
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: disabled ? 'default' : 'pointer',
                }}
                {...props}
              />
            );
          }
          return <input type={type} {...props} />;
        },

        // Tables with clean borders
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-4 first:mt-0 last:mb-0">
            <table 
              className="min-w-full border-collapse"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}
              {...props}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
            }}
            {...props}
          >
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th 
            className="px-4 py-2 text-left font-semibold"
            style={{
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            {...props}
          >
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td 
            className="px-4 py-2"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            {...props}
          >
            {children}
          </td>
        ),

        // Blockquotes with left border
        blockquote: ({ children, ...props }) => (
          <blockquote 
            className="my-4 first:mt-0 last:mb-0"
            style={{
              borderLeft: '4px solid rgba(96, 165, 250, 0.5)', // blue-400 with opacity
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            {...props}
          >
            {children}
          </blockquote>
        ),

        // Links with hover effect
        a: ({ children, href, ...props }) => (
          <a 
            href={href}
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        ),

        // Horizontal rules
        hr: ({ ...props }) => (
          <hr 
            className="my-6"
            style={{
              border: 'none',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            {...props}
          />
        ),

        // Strong/bold text
        strong: ({ children, ...props }) => (
          <strong className="font-semibold" {...props}>{children}</strong>
        ),

        // Emphasis/italic text
        em: ({ children, ...props }) => (
          <em className="italic" {...props}>{children}</em>
        ),

        // Strikethrough (GFM)
        del: ({ children, ...props }) => (
          <del 
            style={{ 
              textDecoration: 'line-through',
              opacity: 0.7,
            }} 
            {...props}
          >
            {children}
          </del>
        ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
