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
    // 处理 eventName 为 数组的情况（如：this.$on(['tab:click', 'tab:change'], () => {})）
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


const instanceTest = { name: 'TestVue', proxy: {} }

emit(instanceTest, 'change', [1, 2, 3])

console.log(eventRegistryMap)