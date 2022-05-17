const { mutableHandlers } = require('./baseHandlers.js')

const ReactiveFlags = {
  SKIP: '__v_skip',
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw'
}
// 存储已经收集的依赖
const reactiveMap = new WeakMap()
const isObject = (val) => val !== null && typeof val === 'object'

const toReactive = val =>
  isObject(val) ? reactive(val) : val

function toRaw(observed) {
  // __v_raw 是一个标志位，表示这个是一个 reactive 
  const raw = observed && observed['__v_raw']
  return raw ? toRaw(raw) : observed
}

/**
 * 创建 reactive 响应式代理
 * @param {*} target 代理对象
 * @param {*} baseHandlers Array Object
 * @param {*} proxyMap 依赖 缓存集合
 * 暂时不实现
 * collectionHandlers：主要是处理：Map、Set、WeakMap、WeakSet 类型
 * isReadonly： 是否只读
 * @returns Proxy
 */
function createReactiveObject(target, baseHandlers, proxyMap /* collectionHandlers, isReadonly */) {
  // 如果不是一个对象
  if(!isObject(target)) {
    return target
  }

  // 如果已经收集
  const existingProxy = proxyMap.get(target)
  if(existingProxy) {
    return existingProxy
  }

  // 创建代理对象（目前仅处理 Array、Object）
  const proxy = new Proxy(target, baseHandlers) // collectionHandlers)

  // 收集已经代理的对象
  proxyMap.set(target, proxy)

  console.log('proxyMap --: ', proxyMap)
  return proxy
}

function reactive(target) {
  // 如果是 只读 属性
  if(target && target[ReactiveFlags.IS_READONLY]) {
    return target
  }
  return createReactiveObject(
    target,
    mutableHandlers,
    reactiveMap
  )
}


module.exports = {
  toReactive,
  toRaw,
  reactive,
  ReactiveFlags,
  isObject
}
