import { StyleSheet, Platform } from 'react-native';

const ITEM_HEIGHT = 50;

const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
    },
    timeDisplay: {
      alignSelf: 'center',
      width: '90%',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      alignItems: 'center',
    },
    timeDisplayText: {
      fontSize: 22,
      fontWeight: '600',
      marginBottom: 4,
    },
    timeHintText: {
      fontSize: 12,
    },
    pickerContainer: {
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    pickerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    pickerColumn: {
      alignItems: 'center',
    },
    pickerLabel: {
      fontSize: 12,
      marginBottom: 10,
      fontWeight: '500',
    },
    pickerHighlightContainer: {
      height: 150,
      position: 'relative',
      justifyContent: 'center',
    },
    pickerHighlight: {
      position: 'absolute',
      height: ITEM_HEIGHT,
      left: 0,
      right: 0,
      borderRadius: 8,
      zIndex: 0, // Behind the text
    },
    pickerScrollView: {
      height: 150,
      width: 80,
    },
    pickerScrollContent: {
      paddingVertical: 50,
    },
    pickerItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 80,
      zIndex: 1, // Text above highlight
    },
    pickerItemText: {
      fontSize: 22,
      fontWeight: '500',
    },
    pickerSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      marginHorizontal: 10,
    },
    doneButton: {
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    presetsContainer: {
      marginTop: 4,
    },
    presetsLabel: {
      fontSize: 14,
      marginBottom: 8,
    },
    presetButtonsScroll: {
      paddingBottom: 8,
    },
    presetButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
    },
    presetButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });

  export default styles;