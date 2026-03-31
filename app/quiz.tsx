import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimelineItem, useHistoryData } from '@/components/history-context';

type QuizOption = {
  key: string;
  label: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  difficulty: Difficulty;
  type: QuestionType;
};

type QuestionType = 'year-to-title' | 'title-to-year' | 'title-to-desc' | 'desc-to-title';
type Difficulty = 'easy' | 'medium' | 'hard';
type QuestionTypeFilter = QuestionType | 'all';

type QuizConfig = {
  questionCount: number;
  difficulty: Difficulty;
  questionType: QuestionTypeFilter;
};

// ==================== 配置选项 ====================

const QUESTION_COUNTS = [4, 8, 12, 16, 20] as const;

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const QUESTION_TYPE_LABELS: Record<QuestionType | 'all', string> = {
  'year-to-title': '年份→标题',
  'title-to-year': '标题→年份',
  'title-to-desc': '标题→描述',
  'desc-to-title': '描述→标题',
  all: '全部',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

// ==================== 工具函数 ====================

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

const buildOptions = (
  correctAnswer: string,
  pool: string[],
  difficulty: Difficulty = 'medium'
): QuizOption[] => {
  const optionCount = difficulty === 'easy' ? 3 : 4;
  const distractors = shuffleArray(pool.filter((value) => value !== correctAnswer)).slice(
    0,
    Math.max(optionCount - 1, 1)
  );

  const mixedAnswers = shuffleArray([correctAnswer, ...distractors]);

  return mixedAnswers.map((answer, index) => ({
    key: OPTION_KEYS[index] ?? String(index + 1),
    label: `${OPTION_KEYS[index] ?? `${index + 1}`}. ${answer}`,
    isCorrect: answer === correctAnswer,
  }));
};

const buildQuizFromTimeline = (
  items: TimelineItem[],
  config: QuizConfig
): QuizQuestion[] => {
  if (items.length === 0) {
    return [];
  }

  const years = Array.from(new Set(items.map((item) => item.year)));
  const titles = Array.from(new Set(items.map((item) => item.title)));
  const descriptions = Array.from(new Set(items.map((item) => item.desc)));

  // 根据难度和类型筛选可用的题目类型
  const allowedTypes: QuestionType[] = [];
  
  if (config.difficulty === 'easy') {
    // 简单模式：只有年份↔标题
    allowedTypes.push('year-to-title', 'title-to-year');
  } else {
    // 中等和困难模式：所有4种类型
    allowedTypes.push('year-to-title', 'title-to-year', 'title-to-desc', 'desc-to-title');
  }

  // 如果指定了特定类型，进一步筛选
  let finalTypes = allowedTypes;
  if (config.questionType !== 'all') {
    finalTypes = allowedTypes.filter((t) => t === config.questionType);
  }

  if (finalTypes.length === 0) {
    // 如果没有匹配的类型，使用所有允许的类型
    finalTypes = allowedTypes;
  }

  const candidates: QuizQuestion[] = [];

  items.forEach((item) => {
    if (finalTypes.includes('year-to-title')) {
      candidates.push({
        id: `year-${item.id}`,
        question: `事件"${item.title}"发生在哪一年？`,
        options: buildOptions(item.year, years, config.difficulty),
        explanation: `正确答案是 ${item.year}。该年份对应事件"${item.title}"。`,
        difficulty: config.difficulty,
        type: 'year-to-title',
      });
    }

    if (finalTypes.includes('title-to-year')) {
      candidates.push({
        id: `title-${item.id}`,
        question: `以下哪个事件发生于 ${item.year} 年？`,
        options: buildOptions(item.title, titles, config.difficulty),
        explanation: `正确答案是"${item.title}"。它发生在 ${item.year} 年。`,
        difficulty: config.difficulty,
        type: 'title-to-year',
      });
    }

    if (finalTypes.includes('title-to-desc')) {
      candidates.push({
        id: `desc-by-title-${item.id}`,
        question: `以下哪一项描述对应事件"${item.title}"？`,
        options: buildOptions(item.desc, descriptions, config.difficulty),
        explanation: `正确答案对应"${item.title}"：${item.desc}`,
        difficulty: config.difficulty,
        type: 'title-to-desc',
      });
    }

    if (finalTypes.includes('desc-to-title')) {
      candidates.push({
        id: `title-by-desc-${item.id}`,
        question: `"${item.desc}"描述的是哪一个事件？`,
        options: buildOptions(item.title, titles, config.difficulty),
        explanation: `正确答案是"${item.title}"。该描述对应此事件。`,
        difficulty: config.difficulty,
        type: 'desc-to-title',
      });
    }
  });

  return shuffleArray(candidates).slice(0, Math.min(candidates.length, config.questionCount));
};

const extractOptionContent = (label: string): string => {
  return label.replace(/^[A-Z]\.?\s*/, '').trim();
};

const buildWrongAnalysis = (
  questionType: QuestionType,
  selectedLabel: string,
  correctLabel: string
): string => {
  if (questionType === 'year-to-title') {
    return `你把事件年份判断成了“${selectedLabel}”，但正确年份是“${correctLabel}”。建议先锁定事件发生的大致历史阶段，再在相邻年代中排除干扰项。`;
  }

  if (questionType === 'title-to-year') {
    return `你把该年份对应事件选成了“${selectedLabel}”，正确是“${correctLabel}”。建议先抓住事件关键词，再匹配其对应年代背景。`;
  }

  if (questionType === 'title-to-desc') {
    return `你选择的描述是“${selectedLabel}”，但与事件不完全匹配。正确描述是“${correctLabel}”。建议比较描述中的核心动作和历史主体。`;
  }

  return `你将该描述对应成了“${selectedLabel}”，正确事件应为“${correctLabel}”。建议先提取描述中的关键线索（人物、政策、冲突）再做匹配。`;
};

export default function QuizScreen() {
  const { timelineId } = useLocalSearchParams<{ timelineId?: string }>();
  const { timelines, currentTimeline } = useHistoryData();

  // 页面状态
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 8,
    difficulty: 'medium',
    questionType: 'all',
  });

  // 答题状态
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 确定要使用的时间轴
  const targetTimeline = useMemo(() => {
    if (timelineId) {
      return timelines.find((t) => t.id === timelineId);
    }
    return currentTimeline;
  }, [timelineId, timelines, currentTimeline]);

  const timelineItems = targetTimeline?.items || [];

  // 基于配置动态生成题目
  const quizQuestions = useMemo(
    () => buildQuizFromTimeline(timelineItems, config),
    [timelineItems, config]
  );

  const activeQuestion = quizQuestions[currentQuestion];

  const selectedOption = useMemo(
    () => activeQuestion?.options.find((option) => option.key === selectedAnswer),
    [activeQuestion, selectedAnswer]
  );

  const correctOption = useMemo(
    () => activeQuestion?.options.find((option) => option.isCorrect),
    [activeQuestion]
  );

  useEffect(() => {
    // 题库变化时回到第一题，避免索引越界。
    setCurrentQuestion(0);
    setSelectedAnswer(null);
  }, [quizQuestions]);

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // ==================== 事件处理 ====================

  const handleStartQuiz = (selectedConfig: QuizConfig) => {
    setConfig(selectedConfig);
    setIsConfiguring(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
  };

  const handleSelectOption = (optionKey: string) => {
    const picked = activeQuestion?.options.find((option) => option.key === optionKey);
    setSelectedAnswer(optionKey);

    // 答对后自动进入下一题（最后一题除外）
    if (picked?.isCorrect && currentQuestion < quizQuestions.length - 1) {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }

      autoNextTimerRef.current = setTimeout(() => {
        setCurrentQuestion((prev) => Math.min(prev + 1, quizQuestions.length - 1));
        setSelectedAnswer(null);
      }, 550);
    }
  };

  const handlePrevQuestion = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
    setSelectedAnswer(null);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      return;
    }

    setCurrentQuestion((prev) => Math.min(prev + 1, quizQuestions.length - 1));
    setSelectedAnswer(null);
  };

  const handleModifyConfig = () => {
    setIsConfiguring(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
  };

  // ==================== 渲染 ====================

  if (isConfiguring) {
    return <QuizConfigScreen config={config} onStart={handleStartQuiz} />;
  }

  const isFirstQuestion = currentQuestion === 0;
  const isLastQuestion = quizQuestions.length === 0 || currentQuestion === quizQuestions.length - 1;
  const canGoNext = !isLastQuestion && selectedAnswer !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>互动知识测验</Text>

        <ScrollView
          style={styles.quizScroll}
          contentContainerStyle={styles.quizScrollContent}
          showsVerticalScrollIndicator={false}>
          {activeQuestion ? (
            <View style={styles.quizCard}>
              {/* 题号和配置 */}
              <View style={styles.quizHeaderRow}>
                <Text style={styles.quizQuestionIndex}>
                  题目 {currentQuestion + 1} / {quizQuestions.length}
                </Text>
              </View>

              {/* 难度和类型标签 */}
              <View style={styles.tagsRow}>
                <View style={[styles.tag, styles.difficultyTag]}>
                  <Text style={styles.tagText}>{DIFFICULTY_LABELS[activeQuestion.difficulty]}</Text>
                </View>
                <View style={[styles.tag, styles.typeTag]}>
                  <Text style={styles.tagText}>{QUESTION_TYPE_LABELS[activeQuestion.type]}</Text>
                </View>
              </View>

              <Text style={styles.quizQuestionText}>{activeQuestion.question}</Text>

              {/* 选项按钮 */}
              {activeQuestion.options.map((option) => {
                const optionBackgroundColor =
                  selectedAnswer === option.key
                    ? option.isCorrect
                      ? '#2E7D32'
                      : '#B71C1C'
                    : '#2B2B2B';

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.optionButton, { backgroundColor: optionBackgroundColor }]}
                    activeOpacity={0.85}
                    disabled={selectedAnswer !== null}
                    onPress={() => handleSelectOption(option.key)}>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* 反馈和解析 */}
              {selectedOption ? (
                <View style={styles.feedbackBox}>
                  <Text
                    style={[
                      styles.feedbackResult,
                      { color: selectedOption.isCorrect ? '#66BB6A' : '#EF5350' },
                    ]}>
                    {selectedOption.isCorrect ? '回答正确' : '回答错误'}
                  </Text>
                  <Text style={styles.feedbackText}>{activeQuestion.explanation}</Text>

                  {!selectedOption.isCorrect && correctOption ? (
                    <View style={styles.errorAnalysisBox}>
                      <Text style={styles.errorAnalysisTitle}>错误分析</Text>
                      <Text style={styles.errorAnalysisLine}>
                        你的答案：{extractOptionContent(selectedOption.label)}
                      </Text>
                      <Text style={styles.errorAnalysisLine}>
                        正确答案：{extractOptionContent(correctOption.label)}
                      </Text>
                      <Text style={styles.errorAnalysisText}>
                        {buildWrongAnalysis(
                          activeQuestion.type,
                          extractOptionContent(selectedOption.label),
                          extractOptionContent(correctOption.label)
                        )}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.hintText}>点击任一选项查看结果与解析</Text>
              )}
            </View>
          ) : (
            <View style={styles.quizCard}>
              <Text style={styles.hintText}>
                当前时间轴数据不足，无法生成题目，请先新增至少一条事件。
              </Text>
            </View>
          )}

          {/* 导航按钮 */}
          <View style={styles.questionNavRow}>
            <TouchableOpacity
              style={[styles.navButton, isFirstQuestion && styles.navButtonDisabled]}
              activeOpacity={0.85}
              disabled={isFirstQuestion}
              onPress={handlePrevQuestion}>
              <Text style={styles.navButtonText}>上一题</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, (!canGoNext || isLastQuestion) && styles.navButtonDisabled]}
              activeOpacity={0.85}
              disabled={!canGoNext || isLastQuestion}
              onPress={handleNextQuestion}>
              <Text style={styles.navButtonText}>下一题</Text>
            </TouchableOpacity>
          </View>

          {!isLastQuestion && activeQuestion && !selectedAnswer ? (
            <Text style={styles.nextTipText}>请先选择答案，再进入下一题</Text>
          ) : null}

          <Text style={styles.autoNextTip}>答对后会自动跳转下一题</Text>

          {/* 操作按钮 */}
          <TouchableOpacity
            style={styles.modifyButton}
            activeOpacity={0.85}
            onPress={handleModifyConfig}>
            <Text style={styles.modifyButtonText}>修改配置</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.85}
            onPress={() => {
              setCurrentQuestion(0);
              setSelectedAnswer(null);
            }}>
            <Text style={styles.resetButtonText}>回到第一题并重新作答</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.jumpButton}
            activeOpacity={0.85}
            onPress={() => router.push('/timeline-list')}>
            <Text style={styles.jumpButtonText}>返回时间轴管理</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ==================== 配置面板组件 ====================

