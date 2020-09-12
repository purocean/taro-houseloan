import { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import styles from './index.module.scss'

type Tab = {value: string, label: string}

interface Props {
  current: string,
  tabs: Tab[],
  onChange?: (val: Tab) => void,
}

export default class Index extends Component <Props> {
  changeTab (tab: Tab) {
    this.props.onChange && this.props.onChange(tab)
  }

  render () {
    const { current, tabs = [] } = this.props

    return <View className={styles.tabs}>
      {tabs.map(tab => <View key={tab.value} className={styles.tabItem} onClick={() => this.changeTab(tab)}>
        <View className={`${styles.tabItemLabel} ${tab.value === current ? styles.tabItemLabelActivated : ''}`}>{tab.label}</View>
      </View>)}
    </View>
  }
}
