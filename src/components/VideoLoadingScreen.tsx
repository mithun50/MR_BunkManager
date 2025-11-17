import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useTheme } from 'react-native-paper';

interface VideoLoadingScreenProps {
  onFinish: () => void;
}

export default function VideoLoadingScreen({ onFinish }: VideoLoadingScreenProps) {
  const theme = useTheme();
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Auto-finish after max 5 seconds as fallback
    const timeout = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onFinish]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      // When video finishes playing, call onFinish
      if (status.didJustFinish) {
        onFinish();
      }
    }
  };

  const handleError = (error: string) => {
    console.error('Video loading error:', error);
    // If video fails to load, just finish
    onFinish();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('@/assets/videos/loading_video.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={handleError}
        />
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const circleSize = width * 0.30; // Circle mask size (smaller = more crop)
const videoSize = width * 1.5; // Actual video size (stays constant)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: circleSize,
    height: circleSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: circleSize / 2, // Perfect circle
    overflow: 'hidden',
  },
  video: {
    width: videoSize,
    height: videoSize,
    marginTop: 50, // Move video down to show upper part through circle
  },
});
