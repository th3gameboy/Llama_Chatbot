import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { DownloadProgress as DownloadProgressType } from '../../types/download';

interface DownloadProgressProps {
  progress: DownloadProgressType;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
  onCancel: () => void;
  onPauseResume: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatTime = (seconds: number): string => {
  if (!seconds || seconds === Infinity) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  status,
  error,
  onCancel,
  onPauseResume,
}) => {
  const percentage = Math.round(progress.progress);
  const isActive = status === 'downloading';
  const isPaused = status === 'paused';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Model Download</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.label}>Speed</Text>
          <Text style={styles.value}>
            {isActive ? `${formatBytes(progress.speed)}/s` : '--'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Time Left</Text>
          <Text style={styles.value}>
            {isActive ? formatTime(progress.timeRemaining) : '--'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Size</Text>
          <Text style={styles.value}>
            {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        {(isActive || isPaused) && (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={onPauseResume}
            >
              <Text style={styles.primaryButtonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {status === 'error' && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000000',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#000000',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#808080',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    color: '#000000',
    fontSize: 14,
  },
}); 