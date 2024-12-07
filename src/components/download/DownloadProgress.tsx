import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface DownloadProgressProps {
  progress: number;
  total: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  error?: string;
  onCancel: () => void;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  total,
  status,
  error,
  onCancel,
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.percentage}>{percentage}%</Text>
        <Text style={styles.status}>
          {status === 'downloading' && 'Downloading model...'}
          {status === 'completed' && 'Download complete'}
          {status === 'error' && error}
          {status === 'idle' && 'Ready to download'}
        </Text>
      </View>

      {status === 'downloading' && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {status === 'downloading' && (
        <Text style={styles.bytesInfo}>
          {(progress / 1024 / 1024).toFixed(1)}MB / {(total / 1024 / 1024).toFixed(1)}MB
        </Text>
      )}

      {status === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    margin: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#D3D3D3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000000',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  status: {
    fontSize: 14,
    color: '#808080',
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#000000',
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bytesInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#808080',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 4,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
  },
}); 