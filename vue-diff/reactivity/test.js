const { reactive } = require('./reactive.js')
const { ReactiveEffect } = require('./effect.js')

const testObj = reactive({ a: 1 })

const textComputed = () => {
  const testEffect = new ReactiveEffect(() => { 
    return console.log('-- textComputed --', testObj.a) 
  })

  testEffect.run()

  console.log('testEffect.deps', testEffect.deps)
}

textComputed()

testObj.a += 1
console.log('testObj', testObj)
