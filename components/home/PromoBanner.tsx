import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { WcBanner } from '@/types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PromoBannerProps = {
  banners: WcBanner[];
  bannerHeight?: number; // ✅ fixed type
};

function getImageUrl(image: WcBanner['image']): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image?.src) return image.src;
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

export function PromoBanner({ banners, bannerHeight = 200 }: PromoBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToIndex = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(index);
    },
    []
  );

  // Auto rotate every 3 seconds
  useEffect(() => {
    if (!banners?.length) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners?.length]);

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  if (!banners?.length) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScrollBeginDrag={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => {
          const imageUrl = getImageUrl(banner.image);
          const description = banner.description
            ? stripHtml(banner.description)
            : null;

          return (
            <View
              key={banner.id}
              style={[styles.banner, { height: bannerHeight }]} // ✅ dynamic height applied here
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholder} />
              )}

              <View style={styles.overlay} />

              <View style={styles.content}>
                <ThemedText style={styles.title} numberOfLines={2}>
                  {banner.title}
                </ThemedText>

                {description ? (
                  <ThemedText style={styles.description} numberOfLines={2}>
                    {description}
                  </ThemedText>
                ) : banner.subtitle ? (
                  <ThemedText style={styles.description} numberOfLines={2}>
                    {banner.subtitle}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.xl,
  },
  banner: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ccc',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FF6B35',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#ccc',
  },
});
