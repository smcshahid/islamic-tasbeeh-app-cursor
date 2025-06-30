import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranVerse, QuranMemorizationProgress, QuranReadingSession } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName } from '../utils/quranApi';

const { width, height } = Dimensions.get('window');

interface QuranMemorizationToolsProps {
  visible: boolean;
  onClose: () => void;
  surahNumber?: number;
  verseNumber?: number;
}

interface MemorizationTestProps {
  visible: boolean;
  onClose: () => void;
  verses: QuranVerse[];
  testType: 'first-word' | 'missing-word' | 'sequence' | 'complete-recitation';
  onTestComplete: (score: number, accuracy: number) => void;
}

interface ProgressTrackingProps {
  visible: boolean;
  onClose: () => void;
  memorationProgress: QuranMemorizationProgress[];
  onProgressUpdate: (surah: number, verse: number, status: 'learning' | 'reviewing' | 'mastered') => void;
}

const MemorizationTest: React.FC<MemorizationTestProps> = ({
  visible,
  onClose,
  verses,
  testType,
  onTestComplete,
}) => {
  const { colors } = useAppTheme();
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [testResults, setTestResults] = useState<Array<{ correct: boolean; verse: number }>>([]);

  const currentVerse = verses[currentVerseIndex];
  const totalVerses = verses.length;
  const progress = ((currentVerseIndex + 1) / totalVerses) * 100;

  const generateQuestion = () => {
    if (!currentVerse) return { question: '', answer: '' };

    switch (testType) {
      case 'first-word':
        const words = currentVerse.text.split(' ');
        return {
          question: `What is the first word of verse ${currentVerse.verseNumber}?`,
          answer: words[0],
        };
      
      case 'missing-word':
        const wordsArray = currentVerse.text.split(' ');
        const randomIndex = Math.floor(Math.random() * wordsArray.length);
        const question = wordsArray.map((word, index) => 
          index === randomIndex ? '____' : word
        ).join(' ');
        return {
          question: `Fill in the missing word:\n${question}`,
          answer: wordsArray[randomIndex],
        };
      
      case 'sequence':
        return {
          question: `What comes after verse ${currentVerse.verseNumber - 1}?`,
          answer: currentVerse.text,
        };
      
      case 'complete-recitation':
        return {
          question: `Recite verse ${currentVerse.verseNumber} completely:`,
          answer: currentVerse.text,
        };
      
      default:
        return { question: '', answer: '' };
    }
  };

  const { question, answer } = generateQuestion();

  const checkAnswer = () => {
    const isCorrect = userAnswer.trim().includes(answer.trim());
    const newResult = { correct: isCorrect, verse: currentVerse.verseNumber };
    const newResults = [...testResults, newResult];
    
    setTestResults(newResults);
    if (isCorrect) {
      setScore(score + 1);
      hapticFeedback.success();
    } else {
      hapticFeedback.error();
    }
    
    setShowAnswer(true);
    
    setTimeout(() => {
      if (currentVerseIndex < totalVerses - 1) {
        nextQuestion();
      } else {
        // Test complete
        const accuracy = (score / totalVerses) * 100;
        onTestComplete(score, accuracy);
        onClose();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentVerseIndex(prev => prev + 1);
    setUserAnswer('');
    setShowAnswer(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.testHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.testProgress}>
            <Text style={[styles.testProgressText, { color: colors.text.primary }]}>
              {currentVerseIndex + 1} of {totalVerses}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: colors.primary }
                ]} 
              />
            </View>
          </View>
          
          <Text style={[styles.scoreText, { color: colors.primary }]}>
            Score: {score}/{totalVerses}
          </Text>
        </View>

        <ScrollView style={styles.testContent} contentContainerStyle={styles.testContentContainer}>
          <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.questionText, { color: colors.text.primary }]}>
              {question}
            </Text>
            
            {testType !== 'complete-recitation' ? (
              <TextInput
                style={[
                  styles.answerInput,
                  { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text.primary,
                  }
                ]}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer..."
                placeholderTextColor={colors.text.tertiary}
                multiline={testType === 'sequence'}
                textAlignVertical="top"
                editable={!showAnswer}
              />
            ) : (
              <View style={[styles.recitationArea, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.recitationInstructions, { color: colors.text.secondary }]}>
                  Tap the microphone to start recording your recitation
                </Text>
                <TouchableOpacity
                  style={[styles.micButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Recording', 'Voice recording feature coming soon!')}
                >
                  <Ionicons name="mic" size={32} color={colors.text.onPrimary} />
                </TouchableOpacity>
              </View>
            )}

            {showAnswer && (
              <View style={[styles.answerReveal, { backgroundColor: colors.islamic.green + '20' }]}>
                <Text style={[styles.answerLabel, { color: colors.islamic.green }]}>
                  Correct Answer:
                </Text>
                <Text style={[styles.answerText, { color: colors.text.primary }]}>
                  {answer}
                </Text>
              </View>
            )}
          </View>

          {!showAnswer && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: userAnswer.trim() ? colors.primary : colors.border,
                }
              ]}
              onPress={checkAnswer}
              disabled={!userAnswer.trim()}
            >
              <Text style={[
                styles.submitButtonText,
                { color: userAnswer.trim() ? colors.text.onPrimary : colors.text.tertiary }
              ]}>
                Submit Answer
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  visible,
  onClose,
  memorationProgress,
  onProgressUpdate,
}) => {
  const { colors } = useAppTheme();
  const [selectedSurah, setSelectedSurah] = useState(1);

  const getSurahProgress = (surahNumber: number) => {
    return memorationProgress.filter(p => p.surahNumber === surahNumber);
  };

  const getStatusCounts = (surahNumber: number) => {
    const progress = getSurahProgress(surahNumber);
    return {
      learning: progress.filter(p => p.status === 'learning').length,
      reviewing: progress.filter(p => p.status === 'reviewing').length,
      mastered: progress.filter(p => p.status === 'mastered').length,
    };
  };

  const renderSurahProgress = () => {
    const progress = getSurahProgress(selectedSurah);
    const counts = getStatusCounts(selectedSurah);
    
    return (
      <View style={styles.surahProgressContainer}>
        <View style={styles.progressSummary}>
          <View style={[styles.progressStat, { backgroundColor: colors.islamic.orange + '20' }]}>
            <Text style={[styles.progressStatNumber, { color: colors.islamic.orange }]}>
              {counts.learning}
            </Text>
            <Text style={[styles.progressStatLabel, { color: colors.text.secondary }]}>
              Learning
            </Text>
          </View>
          
          <View style={[styles.progressStat, { backgroundColor: colors.islamic.blue + '20' }]}>
            <Text style={[styles.progressStatNumber, { color: colors.islamic.blue }]}>
              {counts.reviewing}
            </Text>
            <Text style={[styles.progressStatLabel, { color: colors.text.secondary }]}>
              Reviewing
            </Text>
          </View>
          
          <View style={[styles.progressStat, { backgroundColor: colors.islamic.green + '20' }]}>
            <Text style={[styles.progressStatNumber, { color: colors.islamic.green }]}>
              {counts.mastered}
            </Text>
            <Text style={[styles.progressStatLabel, { color: colors.text.secondary }]}>
              Mastered
            </Text>
          </View>
        </View>

        <FlatList
          data={progress}
          keyExtractor={(item) => `${item.surahNumber}-${item.verseNumber}`}
          renderItem={({ item }) => (
            <View style={[styles.verseProgressItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.verseNumber, { color: colors.text.primary }]}>
                Verse {item.verseNumber}
              </Text>
              
              <View style={styles.statusButtons}>
                {(['learning', 'reviewing', 'mastered'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: item.status === status ? 
                          getStatusColor(status, colors) : 
                          colors.background,
                        borderColor: getStatusColor(status, colors),
                      }
                    ]}
                    onPress={() => onProgressUpdate(item.surahNumber, item.verseNumber, status)}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { 
                        color: item.status === status ? 
                          colors.text.onPrimary : 
                          getStatusColor(status, colors) 
                      }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const getStatusColor = (status: string, colors: any) => {
    switch (status) {
      case 'learning': return colors.islamic.orange;
      case 'reviewing': return colors.islamic.blue;
      case 'mastered': return colors.islamic.green;
      default: return colors.text.secondary;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text.primary }]}>
            Memorization Progress
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.surahSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 114 }, (_, i) => i + 1).map((surahNum) => (
              <TouchableOpacity
                key={surahNum}
                style={[
                  styles.surahButton,
                  {
                    backgroundColor: selectedSurah === surahNum ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setSelectedSurah(surahNum)}
              >
                <Text style={[
                  styles.surahButtonText,
                  { 
                    color: selectedSurah === surahNum ? 
                      colors.text.onPrimary : 
                      colors.text.primary 
                  }
                ]}>
                  {surahNum}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderSurahProgress()}
      </SafeAreaView>
    </Modal>
  );
};

const QuranMemorizationTools: React.FC<QuranMemorizationToolsProps> = ({
  visible,
  onClose,
  surahNumber = 1,
  verseNumber = 1,
}) => {
  const { colors } = useAppTheme();
  const {
    memorationProgress,
    updateMemorizationProgress,
    getMemorizationStats,
  } = useQuranContext();

  const [currentSurah, setCurrentSurah] = useState(surahNumber);
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [testType, setTestType] = useState<'first-word' | 'missing-word' | 'sequence' | 'complete-recitation'>('first-word');

  const stats = getMemorizationStats();

  useEffect(() => {
    if (visible) {
      loadSurahVerses();
    }
  }, [visible, currentSurah]);

  const loadSurahVerses = async () => {
    try {
      setIsLoading(true);
      const surahData = await quranApi.getSurah(currentSurah);
      setVerses(surahData.verses);
    } catch (error) {
      secureLogger.error('Error loading surah for memorization', error);
      Alert.alert('Error', 'Unable to load Surah verses.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTest = (type: typeof testType) => {
    setTestType(type);
    setShowTest(true);
  };

  const handleTestComplete = (score: number, accuracy: number) => {
    secureLogger.info('Memorization test completed', { score, accuracy, surah: currentSurah });
    Alert.alert(
      'Test Complete!',
      `Score: ${score}/${verses.length}\nAccuracy: ${accuracy.toFixed(1)}%`,
      [{ text: 'OK', onPress: () => hapticFeedback.success() }]
    );
  };

  const tools = [
    {
      icon: 'school',
      title: 'First Word Test',
      description: 'Test your recall of verse beginnings',
      color: colors.primary,
      onPress: () => startTest('first-word'),
    },
    {
      icon: 'text',
      title: 'Missing Word',
      description: 'Fill in missing words from verses',
      color: colors.secondary,
      onPress: () => startTest('missing-word'),
    },
    {
      icon: 'arrow-forward',
      title: 'Sequence Test',
      description: 'Test verse order and flow',
      color: colors.accent,
      onPress: () => startTest('sequence'),
    },
    {
      icon: 'mic',
      title: 'Recitation Test',
      description: 'Complete recitation assessment',
      color: colors.islamic.navy,
      onPress: () => startTest('complete-recitation'),
    },
    {
      icon: 'analytics',
      title: 'Progress Tracking',
      description: 'View and update memorization status',
      color: colors.islamic.green,
      onPress: () => setShowProgress(true),
    },
    {
      icon: 'timer',
      title: 'Spaced Repetition',
      description: 'AI-powered review scheduling',
      color: colors.islamic.blue,
      onPress: () => Alert.alert('Coming Soon', 'Intelligent review scheduling feature coming soon!'),
    },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Memorization Tools
          </Text>
          
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Surah Selection */}
          <View style={[styles.surahSelection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Current Surah: {getSurahName(currentSurah)}
            </Text>
            <TouchableOpacity
              style={[styles.changeSurahButton, { borderColor: colors.primary }]}
              onPress={() => Alert.alert('Change Surah', 'Surah selection modal coming soon!')}
            >
              <Text style={[styles.changeSurahButtonText, { color: colors.primary }]}>
                Change Surah
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Progress
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.islamic.green }]}>
                  {stats.totalMastered}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Mastered
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.islamic.blue }]}>
                  {stats.totalReviewing}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Reviewing
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.islamic.orange }]}>
                  {stats.totalLearning}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Learning
                </Text>
              </View>
            </View>
          </View>

          {/* Tools Grid */}
          <View style={styles.toolsGrid}>
            {tools.map((tool, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={tool.onPress}
                {...getButtonA11yProps(tool.title, tool.description, false)}
              >
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.text.primary }]}>
                  {tool.title}
                </Text>
                <Text style={[styles.toolDescription, { color: colors.text.secondary }]}>
                  {tool.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Test Modal */}
        <MemorizationTest
          visible={showTest}
          onClose={() => setShowTest(false)}
          verses={verses}
          testType={testType}
          onTestComplete={handleTestComplete}
        />

        {/* Progress Tracking Modal */}
        <ProgressTracking
          visible={showProgress}
          onClose={() => setShowProgress(false)}
          memorationProgress={memorationProgress}
          onProgressUpdate={updateMemorizationProgress}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  surahSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  changeSurahButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  changeSurahButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  toolIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Test styles
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  testProgress: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  testProgressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  testContent: {
    flex: 1,
  },
  testContentContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  recitationArea: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  recitationInstructions: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerReveal: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Progress tracking styles
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  surahSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  surahButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  surahButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  surahProgressContainer: {
    flex: 1,
    padding: 16,
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  progressStat: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
  },
  verseProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 4,
  },
  statusButtonText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default QuranMemorizationTools; 