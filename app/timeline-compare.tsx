import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHistoryData } from '@/components/history-context';

export default function TimelineCompareScreen() {
  const { timelines } = useHistoryData();
  const [selectedTimeline1Id, setSelectedTimeline1Id] = useState<string | null>(null);
  const [selectedTimeline2Id, setSelectedTimeline2Id] = useState<string | null>(null);
  const [openSelector, setOpenSelector] = useState<'timeline1' | 'timeline2' | null>(null);

  const timeline1 = timelines.find((t) => t.id === selectedTimeline1Id);
  const timeline2 = timelines.find((t) => t.id === selectedTimeline2Id);

  const calculateCommonYears = () => {
    if (!timeline1 || !timeline2) return [];
    const years1 = new Set(timeline1.items.map((item) => item.year));
    return timeline2.items.filter((item) => years1.has(item.year)).map((item) => item.year);
  };

  const commonYears = calculateCommonYears();

  const alignedYearRows = useMemo(() => {
    if (!timeline1 || !timeline2) {
      return [];
    }

    const allYears = Array.from(
      new Set([...timeline1.items.map((item) => item.year), ...timeline2.items.map((item) => item.year)])
    ).sort((a, b) => Number(a) - Number(b));

    return allYears.map((year) => ({
      year,
      leftEvents: timeline1.items.filter((item) => item.year === year),
      rightEvents: timeline2.items.filter((item) => item.year === year),
    }));
  }, [timeline1, timeline2]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>时间轴对比</Text>

        <View style={styles.selectorsRow}>
          <View style={[styles.selectorColumn, openSelector === 'timeline1' && styles.selectorColumnOpen]}>
            <Text style={styles.selectorLabel}>时间轴 1</Text>
            <View style={styles.selectorDropdownWrapper}>
              <TouchableOpacity
                style={styles.selectorTrigger}
                activeOpacity={0.85}
                onPress={() => setOpenSelector(openSelector === 'timeline1' ? null : 'timeline1')}>
                <Text style={styles.selectorTriggerText}>{timeline1?.name || '请选择时间轴'}</Text>
                <Text style={styles.selectorArrowText}>{openSelector === 'timeline1' ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {openSelector === 'timeline1' ? (
                <FlatList
                  style={styles.selectorDropdownList}
                  data={timelines}
                  keyExtractor={(timeline) => timeline.id}
                  renderItem={({ item: timeline }) => (
                    <TouchableOpacity
                      style={[
                        styles.selectorItem,
                        selectedTimeline1Id === timeline.id && styles.selectorItemSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedTimeline1Id(timeline.id);
                        setOpenSelector(null);
                      }}>
                      <Text
                        style={[
                          styles.selectorItemText,
                          selectedTimeline1Id === timeline.id && styles.selectorItemTextSelected,
                        ]}>
                        {timeline.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  scrollEnabled
                />
              ) : null}
            </View>
          </View>

          <View style={[styles.selectorColumn, openSelector === 'timeline2' && styles.selectorColumnOpen]}>
            <Text style={styles.selectorLabel}>时间轴 2</Text>
            <View style={styles.selectorDropdownWrapper}>
              <TouchableOpacity
                style={styles.selectorTrigger}
                activeOpacity={0.85}
                onPress={() => setOpenSelector(openSelector === 'timeline2' ? null : 'timeline2')}>
                <Text style={styles.selectorTriggerText}>{timeline2?.name || '请选择时间轴'}</Text>
                <Text style={styles.selectorArrowText}>{openSelector === 'timeline2' ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {openSelector === 'timeline2' ? (
                <FlatList
                  style={styles.selectorDropdownList}
                  data={timelines}
                  keyExtractor={(timeline) => timeline.id}
                  renderItem={({ item: timeline }) => (
                    <TouchableOpacity
                      style={[
                        styles.selectorItem,
                        selectedTimeline2Id === timeline.id && styles.selectorItemSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedTimeline2Id(timeline.id);
                        setOpenSelector(null);
                      }}>
                      <Text
                        style={[
                          styles.selectorItemText,
                          selectedTimeline2Id === timeline.id && styles.selectorItemTextSelected,
                        ]}>
                        {timeline.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  scrollEnabled
                />
              ) : null}
            </View>
          </View>
        </View>

        {openSelector ? (
          <Pressable style={styles.screenOverlay} onPress={() => setOpenSelector(null)} />
        ) : null}

        {timeline1 && timeline2 ? (
          <ScrollView style={styles.comparisonContent} showsVerticalScrollIndicator={false}>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>并行时间轴对照</Text>

              <View style={styles.parallelHeaderRow}>
                <Text style={styles.parallelHeaderLabel}>{timeline1.name}</Text>
                <Text style={styles.parallelHeaderCenter}>年份轴</Text>
                <Text style={styles.parallelHeaderLabel}>{timeline2.name}</Text>
              </View>

              {alignedYearRows.map((row) => (
                <View key={row.year} style={styles.parallelRow}>
                  <View style={styles.parallelEventsColumn}>
                    {row.leftEvents.length > 0 ? (
                      row.leftEvents.map((item) => (
                        <Text key={item.id} style={styles.parallelEventTextLeft}>
                          {item.title}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.parallelEmptyText}>-</Text>
                    )}
                  </View>

                  <View style={styles.parallelAxisColumn}>
                    <View style={styles.parallelAxisLine} />
                    <View style={styles.parallelAxisDot} />
                    <Text style={styles.parallelYearText}>{row.year}</Text>
                  </View>

                  <View style={styles.parallelEventsColumn}>
                    {row.rightEvents.length > 0 ? (
                      row.rightEvents.map((item) => (
                        <Text key={item.id} style={styles.parallelEventTextRight}>
                          {item.title}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.parallelEmptyText}>-</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>基本信息</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>时间轴 1 名称:</Text>
                <Text style={styles.infoValue}>{timeline1.name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>事件数量:</Text>
                <Text style={styles.infoValue}>{timeline1.items.length}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>时间轴 2 名称:</Text>
                <Text style={styles.infoValue}>{timeline2.name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>事件数量:</Text>
                <Text style={styles.infoValue}>{timeline2.items.length}</Text>
              </View>
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>关键数据</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>共同年份:</Text>
                <Text style={styles.infoValue}>{commonYears.length}</Text>
              </View>

              {commonYears.length > 0 && (
                <View style={styles.yearsList}>
                  <Text style={styles.yearsListLabel}>共同年份: {commonYears.join('、')}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>独有事件 (时间轴 1):</Text>
                <Text style={styles.infoValue}>
                  {timeline1.items.filter((item) => !commonYears.includes(item.year)).length}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>独有事件 (时间轴 2):</Text>
                <Text style={styles.infoValue}>
                  {timeline2.items.filter((item) => !commonYears.includes(item.year)).length}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>时间跨度 (时间轴 1):</Text>
                <Text style={styles.infoValue}>
                  {timeline1.items.length > 0
                    ? `${Math.min(...timeline1.items.map((i) => Number(i.year)))} - ${Math.max(...timeline1.items.map((i) => Number(i.year)))}`
                    : '无'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>时间跨度 (时间轴 2):</Text>
                <Text style={styles.infoValue}>
                  {timeline2.items.length > 0
                    ? `${Math.min(...timeline2.items.map((i) => Number(i.year)))} - ${Math.max(...timeline2.items.map((i) => Number(i.year)))}`
                    : '无'}
                </Text>
              </View>
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>事件详情（共同年份）</Text>

              {commonYears.length > 0 ? (
                commonYears.map((year) => (
                  <View key={year} style={styles.yearEventBlock}>
                    <Text style={styles.yearEventTitle}>• {year} 年</Text>

                    <View style={styles.eventSubBlock}>
                      <Text style={styles.eventSourceLabel}>时间轴 1: {timeline1.name}</Text>
                      {timeline1.items
                        .filter((item) => item.year === year)
                        .map((item) => (
                          <Text key={item.id} style={styles.eventText}>
                            - {item.title}
                          </Text>
                        ))}
                    </View>

                    <View style={styles.eventSubBlock}>
                      <Text style={styles.eventSourceLabel}>时间轴 2: {timeline2.name}</Text>
                      {timeline2.items
                        .filter((item) => item.year === year)
                        .map((item) => (
                          <Text key={item.id} style={styles.eventText}>
                            - {item.title}
                          </Text>
                        ))}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>没有共同年份的事件</Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>请选择两条不同的时间轴进行对比</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#C8A76B',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  selectorColumn: {
    flex: 1,
    zIndex: 5,
  },
  selectorColumnOpen: {
    zIndex: 50,
    elevation: 20,
  },
  selectorLabel: {
    color: '#C8A76B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectorDropdownWrapper: {
    position: 'relative',
  },
  selectorTrigger: {
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorTriggerText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  selectorArrowText: {
    color: '#A8A8A8',
    fontSize: 11,
    fontWeight: '700',
  },
  selectorDropdownList: {
    marginTop: 6,
    maxHeight: 180,
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  selectorItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  selectorItemSelected: {
    backgroundColor: '#2F2F2F',
    borderLeftWidth: 3,
    borderLeftColor: '#C8A76B',
    paddingLeft: 7,
  },
  selectorItemText: {
    color: '#A8A8A8',
    fontSize: 13,
  },
  selectorItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  parallelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  parallelHeaderLabel: {
    flex: 1,
    color: '#C8A76B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  parallelHeaderCenter: {
    width: 76,
    color: '#A8A8A8',
    fontSize: 11,
    textAlign: 'center',
  },
  parallelRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
    minHeight: 56,
  },
  parallelEventsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  parallelEventTextLeft: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 2,
  },
  parallelEventTextRight: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
    marginBottom: 2,
  },
  parallelEmptyText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
  parallelAxisColumn: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  parallelAxisLine: {
    position: 'absolute',
    width: 2,
    top: -6,
    bottom: -6,
    backgroundColor: '#4E4E4E',
  },
  parallelAxisDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C8A76B',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  parallelYearText: {
    color: '#F2E0BD',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  comparisonContent: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#808080',
    fontSize: 14,
  },
  comparisonCard: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  comparisonTitle: {
    color: '#C8A76B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#A8A8A8',
    fontSize: 12,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 8,
  },
  yearsList: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  yearsListLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 18,
  },
  yearEventBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  yearEventTitle: {
    color: '#F2E0BD',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  eventSubBlock: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  eventSourceLabel: {
    color: '#C8A76B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventText: {
    color: '#D9D9D9',
    fontSize: 11,
    lineHeight: 18,
  },
  emptyText: {
    color: '#808080',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 12,
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
