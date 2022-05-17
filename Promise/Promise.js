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
          (c) => {
            // 收集结果
            res.push(c)

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

function testMPromise(success) {
  return new MPromise((resolve, reject) => {
    setTimeout(() => {
      success ? resolve(success) : reject(success)
    }, 200)
  })
}
const p1 = testMPromise(true).then((res) => {
  const p = new MPromise((resolve, reject) => {
    resolve('res2' + res)
  })

  return p
})

const p2 = p1.then(res => {
  console.log('res2: ', p1)
  return testMPromise(false)
}).catch(r => {
  console.log('catch: ', r)
})

console.log('p2: ', p2)
