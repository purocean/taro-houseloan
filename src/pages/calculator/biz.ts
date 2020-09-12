import dayjs from 'dayjs'

export const defaultHousingRateBase = 3.25
export const defaultCommercialRateBase = 4.9

export const downPaymentOptions = [
  { value: 1, label: '一成' },
  { value: 2, label: '二成' },
  { value: 3, label: '三成' },
  { value: 4, label: '四成' },
  { value: 5, label: '五成' },
  { value: 6, label: '六成' },
  { value: 7, label: '七成' },
  { value: 8, label: '八成' },
  { value: 9, label: '九成' },
]

export const paymentMethodOptions = [
  { value: 'eci', label: '等额本息'},
  { value: 'ec', label: '等额本金'},
]

export const yearsOptions = [...new Array(30)].map((_, i) => ({ value: i + 1, label: `${i + 1}年(${(i + 1) * 12})期` }))

export const today = dayjs().format('YYYY-MM-DD')

export type Params = {
  method: 'commercial' | 'housing' | 'mix'
  totalPrice: number,
  downPayment: number,
  paymentMethod: 'eci' | 'ec'
  housingValue: number, // 公积金贷款总额
  commercialValue: number, // 商业贷款总额
  years: number,
  startAt: string,
  housingRateBase: number, // 公积金贷款基本利率
  housingRateFactor: number, // 公积金贷款利率乘数
  commercialRateBase: number, // 商业贷款基本利率,
  commercialRateFactor: number, // 商业贷款利率乘数,
}

type MonthResult = { due: number, interest: number, capital: number }

/**
 * 计算等额本息
 *
 * @param total 总贷款额
 * @param rate 利率
 * @param months 总期数
 * @param currentMonth 当前期数 从 0 开始
 */
const eci = (total: number, rate: number, months: number, currentMonth): MonthResult => {
  const rateMonth = rate / 12 // 月利率
  const due = total * rateMonth * Math.pow(1 + rateMonth, months) / (Math.pow(1 + rateMonth, months) - 1)
  const interest = total * rateMonth * (Math.pow(1 + rateMonth, months) - Math.pow(1 + rateMonth, currentMonth)) / (Math.pow(1 + rateMonth, months) - 1)

  return {
    due,
    capital: due - interest,
    interest,
  }
}

/**
 * 计算等额本金
 *
 * @param total 总贷款额
 * @param rate 年利率
 * @param months 总期数
 * @param currentMonth 当前期数 从 0 开始
 */
const ec = (total: number, rate: number, months: number, currentMonth: number): MonthResult => {
  const rateMonth = rate / 12 // 月利率
  const capital = total / months // 本金
  const due = (total - capital * currentMonth) * rateMonth + capital
  return {
    due,
    capital,
    interest: due - capital,
  }
}

/**
 * 计算等额本息总利息
 *
 * @param total 总贷款额
 * @param rate 年利率
 * @param months 总期数
 */
const eciInterest = (total: number, rate: number, months: number) => {
  const rateMonth = rate / 12 // 月利率
  return months * total * rateMonth * Math.pow(1 + rateMonth, months) / (Math.pow(1 + rateMonth, months) - 1) - total
}

/**
 * 计算等额本金总利息
 *
 * @param total 总贷款额
 * @param rate 年利率
 * @param months 总期数
 */
const ecInterest = (total: number, rate: number, months: number) => {
  const rateMonth = rate / 12 // 月利率
  return (months + 1) * total * rateMonth / 2
}

