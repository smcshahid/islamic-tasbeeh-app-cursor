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
import { useGlobalAction } from '../../src/contexts/GlobalActionContext';
import { useFocusEffect } from 'expo-router';
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
  const { colors, themeDefinition } = useAppTheme();
  const { pendingAction, clearPendingAction } = useGlobalAction();
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
  const [selectedColor, setSelectedColor] = useState(colors.primary);
  
  // Accessibility refs and config
  const counterRef = useRef<View>(null);
  const animationConfig = getAnimationConfig();
  const fontScale = getFontScale();

  // Handle pending actions from global search
  useFocusEffect(
    React.useCallback(() => {
      if (pendingAction && pendingAction.screen === '/(tabs)/') {
        // Execute the pending action
        switch (pendingAction.type) {
          case 'setCounterTarget':
            handleSetTarget();
            break;
          case 'resetCounter':
            handleReset();
            break;
          case 'createNewCounter':
            setShowNewCounterModal(true);
            break;
          case 'openCounterSelector':
            setShowCounterSelector(true);
            break;
        }
        // Clear the pending action
        clearPendingAction();
      }
    }, [pendingAction, clearPendingAction])
  );

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
    setSelectedColor(colors.primary);
    setShowNewCounterModal(false);
  };

  const getProgressPercentage = () => {
    if (!currentCounter?.target) return 0;
    return Math.min((currentCounter.count / currentCounter.target) * 100, 100);
  };



  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CounterSkeleton />
      </SafeAreaView>
    );
  }

  if (!currentCounter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            No counter available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CounterErrorBoundary>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
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
            <Text style={[styles.counterName, { color: colors.text.onPrimary }]}>{currentCounter.name}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.text.onPrimary} />
          </TouchableOpacity>
          
          <Text 
            style={[styles.sessionTimer, { color: colors.text.onPrimary }]}
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
                  { 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: colors.text.onPrimary
                  }
                ]}
              />
            </View>
            <Text 
              style={[styles.progressText, { color: colors.text.onPrimary }]}
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
              { 
                fontSize: 72 * fontScale,
                color: colors.text.onPrimary
              }
            ]}
            accessibilityElementsHidden={true}
          >
            {currentCounter.count.toLocaleString()}
          </Text>
          <Text 
            style={[styles.tapInstruction, { color: colors.text.onPrimary }]}
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
            <Ionicons name="refresh" size={24} color={colors.text.onPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.text.onPrimary }]}>Reset</Text>
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
            <Ionicons name="flag" size={24} color={colors.text.onPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.text.onPrimary }]}>Target</Text>
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Select Counter
            </Text>
            <TouchableOpacity onPress={() => setShowCounterSelector(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.counterList}>
            {counters.map((counter) => (
              <TouchableOpacity
                key={counter.id}
                style={[
                  styles.counterItem,
                  { backgroundColor: colors.surface },
                  currentCounter.id === counter.id && styles.selectedCounterItem
                ]}
                onPress={() => {
                  setCurrentCounter(counter);
                  setShowCounterSelector(false);
                }}
              >
                <View style={[styles.counterColor, { backgroundColor: colors.primary }]} />
                <View style={styles.counterInfo}>
                  <Text style={[styles.counterItemName, { color: colors.text.primary }]}>
                    {counter.name}
                  </Text>
                  <Text style={[styles.counterItemCount, { color: colors.text.secondary }]}>
                    Count: {counter.count.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.addCounterButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setShowCounterSelector(false);
              setShowNewCounterModal(true);
            }}
          >
            <Ionicons name="add" size={24} color={colors.text.onPrimary} />
            <Text style={[styles.addCounterButtonText, { color: colors.text.onPrimary }]}>Add New Counter</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* New Counter Modal */}
      <Modal
        visible={showNewCounterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              New Counter
            </Text>
            <TouchableOpacity onPress={() => setShowNewCounterModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.newCounterForm}>
            <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
              Counter Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border,
                }
              ]}
              value={newCounterName}
              onChangeText={setNewCounterName}
              placeholder="Enter counter name"
              placeholderTextColor={colors.text.tertiary}
            />

            <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
              Target (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border,
                }
              ]}
              value={newCounterTarget}
              onChangeText={setNewCounterTarget}
              placeholder="Enter target count"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
              Color
            </Text>
            <View style={styles.colorPicker}>
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.primary },
                  selectedColor === colors.primary && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.primary)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.secondary },
                  selectedColor === colors.secondary && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.secondary)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.accent },
                  selectedColor === colors.accent && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.accent)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.green },
                  selectedColor === colors.islamic.green && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.islamic.green)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.gold },
                  selectedColor === colors.islamic.gold && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.islamic.gold)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.navy },
                  selectedColor === colors.islamic.navy && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(colors.islamic.navy)}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: selectedColor }]}
              onPress={handleCreateCounter}
            >
              <Text style={[styles.createButtonText, { color: colors.text.onPrimary }]}>Create Counter</Text>
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
          colors={[colors.background, colors.surface, colors.card]}
          style={styles.targetModalGradient}
        >
          <SafeAreaView style={styles.targetModalContainer}>
            {/* Header */}
            <View style={styles.targetModalHeader}>
              <View style={styles.targetModalHeaderContent}>
                <Text style={[styles.targetModalTitle, { color: colors.text.primary }]}>
                  Set Target
                </Text>
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setShowTargetModal(false)}
                >
                  <Ionicons name="close" size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.targetModalSubtitle, { color: colors.text.secondary }]}>
                Choose your target count for {currentCounter?.name}
              </Text>
            </View>

            <ScrollView style={styles.targetModalContent} showsVerticalScrollIndicator={false}>
              {/* Counter Info Card */}
              <View style={[styles.counterInfoCard, { 
                backgroundColor: colors.card,
                borderColor: colors.border
              }]}>
                <View style={[styles.counterColorIndicator, { backgroundColor: colors.primary }]} />
                <View style={styles.counterInfoText}>
                  <Text style={[styles.counterInfoName, { color: colors.text.primary }]}>
                    {currentCounter?.name}
                  </Text>
                  <Text style={[styles.counterInfoCount, { color: colors.text.secondary }]}>
                    Current: {currentCounter?.count.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Preset Targets Section */}
              <View style={styles.presetSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Popular Targets
                </Text>
                <View style={styles.presetTargetsGrid}>
                  {[APP_CONSTANTS.ISLAMIC.TASBIH_COUNT, APP_CONSTANTS.ISLAMIC.ASMA_UL_HUSNA, APP_CONSTANTS.ISLAMIC.MILESTONE_100, APP_CONSTANTS.ISLAMIC.MILESTONE_300, APP_CONSTANTS.ISLAMIC.MILESTONE_500, APP_CONSTANTS.ISLAMIC.MILESTONE_1000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                                              style={[
                        styles.presetTargetCard,
                        { 
                          backgroundColor: colors.card,
                          borderColor: parseInt(targetValue) === preset 
                            ? currentCounter?.color 
                            : colors.border
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
                            : colors.text.primary
                        }
                      ]}>
                        {preset}
                      </Text>
                      <Text style={[styles.presetTargetLabel, { color: colors.text.secondary }]}>
                        {preset === APP_CONSTANTS.ISLAMIC.TASBIH_COUNT ? 'Tasbih' : preset === APP_CONSTANTS.ISLAMIC.ASMA_UL_HUSNA ? 'Asma ul Husna' : 'Target'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Target Section */}
              <View style={styles.customSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Custom Target
                </Text>
                <View style={[styles.customInputCard, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }]}>
                  <TextInput
                    style={[
                      styles.customTargetInput,
                      {
                        color: colors.text.primary,
                      }
                    ]}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="Enter any number"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.targetActionButtonsContainer, { 
              backgroundColor: colors.surface,
              borderTopColor: colors.border
            }]}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn, { 
                  backgroundColor: 'transparent',
                  borderColor: colors.border
                }]}
                onPress={() => setShowTargetModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: colors.text.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn, { backgroundColor: colors.error }]}
                onPress={() => {
                  setTargetValue('');
                  handleSaveTarget();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.text.onPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.text.onPrimary }]}>Remove</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn, 
                  styles.setBtn, 
                  { backgroundColor: currentCounter?.color || colors.primary },
                  !targetValue.trim() && { opacity: 0.5 }
                ]}
                onPress={handleSaveTarget}
                disabled={!targetValue.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={18} color={colors.text.onPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.text.onPrimary }]}>Set Target</Text>
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
    fontSize: 18,
    fontWeight: '600',
    marginRight: 5,
  },
  sessionTimer: {
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
    borderRadius: 3,
  },
  progressText: {
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
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  tapInstruction: {
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderWidth: 3,
  },
  createButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
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
    // backgroundColor set dynamically from theme
  },
  setBtn: {
    // backgroundColor set dynamically
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
}); 