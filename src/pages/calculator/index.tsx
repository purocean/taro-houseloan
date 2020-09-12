import Taro, { Component, Config } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'
import Tabs from './components/tabs'
import XPicker from './components/picker'
import XRadio from './components/radio'
import Rate from './components/rate'
import { Params, downPaymentOptions, yearsOptions, paymentMethodOptions, today, defaultHousingRateBase, defaultCommercialRateBase } from './biz'

import styles from './index.module.scss'

const tabs = [
  { value: 'commercial', label: '商业贷' },
  { value: 'housing', label: '公积金贷' },
  { value: 'mix', label: '组合贷'},
]

interface StateI {
  params: Params,
}

export default class Index extends Component<StateI> {
  config: Config = {
    navigationBarTitleText: '房贷计算器'
  }

  state = {
    params: {
      method: 'commercial',
      totalPrice: 100,
      downPayment: 3,
      paymentMethod: 'eci',
      housingValue: 0, // 公积金贷款总额
      commercialValue: 0, // 商业贷款总额,
      years: 20,
      startAt: today,
      housingRateBase: defaultHousingRateBase, // 公积金贷款基本利率
      housingRateFactor: 1, // 公积金贷款利率乘数
      commercialRateBase: defaultCommercialRateBase, // 商业贷款基本利率,
      commercialRateFactor: 1, // 商业贷款利率乘数,
    }
  } as StateI

  componentWillMount () {
    const { totalPrice = '110' } = this.$router.params
    this.setParamValue('totalPrice', Number(totalPrice))
  }

  setParamValue (key: string, value: string | number) {
    const params = {...this.state.params, [key]: value}

    // 贷款总额
    const amount = Number((params.totalPrice * (1 - params.downPayment / 10)).toFixed(2))

    // 填写总价/首付/切换贷款方式的时候根据比例计算其他
    if (key === 'totalPrice' || key === 'downPayment' || key === 'method') {
      if (params.method === 'commercial') {
        params.commercialValue = amount
        params.housingValue = 0
      } else if (params.method === 'housing') {
        params.housingValue = amount
        params.commercialValue = 0
      } else {
        params.commercialValue = 0
        params.housingValue = amount
      }
    }

    // 填写公积金贷款额度时候修改商业贷款额度
    if (key == 'housingValue') {
      params.commercialValue = Number((amount - params.housingValue).toFixed(2))
    }

    // 填写商业贷款额度时候修改公积金贷款额度
    if (key == 'commercialValue') {
      params.housingValue = Number((amount - params.commercialValue).toFixed(2))
    }

    this.setState({ params })
  }

  setRate(type: 'housing' | 'commercial', value: {value: number, factor: number}) {
    console.log(type, value)
    if (type === 'housing') {
      this.setState({
        params: {
          ...this.state.params,
          housingRateBase: value.value,
          housingRateFactor: value.factor,
        }
      })
    }

    if (type === 'commercial') {
      this.setState({
        params: {
          ...this.state.params,
          commercialRateBase: value.value,
          commercialRateFactor: value.factor,
        }
      })
    }
  }

  checkParams (params: Params) {
    const rules = [
      { fun: (p: Params) => p.housingValue < 0, message: '公积金贷款额度不能小于 0' },
      { fun: (p: Params) => p.commercialValue < 0, message: '商业贷款额度不能小于 0'},
      { fun: (p: Params) => p.totalPrice <= 0, message: '贷款额度不能小于 0'},
      { fun: (p: Params) => p.commercialRateBase * p.commercialRateFactor < 0, message: '商业贷款利率不能小于 0'},
      { fun: (p: Params) => p.commercialRateBase * p.commercialRateFactor > 100, message: '商业贷款利率不能大于 100'},
      { fun: (p: Params) => p.housingRateBase * p.housingRateFactor <= 0, message: '公积金贷款利率不能小于 0'},
      { fun: (p: Params) => p.housingRateBase * p.housingRateFactor >= 100, message: '公积金贷款利率不能大于 100'},
    ]

    rules.forEach(rule => {
      if (rule.fun(params)) {
        throw rule.message;
      }
    })
  }

  start () {
    const { params } = this.state
    try {
      this.checkParams(params)
      const query = Object.keys(params).map(x => `${x}=${params[x]}`).join('&')
      console.log('开始计算', query)
      Taro.navigateTo({url: `result/index?${query}`})
    } catch (error) {
      Taro.showToast({title: error, icon: 'none'})
    }
  }

