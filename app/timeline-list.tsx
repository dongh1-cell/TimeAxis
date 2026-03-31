import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHistoryData } from '@/components/history-context';

type TimelineListItem = {
  id: string;
  name: string;
};

export default function TimelineListScreen() {
  const { timelines, currentTimelineId, selectTimeline, createTimeline, deleteTimeline } =
    useHistoryData();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleCreateTimeline = () => {
    const name = newTimelineName.trim();
    if (!name) {
      return;
    }

    createTimeline(name);
    setNewTimelineName('');
    setShowCreateForm(false);
  };

  const renderTimelineItem = ({ item }: { item: TimelineListItem }) => {
    const isSelected = item.id === currentTimelineId;
    const isMenuOpen = openMenuId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.timelineItemCard,
          isSelected && styles.timelineItemSelected,
          isMenuOpen && styles.timelineItemCardMenuOpen,
        ]}
        activeOpacity={0.85}
        onPress={() => {
          selectTimeline(item.id);
          router.push(`/timeline-detail?id=${item.id}`);
        }}>
        <View style={styles.timelineItemContent}>
          <Text style={styles.timelineItemName}>{item.name}</Text>
          <Text style={styles.timelineItemSubtitle}>
            {timelines.find((t) => t.id === item.id)?.items.length || 0} 个事件
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation();
              setOpenMenuId(isMenuOpen ? null : item.id);
            }}>
            <Text style={styles.menuButtonText}>⋯</Text>
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                activeOpacity={0.85}
                onPress={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  deleteTimeline(item.id);
                }}>
                <Text style={styles.dropdownItemText}>删除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const data: TimelineListItem[] = timelines.map((t) => ({ id: t.id, name: t.name }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>时间轴管理</Text>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => setShowCreateForm(!showCreateForm)}>
          <Text style={styles.createButtonText}>
            {showCreateForm ? '取消' : '新建时间轴'}
          </Text>
        </TouchableOpacity>

        {showCreateForm ? (
          <View style={styles.createForm}>
            <TextInput
              value={newTimelineName}
              onChangeText={setNewTimelineName}
              placeholder="时间轴名称，例如 中国历史"
              placeholderTextColor="#8F8F8F"
              style={styles.input}
            />

            <View style={styles.formButtonRow}>
              <TouchableOpacity
                style={styles.formPrimaryButton}
                activeOpacity={0.85}
                onPress={handleCreateTimeline}>
                <Text style={styles.formButtonText}>创建</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formCancelButton}
                activeOpacity={0.85}
                onPress={() => setShowCreateForm(false)}>
                <Text style={styles.formButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <FlatList
          style={styles.listContainer}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {openMenuId || showCreateForm ? (
          <Pressable
            style={styles.screenOverlay}
            onPress={() => {
              setOpenMenuId(null);
              setShowCreateForm(false);
            }}
          />
        ) : null}

        <TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.85}
          onPress={() => router.push('/timeline-compare')}>
          <Text style={styles.bottomButtonText}>对比两条时间轴</Text>
        </TouchableOpacity>
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
    paddingBottom: 10,
    paddingTop: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  createButton: {
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#F2E0BD',
    fontSize: 14,
    fontWeight: '700',
  },
  createForm: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    position: 'relative',
    zIndex: 3500,
    elevation: 35,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#3F3F3F',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    fontSize: 13,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formPrimaryButton: {
    flex: 1,
    backgroundColor: '#8B6B34',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
  },
  formButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  timelineItemCard: {
    backgroundColor: '#292929',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    position: 'relative',
  },
  timelineItemCardMenuOpen: {
    zIndex: 3000,
    elevation: 30,
  },
  timelineItemSelected: {
    borderColor: '#C8A76B',
    backgroundColor: '#2F2F2F',
  },
  timelineItemContent: {
    flex: 1,
  },
  timelineItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineItemSubtitle: {
    color: '#A8A8A8',
    fontSize: 12,
  },
  menuContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#2F2F2F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
    zIndex: 1001,
    elevation: 40,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  dropdownItemText: {
    color: '#EF5350',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C8A76B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
  },
  bottomButtonText: {
    color: '#F2E0BD',
    fontSize: 14,
    fontWeight: '700',
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
});
