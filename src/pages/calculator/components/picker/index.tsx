import { Component } from '@tarojs/taro'
import { View, Picker, Image } from '@tarojs/components'
import moreIcon from '../../assets/ic_xmore@2x.png'
import styles from './index.module.scss'

type Option = {value: string | number, label: string}

interface Props {
  mode?: 'selector' | 'date',
  value?: string | number,
  options?: Option[],
  onChangeValue?: (val: string | number) => void,
  start?: string,
  end?: string,
}

export default class Index extends Component <Props> {
  changeIndex (e) {
    const index = e.detail.value
    const { options = [], onChangeValue } = this.props
    onChangeValue && onChangeValue(options[index] ? options[index].value : '')
  }

  changeValue (e) {
    const value = e.detail.value
    this.props.onChangeValue && this.props.onChangeValue(value)
  }

  render () {
    const { value, options = [], mode = 'selector', start, end } = this.props

    const content = <View className={styles.content}>
      {!value && <View className={styles.placeholder}>请选择</View>}
      {value && this.props.children}
      <Image src={moreIcon} className={styles.moreIcon}></Image>
    </View>

    if (mode === 'selector') {
      const index = options.findIndex(x => x.value === value)
      const range = options.map(x => x.label)

      return <Picker mode="selector" value={index} range={range} onChange={this.changeIndex.bind(this)} className={styles.picker}>
        {content}
      </Picker>
    } else if (mode === 'date') {
      return <Picker mode="date" value={value ? value.toString() : ''} start={start} end={end} onChange={this.changeValue.bind(this)} className={styles.picker}>
        {content}
      </Picker>
    }

    return null
  }
}
