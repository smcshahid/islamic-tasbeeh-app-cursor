import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTasbeeh } from '../../src/contexts/TasbeehContext';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS, Counter } from '../../src/types';
import { APP_CONSTANTS } from '../../src/constants/app';
import { CounterSkeleton } from '../../src/components/SkeletonLoader';
import { CounterErrorBoundary } from '../../src/components/ErrorBoundary';
import { 
  getCounterA11yProps, 
  getButtonA11yProps, 
  getProgressA11yProps,
  announceToScreenReader,
  getAnimationConfig,
  getFontScale,
  getAccessibleColors,
  getIslamicCountingLabels
} from '../../src/utils/accessibility';

export default function CounterScreen() {
  const { isDark } = useAppTheme();
  const {
    currentCounter,
    counters,
    activeSession,
    incrementCounter,
    resetCounter,
    setCurrentCounter,
    createCounter,
    updateCounter,
    isLoading,
  } = useTasbeeh();

  const [sessionTime, setSessionTime] = useState('0:00');
  const [showCounterSelector, setShowCounterSelector] = useState(false);
  const [showNewCounterModal, setShowNewCounterModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterTarget, setNewCounterTarget] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS.primary.blue);
  
  // Accessibility refs and config
  const counterRef = useRef<View>(null);
  const animationConfig = getAnimationConfig();
  const fontScale = getFontScale();
  const accessibleColors = getAccessibleColors(isDark ? 'dark' : 'light');

  // Update session timer
  useEffect(() => {
    if (!activeSession) {
      setSessionTime('0:00');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(activeSession.startTime).getTime();
      const duration = Math.floor((now - start) / 1000);
      
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setSessionTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          }, APP_CONSTANTS.TIMERS.SESSION_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleIncrement = async () => {
    if (!currentCounter) return;
    
    const previousCount = currentCounter.count;
    await incrementCounter(currentCounter.id);
    
    // Announce count updates to screen readers for significant milestones
    const newCount = currentCounter.count + 1;
    if (newCount % APP_CONSTANTS.ISLAMIC.TASBIH_COUNT === 0 || newCount % APP_CONSTANTS.ISLAMIC.MILESTONE_100 === 0 || 
        (currentCounter.target && newCount === currentCounter.target)) {
      const announcement = getIslamicCountingLabels(newCount, 'general');
      announceToScreenReader(announcement);
    }
  };

  const handleReset = () => {
    if (!currentCounter) return;
    
    Alert.alert(
      'Reset Counter',
      `Are you sure you want to reset "${currentCounter.name}" to 0?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetCounter(currentCounter.id),
        },
      ]
    );
  };

  const handleSetTarget = () => {
    if (!currentCounter) return;
    setTargetValue(currentCounter.target?.toString() || '');
    setShowTargetModal(true);
  };

  const handleSaveTarget = async () => {
    if (!currentCounter) return;
    
    const target = parseInt(targetValue || '0', 10);
    if (target > 0) {
      await updateCounter(currentCounter.id, { target });
    } else {
      // Remove target if 0 or invalid
      await updateCounter(currentCounter.id, { target: undefined });
    }
    
    setShowTargetModal(false);
    setTargetValue('');
  };

  const handleCreateCounter = async () => {
    if (!newCounterName.trim()) return;
    
    const target = newCounterTarget ? parseInt(newCounterTarget, 10) : undefined;
    await createCounter(newCounterName.trim(), selectedColor, target);
    
    setNewCounterName('');
    setNewCounterTarget('');
    setSelectedColor(COLORS.primary.blue);
    setShowNewCounterModal(false);
  };

  const getProgressPercentage = () => {
    if (!currentCounter?.target) return 0;
    return Math.min((currentCounter.count / currentCounter.target) * 100, 100);
  };

  const colorKeys = Object.keys(COLORS.primary) as (keyof typeof COLORS.primary)[];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
        <CounterSkeleton />
      </SafeAreaView>
    );
  }

  if (!currentCounter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
            No counter available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      <CounterErrorBoundary>
        <LinearGradient
          colors={[currentCounter.color, currentCounter.color + '80']}
          style={styles.gradient}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.counterSelector}
            onPress={() => setShowCounterSelector(true)}
            {...getButtonA11yProps(
              `Select counter: ${currentCounter.name}`,
              'Opens counter selection menu'
            )}
          >
            <Text style={styles.counterName}>{currentCounter.name}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.neutral.white} />
          </TouchableOpacity>
          
          <Text 
            style={styles.sessionTimer}
            {...getCounterA11yProps(0, `Session time ${sessionTime}`, undefined)}
            accessibilityLabel={`Current session duration: ${sessionTime}`}
            accessibilityRole="timer"
          >
            Session: {sessionTime}
          </Text>
        </View>

        {/* Target Progress */}
        {currentCounter.target && (
          <View style={styles.progressContainer}>
            <View 
              style={styles.progressBar}
              {...getProgressA11yProps(
                currentCounter.count, 
                currentCounter.target, 
                `${currentCounter.name} progress`
              )}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercentage()}%` }
                ]}
              />
            </View>
            <Text 
              style={styles.progressText}
              accessibilityLabel={`Progress: ${currentCounter.count} out of ${currentCounter.target} completed. ${getProgressPercentage().toFixed(0)} percent complete.`}
            >
              {currentCounter.count} / {currentCounter.target}
            </Text>
          </View>
        )}

        {/* Main Counter */}
        <TouchableOpacity
          ref={counterRef}
          style={styles.counterArea}
          onPress={handleIncrement}
          activeOpacity={0.8}
          {...getCounterA11yProps(
            currentCounter.count, 
            currentCounter.name, 
            currentCounter.target
          )}
          accessibilityLabel={getIslamicCountingLabels(currentCounter.count, 'general')}
          accessibilityActions={[
            { name: 'increment', label: 'Increment counter' },
            { name: 'activate', label: 'Tap to count' }
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment' || 
                event.nativeEvent.actionName === 'activate') {
              handleIncrement();
            }
          }}
        >
          <Text 
            style={[
              styles.counterValue,
              { fontSize: 72 * fontScale }
            ]}
            accessibilityElementsHidden={true}
          >
            {currentCounter.count.toLocaleString()}
          </Text>
          <Text 
            style={styles.tapInstruction}
            accessibilityElementsHidden={true}
          >
            Tap to count
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
            {...getButtonA11yProps(
              'Reset counter',
              `Reset ${currentCounter.name} counter to zero`,
              false
            )}
          >
            <Ionicons name="refresh" size={24} color={COLORS.neutral.white} />
            <Text style={styles.actionButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.targetButton]}
            onPress={handleSetTarget}
            {...getButtonA11yProps(
              'Set target',
              currentCounter.target 
                ? `Current target is ${currentCounter.target}. Tap to change target.`
                : 'Set a target count for this counter',
              false
            )}
          >
            <Ionicons name="flag" size={24} color={COLORS.neutral.white} />
            <Text style={styles.actionButtonText}>Target</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      </CounterErrorBoundary>

      {/* Counter Selector Modal */}
      <Modal
        visible={showCounterSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.white }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Select Counter
            </Text>
            <TouchableOpacity onPress={() => setShowCounterSelector(false)}>
              <Ionicons name="close" size={24} color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.counterList}>
            {counters.map((counter) => (
              <TouchableOpacity
                key={counter.id}
                style={[
                  styles.counterItem,
                  { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100 },
                  currentCounter.id === counter.id && styles.selectedCounterItem
                ]}
                onPress={() => {
                  setCurrentCounter(counter);
                  setShowCounterSelector(false);
                }}
              >
                <View style={[styles.counterColor, { backgroundColor: counter.color }]} />
                <View style={styles.counterInfo}>
                  <Text style={[styles.counterItemName, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                    {counter.name}
                  </Text>
                  <Text style={[styles.counterItemCount, { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }]}>
                    Count: {counter.count.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.addCounterButton, { backgroundColor: COLORS.primary.green }]}
            onPress={() => {
              setShowCounterSelector(false);
              setShowNewCounterModal(true);
            }}
          >
            <Ionicons name="add" size={24} color={COLORS.neutral.white} />
            <Text style={styles.addCounterButtonText}>Add New Counter</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* New Counter Modal */}
      <Modal
        visible={showNewCounterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.white }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              New Counter
            </Text>
            <TouchableOpacity onPress={() => setShowNewCounterModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} />
            </TouchableOpacity>
          </View>

          <View style={styles.newCounterForm}>
            <Text style={[styles.inputLabel, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Counter Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100,
                  color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                }
              ]}
              value={newCounterName}
              onChangeText={setNewCounterName}
              placeholder="Enter counter name"
              placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
            />

            <Text style={[styles.inputLabel, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Target (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100,
                  color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                }
              ]}
              value={newCounterTarget}
              onChangeText={setNewCounterTarget}
              placeholder="Enter target count"
              placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Color
            </Text>
            <View style={styles.colorPicker}>
              {colorKeys.map((colorKey) => (
                <TouchableOpacity
                  key={colorKey}
                  style={[
                    styles.colorOption,
                    { backgroundColor: COLORS.primary[colorKey] },
                    selectedColor === COLORS.primary[colorKey] && styles.selectedColor
                  ]}
                  onPress={() => setSelectedColor(COLORS.primary[colorKey])}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: selectedColor }]}
              onPress={handleCreateCounter}
            >
              <Text style={styles.createButtonText}>Create Counter</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Target Modal */}
      <Modal
        visible={showTargetModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={isDark 
            ? ['#1f2937', '#111827', '#0f172a'] 
            : ['#f8fafc', '#f1f5f9', '#e2e8f0']
          }
          style={styles.targetModalGradient}
        >
          <SafeAreaView style={styles.targetModalContainer}>
            {/* Header */}
            <View style={styles.targetModalHeader}>
              <View style={styles.targetModalHeaderContent}>
                <Text style={[styles.targetModalTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                  Set Target
                </Text>
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                  onPress={() => setShowTargetModal(false)}
                >
                  <Ionicons name="close" size={20} color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.targetModalSubtitle, { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }]}>
                Choose your target count for {currentCounter?.name}
              </Text>
            </View>

            <ScrollView style={styles.targetModalContent} showsVerticalScrollIndicator={false}>
              {/* Counter Info Card */}
              <View style={[styles.counterInfoCard, { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }]}>
                <View style={[styles.counterColorIndicator, { backgroundColor: currentCounter?.color }]} />
                <View style={styles.counterInfoText}>
                  <Text style={[styles.counterInfoName, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                    {currentCounter?.name}
                  </Text>
                  <Text style={[styles.counterInfoCount, { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }]}>
                    Current: {currentCounter?.count.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Preset Targets Section */}
              <View style={styles.presetSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                  Popular Targets
                </Text>
                <View style={styles.presetTargetsGrid}>
                  {[APP_CONSTANTS.ISLAMIC.TASBIH_COUNT, APP_CONSTANTS.ISLAMIC.ASMA_UL_HUSNA, APP_CONSTANTS.ISLAMIC.MILESTONE_100, APP_CONSTANTS.ISLAMIC.MILESTONE_300, APP_CONSTANTS.ISLAMIC.MILESTONE_500, APP_CONSTANTS.ISLAMIC.MILESTONE_1000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetTargetCard,
                        { 
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.white,
                          borderColor: parseInt(targetValue) === preset 
                            ? currentCounter?.color 
                            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                        },
                        parseInt(targetValue) === preset && {
                          backgroundColor: currentCounter?.color + '20',
                          borderWidth: 2,
                          transform: [{ scale: 1.02 }]
                        }
                      ]}
                      onPress={() => setTargetValue(preset.toString())}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.presetTargetNumber,
                        { 
                          color: parseInt(targetValue) === preset 
                            ? currentCounter?.color 
                            : (isDark ? COLORS.neutral.white : COLORS.neutral.gray900)
                        }
                      ]}>
                        {preset}
                      </Text>
                      <Text style={[styles.presetTargetLabel, { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }]}>
                        {preset === APP_CONSTANTS.ISLAMIC.TASBIH_COUNT ? 'Tasbih' : preset === APP_CONSTANTS.ISLAMIC.ASMA_UL_HUSNA ? 'Asma ul Husna' : 'Target'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Target Section */}
              <View style={styles.customSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                  Custom Target
                </Text>
                <View style={[styles.customInputCard, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.white,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }]}>
                  <TextInput
                    style={[
                      styles.customTargetInput,
                      {
                        color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                      }
                    ]}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="Enter any number"
                    placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.targetActionButtonsContainer, { 
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
              borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn, { 
                  backgroundColor: 'transparent',
                  borderColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300
                }]}
                onPress={() => setShowTargetModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray700 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => {
                  setTargetValue('');
                  handleSaveTarget();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.neutral.white} />
                <Text style={styles.actionBtnText}>Remove</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn, 
                  styles.setBtn, 
                  { backgroundColor: currentCounter?.color || COLORS.primary.green },
                  !targetValue.trim() && { opacity: 0.5 }
                ]}
                onPress={handleSaveTarget}
                disabled={!targetValue.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={18} color={COLORS.neutral.white} />
                <Text style={styles.actionBtnText}>Set Target</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  counterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterName: {
    color: COLORS.neutral.white,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 5,
  },
  sessionTimer: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.neutral.white,
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  counterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  counterValue: {
    color: COLORS.neutral.white,
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  tapInstruction: {
    color: COLORS.neutral.white,
    fontSize: 18,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  targetButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  actionButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  counterList: {
    flex: 1,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedCounterItem: {
    borderWidth: 2,
    borderColor: COLORS.primary.green,
  },
  counterColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  counterInfo: {
    flex: 1,
  },
  counterItemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  counterItemCount: {
    fontSize: 14,
  },
  addCounterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  addCounterButtonText: {
    color: COLORS.neutral.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  newCounterForm: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
  },
  textInput: {
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: COLORS.neutral.white,
  },
  createButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: COLORS.neutral.white,
    fontSize: 18,
    fontWeight: '600',
  },
  // Target Modal Styles
  targetModalGradient: {
    flex: 1,
  },
  targetModalContainer: {
    flex: 1,
  },
  targetModalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  targetModalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetModalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  targetModalSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  counterInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  counterColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  counterInfoText: {
    flex: 1,
  },
  counterInfoName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  counterInfoCount: {
    fontSize: 14,
  },
  presetSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  presetTargetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetTargetCard: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetTargetNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  presetTargetLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  customSection: {
    marginBottom: 32,
  },
  customInputCard: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customTargetInput: {
    padding: 20,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  targetActionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  removeBtn: {
    backgroundColor: COLORS.primary.orange,
  },
  setBtn: {
    // backgroundColor set dynamically
  },
  actionBtnText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
}); 