import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
};

export function ScreenContainer({
  children,
  scrollable = false,
  style,
}: ScreenContainerProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.min(width * 0.05, 24);

  const content = (
    <View style={[styles.content, { paddingHorizontal: horizontalPadding }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
});
