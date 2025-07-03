import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export class UpdateService {
  static async checkForUpdates() {
    try {
      if (!Updates.isEnabled) {
        console.log('Updates are not enabled');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update', onPress: () => this.downloadAndRestart() }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  static async downloadAndRestart() {
    try {
      const update = await Updates.fetchUpdateAsync();
      
      if (update.isNew) {
        Alert.alert(
          'Update Downloaded',
          'The update has been downloaded. The app will restart now.',
          [{ text: 'OK', onPress: () => Updates.reloadAsync() }]
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      Alert.alert('Update Error', 'Failed to download update. Please try again later.');
    }
  }

  static async forceUpdate() {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error reloading app:', error);
    }
  }
}