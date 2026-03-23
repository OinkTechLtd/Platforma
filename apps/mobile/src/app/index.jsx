import { useUser } from '@/utils/auth/useUser';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  Compass,
  Contrast,
  Flame,
  Home,
  RefreshCcw,
  Settings2,
  Tv,
  User,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { AppThemeProvider, useAppTheme } from '@/theme/AppThemeProvider';
import {
  availableTopics,
  buildRecommendationBuckets,
  fetchPublicChannels,
} from '@/features/home/channelFeed';

const tabs = [
  { key: 'home', label: 'Главная', icon: Home },
  { key: 'discover', label: 'Обзор', icon: Compass },
  { key: 'subscriptions', label: 'Подписки', icon: Tv },
  { key: 'profile', label: 'Профиль', icon: User },
];

function IndexScreenContent() {
  const { data: viewer } = useUser();
  const viewerId = viewer?.id ?? viewer?.email ?? 'guest';
  const [activeTab, setActiveTab] = useState('home');
  const {
    preferences,
    palette,
    theme,
    setThemeMode,
    setGamma,
    setCompactMode,
    setAutoplayPreviews,
    toggleTopic,
    toggleSubscription,
    hideChannel,
    trackChannelView,
  } = useAppTheme();

  const channelsQuery = useQuery({
    queryKey: ['public-channels'],
    queryFn: fetchPublicChannels,
  });

  const recommendationBuckets = useMemo(
    () => buildRecommendationBuckets(channelsQuery.data ?? [], preferences, viewerId),
    [channelsQuery.data, preferences, viewerId]
  );

  const styles = useMemo(() => createStyles(palette, preferences.compactMode), [palette, preferences.compactMode]);

  const handleOpenChannel = (channel) => {
    trackChannelView(channel);
    setActiveTab('home');
  };

  const renderHome = () => (
    <>
      <HeroCard styles={styles} palette={palette} theme={theme} />
      <ChannelSection
        title="Для тебя"
        subtitle="Персональные рекомендации строятся из интересов, истории и твоего профиля."
        channels={recommendationBuckets.recommended.slice(0, 8)}
        styles={styles}
        onOpenChannel={handleOpenChannel}
        onToggleSubscription={toggleSubscription}
        subscribedIds={preferences.subscribedChannelIds}
      />
      <ChannelSection
        title="Оригиналы без мусора"
        subtitle="Белый список пропускает OinkTech, Twixoff и ТВКАНАЛЫ, а мусорные клоны режем фильтром."
        channels={recommendationBuckets.originals}
        styles={styles}
        onOpenChannel={handleOpenChannel}
        onToggleSubscription={toggleSubscription}
        subscribedIds={preferences.subscribedChannelIds}
        emptyLabel="Оригиналы появятся здесь, когда API вернет подходящие каналы."
      />
      <ChannelSection
        title="В тренде"
        subtitle="Живые каналы из Supabase API без демо-данных."
        channels={recommendationBuckets.discover.slice(0, 10)}
        styles={styles}
        onOpenChannel={handleOpenChannel}
        onToggleSubscription={toggleSubscription}
        subscribedIds={preferences.subscribedChannelIds}
      />
    </>
  );

  const renderDiscover = () => (
    <>
      <SectionHeader
        title="Обзор"
        subtitle="Собери свою ленту: выбери интересы, чтобы алгоритм менялся под тебя."
        styles={styles}
      />
      <View style={styles.topicGrid}>
        {availableTopics.map((topic) => {
          const active = preferences.preferredTopics.includes(topic);
          return (
            <Pressable
              key={topic}
              onPress={() => toggleTopic(topic)}
              style={[styles.topicChip, active && styles.topicChipActive]}
            >
              <Text style={[styles.topicChipText, active && styles.topicChipTextActive]}>{topic}</Text>
            </Pressable>
          );
        })}
      </View>
      <ChannelSection
        title="Свежие каналы"
        subtitle="Открывай новые каналы и скрывай мусор, если что-то проскочило."
        channels={recommendationBuckets.discover}
        styles={styles}
        onOpenChannel={handleOpenChannel}
        onToggleSubscription={toggleSubscription}
        subscribedIds={preferences.subscribedChannelIds}
        actionRenderer={(channel) => (
          <Pressable onPress={() => hideChannel(channel.id)} style={styles.secondaryMiniButton}>
            <Text style={styles.secondaryMiniButtonText}>Скрыть</Text>
          </Pressable>
        )}
      />
    </>
  );

  const renderSubscriptions = () => (
    <>
      <SectionHeader
        title="Подписки"
        subtitle="Собрано как в мобильном YouTube: нижняя навигация и быстрый доступ к твоим каналам."
        styles={styles}
      />
      <ChannelSection
        title="Мои каналы"
        subtitle="Подписки сохраняются отдельно для каждого пользователя и гостя."
        channels={recommendationBuckets.subscriptions}
        styles={styles}
        onOpenChannel={handleOpenChannel}
        onToggleSubscription={toggleSubscription}
        subscribedIds={preferences.subscribedChannelIds}
        emptyLabel="Пока пусто — подпишись на канал в Главной или Обзоре."
      />
    </>
  );

  const renderProfile = () => (
    <>
      <ProfileCard styles={styles} palette={palette} viewer={viewer} subscribedCount={preferences.subscribedChannelIds.length} />
      <SectionHeader
        title="Настройки"
        subtitle="Кнопку загрузки убрал: теперь в профиле только пользовательские настройки и внешний вид."
        styles={styles}
      />
      <View style={styles.settingsCard}>
        <SettingRow
          styles={styles}
          icon={<Contrast size={18} color={palette.text} />}
          label="Светлая тема"
          description="Сразу включает light theme."
          action={<ThemeButton styles={styles} active={preferences.themeMode === 'light'} label="Light" onPress={() => setThemeMode('light')} />}
        />
        <SettingRow
          styles={styles}
          icon={<Contrast size={18} color={palette.text} />}
          label="Темная тема"
          description="Переключение на dark theme."
          action={<ThemeButton styles={styles} active={preferences.themeMode === 'dark'} label="Dark" onPress={() => setThemeMode('dark')} />}
        />
        <SettingRow
          styles={styles}
          icon={<Settings2 size={18} color={palette.text} />}
          label="Система"
          description="Подхватывает тему устройства."
          action={<ThemeButton styles={styles} active={preferences.themeMode === 'system'} label="Auto" onPress={() => setThemeMode('system')} />}
        />
        <View style={styles.gammaBlock}>
          <Text style={styles.settingLabel}>Гамма интерфейса</Text>
          <Text style={styles.settingDescription}>Регулируй яркость поверх темы: от мягкой до контрастной.</Text>
          <Slider
            value={preferences.gamma}
            minimumValue={0.85}
            maximumValue={1.15}
            step={0.05}
            minimumTrackTintColor={palette.accent}
            maximumTrackTintColor={palette.border}
            thumbTintColor={palette.accent}
            onValueChange={setGamma}
          />
          <Text style={styles.gammaValue}>{preferences.gamma.toFixed(2)}x</Text>
        </View>
        <SettingToggle
          styles={styles}
          label="Компактные карточки"
          description="Плотнее список каналов для маленьких экранов."
          value={preferences.compactMode}
          onValueChange={setCompactMode}
        />
        <SettingToggle
          styles={styles}
          label="Автопревью"
          description="Сохраняем настройку отдельно для каждого пользователя."
          value={preferences.autoplayPreviews}
          onValueChange={setAutoplayPreviews}
        />
      </View>
    </>
  );

  let content = renderHome();
  if (activeTab === 'discover') {
    content = renderDiscover();
  }
  if (activeTab === 'subscriptions') {
    content = renderSubscriptions();
  }
  if (activeTab === 'profile') {
    content = renderProfile();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>Platforma</Text>
            <Text style={styles.brandSubtitle}>Живая мобильная лента без демо-контента</Text>
          </View>
          <Pressable onPress={() => channelsQuery.refetch()} style={styles.iconButton}>
            {channelsQuery.isFetching ? (
              <ActivityIndicator color={palette.accent} />
            ) : (
              <RefreshCcw size={18} color={palette.text} />
            )}
          </Pressable>
        </View>

        {channelsQuery.isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={styles.stateTitle}>Загружаю каналы из Supabase</Text>
            <Text style={styles.stateText}>Демо-данные больше не используются.</Text>
          </View>
        ) : channelsQuery.isError ? (
          <View style={styles.centeredState}>
            <Bell size={22} color={palette.accent} />
            <Text style={styles.stateTitle}>Не удалось получить каналы</Text>
            <Text style={styles.stateText}>{String(channelsQuery.error?.message ?? 'Проверь API и попробуй обновить.')}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        )}

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.navItem}>
                <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                  <Icon size={20} color={active ? '#ffffff' : palette.secondaryText} />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function IndexScreen() {
  const { data: viewer } = useUser();
  const viewerId = viewer?.id ?? viewer?.email ?? 'guest';

  return (
    <AppThemeProvider viewerId={viewerId}>
      <IndexScreenContent />
    </AppThemeProvider>
  );
}

