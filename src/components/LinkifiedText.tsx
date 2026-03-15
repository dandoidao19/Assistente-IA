import React from 'react';

interface LinkifiedTextProps {
  text: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  if (!text) return null;

  // Regex for URLs, Instagram handles, and Phone numbers
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const instagramRegex = /(@[a-zA-Z0-9_.]+)/g;
  const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;

  const parts = text.split(/(\s+)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline break-all"
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
              key={index}
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        if (part.match(phoneRegex)) {
          const digits = part.replace(/\D/g, '');
          return (
            <a
              key={index}
              href={`tel:${digits}`}
              className="text-emerald-500 hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        return part;
      })}
    </>
  );
};
