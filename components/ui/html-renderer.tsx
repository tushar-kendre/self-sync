import * as React from "react";
import { View } from "react-native";
import { H1, H2, H3, P, BlockQuote, Code } from "./typography";
import { Text } from "./text";

interface HtmlRendererProps {
  html: string;
  className?: string;
}

export function HtmlRenderer({ html, className }: HtmlRendererProps) {
  // Simple HTML to React Native component converter
  const parseHtml = (htmlString: string): React.ReactElement[] => {
    if (!htmlString || !htmlString.trim()) {
      return [<P key="empty" className={className}>No content</P>];
    }

    const elements: React.ReactElement[] = [];
    let key = 0;

    // Clean up HTML entities first
    let content = htmlString
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    // Extract and render headings
    content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (match, text) => {
      const cleanText = stripAllHtml(text);
      if (cleanText.trim()) {
        elements.push(<H1 key={key++} className={className}>{cleanText}</H1>);
      }
      return '';
    });

    content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, text) => {
      const cleanText = stripAllHtml(text);
      if (cleanText.trim()) {
        elements.push(<H2 key={key++} className={className}>{cleanText}</H2>);
      }
      return '';
    });

    content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, text) => {
      const cleanText = stripAllHtml(text);
      if (cleanText.trim()) {
        elements.push(<H3 key={key++} className={className}>{cleanText}</H3>);
      }
      return '';
    });

    // Extract and render blockquotes
    content = content.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, text) => {
      const cleanText = stripAllHtml(text);
      if (cleanText.trim()) {
        elements.push(<BlockQuote key={key++} className={className}>{cleanText}</BlockQuote>);
      }
      return '';
    });

    // Extract and render list items
    content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, text) => {
      const cleanText = stripAllHtml(text);
      if (cleanText.trim()) {
        elements.push(<P key={key++} className={className}>• {cleanText}</P>);
      }
      return '';
    });

    // Extract and render paragraphs/divs with inline formatting
    content = content.replace(/<(p|div)[^>]*>(.*?)<\/(p|div)>/gi, (match, tag, text) => {
      const processedContent = processInlineFormatting(text);
      if (processedContent && hasContent(processedContent)) {
        elements.push(<P key={key++} className={className}>{processedContent}</P>);
      }
      return '';
    });

    // Handle any remaining text content
    const remainingText = stripAllHtml(content).trim();
    if (remainingText) {
      elements.push(<P key={key++} className={className}>{remainingText}</P>);
    }

    return elements.length > 0 ? elements : [<P key="fallback" className={className}>No content</P>];
  };

  // Strip all HTML tags completely
  const stripAllHtml = (text: string): string => {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

  // Check if content has meaningful text
  const hasContent = (content: React.ReactNode): boolean => {
    if (typeof content === 'string') {
      return content.trim().length > 0;
    }
    if (Array.isArray(content)) {
      return content.some(item => hasContent(item));
    }
    return true; // Assume React elements have content
  };

  // Process inline formatting (bold, italic, code)
  const processInlineFormatting = (text: string): React.ReactNode => {
    if (!text || !text.trim()) return '';

    // First, let's handle code elements
    const parts: (string | React.ReactElement)[] = [];
    let remainingText = text;
    let codeKey = 0;

    // Extract code elements
    remainingText = remainingText.replace(/<code[^>]*>(.*?)<\/code>/gi, (match, codeContent) => {
      const placeholder = `__CODE_${codeKey}__`;
      parts.push(<Code key={`code-${codeKey++}`}>{stripAllHtml(codeContent)}</Code>);
      return placeholder;
    });

    // Extract bold elements
    let boldKey = 0;
    remainingText = remainingText.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, (match, tag, boldContent) => {
      const placeholder = `__BOLD_${boldKey}__`;
      parts.push(
        <Text key={`bold-${boldKey++}`} className="font-bold">
          {stripAllHtml(boldContent)}
        </Text>
      );
      return placeholder;
    });

    // Extract italic elements
    let italicKey = 0;
    remainingText = remainingText.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, (match, tag, italicContent) => {
      const placeholder = `__ITALIC_${italicKey}__`;
      parts.push(
        <Text key={`italic-${italicKey++}`} className="italic">
          {stripAllHtml(italicContent)}
        </Text>
      );
      return placeholder;
    });

    // Clean remaining HTML and split by placeholders
    const cleanText = stripAllHtml(remainingText);
    const textParts = cleanText.split(/(__(?:CODE|BOLD|ITALIC)_\d+__)/);
    
    const result: (string | React.ReactElement)[] = [];
    let partIndex = 0;

    textParts.forEach(part => {
      if (part.startsWith('__CODE_')) {
        const index = parseInt(part.match(/__CODE_(\d+)__/)?.[1] || '0');
        result.push(parts[index]);
      } else if (part.startsWith('__BOLD_')) {
        const index = parseInt(part.match(/__BOLD_(\d+)__/)?.[1] || '0');
        result.push(parts[index]);
      } else if (part.startsWith('__ITALIC_')) {
        const index = parseInt(part.match(/__ITALIC_(\d+)__/)?.[1] || '0');
        result.push(parts[index]);
      } else if (part.trim()) {
        result.push(part);
      }
    });

    return result.length === 1 ? result[0] : result;
  };

  const renderedElements = parseHtml(html);

  return (
    <View>
      {renderedElements}
    </View>
  );
}
