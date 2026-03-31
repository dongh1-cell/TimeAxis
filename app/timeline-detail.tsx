import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimelineItem, useHistoryData } from '@/components/history-context';

export default function TimelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timelines, currentTimeline, selectTimeline, saveTimelineItem, deleteTimelineItem } =
    useHistoryData();

  // 如果传了 id，确保选中该时间轴
  React.useEffect(() => {
    if (id && id !== currentTimeline?.id) {
      selectTimeline(id);
    }
  }, [id]);

  const timeline = currentTimeline;
  const timelineItems = timeline?.items || [];
  const [isListReady, setIsListReady] = useState(false);

  React.useEffect(() => {
    setIsListReady(false);
    const task = InteractionManager.runAfterInteractions(() => {
      setIsListReady(true);
    });

    return () => {
      task.cancel();
    };
  }, [timeline?.id, timelineItems.length]);

  // 编辑态控制：null 表示新增模式。
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  // 表单默认收起，通过按钮展开。
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formYear, setFormYear] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [openItemMenuId, setOpenItemMenuId] = useState<string | null>(null);

  const handleStartEditTimelineItem = (item: TimelineItem) => {
    setIsEditorOpen(true);
    setEditingTimelineId(item.id);
    setFormYear(item.year);
    setFormTitle(item.title);
    setFormDesc(item.desc);
  };

  const handleCancelEditTimelineItem = () => {
    setEditingTimelineId(null);
    setFormYear('');
    setFormTitle('');
    setFormDesc('');
  };

  const handleCancelEditAndClose = () => {
    handleCancelEditTimelineItem();
    setIsEditorOpen(false);
  };

  const handleToggleEditor = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      return;
    }

    // 通过“展开新增历史事件”打开时，强制回到新增态并清空上次编辑内容。
    handleCancelEditTimelineItem();
    setIsEditorOpen(true);
  };

  const handleYearChange = (value: string) => {
    // 年份只允许输入数字字符。
    setFormYear(value.replace(/\D/g, ''));
  };

  const handleSaveTimelineItem = () => {
    saveTimelineItem(
      {
        year: formYear,
        title: formTitle,
        desc: formDesc,
      },
      editingTimelineId
    );

    handleCancelEditTimelineItem();
    setIsEditorOpen(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderTimelineItem = ({ item }: { item: TimelineItem }) => {
    const isMenuOpen = openItemMenuId === item.id;

    return (
      <View style={[styles.timelineRow, isMenuOpen && styles.timelineRowMenuOpen]}>
        <View style={styles.yearColumn}>
          <Text style={styles.yearText}>{item.year}</Text>
        </View>

        <View style={styles.axisColumn}>
          <View style={styles.axisLine} />
          <View style={styles.axisDot} />
        </View>

        <View style={styles.cardColumn}>
          <View style={styles.eventCard}>
            <View style={styles.eventHeaderRow}>
              <View style={styles.eventTextContainer}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDesc}>{item.desc}</Text>
              </View>

              <View style={styles.itemMenuContainer}>
                <TouchableOpacity
                  style={styles.itemMenuButton}
                  activeOpacity={0.85}
                  onPress={() => setOpenItemMenuId(isMenuOpen ? null : item.id)}>
                  <Text style={styles.itemMenuButtonText}>⋯</Text>
                </TouchableOpacity>

                {isMenuOpen && (
                  <View style={styles.itemDropdownMenu}>
                    <TouchableOpacity
                      style={styles.itemDropdownItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        setOpenItemMenuId(null);
                        handleStartEditTimelineItem(item);
                      }}>
                      <Text style={styles.itemDropdownItemText}>编辑</Text>
                    </TouchableOpacity>
                    <View style={styles.dropdownDivider} />
                    <TouchableOpacity
                      style={styles.itemDropdownItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        setOpenItemMenuId(null);
                        deleteTimelineItem(item.id);
                      }}>
                      <Text style={[styles.itemDropdownItemText, styles.deleteOptionText]}>删除</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={() => setOpenItemMenuId(null)}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>← 返回</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{timeline?.name || '时间轴详情'}</Text>
            <View style={{ width: 60 }} />
          </View>

        <TouchableOpacity
          style={styles.editorToggleButton}
          activeOpacity={0.85}
          onPress={handleToggleEditor}>
          <Text style={styles.editorToggleButtonText}>
            {isEditorOpen
              ? editingTimelineId
                ? '收起编辑面板'
                : '收起新增面板'
              : '展开新增历史事件'}
          </Text>
        </TouchableOpacity>

        {isEditorOpen ? (
          <View style={styles.editorCard}>
            <Text style={styles.editorTitle}>{editingTimelineId ? '编辑历史事件' : '新增历史事件'}</Text>

            <TextInput
              value={formYear}
              onChangeText={handleYearChange}
              placeholder="年份，例如 1914"
              placeholderTextColor="#8F8F8F"
              style={styles.input}
              keyboardType="number-pad"
            />
            <TextInput
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="事件标题"
              placeholderTextColor="#8F8F8F"
              style={styles.input}
            />
            <TextInput
              value={formDesc}
              onChangeText={setFormDesc}
              placeholder="事件描述"
              placeholderTextColor="#8F8F8F"
              style={[styles.input, styles.inputDesc]}
              multiline
            />

            <View style={styles.editorButtonRow}>
              <TouchableOpacity
                style={styles.editorPrimaryButton}
                activeOpacity={0.85}
                onPress={handleSaveTimelineItem}>
                <Text style={styles.editorPrimaryButtonText}>
                  {editingTimelineId ? '保存修改' : '添加到时间轴'}
                </Text>
              </TouchableOpacity>

              {editingTimelineId ? (
                <TouchableOpacity
                  style={styles.editorGhostButton}
                  activeOpacity={0.85}
                  onPress={handleCancelEditAndClose}>
                  <Text style={styles.editorGhostButtonText}>取消编辑</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {!isListReady ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>正在加载时间轴内容...</Text>
          </View>
        ) : timelineItems.length > 0 ? (
          <FlatList
            style={styles.timelineList}
            data={timelineItems}
            keyExtractor={(item) => item.id}
            renderItem={renderTimelineItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.timelineListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>还没有添加任何事件</Text>
          </View>
        )}

          <TouchableOpacity
            style={styles.jumpButton}
            activeOpacity={0.85}
            onPress={() => router.push(`/quiz?timelineId=${timeline?.id}`)}>
            <Text style={styles.jumpButtonText}>进入互动知识测验</Text>
          </TouchableOpacity>

          {isEditorOpen ? (
            <Pressable
              style={styles.screenOverlay}
              onPress={() => {
                setIsEditorOpen(false);
              }}
            />
          ) : null}
        </View>
      </TouchableWithoutFeedback>
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
    paddingBottom: 10,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#C8A76B',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  editorToggleButton: {
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
    marginBottom: 10,
  },
  editorToggleButtonText: {
    color: '#F2E0BD',
    fontSize: 14,
    fontWeight: '700',
  },
  editorCard: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    position: 'relative',
    zIndex: 3500,
    elevation: 35,
  },
  editorTitle: {
    color: '#F2E0BD',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#3F3F3F',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    fontSize: 13,
  },
  inputDesc: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  editorButtonRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 8,
  },
  editorPrimaryButton: {
    flex: 1,
    backgroundColor: '#8B6B34',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editorGhostButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
  },
  editorGhostButtonText: {
    color: '#F2E0BD',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineListContent: {
    paddingBottom: 8,
  },
  timelineList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#808080',
    fontSize: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 96,
    marginBottom: 10,
    position: 'relative',
  },
  timelineRowMenuOpen: {
    zIndex: 3000,
    elevation: 30,
  },
  yearColumn: {
    width: 64,
    alignItems: 'flex-end',
    paddingRight: 8,
    justifyContent: 'center',
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  axisColumn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  axisLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: '#4E4E4E',
  },
  axisDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C8A76B',
    borderWidth: 2,
    borderColor: '#1E1E1E',
    zIndex: 2,
  },
  cardColumn: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  eventCard: {
    backgroundColor: '#292929',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  eventDesc: {
    color: '#D9D9D9',
    fontSize: 13,
    lineHeight: 20,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventTextContainer: {
    flex: 1,
  },
  itemMenuContainer: {
    position: 'relative',
    zIndex: 4000,
  },
  itemMenuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
    marginTop: -2,
  },
  itemMenuButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDropdownMenu: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#2F2F2F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
    zIndex: 1001,
    elevation: 40,
  },
  itemDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#3A3A3A',
  },
  itemDropdownItemText: {
    color: '#F2E0BD',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteOptionText: {
    color: '#EF5350',
  },
  jumpButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#242424',
  },
  jumpButtonText: {
    color: '#F2E0BD',
    fontSize: 14,
    fontWeight: '700',
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
});