function HeroCard({ styles, palette, theme }) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroBadge}>
        <Flame size={14} color={palette.accent} />
        <Text style={styles.heroBadgeText}>Новый фид</Text>
      </View>
      <Text style={styles.heroTitle}>Каналы теперь тянутся из реального API и чистятся от мусора</Text>
      <Text style={styles.heroSubtitle}>
        Персонализация строится по интересам, подпискам и истории просмотров, так что у каждого пользователя своя выдача.
      </Text>
      <View style={styles.heroMetricsRow}>
        <MetricChip styles={styles} label="Источник" value="Supabase" />
        <MetricChip styles={styles} label="Темы" value="Light / Dark" />
        <MetricChip styles={styles} label="Навигация" value="YouTube-like" />
      </View>
      <Text style={styles.heroFootnote}>Активная тема: {theme === 'dark' ? 'темная' : 'светлая'}.</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle, styles }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ChannelSection({
  title,
  subtitle,
  channels,
  styles,
  onOpenChannel,
  onToggleSubscription,
  subscribedIds,
  emptyLabel = 'Пока каналов нет.',
  actionRenderer,
}) {
  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title={title} subtitle={subtitle} styles={styles} />
      {channels.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>{emptyLabel}</Text>
        </View>
      ) : (
        channels.map((channel) => {
          const subscribed = subscribedIds.includes(channel.id);
          return (
            <Pressable key={channel.id} onPress={() => onOpenChannel(channel)} style={styles.channelCard}>
              <View style={styles.channelRow}>
                {channel.avatarUrl ? (
                  <Image source={{ uri: channel.avatarUrl }} style={styles.channelAvatar} />
                ) : (
                  <View style={styles.channelAvatarFallback}>
                    <Text style={styles.channelAvatarFallbackText}>{channel.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.channelBody}>
                  <View style={styles.channelTitleRow}>
                    <Text style={styles.channelTitle}>{channel.name}</Text>
                    {channel.isVerified ? <Text style={styles.verifiedBadge}>●</Text> : null}
                  </View>
                  <Text style={styles.channelMeta}>{channel.handle || 'Без username'} · {channel.subscriberLabel}</Text>
                  <Text style={styles.channelDescription} numberOfLines={2}>
                    {channel.description || 'Описание пока не заполнено, но канал уже доступен через API.'}
                  </Text>
                  <View style={styles.channelTags}>
                    <Tag styles={styles} label={channel.category} />
                    <Tag styles={styles} label={channel.recommendationReason || 'Живая подборка'} />
                  </View>
                </View>
              </View>
              <View style={styles.channelFooter}>
                <Pressable onPress={() => onToggleSubscription(channel.id)} style={[styles.primaryMiniButton, subscribed && styles.primaryMiniButtonActive]}>
                  <Text style={[styles.primaryMiniButtonText, subscribed && styles.primaryMiniButtonTextActive]}>
                    {subscribed ? 'В подписках' : 'Подписаться'}
                  </Text>
                </Pressable>
                {actionRenderer ? actionRenderer(channel) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function ProfileCard({ styles, palette, viewer, subscribedCount }) {
  const initials = (viewer?.name || viewer?.email || 'Guest').slice(0, 2).toUpperCase();
  return (
    <View style={styles.profileHero}>
      <View style={[styles.profileAvatar, { backgroundColor: palette.accentMuted }]}>
        <Text style={styles.profileAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.profileName}>{viewer?.name || 'Гость Platforma'}</Text>
      <Text style={styles.profileSubtitle}>{viewer?.email || 'Локальный профиль без кнопки загрузить'}</Text>
      <Text style={styles.profileStats}>Подписок: {subscribedCount}</Text>
    </View>
  );
}

function ThemeButton({ styles, active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.themeButton, active && styles.themeButtonActive]}>
      <Text style={[styles.themeButtonText, active && styles.themeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SettingRow({ styles, icon, label, description, action }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {action}
    </View>
  );
}

function SettingToggle({ styles, label, description, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingContentExpanded}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function MetricChip({ styles, label, value }) {
  return (
    <View style={styles.metricChip}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Tag({ styles, label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function createStyles(palette, compactMode) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    appShell: {
      flex: 1,
      backgroundColor: palette.background,
    },
    topBar: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      color: palette.text,
      fontSize: 24,
      fontWeight: '800',
    },
    brandSubtitle: {
      color: palette.secondaryText,
      marginTop: 4,
      fontSize: 13,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 120,
      gap: 22,
    },
    centeredState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 32,
    },
    stateTitle: {
      color: palette.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    stateText: {
      color: palette.secondaryText,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    heroCard: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 12,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.accentMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    heroBadgeText: {
      color: palette.text,
      fontWeight: '700',
    },
    heroTitle: {
      color: palette.text,
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 32,
    },
    heroSubtitle: {
      color: palette.secondaryText,
      fontSize: 15,
      lineHeight: 22,
    },
    heroMetricsRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    heroFootnote: {
      color: palette.secondaryText,
      fontSize: 13,
    },
    metricChip: {
      backgroundColor: palette.elevated,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 96,
    },
    metricLabel: {
      color: palette.secondaryText,
      fontSize: 12,
    },
    metricValue: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    sectionBlock: {
      gap: 12,
    },
    sectionHeader: {
      gap: 4,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '800',
    },
    sectionSubtitle: {
      color: palette.secondaryText,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyCard: {
      borderRadius: 18,
      padding: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    emptyCardText: {
      color: palette.secondaryText,
      fontSize: 14,
    },
    channelCard: {
      backgroundColor: palette.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.border,
      padding: compactMode ? 14 : 18,
      gap: 12,
    },
    channelRow: {
      flexDirection: 'row',
      gap: 14,
    },
    channelAvatar: {
      width: compactMode ? 52 : 60,
      height: compactMode ? 52 : 60,
      borderRadius: 18,
      backgroundColor: palette.elevated,
    },
    channelAvatarFallback: {
      width: compactMode ? 52 : 60,
      height: compactMode ? 52 : 60,
      borderRadius: 18,
      backgroundColor: palette.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelAvatarFallbackText: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '800',
    },
    channelBody: {
      flex: 1,
      gap: 6,
    },
    channelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    channelTitle: {
      color: palette.text,
      fontSize: compactMode ? 16 : 17,
      fontWeight: '800',
      flexShrink: 1,
    },
    verifiedBadge: {
      color: palette.success,
      fontSize: 14,
      marginTop: 1,
    },
    channelMeta: {
      color: palette.secondaryText,
      fontSize: 13,
    },
    channelDescription: {
      color: palette.text,
      opacity: 0.88,
      fontSize: 14,
      lineHeight: 20,
    },
    channelTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    tag: {
      backgroundColor: palette.elevated,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    tagText: {
      color: palette.secondaryText,
      fontSize: 12,
      fontWeight: '600',
    },
    channelFooter: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    primaryMiniButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: palette.accentMuted,
    },
    primaryMiniButtonActive: {
      backgroundColor: palette.accent,
    },
    primaryMiniButtonText: {
      color: palette.text,
      fontWeight: '700',
      fontSize: 13,
    },
    primaryMiniButtonTextActive: {
      color: '#ffffff',
    },
    secondaryMiniButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
    },
    secondaryMiniButtonText: {
      color: palette.secondaryText,
      fontWeight: '700',
      fontSize: 13,
    },
    topicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    topicChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    topicChipActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    topicChipText: {
      color: palette.text,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    topicChipTextActive: {
      color: '#ffffff',
    },
    profileHero: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 20,
      alignItems: 'center',
      gap: 8,
    },
    profileAvatar: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: {
      color: palette.text,
      fontSize: 24,
      fontWeight: '800',
    },
    profileName: {
      color: palette.text,
      fontSize: 22,
      fontWeight: '800',
    },
    profileSubtitle: {
      color: palette.secondaryText,
      fontSize: 14,
    },
    profileStats: {
      color: palette.text,
      fontWeight: '700',
      marginTop: 6,
    },
    settingsCard: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 18,
      gap: 18,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    settingIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: palette.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingContent: {
      flex: 1,
      gap: 3,
    },
    settingContentExpanded: {
      flex: 1,
      gap: 3,
      paddingRight: 12,
    },
    settingLabel: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '700',
    },
    settingDescription: {
      color: palette.secondaryText,
      fontSize: 13,
      lineHeight: 18,
    },
    themeButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: palette.elevated,
    },
    themeButtonActive: {
      backgroundColor: palette.accent,
    },
    themeButtonText: {
      color: palette.text,
      fontWeight: '700',
      fontSize: 13,
    },
    themeButtonTextActive: {
      color: '#ffffff',
    },
    gammaBlock: {
      gap: 6,
      paddingVertical: 4,
    },
    gammaValue: {
      color: palette.text,
      fontWeight: '700',
    },
    bottomNav: {
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 14,
      borderRadius: 26,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 10,
      justifyContent: 'space-between',
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    navIconWrap: {
      width: 40,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navIconWrapActive: {
      backgroundColor: palette.accent,
    },
    navLabel: {
      color: palette.secondaryText,
      fontSize: 11,
      fontWeight: '700',
    },
    navLabelActive: {
      color: palette.text,
    },
  });
}

export default IndexScreen;
