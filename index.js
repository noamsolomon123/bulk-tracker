import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
registerRootComponent(App);
