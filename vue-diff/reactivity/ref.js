const { toReactive, toRaw } = require('./reactive.js')
const { ReactiveEffect, isTracking, trackEffects, triggerEffects } = require('./effect.js')

function trackRefValue(ref) {
  if(!isTracking()) {
    return
  }

  if(!ref.dep) {
    ref.dep = new Set()
  }

  trackEffects(ref.dep)
}

function triggerRefValue(ref) {
  triggerEffects(ref.dep);
}

class RefImpl{
  dep
  _rawValue
  __v_isRef = true
  constructor(value, _shallow) {
    this._value = value
    // 存储原始值，用来与新值做对比
    this._rawValue = _shallow ? value : toRaw(value)
    this._value = _shallow ? value : toReactive(value)
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal)
    // Object.is() 方法判断两个值是否为同一个值。
    if (!Object.is(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = this._shallow ? newVal : toReactive(newVal)
      triggerRefValue(this) // ,newValue) 在dev环境下使用了 newValue，这里忽略
    }
  }
}

function isRef(r) {
  return Boolean(r && r.__v_isRef === true)
}
function createRef(rawValue, _shallow) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, _shallow)
}

function ref(val) {
  return createRef(val, false)
}

// const testRef = ref(1)

// const textComputed = () => {
//   const testEffect = new ReactiveEffect(() => { 
//     console.log('textComputed', testRef.value) 
//   })

//   testEffect.run()

//   console.log('testEffect.deps', testEffect.deps)
// }
// const textComputed1 = () => {
//   const fn = () => {  console.log('textComputed', testRef.value) }
//   const testEffect = new ReactiveEffect(fn)

//   testEffect.run()
// }

// textComputed1()
// textComputed()
// console.log('testRef', testRef)
// testRef.value ++

module.exports = {
  isRef,
  ref
}