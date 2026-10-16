import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { parseInline } from '@/lib/inline-format';
import type { Source, StoryBlock } from '@/domain/types';
import { fonts, layout, radius, space, useTheme } from '@/theme';

import { CoverImage } from '../cover-image';

type Props = {
  blocks: StoryBlock[];
  sources: Source[];
};

/** Paragraph text with **bold**, _italic_ and [links](https://…) rendered inline. */
function RichText({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="storyBody">
      {parseInline(text).map((span, i) => {
        if (span.kind === 'bold') return <Text key={i} variant="storyBody" style={styles.bold}>{span.text}</Text>;
        if (span.kind === 'italic') return <Text key={i} variant="storyBody" style={styles.italic}>{span.text}</Text>;
        if (span.kind === 'link') {
          return (
            <Text
              key={i}
              variant="storyBody"
              accessibilityRole="link"
              onPress={() => void WebBrowser.openBrowserAsync(span.url)}
              style={[styles.link, { color: colors.primary, textDecorationColor: colors.primary }]}>
              {span.text}
            </Text>
          );
        }
        return span.text;
      })}
    </Text>
  );
}

/**
 * Renders a campaign story as an editorial article. Used by the detail page and, later, the
 * creation preview, so a draft looks exactly as it will when published.
 */
export function StoryRenderer({ blocks, sources }: Props) {
  const { colors } = useTheme();
  const sourceNumber = (id?: string) => {
    const index = sources.findIndex((s) => s.id === id);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <View style={styles.story}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'headline':
            return (
              <Text key={block.id} variant="storyTitle" accessibilityRole="header" style={styles.heading}>
                {block.text}
              </Text>
            );
          case 'intro':
            return (
              <Text key={block.id} variant="storyBody" color="textMuted" style={styles.italic}>
                {block.text}
              </Text>
            );
          case 'heading':
            return (
              <Text key={block.id} variant="storyHeading" accessibilityRole="header" style={styles.heading}>
                {block.text}
              </Text>
            );
          case 'paragraph':
            return <RichText key={block.id} text={block.text} />;
          case 'image':
            return (
              <View key={block.id} style={styles.figure}>
                <CoverImage image={block.image} category="other" decorative={false} style={styles.image} />
                {(block.caption || block.image.credit) && (
                  <Text variant="footnote" color="textMuted">
                    {block.caption}
                    {block.image.credit && (
                      <Text variant="footnote" color="textMuted">{` Photo: ${block.image.credit}`}</Text>
                    )}
                  </Text>
                )}
              </View>
            );
          case 'stat': {
            const n = sourceNumber(block.sourceId);
            return (
              <View
                key={block.id}
                accessible
                accessibilityLabel={`${block.value}. ${block.label}.${n ? ` Source ${n}.` : ''}`}
                style={[styles.stat, { borderColor: colors.primary }]}>
                <Text variant="title1" color="primary" tabular>
                  {block.value}
                </Text>
                <Text variant="subhead" color="textMuted">
                  {block.label}
                  {n && <Text variant="subhead" color="primary">{`  [${n}]`}</Text>}
                </Text>
              </View>
            );
          }
          case 'quote':
            return (
              <View key={block.id} style={[styles.quote, { borderColor: colors.border }]}>
                <Text variant="storyHeading" style={styles.quoteText}>
                  “{block.text}”
                </Text>
                {block.attribution && (
                  <Text variant="subhead" color="textMuted">
                    — {block.attribution}
                  </Text>
                )}
              </View>
            );
          // Suggested actions are published in the "What you can do" section, not inline.
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  story: { gap: space.lg, paddingHorizontal: layout.gutter },
  heading: { marginTop: space.md },
  figure: { gap: space.sm, marginVertical: space.sm },
  image: { width: '100%', aspectRatio: 3 / 2, borderRadius: radius.md },
  stat: { borderLeftWidth: 3, paddingLeft: space.lg, paddingVertical: space.xs, gap: space.xs, marginVertical: space.sm },
  quote: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.lg, gap: space.sm, marginVertical: space.sm },
  quoteText: { fontFamily: fonts.serifItalic },
  bold: { fontFamily: fonts.serifSemibold },
  italic: { fontFamily: fonts.serifItalic },
  link: { textDecorationLine: 'underline' },
});
