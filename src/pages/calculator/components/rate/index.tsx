import { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'
import styles from './index.module.scss'

type Rate = { value: number, factor: number }

interface Props {
  value: Rate,
  onChange?: (val: Rate) => void,
}

export default class Index extends Component <Props> {
  changeValue (value: Rate) {
    this.props.onChange && this.props.onChange(value)
  }

  render () {
    const { value = { value: 4.9, factor: 1 } } = this.props

    const result = (value.value * value.factor).toFixed(2)

    return <View className={styles.rate}>
      <View className={styles.item}>
        <Input type="digit" maxLength={5} className={styles.input} value={value.value.toString()} onInput={e => this.changeValue({...value, value: Number(e.detail.value)})}></Input>
        <View className={styles.unit}>%</View>
      </View>
      <View className={styles.times}>X</View>
      <View className={styles.item}>
        <Input type="digit" maxLength={5} className={styles.input} value={value.factor.toString()} onInput={e => this.changeValue({...value, factor: Number(e.detail.value)})}></Input>
        <View className={styles.unit}>倍</View>
      </View>
      <View className={styles.result}>
        = {result}%
      </View>
    </View>
  }
}
