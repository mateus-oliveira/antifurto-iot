import { Text, TouchableOpacity, View } from 'react-native';

import { appStyles } from '../styles/appStyles';

type Screen = 'buscar' | 'controle' | 'seguranca';

type NavigationTabsProps = {
    activeScreen: Screen;
    onChangeScreen: (screen: Screen) => void;
};

export function NavigationTabs({ activeScreen, onChangeScreen }: NavigationTabsProps) {
    return (
        <View style={appStyles.navBar}>
            <TouchableOpacity style={[appStyles.navItem, activeScreen === 'buscar' && appStyles.navItemActive]} onPress={() => onChangeScreen('buscar')}>
                <Text style={appStyles.navText}>Buscar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[appStyles.navItem, activeScreen === 'controle' && appStyles.navItemActive]} onPress={() => onChangeScreen('controle')}>
                <Text style={appStyles.navText}>Controle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[appStyles.navItem, activeScreen === 'seguranca' && appStyles.navItemActive]} onPress={() => onChangeScreen('seguranca')}>
                <Text style={appStyles.navText}>Seguranca</Text>
            </TouchableOpacity>
        </View>
    );
}