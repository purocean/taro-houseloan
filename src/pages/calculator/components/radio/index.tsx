import { Component } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import icon from '../../assets/ic_radio@2x.png'
import iconS from '../../assets/ic_radio_sel@2x.png'
import styles from './index.module.scss'

type Option = {value: string | number, label: string}

interface Props {
  value?: string | number,
  options: Option[],
  onChange?: (val: Option) => void,
}

export default class Index extends Component <Props> {
  changeValue (option: Option) {
    const { onChange } = this.props
    onChange && onChange(option)
  }

  render () {
    const { value, options = [] } = this.props

    return <View className={styles.radio}>
      {options.map(x => <View key={x.value} className={styles.item} onClick={() => this.changeValue(x)}>
        <Image className={styles.icon} src={value === x.value ? iconS : icon}></Image>
        <View className={styles.label}>{x.label}</View>
      </View>)}
    </View>
  }
}
