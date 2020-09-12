import { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { Params, Result, calc } from '../biz'

import styles from './index.module.scss'
import arrowIcon from './ic_arrow_up@2x.png'
import topCardBg from './img_kpbg@2x.png'

interface StateI {
  open: {[key: string]: boolean},
  params: Params | null,
  result: Result | null,
}

export default class Index extends Component<StateI> {
  config: Config = {
    navigationBarTitleText: '计算结果'
  }

  state = {
    open: {},
    params: null,
    result: null,
  } as StateI

  componentWillMount () {
    const params = {...this.$router.params} as any

    const result = calc(params)
    // 默认展开第一年的数据
    const open = result.detail.length > 0 ? {[result.detail[0].year]: true} : {}

    this.setState({ params, result, open })
  }

  changeOpen (key) {
    const open = {...this.state.open}

    open[key] = !open[key]

    this.setState({open: open})
  }

  render () {
    const { params, result, open } = this.state

    if (!result || !params) {
      return null
    }

    return <View className={styles.result}>
      <View className={styles.top}>
        <View className={styles.topCard}>
          <Image className={styles.topCardBg} src={topCardBg}></Image>
          <View className={styles.topCardTextA}>{result.perMonth}元</View>
          {params.paymentMethod === 'ec' && <View className={styles.topCardTextB}>首月后每月递减 {result.perMonthReduce} 元</View>}
          {params.paymentMethod !== 'ec' && <View className={styles.topCardTextB}>每月还款</View>}
        </View>
        <View className={styles.topItem} style={{boxShadow: 'none'}}>
          <View className={styles.topItemLabel}>还款总额</View>
          <View className={styles.topItemValue}>{result.dueAmount + ' 万元'}</View>
        </View>
        <View className={styles.topItem}>
          <View className={styles.topItemLabel}>支付利息</View>
          <View className={styles.topItemValue}>{result.interestAmount} 万元</View>
        </View>
        <View className={styles.topItem}>
          <View className={styles.topItemLabel}>贷款总额</View>
          <View className={styles.topItemValue}>{result.amount} 万元</View>
        </View>
        <View className={styles.topItem}>
          <View className={styles.topItemLabel}>按揭年数</View>
          <View className={styles.topItemValue}>{result.years}年({result.years * 12}期)</View>
        </View>
      </View>
      <View className={styles.detail}>
        <View className={styles.detailTitle}>贷款明细</View>
        {result.detail.map(detail => <View key={detail.year} className={styles.detailCard}>
          <View className={styles.detailCardHead} onClick={() => this.changeOpen(detail.year)}>
            <View className={styles.detailCardHeadTitle}>{detail.year}年</View>
            <Image className={styles.arrowIcon + (open[detail.year] ? ' ' + styles.arrowIconOpen : '')} src={arrowIcon}></Image>
          </View>
          {open[detail.year] && <View className={styles.detailCardContent}>
            <View className={styles.detailCardContentTr + ' ' + styles.detailCardContentHead}>
              <View className={styles.detailCardContentTh + ' ' + styles.detailCardContentTTA}>月份</View>
              <View className={styles.detailCardContentTh + ' ' + styles.detailCardContentTTB}>本期还款</View>
              <View className={styles.detailCardContentTh + ' ' + styles.detailCardContentTTB}>本期本金</View>
              <View className={styles.detailCardContentTh + ' ' + styles.detailCardContentTTB}>本期利息</View>
              <View className={styles.detailCardContentTh + ' ' + styles.detailCardContentTTC}>本期剩余待还</View>
            </View>
            {detail.list.map(row => <View key={detail.year + '_' + row.month} className={styles.detailCardContentTr}>
              <View className={styles.detailCardContentTd + ' ' + styles.detailCardContentTTA}>{row.month}月</View>
              <View className={styles.detailCardContentTd + ' ' + styles.detailCardContentTTB}>{row.due}</View>
              <View className={styles.detailCardContentTd + ' ' + styles.detailCardContentTTB}>{row.capital}</View>
              <View className={styles.detailCardContentTd + ' ' + styles.detailCardContentTTB}>{row.interest}</View>
              <View className={styles.detailCardContentTd + ' ' + styles.detailCardContentTTC}>{row.rest}</View>
            </View>)}
          </View>}
        </View>)}
      </View>
    </View>
  }
}
