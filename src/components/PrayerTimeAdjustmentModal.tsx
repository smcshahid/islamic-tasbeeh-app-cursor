import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../types';
import { PrayerName, PRAYER_NAMES } from '../types';

interface PrayerTimeAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  onConfirmAll?: (minutes: number) => void;
  prayer: PrayerName;
  currentAdjustment: number;
  isDark?: boolean;
}

export const PrayerTimeAdjustmentModal: React.FC<PrayerTimeAdjustmentModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onConfirmAll,
  prayer,
  currentAdjustment,
  isDark = false,
}) => {
  const [inputValue, setInputValue] = useState(currentAdjustment.toString());
  const [error, setError] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);

  const backgroundColor = isDark ? COLORS.neutral.gray800 : COLORS.neutral.white;
  const surfaceColor = isDark ? COLORS.neutral.gray700 : COLORS.neutral.gray50;
  const textColor = isDark ? COLORS.neutral.white : COLORS.neutral.black;
  const borderColor = isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300;

  useEffect(() => {
    if (visible) {
      setInputValue(currentAdjustment.toString());
      setError(null);
      setApplyToAll(false);
    }
  }, [visible, currentAdjustment]);

  const handleConfirm = () => {
    const minutes = parseInt(inputValue.trim(), 10);
    
    if (isNaN(minutes)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (minutes < -30 || minutes > 30) {
      setError('Adjustment must be between -30 and +30 minutes');
      return;
    }
    
    if (applyToAll && onConfirmAll) {
      onConfirmAll(minutes);
    } else {
      onConfirm(minutes);
    }
    onClose();
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setError(null);
  };

  const incrementValue = (delta: number) => {
    const current = parseInt(inputValue, 10) || 0;
    const newValue = Math.max(-30, Math.min(30, current + delta));
    setInputValue(newValue.toString());
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name="time" 
                size={24} 
                color={COLORS.primary.green} 
              />
              <Text style={[styles.title, { color: textColor }]}>
                Adjust {PRAYER_NAMES.en[prayer]} Time
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.description, { color: textColor }]}>
              Enter adjustment in minutes (-30 to +30)
            </Text>
            
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: surfaceColor, borderColor }]}
                onPress={() => incrementValue(-5)}
              >
                <Ionicons name="remove" size={20} color={textColor} />
              </TouchableOpacity>
              
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: surfaceColor, 
                    borderColor: error ? COLORS.semantic.error : borderColor,
                    color: textColor 
                  }
                ]}
                value={inputValue}
                onChangeText={handleInputChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                selectTextOnFocus
                maxLength={3}
              />
              
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: surfaceColor, borderColor }]}
                onPress={() => incrementValue(5)}
              >
                <Ionicons name="add" size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.unit, { color: textColor }]}>minutes</Text>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {onConfirmAll && (
              <View style={[styles.applyAllContainer, { backgroundColor: surfaceColor }]}>
                <View style={styles.applyAllContent}>
                  <View>
                    <Text style={[styles.applyAllLabel, { color: textColor }]}>
                      Apply to All Prayers
                    </Text>
                    <Text style={[styles.applyAllDescription, { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }]}>
                      Set the same adjustment for all five daily prayers
                    </Text>
                  </View>
                  <Switch
                    value={applyToAll}
                    onValueChange={setApplyToAll}
                    trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
                    thumbColor={COLORS.neutral.white}
                  />
                </View>
              </View>
            )}

            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: textColor }]}>
                Current adjustment: 
                <Text style={[styles.previewValue, { color: COLORS.primary.green }]}>
                  {currentAdjustment > 0 ? '+' : ''}{currentAdjustment} minutes
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {applyToAll ? 'Apply to All' : 'Set Adjustment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    minWidth: 100,
    ...Platform.select({
      ios: {
        paddingVertical: 16,
      },
    }),
  },
  unit: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.semantic.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  applyAllContainer: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  applyAllContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyAllLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  applyAllDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.neutral.gray400,
  },
  cancelButtonText: {
    color: COLORS.neutral.gray600,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.primary.green,
  },
  confirmButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 