interface QuizConfigScreenProps {
  config: QuizConfig;
  onStart: (config: QuizConfig) => void;
}

function QuizConfigScreen({ config, onStart }: QuizConfigScreenProps) {
  const { currentTimeline } = useHistoryData();
  const [localConfig, setLocalConfig] = useState<QuizConfig>(config);

  const itemCount = currentTimeline?.items.length || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>互动知识测验</Text>

        <ScrollView
          style={styles.configScroll}
          contentContainerStyle={styles.configScrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.configCard}>
            {/* 题目数量配置 */}
            <Text style={styles.configLabel}>选择题目数量</Text>
            <View style={styles.configOptionsGrid}>
              {QUESTION_COUNTS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.configOption,
                    localConfig.questionCount === count && styles.configOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setLocalConfig((prev) => ({ ...prev, questionCount: count }))
                  }>
                  <Text
                    style={[
                      styles.configOptionText,
                      localConfig.questionCount === count && styles.configOptionTextSelected,
                    ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 难度配置 */}
            <Text style={[styles.configLabel, { marginTop: 24 }]}>选择难度</Text>
            <View style={styles.difficultyContainer}>
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyOption,
                    localConfig.difficulty === difficulty && styles.difficultyOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setLocalConfig((prev) => ({ ...prev, difficulty }))}>
                  <Text
                    style={[
                      styles.difficultyOptionText,
                      localConfig.difficulty === difficulty &&
                        styles.difficultyOptionTextSelected,
                    ]}>
                    {DIFFICULTY_LABELS[difficulty]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 难度说明 */}
            <View style={styles.difficultyDescBox}>
              <Text style={styles.difficultyDescTitle}>难度说明：</Text>
              {localConfig.difficulty === 'easy' && (
                <>
                  <Text style={styles.difficultyDescText}>• 包含题型：年份↔标题</Text>
                  <Text style={styles.difficultyDescText}>• 选项数量：3个</Text>
                </>
              )}
              {localConfig.difficulty === 'medium' && (
                <>
                  <Text style={styles.difficultyDescText}>• 包含题型：全部4种</Text>
                  <Text style={styles.difficultyDescText}>• 选项数量：4个</Text>
                </>
              )}
              {localConfig.difficulty === 'hard' && (
                <>
                  <Text style={styles.difficultyDescText}>• 包含题型：全部4种</Text>
                  <Text style={styles.difficultyDescText}>• 选项数量：4个</Text>
                  <Text style={styles.difficultyDescText}>• 干扰度：更高（更难区分选项）</Text>
                </>
              )}
            </View>

            {/* 题目类型配置 */}
            <Text style={[styles.configLabel, { marginTop: 24 }]}>选择题目类型</Text>
            <View style={styles.typeContainer}>
              {(['all', 'year-to-title', 'title-to-year', 'title-to-desc', 'desc-to-title'] as const).map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      localConfig.questionType === type && styles.typeOptionSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setLocalConfig((prev) => ({ ...prev, questionType: type }))}>
                    <Text
                      style={[
                        styles.typeOptionText,
                        localConfig.questionType === type && styles.typeOptionTextSelected,
                      ]}>
                      {QUESTION_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* 条件说明 */}
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                ℹ️ 简单难度仅包含"年份↔标题"题型，其他题型选择将被忽略
              </Text>
            </View>

            {/* 开始按钮 */}
            <TouchableOpacity
              style={[
                styles.startButton,
                itemCount < localConfig.questionCount && styles.startButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={itemCount < localConfig.questionCount}
              onPress={() => onStart(localConfig)}>
              <Text style={styles.startButtonText}>开始答题</Text>
            </TouchableOpacity>

            {itemCount < localConfig.questionCount && (
              <Text style={styles.warningText}>
                ⚠️ 数据不足：需要 {localConfig.questionCount} 条数据，但当前只有 {itemCount} 条
              </Text>
            )}

            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.85}
              onPress={() => router.push('/timeline-list')}>
              <Text style={styles.backButtonText}>返回时间轴管理</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ==================== 样式定义 ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 16,
  },

  // ==================== Quiz 答题页面 ====================

  quizScroll: {
    flex: 1,
  },
  quizScrollContent: {
    paddingBottom: 24,
  },
  quizCard: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizQuestionIndex: {
    fontSize: 14,
    color: '#C8A76B',
    fontWeight: '600',
  },

  // 标签样式
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyTag: {
    backgroundColor: '#3a3a3a',
    borderLeftWidth: 3,
    borderLeftColor: '#C8A76B',
  },
  typeTag: {
    backgroundColor: '#3a3a3a',
    borderLeftWidth: 3,
    borderLeftColor: '#8B7355',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  quizQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  feedbackBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C8A76B',
  },
  feedbackResult: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: '#DDDDDD',
    lineHeight: 20,
  },
  errorAnalysisBox: {
    marginTop: 10,
    backgroundColor: '#2A1F1F',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF5350',
  },
  errorAnalysisTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF8A80',
    marginBottom: 6,
  },
  errorAnalysisLine: {
    fontSize: 12,
    color: '#F5C6C6',
    marginBottom: 4,
  },
  errorAnalysisText: {
    fontSize: 12,
    color: '#FFD9D9',
    lineHeight: 18,
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#999999',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questionNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#C8A76B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#555555',
    opacity: 0.6,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  nextTipText: {
    fontSize: 12,
    color: '#C8A76B',
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  autoNextTip: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 16,
    textAlign: 'center',
  },

  // 操作按钮
  modifyButton: {
    backgroundColor: '#3a5a7f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#4a4a4a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jumpButton: {
    backgroundColor: '#555555',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  jumpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ==================== 配置页面 ====================

  configScroll: {
    flex: 1,
  },
  configScrollContent: {
    paddingBottom: 24,
  },
  configCard: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  // 题目数量选择网格
  configOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  configOption: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  configOptionSelected: {
    backgroundColor: '#C8A76B',
    borderColor: '#C8A76B',
  },
  configOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  configOptionTextSelected: {
    color: '#1E1E1E',
  },

  // 难度选项
  difficultyContainer: {
    gap: 10,
  },
  difficultyOption: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  difficultyOptionSelected: {
    backgroundColor: '#C8A76B',
    borderColor: '#C8A76B',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  difficultyOptionTextSelected: {
    color: '#1E1E1E',
  },

  // 难度说明框
  difficultyDescBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C8A76B',
  },
  difficultyDescTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C8A76B',
    marginBottom: 8,
  },
  difficultyDescText: {
    fontSize: 12,
    color: '#DDDDDD',
    marginBottom: 4,
    lineHeight: 18,
  },

  // 题目类型选项
  typeContainer: {
    gap: 10,
  },
  typeOption: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  typeOptionSelected: {
    backgroundColor: '#8B7355',
    borderColor: '#8B7355',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },

  // 说明框
  noteBox: {
    backgroundColor: '#2a3f5c',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5a9fd4',
  },
  noteText: {
    fontSize: 12,
    color: '#b0d4f1',
    lineHeight: 18,
  },

  // 警告框
  warningText: {
    fontSize: 12,
    color: '#ff9d5c',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // 操作按钮
  startButton: {
    backgroundColor: '#C8A76B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#888888',
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  backButton: {
    backgroundColor: '#555555',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
