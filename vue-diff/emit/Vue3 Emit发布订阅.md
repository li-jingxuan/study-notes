## Vue中的发布订阅模式分析

> 模块：instanceEventEmiiter.ts（在下方有简单实现和解析）
>
> 在Vue3中，已经取消了对这个模块的引用，故而不再支持 $on、$off、$once相关的方法，不过还是可以对进行学习和借鉴，运用到工作中。

1. **Vue3中的简单实现**

   Vue3中 emit 的实现相对 Vue2 来说更加简单一些了，他是通过 h函数 的第二个参数来实现的

   *实现 Child 组件*

   ```javascript
   const { createApp, h } = Vue
   // 创建一个子组件
   const Child = {
     setup(props, ctx) {
       return {
         buttonClick() {
           // 源码中挂载 emit 的函数：createComponentInstance
   		// 挂载代码：instance.emit = emit.bind(null, instance)
           // emit函数接受3个参数： emit(instance, event, ...rawArgs)
           // 其中 instance 在挂载到 instance 的时候默认传入了
           // ctx.emit('test') 相当于  ctx.emit('当前Vue实例', 'test', 123)
           // emit函数中会对 on开头、 Once 结尾等关键字符串进行解析
           // 然后从 instance.vnode.props 中去获取对应的回调函数
           // 然后执行 回调函数，此次发布订阅流程也就完成了
             
           // 执行 emit 方法发布一个 test 事件
           ctx.emit('test', 123)
         }
       }
     },
     render(e) {
       return h('button', {
         onClick: this.buttonClick
       }, '派发Emit')
     }
   }
   ```

   *实现App组件*

   ```javascript
   const App = {
     render(e) {
       // h函数返回一个 vnode
       // 当 h 函数的第二个参数是一个 Object，并且不是一个 VNode 时
       // vnode.props 就是 h 函数的第二个参数值
       return h(
         'div', {}, [
           // 引用 Child 组件，并且传入 onTest 方法
           h(Child, {
             // 监听 test 事件 vnode.props = { onText: Funtion }
             onTest(e) {
               console.log('emit test event!', e)
             }
           })
         ]
       ) 
     }
   }
   
   createApp(App).mount(document.getElementById('emitApp'))
   ```

2. **instanceEventEmiiter 实现代码（简易 JS 版本）**

   · 其中像 WeakMap对象、getRegistry方法的运用，及对与 eventName 为数组的处理逻辑还是值得学习的

   · 在工作中可以在 Vue3 的项目中实现一个 Emiiter 模块，代替 Vue2中的 bus 实现，用于全局事件通讯

   ```javascript
   // 发布订阅仓库
   // 数据结构类似： { Instance, Object<[event: string]: Function[] | undefined> }
   const eventRegistryMap = new WeakMap()
   
   /**
    * 根据 instance 进行事件注册
    * @param {*} instance 当前 Vue 实例对象
    * @returns 当前事件对象s
    */
   function getRegistry(instance) {
     // 从 map 中获取事件对象
     let events = eventRegistryMap.get(instance)
   
     if(!events) {
       // 若没有注册过，则进行新注册
       eventRegistryMap.set(instance, (events = Object.create(null)))
     }
   
     // 返回 实例的事件对象
     return events
   }
   
   /**
    * 添加订阅
    * @param {*} instance 实例
    * @param {*} eventName 事件名称  string | string[]
    * @param {*} fn 回调函数 function
    */
   function on(instance, eventName, fn) {
     if(Array.isArray(eventName)) {
       // 处理 eventName 为 数组的情况
       //（如：this.$on(['tab:click', 'tab:change'], () => {})）
       eventName.forEach(c => on(instance, c, fn))
     } else{
       // 获取 instance实例 的事件对象的
       let events = getRegistry(instance)
       // 将回调函数添加到事件对象的 回调函数 列表中
       (events[eventName] || (events[eventName] = [])).push(fn)
     }
   }
   
   /**
    * 发布订阅
    * @param {*} instance 实例
    * @param {*} eventName 事件名称  string | string[]
    * @param {*} args 回调函数 function
    */
   function emit(instance, eventName, args) {
     // 获取 instance实例 中事件名称为 eventName 的回调函数列表
     const cbs = getRegistry(instance)[eventName]
     
     if(cbs) {
       // 在 Vue 源码中，这里是通过 callWithAsyncErrorHandling 函数统一进行执行的
       // 目的是为了统一收集回调函数中的异常
   
       // 执行回调函数（这里我们直接调用了）
       cbs.forEach(fn => {
         fn.apply(instance.proxy, args)
       })
     }
   }
   
   /**
    * 添加订阅（只触发一次）
    * @param {*} instance 实例
    * @param {*} eventName 事件名称  string | string[] 
    * @param {*} fn  回调函数 function
    * @returns 
    */
   function once(instance, eventName, fn) {
     // 由于只需要执行一次，这里对 回调 函数进行了包装
     const wrapped = (...args) => {
       // 执行回调是我们需要吧他删除掉
       off(instance, eventName, fn)
       // 执行回调函数
       fn.call(instance.proxy, ...args)
     }
   
     // 在包装函数上增加一个 fn属性，用于删除这个回调函数时做匹配
     wrapped.fn = fn
     // 添加到 订阅 列表中
     on(instance, eventName, wrapped)
     return instance.proxy
   }
   
   /**
    * 移除订阅事件
    * @param {*} instance 实例
    * @param {*} eventName 事件名称  string | string[]
    * @param {*} fn 回调函数 function
    * @returns 
    */
   function off(instance, eventName, fn) {
     if(Array.isArray(eventName)) {
       // 处理 eventName 为 数组的情况
       eventName.forEach(c => off(instance, c, fn))
     } else {
       const vm = instance.proxy
       const events = getRegistry(instance)
       const cbs = events[eventName]
       // 事件 订阅列表 为空时提前处理
       if(!cbs) {
         return vm
       }
       
       // 没有传入回调函数，直接将 事件订阅列表 清空即可
       if(!fn) {
         events[eventName] = undefined
         return vm
       }
       
       // 过滤掉需要清除的回调，重新赋值给这个事件的 订阅列表
       events[eventName] = cbs.filter(c => !(c === fn))
     }
   }
   ```

   