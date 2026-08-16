import React from 'react';

interface FormattedAiTextProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown tokens: **bold**, *italic*, `code` (all in neutral colors)
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="font-mono text-xs text-text-primary bg-bg-dark px-1.5 py-0.5 border border-border-color mx-0.5 break-all">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-text-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export function FormattedAiText({ content, className = '' }: FormattedAiTextProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="space-y-2.5 my-3 pl-1">
          {currentListItems.map((item, i) => (
            <li key={i} className="flex items-start space-x-2.5 text-sm text-text-secondary leading-relaxed">
              <span className="w-1.5 h-1.5 bg-text-muted shrink-0 mt-2" />
              <div className="flex-1">{item}</div>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(lineIndex);
      return;
    }

    // Match numbered list (1. Item) or bullet list (- Item, * Item) -> convert ALL to bullet list items
    const listMatch = line.match(/^(\d+[\.\)]|[-*•])\s+(.*)/);
    if (listMatch) {
      currentListItems.push(renderInlineTokens(listMatch[2]));
      return;
    }

    // Regular paragraph
    flushList(lineIndex);
    elements.push(
      <p key={`p-${lineIndex}`} className="text-sm text-text-secondary leading-relaxed my-2">
        {renderInlineTokens(line)}
      </p>
    );
  });

  flushList('end');

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
