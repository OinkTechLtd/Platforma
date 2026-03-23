import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const AppThemeContext = createContext(null);
const STORAGE_PREFIX = 'platforma-preferences-v2';

const defaultPreferences = {
  themeMode: 'system',
  gamma: 1,
  preferredTopics: ['technology', 'music', 'news'],
  subscribedChannelIds: [],
  hiddenChannelIds: [],
  watchHistory: {},
  compactMode: false,
  autoplayPreviews: true,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const number = Number.parseInt(safe, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function applyGamma(hex, gamma) {
  const amount = clamp(gamma, 0.75, 1.25);
  const rgb = hexToRgb(hex);
  const adjusted = {
    r: 255 * Math.pow(rgb.r / 255, 1 / amount),
    g: 255 * Math.pow(rgb.g / 255, 1 / amount),
    b: 255 * Math.pow(rgb.b / 255, 1 / amount),
  };
  return rgbToHex(adjusted);
}

function createPalette(theme, gamma) {
  const base = theme === 'dark'
    ? {
        background: '#0b0d10',
        surface: '#14181f',
        elevated: '#1b212c',
        text: '#f5f7fb',
        secondaryText: '#94a1b5',
        border: '#222838',
        accent: '#ff4e45',
        accentMuted: '#302125',
        success: '#2fd17d',
      }
    : {
        background: '#f8fafc',
        surface: '#ffffff',
        elevated: '#eef2ff',
        text: '#101828',
        secondaryText: '#667085',
        border: '#dbe3f0',
        accent: '#ff3b30',
        accentMuted: '#ffe8e5',
        success: '#12b76a',
      };

  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => {
      if (!value.startsWith('#')) {
        return [key, value];
      }
      if (key === 'accent' || key === 'success') {
        return [key, value];
      }
      return [key, applyGamma(value, gamma)];
    })
  );
}

export function AppThemeProvider({ children, viewerId = 'guest' }) {
  const systemTheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false);

    AsyncStorage.getItem(`${STORAGE_PREFIX}:${viewerId}`)
      .then((rawValue) => {
        if (!isMounted) {
          return;
        }

        if (!rawValue) {
          setPreferences(defaultPreferences);
          setIsLoaded(true);
          return;
        }

        const parsed = JSON.parse(rawValue);
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          preferredTopics: Array.isArray(parsed?.preferredTopics)
            ? parsed.preferredTopics
            : defaultPreferences.preferredTopics,
          subscribedChannelIds: Array.isArray(parsed?.subscribedChannelIds)
            ? parsed.subscribedChannelIds
            : [],
          hiddenChannelIds: Array.isArray(parsed?.hiddenChannelIds)
            ? parsed.hiddenChannelIds
            : [],
          watchHistory: typeof parsed?.watchHistory === 'object' && parsed.watchHistory
            ? parsed.watchHistory
            : {},
        });
        setIsLoaded(true);
      })
      .catch(() => {
        if (isMounted) {
          setPreferences(defaultPreferences);
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [viewerId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    AsyncStorage.setItem(`${STORAGE_PREFIX}:${viewerId}`, JSON.stringify(preferences)).catch(() => {});
  }, [viewerId, preferences, isLoaded]);

  const resolvedTheme = preferences.themeMode === 'system' ? systemTheme : preferences.themeMode;
  const palette = useMemo(
    () => createPalette(resolvedTheme, preferences.gamma),
    [resolvedTheme, preferences.gamma]
  );

  const value = useMemo(() => ({
    isLoaded,
    preferences,
    theme: resolvedTheme,
    palette,
    setThemeMode: (themeMode) => setPreferences((current) => ({ ...current, themeMode })),
    setGamma: (gamma) => setPreferences((current) => ({ ...current, gamma })),
    setCompactMode: (compactMode) => setPreferences((current) => ({ ...current, compactMode })),
    setAutoplayPreviews: (autoplayPreviews) => setPreferences((current) => ({ ...current, autoplayPreviews })),
    toggleTopic: (topic) => setPreferences((current) => {
      const exists = current.preferredTopics.includes(topic);
      return {
        ...current,
        preferredTopics: exists
          ? current.preferredTopics.filter((entry) => entry !== topic)
          : [...current.preferredTopics, topic],
      };
    }),
    toggleSubscription: (channelId) => setPreferences((current) => {
      const exists = current.subscribedChannelIds.includes(channelId);
      return {
        ...current,
        subscribedChannelIds: exists
          ? current.subscribedChannelIds.filter((entry) => entry !== channelId)
          : [...current.subscribedChannelIds, channelId],
      };
    }),
    hideChannel: (channelId) => setPreferences((current) => ({
      ...current,
      hiddenChannelIds: current.hiddenChannelIds.includes(channelId)
        ? current.hiddenChannelIds
        : [...current.hiddenChannelIds, channelId],
    })),
    trackChannelView: (channel) => setPreferences((current) => ({
      ...current,
      watchHistory: {
        ...current.watchHistory,
        [channel.id]: {
          count: (current.watchHistory[channel.id]?.count ?? 0) + 1,
          category: channel.category,
          lastViewedAt: new Date().toISOString(),
        },
      },
    })),
  }), [isLoaded, palette, preferences, resolvedTheme]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return context;
}

export default AppThemeProvider;
