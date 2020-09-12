import '@tarojs/async-await'
import PromiseFinally from 'promise.prototype.finally'
import Taro, { Component, Config } from '@tarojs/taro'
import { Provider } from '@tarojs/mobx'
import Index from './pages/calculator'

import './app.scss'

PromiseFinally.shim()

// h5 环境中开启 React Devtools
if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
  require('nerv-devtools')
}

class App extends Component {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      'pages/calculator/index',
      'pages/calculator/result/index'

    ],
    window: {
      backgroundTextStyle: 'light',
      // navigationBarBackgroundColor: '#E63836',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: '房贷计算器',
      navigationBarTextStyle: 'black'
    },
  }

  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Provider>
        <Index />
      </Provider>
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
