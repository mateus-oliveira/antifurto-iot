export enum NavigationTabsEnum {
    SEARCH = 'buscar',
    CONTROL = 'controle',
    SECURITY = 'seguranca',
}

export type Screen = NavigationTabsEnum.SEARCH | NavigationTabsEnum.CONTROL | NavigationTabsEnum.SECURITY;