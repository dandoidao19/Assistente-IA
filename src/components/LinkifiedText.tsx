import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) return null;

  // Regex para detectar URLs, links do Waze e @perfis do Instagram
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const instagramRegex = /(@[a-zA-Z0-0._]+)/g;

  const parts = text.split(/(\s+)/);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        if (part.match(instagramRegex)) {
          const username = part.substring(1);
          return (
            <a
              key={i}
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 dark:text-pink-400 font-bold underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        return part;
      })}
    </span>
  );
}
