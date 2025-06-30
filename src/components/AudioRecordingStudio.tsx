import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import advancedAudioService, { RecordingSession } from '../services/AdvancedAudioService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AudioRecordingStudioProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AudioRecordingStudio({ isVisible, onClose }: AudioRecordingStudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);
  const [recordingName, setRecordingName] = useState('');
  const [recordingQuality, setRecordingQuality] = useState<'low' | 'high'>('high');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<RecordingSession | null>(null);
  const [inputGain, setInputGain] = useState(1.0);
  const [monitorVolume, setMonitorVolume] = useState(0.5);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeTempo, setMetronomeTempo] = useState(120);
  
  // Use only HIGH_QUALITY preset as it's the confirmed available preset
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const waveformTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start waveform animation
      waveformTimer.current = setInterval(() => {
        generateWaveformData();
      }, 100);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
        waveformTimer.current = null;
      }
      animatedValue.stopAnimation();
    }

    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (waveformTimer.current) clearInterval(waveformTimer.current);
    };
  }, [isRecording, isPaused]);

  const loadRecordings = () => {
    const savedRecordings = advancedAudioService.getRecordings();
    setRecordings(savedRecordings);
  };

  const generateWaveformData = () => {
    const data = Array.from({ length: 50 }, () => Math.random() * 100);
    setWaveformData(data);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      if (!recordingName.trim()) {
        Alert.alert('Error', 'Please enter a recording name');
        return;
      }

      const session = await advancedAudioService.startRecording(recordingName, recordingQuality);
      setCurrentSession(session);
      setIsRecording(true);
      setRecordingDuration(0);
      
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      console.log('[AudioRecordingStudio] Recording started:', session.name);
    } catch (error) {
      console.error('[AudioRecordingStudio] Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (currentSession) {
        await audioRecorder.stop();
        const stoppedSession = await advancedAudioService.stopRecording(currentSession.id);
        
        if (stoppedSession) {
          stoppedSession.duration = recordingDuration;
          setRecordings(prev => [...prev, stoppedSession]);
        }
        
        setCurrentSession(null);
        setIsRecording(false);
        setIsPaused(false);
        setRecordingDuration(0);
        setRecordingName('');
        
        console.log('[AudioRecordingStudio] Recording stopped:', stoppedSession?.name);
      }
    } catch (error) {
      console.error('[AudioRecordingStudio] Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handlePauseRecording = async () => {
    try {
      if (isPaused) {
        audioRecorder.record();
        setIsPaused(false);
      } else {
        await audioRecorder.stop();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('[AudioRecordingStudio] Error pausing recording:', error);
    }
  };

  const handleDeleteRecording = (recording: RecordingSession) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRecordings(prev => prev.filter(r => r.id !== recording.id));
          },
        },
      ]
    );
  };

  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {waveformData.map((height, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 0.8,
                backgroundColor: isRecording && !isPaused ? '#FF6B35' : '#666',
                opacity: isRecording && !isPaused ? 
                  animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }) : 0.3,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderRecordingsList = () => (
    <Modal visible={showRecordings} animationType="slide" transparent>
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.recordingsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recordings</Text>
            <TouchableOpacity onPress={() => setShowRecordings(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.recordingsContent}>
            {recordings.map((recording) => (
              <View key={recording.id} style={styles.recordingItem}>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingName}>{recording.name}</Text>
                  <Text style={styles.recordingDetails}>
                    {formatDuration(recording.duration)} • {recording.quality} quality
                  </Text>
                  <Text style={styles.recordingDate}>
                    {recording.createdAt.toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.recordingActions}>
                  <TouchableOpacity
                    style={styles.recordingActionButton}
                    onPress={() => setSelectedRecording(recording)}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.recordingActionButton}
                    onPress={() => handleDeleteRecording(recording)}
                  >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {recordings.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recordings yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start recording to see your sessions here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal visible={showSettings} animationType="slide" transparent>
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.settingsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recording Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            {/* Quality Selection */}
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Recording Quality</Text>
              <View style={styles.qualityButtons}>
                {(['low', 'high'] as const).map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      recordingQuality === quality && styles.qualityButtonActive,
                    ]}
                    onPress={() => setRecordingQuality(quality)}
                  >
                    <Text style={styles.qualityButtonText}>
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Input Gain */}
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Input Gain</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={2}
                  value={inputGain}
                  onValueChange={setInputGain}
                  minimumTrackTintColor="#FF6B35"
                  maximumTrackTintColor="#333"
                />
                <Text style={styles.sliderValue}>{inputGain.toFixed(1)}</Text>
              </View>
            </View>

            {/* Monitor Volume */}
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Monitor Volume</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={monitorVolume}
                  onValueChange={setMonitorVolume}
                  minimumTrackTintColor="#FF6B35"
                  maximumTrackTintColor="#333"
                />
                <Text style={styles.sliderValue}>{Math.round(monitorVolume * 100)}%</Text>
              </View>
            </View>

            {/* Metronome */}
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Metronome</Text>
              <View style={styles.metronomeContainer}>
                <TouchableOpacity
                  style={[
                    styles.metronomeToggle,
                    metronomeEnabled && styles.metronomeToggleActive,
                  ]}
                  onPress={() => setMetronomeEnabled(!metronomeEnabled)}
                >
                  <Text style={styles.metronomeToggleText}>
                    {metronomeEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.bpmContainer}>
                  <Text style={styles.bpmLabel}>BPM</Text>
                  <TextInput
                    style={styles.bpmInput}
                    value={metronomeTempo.toString()}
                    onChangeText={(text) => {
                      const bpm = parseInt(text) || 120;
                      setMetronomeTempo(Math.max(60, Math.min(200, bpm)));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide">
      <LinearGradient
        colors={['#2d1b69', '#1a1a2e', '#16213e']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recording Studio</Text>
          <TouchableOpacity onPress={() => setShowRecordings(true)} style={styles.headerButton}>
            <Ionicons name="folder" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Recording Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Recording Name</Text>
            <TextInput
              style={styles.recordingNameInput}
              value={recordingName}
              onChangeText={setRecordingName}
              placeholder="Enter recording name..."
              placeholderTextColor="#666"
              editable={!isRecording}
            />
          </View>

          {/* Recording Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
            {isRecording && (
              <Animated.View
                style={[
                  styles.recordingIndicator,
                  {
                    opacity: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ]}
              />
            )}
          </View>

          {/* Waveform Visualization */}
          <View style={styles.visualizationContainer}>
            <Text style={styles.visualizationTitle}>Live Waveform</Text>
            {renderWaveform()}
          </View>

          {/* Recording Controls */}
          <View style={styles.recordingControls}>
            {!isRecording ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={handleStartRecording}
                disabled={!recordingName.trim()}
              >
                <Ionicons name="radio-button-on" size={36} color="#fff" />
                <Text style={styles.recordButtonText}>Start Recording</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeRecordingControls}>
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={handlePauseRecording}
                >
                  <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStopRecording}
                >
                  <Ionicons name="stop" size={24} color="#fff" />
                  <Text style={styles.stopButtonText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Level Meters */}
          <View style={styles.levelMeters}>
            <Text style={styles.levelMeterTitle}>Input Level</Text>
            <View style={styles.levelMeterContainer}>
              {Array.from({ length: 20 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.levelMeterBar,
                    {
                      backgroundColor: index < 12 ? '#4CAF50' : 
                                    index < 16 ? '#FFC107' : '#F44336',
                      opacity: isRecording && Math.random() > 0.3 ? 1 : 0.3,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings" size={24} color="#fff" />
            <Text style={styles.settingsButtonText}>Recording Settings</Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <MaterialIcons name="mic-external-on" size={24} color="#fff" />
              <Text style={styles.quickActionText}>External Mic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="headset" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Monitor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <MaterialIcons name="graphic-eq" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Effects</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderRecordingsList()}
        {renderSettingsModal()}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  recordingNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    marginLeft: 15,
  },
  visualizationContainer: {
    marginBottom: 30,
  },
  visualizationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  waveformBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  activeRecordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  stopButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  levelMeters: {
    marginBottom: 30,
  },
  levelMeterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  levelMeterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  levelMeterBar: {
    width: 8,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  recordingsModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
  },
  settingsModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingsContent: {
    flex: 1,
    padding: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 10,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingDetails: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  recordingDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  recordingActions: {
    flexDirection: 'row',
  },
  recordingActionButton: {
    padding: 10,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  settingSection: {
    marginBottom: 30,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  qualityButtonActive: {
    backgroundColor: '#FF6B35',
  },
  qualityButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  metronomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metronomeToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  metronomeToggleActive: {
    backgroundColor: '#FF6B35',
  },
  metronomeToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpmLabel: {
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
  },
  bpmInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
}); 