  render () {
    const { params } = this.state

    const downPayment = downPaymentOptions.find(x => x.value === params.downPayment)
    const downPaymentLabel = downPayment ? `${downPayment.label}(${(params.totalPrice * downPayment.value / 10).toFixed(2)}万元)` : ''
    const years = yearsOptions.find(x => x.value === params.years)
    const yearsLabel = years ? years.label : ''

    return <View className={styles.calc}>
      <Tabs tabs={tabs} current={params.method} onChange={v => this.setParamValue('method', v.value)} />
      <View className={styles.form}>
        <View className={styles.formItem + ' ' + styles.formItemNoLine}>
          <View className={styles.formItemLabel}>贷款总价</View>
          <View className={styles.formItemValue}>
            <Input
              type="digit"
              placeholderStyle="color: #D8D9E1"
              placeholder="请输入"
              maxLength={8}
              value={params.totalPrice ? params.totalPrice.toString() : ''}
              onInput={e => this.setParamValue('totalPrice', e.detail.value)}
              className={styles.formItemValueText + ' ' + styles.formItemValueInput}></Input>
            <View className={styles.formItemValuePrice}>万元</View>
          </View>
        </View>
        <View className={styles.formItem}>
          <View className={styles.formItemLabel}>首付比例</View>
          <View className={styles.formItemValue}>
            <XPicker options={downPaymentOptions} value={params.downPayment} onChangeValue={v => this.setParamValue('downPayment', v)}>
              <View className={styles.formItemValueText}>{downPaymentLabel}</View>
            </XPicker>
          </View>
        </View>
        <View className={styles.formItem}>
          <View className={styles.formItemLabel}>还款方式</View>
          <View className={styles.formItemValue}>
            <XRadio options={paymentMethodOptions} value={params.paymentMethod} onChange={v => this.setParamValue('paymentMethod', v.value)}></XRadio>
          </View>
        </View>
        {params.method !== 'commercial' && <View className={styles.formItem}>
          <View className={styles.formItemLabel}>公积金贷款总额</View>
          <View className={styles.formItemValue}>
            <Input
              type="digit"
              disabled={params.method !== 'mix'}
              placeholderStyle="color: #D8D9E1"
              placeholder={params.method === 'mix' ? '请输入' : ''}
              maxLength={8}
              value={params.housingValue ? params.housingValue.toString() : '0'}
              onInput={e => this.setParamValue('housingValue', e.detail.value)}
              className={styles.formItemValueText + ' ' + styles.formItemValueInput}></Input>
            <View className={styles.formItemValuePrice}>万元</View>
          </View>
        </View>}
        {params.method !== 'housing' && <View className={styles.formItem}>
          <View className={styles.formItemLabel}>商业贷款总额</View>
          <View className={styles.formItemValue}>
            <Input
              type="digit"
              disabled={params.method !== 'mix'}
              placeholderStyle="color: #D8D9E1"
              placeholder={params.method === 'mix' ? '请输入' : ''}
              maxLength={8}
              value={params.commercialValue ? params.commercialValue.toString() : '0'}
              onInput={e => this.setParamValue('commercialValue', e.detail.value)}
              className={styles.formItemValueText + ' ' + styles.formItemValueInput}></Input>
            <View className={styles.formItemValuePrice}>万元</View>
          </View>
        </View>}
        <View className={styles.formItem}>
          <View className={styles.formItemLabel}>按揭年数</View>
          <View className={styles.formItemValue}>
            <XPicker options={yearsOptions} value={params.years} onChangeValue={v => this.setParamValue('years', v)}>
              <View className={styles.formItemValueText}>{yearsLabel}</View>
            </XPicker>
          </View>
        </View>
        <View className={styles.formItem}>
          <View className={styles.formItemLabel}>首次还款日期</View>
          <View className={styles.formItemValue}>
            <XPicker mode="date" value={params.startAt} start={today} onChangeValue={v => this.setParamValue('startAt', v)}>
              <View className={styles.formItemValueText}>{params.startAt}</View>
            </XPicker>
          </View>
        </View>
        <View className={styles.formItem + ' ' + (params.method === 'mix' ? styles.formItemX : '')}>
          <View className={styles.formItemLabel}>贷款利率(%)</View>
          <View className={styles.formItemValue + ' ' + (params.method === 'mix' ? styles.formItemX : '')}>
            {params.method !== 'commercial' && <View className={styles.rateRow}>
              {params.method === 'mix' && <View>公积金</View>}
              <Rate
                value={{value: params.housingRateBase, factor: params.housingRateFactor}}
                onChange={v => this.setRate('housing', v)}></Rate>
            </View>}
            {params.method !== 'housing' && <View className={styles.rateRow}>
              {params.method === 'mix' && <View>商业贷</View>}
              <Rate
                value={{value: params.commercialRateBase, factor: params.commercialRateFactor}}
                onChange={v => this.setRate('commercial', v)}></Rate>
            </View>}
          </View>
        </View>
      </View>
      <View className={styles.btn} onClick={this.start.bind(this)}>开始计算</View>
    </View>
  }
}
