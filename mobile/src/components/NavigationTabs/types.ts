import { Screen } from '../../types/navigation';

export interface NavigationTabsProps {
  activeScreen: Screen;
  onChangeScreen: (screen: Screen) => void;
}