const calcRaw = (params: Params) => {
  type DetailListItem = {
    index: number,
    month: number, // 月份
    due: number, // 本期还款
    capital: number, // 本期本金
    interest: number, // 本期利息
    rest: number,
  }

  type Detail = {
    year: number,
    list: DetailListItem[]
  }

  // 参数预处理
  const commercialRateBase = Number(params.commercialRateBase) / 100
  const commercialRateFactor = Number(params.commercialRateFactor)
  const commercialValue = Number(params.commercialValue) * 10000
  // const downPayment = Number(params.downPayment)
  const housingRateBase = Number(params.housingRateBase) / 100
  const housingRateFactor = Number(params.housingRateFactor)
  const housingValue = Number(params.housingValue) * 10000
  const method = params.method
  const paymentMethod = params.paymentMethod
  const startAt = new Date(params.startAt)
  const startYear = startAt.getFullYear()
  // const totalPrice = Number(params.totalPrice)
  const years = Number(params.years)
  const months = years * 12

  // 实际计算利率
  const housingRate = housingRateBase * housingRateFactor
  const commercialRate = commercialRateBase * commercialRateFactor

  // 本金总额
  const amount = method === 'mix' ? (housingValue + commercialValue) : (method === 'housing' ? housingValue : commercialValue) // 贷款总额

  let housingInterestAmount = 0 // 公积金贷款利息总额
  let commercialInterestAmount = 0 // 商业贷款利息总额

  // 计算公积金贷利息总额
  if (method !== 'commercial') {
    housingInterestAmount = paymentMethod === 'eci' ? eciInterest(housingValue, housingRate, months) : ecInterest(housingValue, housingRate, months)
  }

  // 计算商贷利息总额
  if (method !== 'housing') {
    commercialInterestAmount = paymentMethod === 'eci' ? eciInterest(commercialValue, commercialRate, months) : ecInterest(commercialValue, commercialRate, months)
  }

  // 利息总额
  const interestAmount = housingInterestAmount + commercialInterestAmount

  // 还款总额
  const dueAmount = amount + interestAmount

  let housingDueAmount = 0 // 记录公积金已还款总额，方便计算剩余待还
  let commercialDueAmount = 0 // 记录商贷已还款总额，方便计算剩余待还
  const detail: Detail[] = [] // 储存还款详情
  const items: DetailListItem[] = [] // 记录最近几条，方便计算还款递减
  let currentMonth = 0 // 当前期数游标，从 0 开始
  for (let y = 0; y <= years; y++) {
    const list: DetailListItem[] = []
    for (let m = 0; m < 12; m++ ) {
      if (currentMonth >= months) {
        break
      }

      if (y === 0 && m === 0) { // 今年当前月份
        m = startAt.getMonth()
      }

      let dueHousingResult: MonthResult = { due: 0, interest: 0, capital: 0 } // 本月公积金待还
      let dueCommercialResult: MonthResult = { due: 0, interest: 0, capital: 0 } // 本月商业待还

      // 计算公积金贷
      if (method !== 'commercial') {
        dueHousingResult = paymentMethod === 'eci' ? eci(housingValue, housingRate, months, currentMonth) : ec(housingValue, housingRate, months, currentMonth)
      }

      // 计算商贷
      if (method !== 'housing') {
        dueCommercialResult = paymentMethod === 'eci' ? eci(commercialValue, commercialRate, months, currentMonth) : ec(commercialValue, commercialRate, months, currentMonth)
      }

      // 累加还款总额
      housingDueAmount += dueHousingResult.due
      commercialDueAmount += dueCommercialResult.due

      const item = {
        index: currentMonth,
        month: m + 1,
        capital: dueHousingResult.capital + dueCommercialResult.capital,
        interest: dueHousingResult.interest + dueCommercialResult.interest,
        due: dueHousingResult.due + dueCommercialResult.due,
        rest: Math.abs(dueAmount - housingDueAmount - commercialDueAmount),
      }

      // 记录头几次的还款情况
      if (items.length < 2) {
        items.push(item)
      }

      list.push(item)
      currentMonth++
    }

    if (list.length > 0) {
      detail.push({
        year: startYear + y,
        list
      })
    }
  }

  return {
    perMonth: items.length > 0 ? items[0].due : 0, // 每月还款 元
    perMonthReduce: items.length > 1 ? items[0].due - items[1].due : 0, // 每月递减 元，等额本金模式
    amount, // 贷款总额
    dueAmount, // 还款总额
    interestAmount, // 利息总额
    years, // 按揭年数
    detail: detail
  }
}

export type Result = {
  perMonth: string, // 每月还款 元
  perMonthReduce: string, // 每月递减 元，等额本金模式
  amount: string, // 贷款总额 万
  dueAmount: string, // 还款总额 万
  interestAmount: string, // 利息总额 万
  years: number, // 按揭年数
  detail: {
    year: string,
    list: {
      index: number,
      month: string, // 月份
      due: string, // 本期还款
      capital: string, // 本期本金
      interest: string, // 本期利息
    }[]
  }[]
}

export const calc = (params: Params): Result => {
  console.log(new Date().valueOf(), '开始计算', params)
  const result = calcRaw(params)
  console.log(new Date().valueOf(), '计算结果', result, )

  return {
    perMonth: result.perMonth.toFixed(2), // 每月还款 元
    perMonthReduce: result.perMonthReduce.toFixed(2), // 每月递减 元，等额本金模式
    amount: (result.amount / 10000).toFixed(2), // 贷款总额 万
    dueAmount: (result.dueAmount / 10000).toFixed(2), // 还款总额 万
    interestAmount: (result.interestAmount / 10000).toFixed(2), // 利息总额 万
    years: result.years, // 按揭年数
    detail: result.detail.map(x => ({
      year: x.year.toString(),
      list: x.list.map(y => ({
        index: y.index,
        month: y.month.toString(), // 月份
        due: y.due.toFixed(2), // 本期还款
        capital: y.capital.toFixed(2), // 本期本金
        interest: y.interest.toFixed(2), // 本期利息
        rest: y.rest.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'),
      }))
    }))
  }
}
