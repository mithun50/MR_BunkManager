/**
 * Simple Markdown Renderer for React Native
 * A lightweight, reliable markdown renderer without complex dependencies
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownRendererProps {
  content: string;
  textColor: string;
  codeBackground: string;
  codeColor: string;
  linkColor: string;
  borderColor: string;
}

type BlockType = 'paragraph' | 'heading' | 'code' | 'list' | 'blockquote' | 'hr';

interface Block {
  type: BlockType;
  content: string;
  level?: number;
  ordered?: boolean;
  items?: string[];
}

export default function MarkdownRenderer({
  content,
  textColor,
  codeBackground,
  codeColor,
  linkColor,
  borderColor,
}: MarkdownRendererProps) {

  // Parse inline formatting and return array of Text elements
  const renderInline = (text: string, baseStyle: any, key: string): React.ReactNode => {
    if (!text) return null;

    const elements: React.ReactNode[] = [];
    let remaining = text;
    let idx = 0;

    while (remaining.length > 0) {
      // Bold **text** or __text__
      let match = remaining.match(/^(\*\*|__)([^*_]+)\1/);
      if (match) {
        elements.push(
          <Text key={`${key}-${idx++}`} style={[baseStyle, styles.bold]}>
            {match[2]}
          </Text>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Italic *text* or _text_ (single)
      match = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (match) {
        elements.push(
          <Text key={`${key}-${idx++}`} style={[baseStyle, styles.italic]}>
            {match[2]}
          </Text>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Inline code `code`
      match = remaining.match(/^`([^`]+)`/);
      if (match) {
        elements.push(
          <Text
            key={`${key}-${idx++}`}
            style={[styles.inlineCode, { backgroundColor: codeBackground, color: codeColor }]}
          >
            {match[1]}
          </Text>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Link [text](url) - just render text part
      match = remaining.match(/^\[([^\]]+)\]\([^)]+\)/);
      if (match) {
        elements.push(
          <Text key={`${key}-${idx++}`} style={[baseStyle, styles.link, { color: linkColor }]}>
            {match[1]}
          </Text>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Find next special character
      const nextSpecial = remaining.search(/[\*_`\[]/);
      if (nextSpecial === -1) {
        elements.push(<Text key={`${key}-${idx++}`} style={baseStyle}>{remaining}</Text>);
        break;
      } else if (nextSpecial === 0) {
        elements.push(<Text key={`${key}-${idx++}`} style={baseStyle}>{remaining[0]}</Text>);
        remaining = remaining.slice(1);
      } else {
        elements.push(<Text key={`${key}-${idx++}`} style={baseStyle}>{remaining.slice(0, nextSpecial)}</Text>);
        remaining = remaining.slice(nextSpecial);
      }
    }

    if (elements.length === 0) return null;
    if (elements.length === 1) return elements[0];
    return <Text key={key}>{elements}</Text>;
  };

  // Parse content into blocks
  const parseBlocks = (text: string): Block[] => {
    const lines = text.split('\n');
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // Code block ```
      if (trimmed.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({ type: 'code', content: codeLines.join('\n') });
        i++;
        continue;
      }

      // Heading #
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2],
        });
        i++;
        continue;
      }

      // HR ---
      if (/^[-*_]{3,}$/.test(trimmed)) {
        blocks.push({ type: 'hr', content: '' });
        i++;
        continue;
      }

      // Blockquote >
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
          i++;
        }
        blocks.push({ type: 'blockquote', content: quoteLines.join(' ') });
        continue;
      }

      // Unordered list
      if (/^[-*+]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
          i++;
        }
        blocks.push({ type: 'list', content: '', ordered: false, items });
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        blocks.push({ type: 'list', content: '', ordered: true, items });
        continue;
      }

      // Paragraph - collect consecutive non-special lines
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('>') &&
        !/^[-*+]\s+/.test(lines[i].trim()) &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !/^[-*_]{3,}$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      if (paraLines.length > 0) {
        blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
      }
    }

    return blocks;
  };

  const blocks = parseBlocks(content);
  const baseTextStyle = { color: textColor };

  return (
    <View>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        switch (block.type) {
          case 'heading': {
            const sizes = [20, 18, 16, 15, 14, 13];
            const fontSize = sizes[Math.min((block.level || 1) - 1, 5)];
            return (
              <Text key={key} style={[styles.heading, { fontSize, color: textColor }]}>
                {renderInline(block.content, { color: textColor }, key)}
              </Text>
            );
          }

          case 'code':
            return (
              <View key={key} style={[styles.codeBlock, { backgroundColor: codeBackground }]}>
                <Text style={[styles.codeText, { color: textColor }]}>
                  {block.content}
                </Text>
              </View>
            );

          case 'blockquote':
            return (
              <View key={key} style={[styles.blockquote, { borderLeftColor: linkColor }]}>
                <Text style={[styles.blockquoteText, { color: textColor }]}>
                  {renderInline(block.content, { color: textColor }, key)}
                </Text>
              </View>
            );

          case 'list':
            return (
              <View key={key} style={styles.list}>
                {block.items?.map((item, idx) => (
                  <View key={`${key}-item-${idx}`} style={styles.listItem}>
                    <Text style={[styles.listBullet, { color: textColor }]}>
                      {block.ordered ? `${idx + 1}.` : '•'}
                    </Text>
                    <Text style={[styles.listText, { color: textColor }]}>
                      {renderInline(item, { color: textColor }, `${key}-item-${idx}`)}
                    </Text>
                  </View>
                ))}
              </View>
            );

          case 'hr':
            return <View key={key} style={[styles.hr, { backgroundColor: borderColor }]} />;

          case 'paragraph':
          default:
            return (
              <Text key={key} style={[styles.paragraph, { color: textColor }]}>
                {renderInline(block.content, { color: textColor }, key)}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  heading: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  link: {
    textDecorationLine: 'underline',
  },
  codeBlock: {
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    width: 20,
    fontSize: 14,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 6,
  },
  blockquoteText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hr: {
    height: 1,
    marginVertical: 10,
  },
});
