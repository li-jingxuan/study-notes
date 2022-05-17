### Vue3中的响应式对象Reactive源码分析

> ReactiveEffect.js 中的 trackEffects函数 及 ReactiveEffect类 在Ref随笔中已经介绍，在本文中不做赘述
>
> 本文中所有的源代码均为 JS简易版本，便于阅读理解

[Vue3源码分析之 Ref 与 ReactiveEffect](https://www.cnblogs.com/jingxuan-li/p/15703324.html)

**Reactive流程图**

![image-20211222162016829](C:\Users\xuan\AppData\Roaming\Typora\typora-user-images\image-20211222162016829.png)

1. reactive(obj) 都做了些什么？

   reactive函数其实只做了 *过滤只读对象* 的功能，创建 Proxy 代理是通过调用 *createReactiveObject* 函数来进行的

   *reactive 函数源代码*

   ```javascript
   // WeakMap 可以有效避免内存泄漏问题，因为他的键是弱引用的
   // const reactiveMap = new WeakMap(): 已收集的依赖的缓存列表（属于：effect模块）
   // const { mutableHandlers } = require('./baseHandlers模块')
   
   function reactive(target) {
     // 如果这个对象被标记为只读，那么我们只需要将他返回即可（因为只读不存在修改）
     if(target && target[ReactiveFlags.IS_READONLY]) {
       return target
     }
     return createReactiveObject(
       target,
       mutableHandlers,
       reactiveMap
     )
   }
   ```

   createReactiveObject 函数返回一个 响应式代理(Proxy),  针对 目标对象(target) 进行过滤和特殊处理

   *createReactiveObject 函数源代码*

   ```javascript
   /**
    * 创建 reactive 响应式代理
    * @param {*} target 代理对象
    * @param {*} baseHandlers Array Object
    * @param {*} proxyMap 依赖 缓存集合
    * 下方特殊类型暂时不实现，不影响核心逻辑
    * collectionHandlers：主要是处理：Map、Set、WeakMap、WeakSet 类型
    * isReadonly： 是否只读
    * @returns Proxy
    */
   function createReactiveObject(target, baseHandlers, proxyMap /* collectionHandlers, isReadonly */) {
     // 如果不是一个对象（这里没有在 reactive 中做处理，是由于 readonly 类似的api也需要调用该函数）
     if(!isObject(target)) {
       return target
     }
   
     // 如果已经收集，将缓存列表中的内容返回即可
     const existingProxy = proxyMap.get(target)
     if(existingProxy) {
       return existingProxy
     }
   
     // 创建代理对象（目前仅处理 Array、Object）
     const proxy = new Proxy(target, baseHandlers) // collectionHandlers)
   
     // 收集已经代理的对象
     proxyMap.set(target, proxy)
     // 将响应式对象 Proxy 返回
     return proxy
   }

2. baseHandlers 模块中是如何创建 get 和 set 等方法的？

   mutableHandlers 对象中包含 get, set, deleteProperty, has, ownKeys 几种操作方法

   ```javascript
   /**
    * 以下方法本文不进行实现：
    * deleteProperty: 删除属性时*
    * has：检查目标对象是否存在此某个属性（因为 写入/删除 对象属性会受到影响，需要收集）
    * ownKeys：获取keys数组列表（因为如果 写入/删除 对象中的属性，keys数组长度会变化，需要收集)
   */
   ```

   *get = createGetter()实现代码*

   ```javascript
   const get = createGetter()
   
   function createGetter(isReadonly =false) {
     return function get(target, key, receiver) {
       // console.log('get: ', key)
       // const targetIsArray = Array.isArray(target)
       
       // 源码中数组的特殊处理，主要是针对数组的一些原生方法进行处理（源码中对应的函数：createArrayInstrumentations()）
       // 处理：'push', 'pop', 'shift', 'unshift', 'splice'(避免数组长度被追踪，某些情况可能造成无限循环)
       // 处理：'includes', 'indexOf', 'lastIndexOf'（对可能产生依赖作用的方法进行追踪）
       // if(!isReadonly && targetIsArray && Object.prototype.hasOwnProperty(arrayInstrumentations, key)) {
       // }
   
       const res = Reflect.get(target, key, receiver)
       // 如果是只读的，那么不需要进行收集，因为无法set，就不会被更改
       if(!isReadonly) {
         // 若当前存在 activeEffect(活跃的 effect)，那么需要对其进行收集
         track(target, key)
       }
       
       if(isObject(res)) {
         // 如果结果是一个 Object，比如：const obj = { a: 1, b: { a: '2-1' } }，获取 obj.b.a
         // 如果不将 b 进行响应式代理，那么在读取 a 的时候无法触发 get 方法，因为 proxy 只会作用第一层对象
         // 源码中有一个 shallow 参数来判读是否 执行嵌套对象的深度转换
         return isReadonly ? '' : reactive(res)
       }
   
       return res
     }
   }
   ```

   createSetter函数核心逻辑其实就是 执行 Reflect.set 方法，触发trigger

   *set = createSetter()实现代码*

   ```javascript
   const set = createSetter()
   // shallow：浅监听
   function createSetter(shallow = false) {
     return function set(target, key, value, receiver) {
       // 要在 trigger 函数执行之前更改值，否则拿不到最新的值
       const result =  Reflect.set(target, key, value, receiver)
   
       trigger(target, key)
       // trigger函数执行完成后，返回结果
       return result
     }
   }
   ```

   baseHandlers 模块会导出一个 mutableHandlers 对象

   ```javascript
   export const mutableHandlers = {
     get,
     set,
     deleteProperty,
     has,
     ownKeys
   }
   ```

3. effect 模块的拓展

   effect模块针对 reactive，主要增加了 track(收集依赖)、trigger(触发依赖) 两个方法及 targetMap(缓存 effec) 属性

   *effct.js*

   > effect模块源码在讲解 Ref 的随笔中已进行分析（[Vue3源码分析之 Ref 与 ReactiveEffect](https://www.cnblogs.com/jingxuan-li/p/15703324.html)）

   ```javascript
   let activeEffect // 记录当前活跃的对象
   let shouldTrack = false // 标记是否追踪
   
   const isTracking = () => activeEffect && shouldTrack // 工具函数
   
   // 新增：存储已经收集的依赖(reactive)
   const targetMap  = new WeakMap()
   // ...... 其他
   ```

   *track 源码*

   ```javascript
   // 依赖收集
   function track(target, key /** trackType */) {
     if(!isTracking()) {
       return
     }
   
     // 从缓存列表中尝试获取
     let depsMap = targetMap.get(target)
     if(!depsMap) {
       // 如果没有被收集过，那么进行收集， 那么创建一个 depsMap
       targetMap.set(target, (depsMap = new Map()))
     }
   
     // 尝试从已收集的依赖中获取 effects
     let dep = depsMap.get(key)
     if(!dep) {
       // 如果这个这个 key 不存在，则创建一个 dep
       depsMap.set(key, (dep = new Set()))
     }
   
     // 进行 effect 收集，dep.add(activeEffect)
     trackEffects(dep)
   }
   ```

   *trigger 源码*

   ```javascript
   /**
   * type, oldValue, newValue, oldTarget：这几个参数在源码中，主要是为了 dev 环境中的日志提示作用
   */
   function trigger(target, key /* type, oldValue, newValue, oldTarget */) {
     const depsMap = targetMap.get(target)
     // depsMap可能为空
     if (!depsMap) {
       return
     }
    
     const deps = depsMap.get(key)
     // 将 set对象 deps 转为数组
     triggerEffects([...deps])
   }
   ```

   *测试代码*

   ```javascript
   const testObj = reactive({ a: 1 })
   
   // 模拟一个 computed
   const testComputed = () => {
     // 创建一个 effect
     const testEffect = new ReactiveEffect(() => { 
       // 在回调函数中打印 testObj.a
       return console.log('-- textComputed --', testObj.a) 
     })
   
     // 此时，targetMap.get(target) = dep<Set>[testEffect<ReactiveEffect>]
     // testEffect.deps = [dep<Set>[testEffect<ReactiveEffect>]]
     testEffect.run()
   
     console.log('testEffect.deps', testEffect.deps)
   }
   
   testComputed() 
   
   testObj.a += 1 // console -> -- textComputed -- 2
   ```




> 备注：手写的 JS 简易版本源码，方便阅读理解很多边缘情况并没有完全考虑，问题请留言
