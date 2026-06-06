import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

export function MannequinSilhouette() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.head} />
      <View style={styles.neck} />
      <View style={styles.torso} />
      <View style={styles.hips} />
      <View style={styles.legs}>
        <View style={styles.leg} />
        <View style={styles.legGap} />
        <View style={styles.leg} />
      </View>
      <View style={styles.feetRow}>
        <View style={styles.foot} />
        <View style={styles.foot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '2%',
  },
  head: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: '1%',
  },
  neck: {
    width: '5%',
    height: '3%',
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: '1%',
  },
  torso: {
    width: '30%',
    height: '24%',
    backgroundColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  hips: {
    width: '28%',
    height: '6%',
    backgroundColor: colors.border,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    marginBottom: '1%',
  },
  legs: {
    width: '26%',
    height: '28%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leg: {
    width: '42%',
    height: '100%',
    backgroundColor: colors.border,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  legGap: {
    width: '8%',
  },
  feetRow: {
    width: '34%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '1%',
  },
  foot: {
    width: '42%',
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
});
