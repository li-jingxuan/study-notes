## 手写 Promise 实现
### Promise的基本使用
  > Promise定义及用法详情文档：[Promise MAD文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  ```javascript
  function testPromise(param) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        params 
          ? resolve('resolve:' + param) 
          : reject('reject:' + param)
      }, 1000)
    })
  }
  ```
  我们能够通过 .then 方法来获取执行成功或失败的结果，如：
  ```javascript
  const param = true

  testPromise(param).then(res => {
    // 当 param = true 时执行
    console.log(res) // -> resolve: true
  }, err => {
    // 当 param = false 时执行
    console.log(res) // -> reject: false
  })
```

* Promise通常用于需要异步处理，比如HTTP请求等场景
* Promise会加入 JS 的微任务队列，故也可用于特定场景的优化处理
  > 关于JS微任务队列文章参考：[Vue3中微任务队列](https://www.cnblogs.com/jingxuan-li/p/15524999.html)

### 实现Promise
* 目标1：实现简单版本的 MPromise 类\
  Promise是一个类，构造函数接受一个函数，这个函数的两个参数 resolve, reject 也是函数\
  Promise实际上是由三个状态来驱动的: PENDING(等待)、FULFILLED(完成)、REJECTED(拒绝)
  ```javascript
  class MPromise{
    // 分别设置Promise的三个执行状态
    static PENDING = 'PENDING' // 等待
    static FULFILLED = 'FULFILLED' // 已完成 .then
    static REJECTED = 'REJECTED' // 已拒绝 .catch

    constructor(executor) {
      // 初始化状态为 PENDING
      this.status = MPromise.PENDING
      // 分别存储执行 成功 和 执行 失败的值
      this.resolveResult = undefined
      this.rejectReason = undefined
      // 存储回调函数
      // 由于同一个 Promise 的.then函数可以调用多次，这里需要使用数组来存储
      this.callback = []
      // 将 执行函数 中的 resolve与 reject 方法执行 this 绑定
      executor(this._resolve.bind(this), this._reject.bind(this))
    }

    then(resolveFn, rejectFn) {
      this.callback.push({
        resolveFn, 
        rejectFn
      })
    }

    _resolve(result) {
      // 更改状态
      this.status = MPromise.FULFILLED
      // 设置 .then 参数值
      this.resolveResult = result
      // 执行回调函数
      this.callback.forEach(cb => this._handler(cb))
    }

    _reject(errorBody) {
      // 更改状态
      this.status = MPromise.REJECTED
      // 设置 .catch 参数值
      this.rejectReason = errorBody
      // 执行回调函数
      this.callback.forEach(cb => this._handler(cb))
    }

    // 根据当前的状态 执行对应的 callback 函数
    _handler(callback) {
      const { resolveFn, rejectFn } = callback

      if(this.status === MPromise.REJECTED && rejectFn) {
        rejectFn(this.rejectReason)
      } else if(this.status === MPromise.FULFILLED && resolveFn) {
        resolveFn(this.resolveResult)
      }
    }
  }
  ```
  我们可以先对简单版本的 MPromise 进行测试
  ```javascript
  function testMPromise(test) {
    return new MPromise((resolve, reject) => {
      setTimeout(() => {
        test ? resolve('resolve') : reject('resolve')
      }, 500)
    })
  }

  const p = testMPromise(true).then(r => {
    console.log('then: ', r) // -> 在 500ms 后输出： then：resolve
  })

  // 由于我们没有实现链式调用，p输出的是 undefined，所有 p.then 会抛出异常
  console.log(p)
  ```
* 目标2：实现链式调用\
  实现链式调用我们需要在调用 then 方法时返回一个新的 MPromise 对象\
  然后我们需要对 _handle 函数进行改造，因为我们需要将上一次 then 函数的返回值传递下去
  我们还需要处理 then 中返回的是一个 MPromise 对象的情况
  > 这里不能直接将 this 返回，我们必须保证每一个 MPromise 都是独立的，不然会造成内部变量的混乱
  ```javascript
  // 添加一个工具函数，判断是否为 MPromise 类型对象
  const isMPromise = (obj) => obj instanceof MPromise

  class MPromise {
    // ......
    then(resolveFn, rejectFn) {
      const newMPromiseCb = (nextResolveFn, nextRejectFn) => {
        // 我们不能在使用 this.callback.push() 的方式添加回调函数
        // 这样会导致不在同一个上下文(this)中
        // 调用处理函数 _handler，在 _handler 函数中去添加 callback
        // 这样就能保证往正确的上下文this中添加回调
        this._handler({
          resolveFn,
          rejectFn,
          nextResolveFn,
          nextRejectFn,
        })
      }

      // 处理链式调用的问题:
      // 创建一个 新的 MPromise 对象，并将其返回，使其能够进行链式调用
      return new MPromise(newMPromiseCb)
    }

    // 还需要考虑.then中返回的是一个 MPromise 对象该如何处理？ 
    _resolve(result) {
      if(isMPromise(result)) {
        // 若上一次处理的返回值为一个 MPromise 对象
        // 需要执行这个 MPromise
        // 将 FULFILLED 和 REJECTED 状态分别交给 this._resolve 和 _reject去执行
        result.then(
          this._resolve.bind(this),
          this._reject.bind(this)
        )
      } else {
        // 更改状态
        this.status = MPromise.FULFILLED
        // 设置 .then 参数值
        this.resolveResult = result
        // 执行回调函数
        this.callback.forEach(cb => this._handler(cb))
      }
    }

    _reject(errorBody) {
      // 与 _resolve 中的处理逻辑相同
      if(isMPromise(errorBody)) {
        errorBody.then(
          this._resolve.bind(this),
          this._reject.bind(this)
        )
      } else {
        // 更改状态
        this.status = MPromise.REJECTED
        // 设置 .catch 参数值
        this.rejectReason = errorBody
        // 执行回调函数
        this.callback.forEach(cb => this._handler(cb))
      }
    }

    _handle(callback) { 
      const { 
        resolveFn, 
        rejectFn, 
        nextResolveFn
        nextRejectFn
      } = callback

      // 当 MPromise 状态为 PENDING 时将其回调函数收集到 this.callback 中
      if(this.status === MPromise.PENDING) {
        this.callback.push(callback)
        return
      }

      if(this.status === MPromise.REJECTED && rejectFn) {
        const reason = rejectFn
                        ? rejectFn(this.rejectReason)
                        :this.rejectReason
        nextRejectFn(reason)
      } else if(this.status === MPromise.FULFILLED && resolveFn) {
        // 先判断是否传入了 resolveFn 回调函数
        // 存在 则需要执行该函数，并将其返回值作为 nextResolveFn 的参数传入进去
        const reason = rejectFn 
                        ? resolveFn(this.resolveResult)
                        : this.resolveResult
        nextResolveFn(reason)
      }
    }
  }
  ```
* 目标3：实现常用的静态方法\
  .catch
  ```javascript
  class MPromise{
    // ...
    // 添加 catch 函数
    catch(rejectFn) {
      // 我们只需要调用一下 then 方法，并将第一个参数传入 undefined 即可
      return this.then(undefined, rejectFn)
    }
    // ...
  }
  ```
  .finally
  ```javascript
  class MPromise{
    // ...
    // 添加一个 finally 函数
    finally(fn) {
      // 这里我们只需要将传入的回调函数 fn，都当做 then 函数的参数传进去即可
      // 因为 then 函数中会根据状态至少执行其中一个函数
      this.then(fn, fn)
    }
    // ...
  }
  ```
  Promise.reject 与 Promise.resolve
  ```javascript
  class MPromise {
    // ...
    static reject(errorBody) {
      // 其实只要注意判断传入的 参数 是否为一个 MPromise，或者是 存在 catch 属性的一个对象
      if(errorBody instanceof MPromise || (typeof errorBody === 'object' && 'catch' in errorBody)) {
        // 直接把这个对象返回就行了
        return errorBody
      }

      // 包装一下，返回一个状态为 REJECTED MPromise 对象即可
      return new MPromise((resolve, reject) => {
        reject(errorBody)
      })
    }
    
    // resolve 与 reject 方法一致
    static resolve(resolveValue) {
      if(errorBody instanceof MPromise || (typeof errorBody === 'object' && 'then' in resolveValue)) {
        return resolveValue
      }
      return new MPromise(resolve => resolve(resolveValue))
    }
    // ...
  }
  ```
  Promise.all
  ```javascript
  class MPromise {
    // ...
    // iterables: 为数组类型
    static all(iterables) {
      const res = []
      return new MPromise((resolve, reject) => {
        iterables.forEach((c, index) => {
          // MPromise.resolve 转换为 MPPromise 对象
          MPromise.resolve(c).then(
            (res) => {
              // 收集结果
              res.push(res)

              if(index >= iterables.length - 1) {
                resolve(res)
              }
            }, 
            // 若执行到 reject 则会直接停止调用并且返回当次执行失败的原因
            reject
          )
        })
      })
    }
    // ...
  }
  ```
### 完整代码
  >1.[手写Promise - 实现一个基础的Promise](https://segmentfault.com/a/1190000023180502)\
  >2.[手把手教你实现 Promise](https://segmentfault.com/a/1190000023858504)\
  >3.建议版本没有处理异常等信息
```javascript
const isMPromise = (obj) => obj instanceof MPromise

class MPromise{
  static PENDING = 'PENDING'
  static FULFILLED = 'FULFILLED'
  static REJECTED = 'REJECTED'

  constructor(executor) {
    // 初始化状态为 PENDING
    this.status = MPromise.PENDING
    // 分别存储执行 成功 和 执行 失败的值
    this.resolveResult = undefined
    this.rejectReason = undefined
    // 存储回调函数
    this.callback = []
    // 将 执行函数 中的 resolve与 reject 方法执行 this 绑定
    executor(this._resolve.bind(this), this._reject.bind(this))
  }

  then(resolveFn, rejectFn) {
    // 实现链式调用，返回一个新的 MPromise 对象
    const _promise = new MPromise((nextResolve, nextReject) => {
      this._handler({
        resolveFn,
        rejectFn,
        nextReject,
        nextResolve
      })
    })
    return _promise
  }

  catch(rejectFn) {
    return this.then(undefined, rejectFn)
  }

  // 添加一个 finally 函数
  finally(fn) {
    // 这里我们只需要将传入的回调函数 fn，都当做 then 函数的参数传进去即可
    // 因为 then 函数中会根据状态至少执行其中一个函数
    this.then(fn, fn)
  }
  
  // iterables: 为数组类型
  static all(iterables) {
    const res = []
    return new MPromise((resolve, reject) => {
      iterables.forEach((c, index) => {
        // MPromise.resolve 转换为 MPPromise 对象
        MPromise.resolve(c).then(
          (res) => {
            // 收集结果
            res.push(res)

            if(index >= iterables.length - 1) {
              resolve(res)
            }
          }, 
          // 若执行到 reject 则会直接停止调用并且返回当次执行失败的原因
          reject
        )
      })
    })
  }

  static reject(errorBody) {
    if(errorBody instanceof MPromise || (typeof errorBody === 'object' && 'catch' in errorBody)) {
      return errorBody
    }
    return new MPromise((resolve, reject) => {
      reject(errorBody)
    })
  }

  static resolve(resolveValue) {
    if(errorBody instanceof MPromise || (typeof errorBody === 'object' && 'then' in resolveValue)) {
      return resolveValue
    }
    return new MPromise(resolve => resolve(resolveValue))
  }

  _resolve(result) {
    if(isMPromise(result)) {
      result.then(
        this._resolve.bind(this),
        this._reject.bind(this)
      )
    } else {
      this.status = MPromise.FULFILLED
      this.resolveResult = result
      // console.log('callback', this.callback)
      this.callback.forEach(cb => this._handler(cb))
    }
  }

  _reject(errorBody) {
    if(isMPromise(errorBody)) {
      result.then(
        this._resolve.bind(this),
        this._reject.bind(this)
      )
    } else {
      this.status = MPromise.REJECTED
      this.rejectReason = errorBody

      this.callback.forEach(cb => this._handler(cb))
    }
  }

  _handler(callback) {
    if(this.status === MPromise.PENDING) {
      this.callback.push(callback)
      return
    }

    const { 
      resolveFn,
      rejectFn,
      nextReject,
      nextResolve
    } = callback
    
    if(this.status === MPromise.REJECTED && rejectFn) {
      const _reason = rejectFn ? rejectFn(this.rejectReason) : this.rejectReason
      nextReject(_reason)
    }else if(this.status === MPromise.FULFILLED && resolveFn) {

      const _reason = resolveFn ? resolveFn(this.resolveResult) : this.resolveResult
      // 将上一个 then 中的返回值作为下次 then 的参数传入
      nextResolve(_reason)
    }
  }
}
```
