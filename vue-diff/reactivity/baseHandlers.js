const { /**isObject, toRaw */ reactive } = require('./reactive.js')
const { track, trigger } = require('./effect.js')
const { isRef } = require('./ref.js')


function toRaw(observed) {
  // __v_raw 是一个标志位，表示这个是一个 reactive 
  const raw = observed && observed['__v_raw']
  return raw ? toRaw(raw) : observed
}
const isObject = (val) => val !== null && typeof val === 'object'


const arrayInstrumentations = {}
const get =  /*#__PURE__*/  createGetter()

function createGetter(isReadonly =false) {
  return function get(target, key, receiver) {
    // console.log('get: ', key)
    // const targetIsArray = Array.isArray(target)
    
    // TODO 数组的特殊处理，先不进行处理
    // if(!isReadonly && targetIsArray && Object.prototype.hasOwnProperty(arrayInstrumentations, key)) {

    // }

    const res = Reflect.get(target, key, receiver)
    
    // 排除一些 Object自身的内部属性，__v_isRef __isVue __proto__ 等， 过滤掉 symbol
    // if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
    //   return res
    // }

    // 如果是只读的，那么不需要进行收集，因为无法set，就不会被更改
    if(!isReadonly) {
      // 若当前存在 activeEffect(活跃的 effect)，那么需要对其进行收集
      track(target, key)
    }
    
    if(isObject(res)) {
      // 如果结果是一个 Object，比如：const obj = { a: 1, b: { a: '2-1' } }，获取 obj.b.a
      // 如果不将 b 进行响应式代理，那么在读取 a 的时候无法触发 get 方法，因为 proxy 只会代理第一层的对象
      return isReadonly ? '' : reactive(res)
    }

    return res
  }
}

const set = createSetter()
// shallow：浅监听
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    // let oldValue = target[key]
    
    // if(!shallow) {
    // value = toRaw(value)
    // oldValue = toRaw(oldValue)
    // // 如果 oldValue 是一个 Ref
    // // 那么我们只需要更改 oldValue.value 的值即可，因为 Ref 本身就是响应式的
    // if(!Array.isArray(target) && isRef(oldValue) && !isRef(value)) {
    //   oldValue.value = value
    //   return true
    // }
    //}


    // const hadKey = isArray(target) && isIntegerKey(key)
    //                   ? Number(key) < target.length
    //                   : hasOwn(target, key)
    const result =  Reflect.set(target, key, value, receiver)
    console.log(target, toRaw(receiver), target === receiver)
    trigger(target, key)
    // 如果变化发生在 原型链属性上，则不触发（优化的点）
    if (target === toRaw(receiver)) {
      // trigger(target, key)
      // if(!hadKey) {
      //   // 如果这个值不存在，则触发依赖（添加属性时）
      //   trigger(target, 'add', key)
      // } else if(!Object.is(oldValue, value)) {
      //   // 如果两个值不相等，触发依赖（写入属性时）
      //   trigger(target, 'set', key)
      // }
    }
    return result
  }
}

function deleteProperty() {}

function has() {}

function ownKeys() {}

const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
module.exports = {
  mutableHandlers,
  track
}