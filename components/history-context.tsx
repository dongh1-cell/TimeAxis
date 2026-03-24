import React, { createContext, useContext, useMemo, useState } from 'react';

export type TimelineItem = {
  id: string;
  year: string;
  title: string;
  desc: string;
};

export type Timeline = {
  id: string;
  name: string;
  items: TimelineItem[];
  createdAt: number;
};

type SaveTimelineItemPayload = {
  year: string;
  title: string;
  desc: string;
};

type HistoryContextValue = {
  timelines: Timeline[];
  currentTimelineId: string | null;
  currentTimeline: Timeline | null;

  // 时间轴管理
  createTimeline: (name: string) => void;
  deleteTimeline: (id: string) => void;
  renameTimeline: (id: string, newName: string) => void;
  selectTimeline: (id: string) => void;

  // 时间线条目管理（作用于当前时间轴）
  saveTimelineItem: (payload: SaveTimelineItemPayload, editingId?: string | null) => void;
  deleteTimelineItem: (itemId: string) => void;
};

const initialTimelineData: TimelineItem[] = [
  {
    id: '1',
    year: '1620',
    title: '清教徒与万帕诺亚格人',
    desc: '早期欧洲定居者与北美原住民的文化交汇与冲突。',
  },
  {
    id: '2',
    year: '1830',
    title: '血泪之路 (Trail of Tears)',
    desc: '印第安人被迫西迁的沉重历史印记。',
  },
  {
    id: '3',
    year: '1861',
    title: '美国内战爆发',
    desc: '南北方在经济制度与联邦权力上的根本冲突走向战争。',
  },
  {
    id: '4',
    year: '1865',
    title: '内战结束与重建',
    desc: '国家重新统一及后续的社会重建时代。',
  },
];

const sortTimelineByYear = (items: TimelineItem[]) => {
  return [...items].sort((a, b) => Number(a.year) - Number(b.year));
};

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const initialTimelines: Timeline[] = [
    {
      id: 'default-1',
      name: '美国历史',
      items: sortTimelineByYear(initialTimelineData),
      createdAt: Date.now(),
    },
  ];

  const [timelines, setTimelines] = useState<Timeline[]>(initialTimelines);
  const [currentTimelineId, setCurrentTimelineId] = useState<string | null>('default-1');

  const currentTimeline = useMemo(
    () => timelines.find((t) => t.id === currentTimelineId) || null,
    [timelines, currentTimelineId]
  );

  const createTimeline = (name: string) => {
    const newTimeline: Timeline = {
      id: String(Date.now()),
      name,
      items: [],
      createdAt: Date.now(),
    };

    setTimelines((prev) => [...prev, newTimeline]);
    setCurrentTimelineId(newTimeline.id);
  };

  const deleteTimeline = (id: string) => {
    setTimelines((prev) => prev.filter((t) => t.id !== id));

    if (currentTimelineId === id) {
      const remaining = timelines.filter((t) => t.id !== id);
      setCurrentTimelineId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const renameTimeline = (id: string, newName: string) => {
    setTimelines((prev) => prev.map((t) => (t.id === id ? { ...t, name: newName } : t)));
  };

  const selectTimeline = (id: string) => {
    setCurrentTimelineId(id);
  };

  const saveTimelineItem = (payload: SaveTimelineItemPayload, editingId?: string | null) => {
    if (!currentTimelineId) {
      return;
    }

    const year = payload.year.trim();
    const title = payload.title.trim();
    const desc = payload.desc.trim() || '（暂无描述）';

    if (!year || !title) {
      return;
    }

    setTimelines((prev) =>
      prev.map((timeline) => {
        if (timeline.id !== currentTimelineId) {
          return timeline;
        }

        if (editingId) {
          return {
            ...timeline,
            items: sortTimelineByYear(
              timeline.items.map((item) =>
                item.id === editingId ? { ...item, year, title, desc } : item
              )
            ),
          };
        }

        return {
          ...timeline,
          items: sortTimelineByYear([
            ...timeline.items,
            {
              id: String(Date.now()),
              year,
              title,
              desc,
            },
          ]),
        };
      })
    );
  };

  const deleteTimelineItem = (itemId: string) => {
    if (!currentTimelineId) {
      return;
    }

    setTimelines((prev) =>
      prev.map((timeline) => {
        if (timeline.id !== currentTimelineId) {
          return timeline;
        }

        return {
          ...timeline,
          items: timeline.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      timelines,
      currentTimelineId,
      currentTimeline,
      createTimeline,
      deleteTimeline,
      renameTimeline,
      selectTimeline,
      saveTimelineItem,
      deleteTimelineItem,
    }),
    [timelines, currentTimelineId, currentTimeline]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistoryData() {
  const context = useContext(HistoryContext);

  if (!context) {
    throw new Error('useHistoryData 必须在 HistoryProvider 内使用');
  }

  return context;
}
