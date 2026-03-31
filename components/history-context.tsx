import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

const initialTimelinesSeed: Timeline[] = [
  {
    id: 'timeline-china-modern',
    name: '中国近代变革与启蒙 (1860s-1910s)',
    createdAt: Date.now(),
    items: [
      {
        id: 'c1',
        year: '1861',
        title: '总理衙门设立',
        desc: '清政府设立总理各国事务衙门，标志着洋务运动正式开启，开始引进西方技术。',
      },
      {
        id: 'c2',
        year: '1872',
        title: '留美幼童计划启动',
        desc: '清政府首次派遣120名幼童赴美留学，这是中国最早的官派留学生。',
      },
      {
        id: 'c3',
        year: '1877',
        title: '轮船招商局扩张',
        desc: '洋务派创办的轮船招商局成功收购美资旗昌轮船公司，打破了外资在近代中国航运的垄断。',
      },
      {
        id: 'c4',
        year: '1888',
        title: '北洋水师正式成军',
        desc: '《北洋海军章程》颁布，这支近代化舰队在当时被认为是亚洲最强大的海军力量。',
      },
      {
        id: 'c5',
        year: '1894',
        title: '甲午中日战争爆发',
        desc: '中日两国爆发全面战争，北洋水师全军覆没，宣告了三十年洋务运动的彻底破产。',
      },
      {
        id: 'c6',
        year: '1898',
        title: '戊戌变法 (百日维新)',
        desc: '光绪帝试图在政治、教育等领域推行自上而下的制度维新，但遭到保守派强烈反对而失败。',
      },
      {
        id: 'c7',
        year: '1900',
        title: '义和团与八国联军侵华',
        desc: '以“扶清灭洋”为口号的义和团运动达到高潮，随后八国联军攻陷北京，中国面临空前危机。',
      },
      {
        id: 'c8',
        year: '1905',
        title: '废除科举制度',
        desc: '清政府宣布自次年起停止科举考试，这座存在了一千三百多年的传统人才选拔制度正式终结。',
      },
      {
        id: 'c9',
        year: '1911',
        title: '辛亥革命与清华学堂开学',
        desc: '武昌起义爆发，推翻清朝统治；同年，利用美国退还的部分庚子赔款建立的清华学堂正式开学。',
      },
      {
        id: 'c10',
        year: '1919',
        title: '五四运动',
        desc: '巴黎和会外交失败引发北京学生大游行，迅速演变为全国性的爱国运动，标志着新民主主义革命的开端。',
      },
    ],
  },
  {
    id: 'timeline-us-gilded',
    name: '美国内战重建与镀金时代 (1860s-1910s)',
    createdAt: Date.now() + 1,
    items: [
      {
        id: 'u1',
        year: '1861',
        title: '南北战争爆发',
        desc: '南方各蓄奴州宣布脱离联邦，内战正式打响，国家面临分裂危机。',
      },
      {
        id: 'u2',
        year: '1862',
        title: '《宅地法》通过',
        desc: '林肯签署法案，加速了西部开发，但也进一步加剧了白人定居者与原住民之间的土地冲突。',
      },
      {
        id: 'u3',
        year: '1865',
        title: '第十三条修正案通过',
        desc: '内战结束，美国宪法正式废除奴隶制，国家进入漫长的“重建时期”，处理复杂的种族遗留问题。',
      },
      {
        id: 'u4',
        year: '1869',
        title: '横贯大陆铁路贯通',
        desc: '太平洋铁路在犹他州合龙，极大促进了美国经济一体化，其中华工为西段铁路建设做出了巨大贡献。',
      },
      {
        id: 'u5',
        year: '1876',
        title: '贝尔发明电话',
        desc: '亚历山大·格拉汉姆·贝尔获得电话专利，美国正式迎来第二次工业革命的通讯技术狂飙期。',
      },
      {
        id: 'u6',
        year: '1882',
        title: '《排华法案》通过',
        desc: '美国国会通过法案，绝对禁止华工入境十年，这是美国历史上首个针对特定族裔的限制移民法律。',
      },
      {
        id: 'u7',
        year: '1890',
        title: '伤膝河大屠杀',
        desc: '美军在南达科他州屠杀近300名拉科塔印第安人，这标志着美国针对原住民的“印第安战争”基本结束。',
      },
      {
        id: 'u8',
        year: '1898',
        title: '美西战争',
        desc: '美国击败西班牙，夺取菲律宾、波多黎各等地，标志着美国确立全球强权地位并走向海外扩张。',
      },
      {
        id: 'u9',
        year: '1906',
        title: '《纯净食品和药品法》',
        desc: '在揭露食品加工黑幕的新闻报道推动下，国会通过该法案，标志着联邦政府开始系统性监管公共健康。',
      },
      {
        id: 'u10',
        year: '1911',
        title: '标准石油公司解体',
        desc: '最高法院裁定洛克菲勒的石油帝国构成非法垄断并强制拆分，这是规范资本扩张的标志性事件。',
      },
      {
        id: 'u11',
        year: '1919',
        title: '第十八条修正案（禁酒令）',
        desc: '美国宪法正式禁止制造、售卖和运输酒精饮料，深刻影响了20年代的美国社会文化与治安。',
      },
    ],
  },
];

const sortTimelineByYear = (items: TimelineItem[]) => {
  return [...items].sort((a, b) => Number(a.year) - Number(b.year));
};

const HISTORY_STORAGE_KEY = 'history_data_v1';

type PersistedHistoryData = {
  timelines: Timeline[];
  currentTimelineId: string | null;
};

const normalizeTimelines = (timelines: Timeline[]) =>
  timelines.map((timeline) => ({
    ...timeline,
    items: sortTimelineByYear(timeline.items ?? []),
  }));

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const initialTimelines: Timeline[] = initialTimelinesSeed.map((timeline) => ({
    ...timeline,
    items: sortTimelineByYear(timeline.items),
  }));

  const [timelines, setTimelines] = useState<Timeline[]>(initialTimelines);
  const [currentTimelineId, setCurrentTimelineId] = useState<string | null>('timeline-china-modern');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

        if (!raw || !isMounted) {
          return;
        }

        const parsed = JSON.parse(raw) as PersistedHistoryData;
        const restoredTimelines = Array.isArray(parsed?.timelines)
          ? normalizeTimelines(parsed.timelines)
          : [];
        const restoredCurrentTimelineId = parsed?.currentTimelineId ?? null;

        if (restoredTimelines.length > 0) {
          const hasCurrent = restoredTimelines.some((t) => t.id === restoredCurrentTimelineId);
          setTimelines(restoredTimelines);
          setCurrentTimelineId(hasCurrent ? restoredCurrentTimelineId : restoredTimelines[0].id);
        }
      } catch {
        // 持久化数据损坏时回退到内置种子数据
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const payload: PersistedHistoryData = {
      timelines,
      currentTimelineId,
    };

    AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // 存储失败不影响页面现有功能
    });
  }, [timelines, currentTimelineId, isHydrated]);

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
