import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) return null;

  // Regex para detectar URLs (incluindo Waze), @perfis do Instagram e números de telefone
  const urlRegex = /(https?:\/\/[^\s]+|waze:\/\/[^\s]+)/g;
  const instagramRegex = /(@[a-zA-Z0-9._]+)/g;
  const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;

  // Split the text while keeping the separators (the matches)
  const parts = text.split(/(\s+)/);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Detect URLs
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

        // Detect Instagram handles
        if (part.match(instagramRegex)) {
          const username = part.trim().substring(1);
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

        // Detect Phone Numbers
        if (part.match(phoneRegex)) {
          const rawPhone = part.replace(/\D/g, '');
          return (
            <a
              key={i}
              href={`tel:${rawPhone}`}
              className="text-emerald-600 dark:text-emerald-400 font-bold underline"
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
