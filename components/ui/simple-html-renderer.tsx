import * as React from "react";
import { View } from "react-native";
import { P } from "./typography";

interface SimpleHtmlRendererProps {
  html: string;
  className?: string;
}

export function SimpleHtmlRenderer({ html, className }: SimpleHtmlRendererProps) {
  // HTML renderer that preserves line breaks while removing tags
  const parseHtmlWithLineBreaks = (htmlString: string): React.ReactElement[] => {
    if (!htmlString || !htmlString.trim()) {
      return [<P key="empty" className={className}>No content</P>];
    }

    const elements: React.ReactElement[] = [];
    let key = 0;

    // First, decode HTML entities
    let content = htmlString
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    // Convert HTML line breaks and paragraphs to newlines before stripping tags
    content = content
      .replace(/<\/p>/gi, '\n\n')           // End of paragraph = double newline
      .replace(/<p[^>]*>/gi, '')            // Remove opening p tags
      .replace(/<\/div>/gi, '\n\n')         // End of div = double newline  
      .replace(/<div[^>]*>/gi, '')          // Remove opening div tags
      .replace(/<br[^>]*>/gi, '\n')         // br tags = single newline
      .replace(/<\/?(h[1-6])[^>]*>/gi, '\n\n'); // Headings get double newlines

    // Now strip all remaining HTML tags
    content = content.replace(/<[^>]*>/g, '');

    // Split by double newlines to get paragraphs
    const paragraphs = content.split('\n\n');
    
    paragraphs.forEach(paragraph => {
      if (paragraph && paragraph.trim()) {
        // Further split by single newlines within paragraphs
        const lines = paragraph.split('\n');
        
        lines.forEach(line => {
          const cleanLine = line.replace(/\s+/g, ' ').trim();
          if (cleanLine) {
            elements.push(
              <P key={key++} className={className}>
                {cleanLine}
              </P>
            );
          }
        });
      }
    });

    // Fallback if no structured content found
    if (elements.length === 0) {
      const cleanText = content.replace(/\s+/g, ' ').trim();
      if (cleanText) {
        elements.push(
          <P key={key++} className={className}>
            {cleanText}
          </P>
        );
      }
    }

    return elements.length > 0 ? elements : [<P key="fallback" className={className}>No content</P>];
  };

  const renderedElements = parseHtmlWithLineBreaks(html);

  return (
    <View>
      {renderedElements}
    </View>
  );
}
