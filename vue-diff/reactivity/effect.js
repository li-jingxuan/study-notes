// 记录当前活跃的对象
let activeEffect
// 标记是否追踪
let shouldTrack = false

// 存储已经收集的依赖(reactive)
const targetMap  = new WeakMap()

const isTracking = () => activeEffect && shouldTrack

function trackEffects(dep) {
  if(!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

function triggerEffects(dep) {
  for (const effect of dep) {
    // 这里做个判断，执行的 effect 不是 当前活跃的 effect
    if(effect !== activeEffect) {
      if(effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  }
}

function trigger(target, key /* type, oldValue, newValue, oldTarget */) {
  console.log('targetMap--: ', targetMap)

  const depsMap = targetMap.get(target)

  const deps = depsMap.get(key)

  triggerEffects([...deps])
}

class ReactiveEffect{
  active = true
  deps = []
  onStop = null

  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
  }

  run() {
    if(!this.active) {
      return this.fn()
    }

    // 源码这里用了两个工具函数：pauseTracking 和 enableTracking 来改变 shouldTrack的状态
    shouldTrack = true
    activeEffect = this
    
    // 在设置完 activeEffect 后执行，在方法中能够对当前活跃的 activeEffect 进行依赖收集
    const result = this.fn()
    
    shouldTrack = false
    // 执行完副作用函数后要清空当前活跃的 effect
    activeEffect = undefined

    return result
  }

  // 暂停追踪
  stop() {
    if (this.active) {
      // 找到所有依赖这个 effect 的响应式对象
      // 从这些响应式对象里面把 effect 给删除掉
      cleanupEffect(this)
      // 执行onStop回调函数
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

// 依赖收集
function track(target, key /** trackType */) {
  if(!isTracking()) {
    return
  }

  // 从缓存列表中尝试获取
  let depsMap = targetMap.get(target)
  if(!depsMap) {
    // 如果没有被收集过，那么进行收集
    targetMap.set(target, (depsMap = new Map()))
  }

  // 尝试从已收集的依赖中获取 effects
  let dep = depsMap.get(key)
  if(!dep) {
    // 如果这个这个 key 不存在
    depsMap.set(key, (dep = new Set()))
  }
  // 进行 effect 收集，dep.add(activeEffect)
  trackEffects(dep)
}

module.exports = {
  ReactiveEffect,
  isTracking,
  trackEffects,
  triggerEffects,
  track,
  trigger
}
