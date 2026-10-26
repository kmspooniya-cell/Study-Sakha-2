import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { BarChart } from '../components/Charts';
import { Shell, useLayout } from '../components/Shell';
import { Button, Card, Chip, ProgressBar, ProgressRing, SectionHeader, Tag, Txt } from '../components/ui';
import { CURRENT_AFFAIRS, EXAMS, RESOURCES, TESTS, TODAY_PLAN } from '../lib/data';
import { dayKey, useStore } from '../lib/store';
import { radii, useTheme } from '../lib/theme';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const { state, streak, todayMinutes, todayDone, dispatch } = useStore();
  const { isMobile, isDesktop } = useLayout();
  const goal = state.settings.dailyGoalMin;
  const target = Math.min(1, todayMinutes / goal);
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      setAnim(Math.min(1, frame / 28));
      if (frame >= 28) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target]);

  const exam = EXAMS.find((e) => e.id === (state.user?.exam ?? 'upsc'))!;
  const first = (state.user?.name ?? 'Aspirant').split(' ')[0];

  const week = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({ label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], value: state.studyLog[dayKey(d)] ?? 0 });
    }
    return out;
  }, [state.studyLog]);

  const continueItems = Object.entries(state.progress)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, 3)
    .map(([id, v]) => ({ id, ...v, res: RESOURCES.find((r) => r.id === id) }))
    .filter((x) => x.res);

  const liveTests = TESTS.filter((t) => t.liveAt);
  const recent = RESOURCES.filter((r) => r.exam === exam.id).slice(0, isDesktop ? 4 : 3);
  const planPct = Math.round((todayDone.length / TODAY_PLAN.length) * 100);

  const quickActions: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }[] = [
    { label: 'Ask Sakha AI', icon: 'sparkles', color: colors.teal, onPress: () => nav.navigate('SakhaAI') },
    { label: 'Daily Quiz', icon: 'flash', color: colors.amber, onPress: () => nav.navigate('TestPlayer', { testId: 't4' }) },
    { label: 'PYQ Bank', icon: 'albums', color: colors.blue, onPress: () => nav.navigate('PYQ') },
    { label: 'New Note', icon: 'create', color: colors.violet, onPress: () => nav.navigate('NoteEditor', {}) },
  ];

  const openPlanItem = (item: (typeof TODAY_PLAN)[number]) => {
    if (item.kind === 'note') nav.navigate('NoteEditor', { resourceId: item.refId });
    else if (item.kind === 'pyq') nav.navigate('PYQ', { subject: item.refId });
    else if (item.kind === 'ca') nav.navigate('CurrentAffairs');
    else nav.navigate('TestPlayer', { testId: item.refId });
  };

  return (
    <Shell active="Dashboard" title="Dashboard" subtitle={`${exam.name} · ${exam.aspirants} aspirants preparing`}>
      <LinearGradient
        colors={[colors.navy, colors.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radii.xl, padding: isMobile ? 18 : 24, overflow: 'hidden' }}
      >
        <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 18 : 24 }}>
          <View style={{ flex: 1 }}>
            <Txt size={12.5} weight="700" color="rgba(255,255,255,0.72)" style={{ letterSpacing: 1 }}>
              {greeting().toUpperCase()}
            </Txt>
            <Txt size={isMobile ? 24 : 30} weight="800" display color="#fff" style={{ marginTop: 4, letterSpacing: -0.8 }}>
              {first}, let us close today's ring.
            </Txt>
            <Txt size={13.5} color="rgba(255,255,255,0.8)" style={{ marginTop: 8, maxWidth: 520 }}>
              You have studied {todayMinutes} of {goal} minutes today. {todayDone.length} of {TODAY_PLAN.length} planned tasks are done.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <Button label="Continue studying" icon="play" variant="soft" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} onPress={() => nav.navigate('Library')} />
              <Button
                label="Ask Sakha AI"
                icon="sparkles-outline"
                variant="ghost"
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}
                onPress={() => nav.navigate('SakhaAI')}
              />
            </View>
          </View>

          <View style={{ alignItems: 'center', gap: 12 }}>
            <ProgressRing size={isMobile ? 130 : 150} stroke={13} progress={target * anim}>
              <Txt size={isMobile ? 26 : 30} weight="800" display color="#fff">
                {Math.round(target * anim * 100)}%
              </Txt>
              <Txt size={11.5} color="rgba(255,255,255,0.75)" weight="600">
                daily goal
              </Txt>
            </ProgressRing>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill }}>
              <Ionicons name="flame" size={16} color="#FFB84D" />
              <Txt size={13} weight="800" color="#fff">
                {streak}-day streak
              </Txt>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {quickActions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: isMobile ? '45%' : 150,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              padding: 14,
              gap: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: `${a.color}22`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={a.icon} size={18} color={a.color} />
            </View>
            <Txt size={13.5} weight="700">
              {a.label}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginTop: 20 }}>
        <View style={{ flex: 1.15, gap: 20 }}>
          <Card>
            <SectionHeader title="Today's plan" icon="checkbox-outline" action={`${planPct}% done`} />
            <ProgressBar value={planPct} color={colors.teal} />
            <View style={{ marginTop: 14, gap: 4 }}>
              {TODAY_PLAN.map((item) => {
                const done = todayDone.includes(item.id);
                return (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
                    <Pressable
                      onPress={() => {
                        dispatch({ type: 'togglePlan', id: item.id });
                        if (!done) dispatch({ type: 'study', minutes: item.minutes });
                      }}
                      hitSlop={8}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        borderWidth: 1.8,
                        borderColor: done ? colors.teal : colors.border,
                        backgroundColor: done ? colors.teal : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
                    </Pressable>
                    <Pressable style={{ flex: 1 }} onPress={() => openPlanItem(item)}>
                      <Txt
                        size={13.5}
                        weight="600"
                        color={done ? colors.textFaint : colors.text}
                        style={done ? { textDecorationLine: 'line-through' } : undefined}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Txt>
                    </Pressable>
                    <Tag label={`${item.minutes}m`} color={colors.textMuted} />
                  </View>
                );
              })}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Continue learning" icon="play-circle-outline" action="Library" onAction={() => nav.navigate('Library')} />
            <View style={{ gap: 12 }}>
              {continueItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    item.res!.type === 'book'
                      ? nav.navigate('BookReader', { resourceId: item.id })
                      : nav.navigate('NoteEditor', { resourceId: item.id })
                  }
                  style={({ pressed }) => ({ flexDirection: 'row', gap: 12, opacity: pressed ? 0.75 : 1 })}
                >
                  <Image source={{ uri: item.res!.cover }} style={{ width: 52, height: 68, borderRadius: 10, backgroundColor: colors.surfaceAlt }} />
                  <View style={{ flex: 1, justifyContent: 'center', gap: 7 }}>
                    <Txt size={13.5} weight="700" numberOfLines={1}>
                      {item.res!.title}
                    </Txt>
                    <Txt size={11.5} color={colors.textMuted}>
                      {item.res!.subject} · {item.res!.type === 'book' ? 'Book' : 'Note'} · {item.percent}% complete
                    </Txt>
                    <ProgressBar value={item.percent} height={6} />
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Weekly activity" icon="bar-chart-outline" action="Profile" onAction={() => nav.navigate('Profile')} />
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 12 }}>
              <View>
                <Txt size={22} weight="800" display>
                  {week.reduce((a, b) => a + b.value, 0)}m
                </Txt>
                <Txt size={11.5} color={colors.textMuted}>
                  this week
                </Txt>
              </View>
              <View>
                <Txt size={22} weight="800" display color={colors.teal}>
                  {Math.round(week.reduce((a, b) => a + b.value, 0) / 7)}m
                </Txt>
                <Txt size={11.5} color={colors.textMuted}>
                  daily average
                </Txt>
              </View>
            </View>
            <BarChart data={week} goal={goal} />
          </Card>
        </View>

        <View style={{ flex: 1, gap: 20 }}>
          <Card>
            <SectionHeader title="Upcoming live tests" icon="radio-outline" action="All tests" onAction={() => nav.navigate('Tests')} />
            <View style={{ gap: 12 }}>
              {liveTests.map((t) => (
                <View key={t.id} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 13, gap: 9 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
                    <Txt size={11.5} weight="800" color={colors.danger}>
                      {t.liveAt}
                    </Txt>
                    <Tag label={t.kind} color={colors.blue} />
                  </View>
                  <Txt size={14} weight="700" numberOfLines={2}>
                    {t.title}
                  </Txt>
                  <Txt size={11.5} color={colors.textMuted}>
                    {t.questions.length} questions · {t.durationMin} min · {t.attempts.toLocaleString('en-IN')} enrolled
                  </Txt>
                  <Button label="Enter test" icon="arrow-forward" size="sm" onPress={() => nav.navigate('TestPlayer', { testId: t.id })} />
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Fresh in your library" icon="library-outline" action="See all" onAction={() => nav.navigate('Library')} />
            <View style={{ gap: 14 }}>
              {recent.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => (r.type === 'book' ? nav.navigate('BookReader', { resourceId: r.id }) : nav.navigate('NoteEditor', { resourceId: r.id }))}
                  style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={r.type === 'book' ? 'book-outline' : r.type === 'pyq-set' ? 'albums-outline' : 'document-text-outline'} size={18} color={colors.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={13} weight="700" numberOfLines={1}>
                      {r.title}
                    </Txt>
                    <Txt size={11.5} color={colors.textMuted}>
                      {r.subject} · {r.minutes} min · ★ {r.rating}
                    </Txt>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Current affairs" icon="newspaper-outline" action="Open" onAction={() => nav.navigate('CurrentAffairs')} />
            <View style={{ gap: 12 }}>
              {CURRENT_AFFAIRS.slice(0, 3).map((c) => (
                <Pressable key={c.id} onPress={() => nav.navigate('CurrentAffairs')} style={({ pressed }) => ({ gap: 5, opacity: pressed ? 0.75 : 1 })}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Tag label={c.category} color={colors.teal} />
                    <Txt size={11} color={colors.textFaint}>
                      {c.date}
                    </Txt>
                  </View>
                  <Txt size={13} weight="700" numberOfLines={2}>
                    {c.title}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Switch focus" icon="swap-horizontal-outline" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EXAMS.map((e) => (
                <Chip
                  key={e.id}
                  label={e.short}
                  tone={e.color}
                  active={e.id === exam.id}
                  onPress={() => nav.navigate('Library', { exam: e.id })}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>
    </Shell>
  );
}
