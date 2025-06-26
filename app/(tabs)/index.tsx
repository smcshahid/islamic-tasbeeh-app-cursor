import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTasbeeh } from '../../src/contexts/TasbeehContext';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS, Counter } from '../../src/types';

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
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleIncrement = async () => {
    if (!currentCounter) return;
    await incrementCounter(currentCounter.id);
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
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
            Loading...
          </Text>
        </View>
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
      <LinearGradient
        colors={[currentCounter.color, currentCounter.color + '80']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.counterSelector}
            onPress={() => setShowCounterSelector(true)}
          >
            <Text style={styles.counterName}>{currentCounter.name}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.neutral.white} />
          </TouchableOpacity>
          
          <Text style={styles.sessionTimer}>
            Session: {sessionTime}
          </Text>
        </View>

        {/* Target Progress */}
        {currentCounter.target && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercentage()}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentCounter.count} / {currentCounter.target}
            </Text>
          </View>
        )}

        {/* Main Counter */}
        <TouchableOpacity
          style={styles.counterArea}
          onPress={handleIncrement}
          activeOpacity={0.8}
        >
          <Text style={styles.counterValue}>
            {currentCounter.count.toLocaleString()}
          </Text>
          <Text style={styles.tapInstruction}>
            Tap to count
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={24} color={COLORS.neutral.white} />
            <Text style={styles.actionButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.targetButton]}
            onPress={handleSetTarget}
          >
            <Ionicons name="flag" size={24} color={COLORS.neutral.white} />
            <Text style={styles.actionButtonText}>Target</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.white }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Set Target
            </Text>
            <TouchableOpacity onPress={() => setShowTargetModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} />
            </TouchableOpacity>
          </View>

          <View style={styles.targetModalContent}>
            <Text style={[styles.targetSubtitle, { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }]}>
              Choose your target count for {currentCounter?.name}
            </Text>

            {/* Preset Target Buttons */}
            <View style={styles.presetTargetsContainer}>
              {[33, 99, 100, 300, 500, 1000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetTargetButton,
                    { backgroundColor: COLORS.primary.teal },
                    parseInt(targetValue) === preset && { 
                      backgroundColor: currentCounter?.color || COLORS.primary.green,
                      transform: [{ scale: 1.05 }]
                    }
                  ]}
                  onPress={() => setTargetValue(preset.toString())}
                >
                  <Text style={styles.presetTargetText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual Input */}
            <Text style={[styles.inputLabel, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              Or enter custom target:
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100,
                  color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                }
              ]}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="Enter target count"
              placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
              keyboardType="numeric"
            />

            {/* Action Buttons */}
            <View style={styles.targetActionButtons}>
              <TouchableOpacity
                style={[styles.targetActionButton, styles.cancelButton]}
                onPress={() => setShowTargetModal(false)}
              >
                <Text style={[styles.targetActionButtonText, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.targetActionButton, { backgroundColor: COLORS.primary.orange }]}
                onPress={() => {
                  setTargetValue('');
                  handleSaveTarget();
                }}
              >
                <Text style={styles.targetActionButtonText}>Remove Target</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.targetActionButton, { backgroundColor: currentCounter?.color || COLORS.primary.green }]}
                onPress={handleSaveTarget}
                disabled={!targetValue.trim()}
              >
                <Text style={styles.targetActionButtonText}>Set Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
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
  targetModalContent: {
    flex: 1,
    padding: 20,
  },
  targetSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  presetTargetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  presetTargetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetTargetText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  targetActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  targetActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.neutral.gray300,
  },
  targetActionButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 