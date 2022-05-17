// Vue3 中的 diff 算法
// 模拟节点
const { oldVirtualDom, virtualDom } = require('./dom')

const ShapeFlags = {
    TEXT_CHILDREN: 1 << 3,
    ARRAY_CHILDREN: 1 << 4
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

/**
 * Vue render模块函数入口函数
 * @param {*} n1 老节点（若老节点为 null， 则为初始化新节点）
 * @param {*} n2 新节点
 * @param {*} container 容器
 */
function patch(n1, n2, container) {
  // 源码中这里会根据 n2 节点的类型进行不同处理
  // 这里只考虑 Element 类型，因为diff算法的核心逻辑在 patchKeyedChildren 这个方法中
  processElement(n1, n2, container)
}

function processElement(n1, n2, container) {
  if (!n1) {
    // mountElement(n2, container);
  } else {
    // todo
    updateElement(n1, n2, container);
  }
}

function updateElement(n1, n2, container) {
  const oldProps = (n1 && n1.props) || {}
  const newProps = (n2 && n2.props) || {}
  const el = (n2.el = n1.el);

  patchProps(el, oldProps, newProps)
  patchChildren(n1, n2, el)
}

function patchProps(el, oldProps, newProps) {
  for(let key in newProps) {
      const oldVal = oldProps[key]
      const newVal = newProps[key]
      if(oldVal !== newVal) {
        // hostPatchProp(el, key, oldVal, newVal);
      }
  }

  for(let key in oldProps) {
      const oldVal = oldProps[key]
      const newVal = null

      if(!(key in newProps)) {
        // hostPatchProp(el, key, oldVal, newVal);
      }
  }
}

function patchChildren(n1, n2, container) {
  const { children: c1, shapeFlag: prevShapeFlag } = n1
  const { children: c2, shapeFlag } = n2

  if(ShapeFlags.TEXT_CHILDREN & shapeFlag) {
    // 如果 新节点n2 是 文本类型
    console.log('c1, c2', n1, n2)
    if(c1 !== c2) {
        // hostSetElementText(container, c2)
        console.log('更新节点文本即可!', container, c2)
    }
  } else if(
    (ShapeFlags.ARRAY_CHILDREN & prevShapeFlag) 
    && (ShapeFlags.ARRAY_CHILDREN & shapeFlag)
  ) {
    // 如果 旧节点n1 与 新节点n2 是数组类型
    patchKeyedChildren(c1, c2, container)
  }
}

function patchKeyedChildren(c1, c2, container) {
    let i = 0; // 当前索引
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // const isSameVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key

    while(i <= e1 && i <= e2) {
        const prevChild = c1[i]
        const nextChild = c2[i]
        if(!isSameVNodeType(prevChild, nextChild)) {
            break
        }
        
        // 相等，继续进行对比
        patch(prevChild, nextChild, container)
        i++
    }

    while(i <= e1 && i <= e2) {
        const prevChild = c1[e1]
        const nextChild = c2[e2]
        if(!isSameVNodeType(prevChild, nextChild)) {
            break
        }

        // 相等，继续进行对比
        patch(prevChild, nextChild, container)
        e1--
        e2--
    }

    /**
     * c1: (a, b, c)
     * c2: (a, b, c), d
     * i = 3   e1 = 2  e2 = 3
     * 
     * c1: (b, c, d)
     * c2: a, (b, c, d)
     * i = 0   e1 = -1  e2 = 0
     */
    if (i > e1 && i <= e2) {
      console.log('新节点 > 老节点')
      while(i <= e2) {
        const n2 = c2[i]
        patch(null, n2, container)
        i++
      }
    } 
    /**
     * c1: a, (c, b)
     * c2: c, b
     * i = 0   e1 = 0  e2 = -1
     * 
     * c1: (c, b), a
     * c2: (c, b)
     * i = 2   e1 = 2  e2 = 1
     */
    else if (i > e2 && i <= e1) {
      console.log('老节点 > 新节点')
      while(i <= e1){
        console.log('删除节点: ', c1[i])
        i++
      }
    } else {
      // 对比完两边的节点后
      // a,b, (c, b, d), a, b  -> e1: 4 i: 2
      // a, b, (b, c, b), a, b -> e2: 4 i: 2
      const s1 = i
      const s2 = i
      // 存储 新节点 key 对应的 索引
      const keyToNewIndexMap = new Map()
      for(i = s2; i < e2; i++) {
        const nextChild = c2[i]
        if(nextChild.key !== null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }
      
      // 新节点长度
      //（
      //  左右对比完成之后的长度，
      //  a, b, (c, c, c), a, b | a, b, (b, b, b), a, b -> len: 3
      //）
      const toBePatched = e2 - s2 + 1
      // 初始化 新节点 Map
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      

      // 遍历老节点
      // 找出 老节点有新节点没有的 -> 进行删除
      // 如果新老节点都有的 -> 继续进行 patch 比对
      for(i = s1; i < e1; i++) {
        const prevChild = c1[i]

        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 如果这个节点没有 Key，则尝试查找相同类型的无键节点
          for(let j = s2; j < e2; j++) {
            if(
              newIndexToOldIndexMap[j - s2] === 0 
                && isSameVNodeType(prevChild, c2[j])
              ) {
                newIndex = j
                break
            }
          }
        }

        if(newIndex === undefined) {
          // 如果新节点中没有这个老节点，删除该节点
          // console.log(prevChild)
        } else {
          // i有可能为0，这里 +1 是保证该值不为 0
          newIndexToOldIndexMap[newIndex - s2] = i + 1

          // 如果新老节点都存在，继续进行对比
          patch(prevChild, c2[newIndex], container)
        }
      }

      // 遍历新节点
      // 1. 新节点不存在  -> 初始化这个节点
      // 2. 新老节点都存在需要移动位置
      for(i = toBePatched - 1; i >=0; i--) {
        const newIndex = s2 + i
        const nextChild =  c2[newIndex]

        if(newIndexToOldIndexMap[i] === 0){
          // 新节点不存在，则初始化一个
          patch(null, nextChild, container)
        } else {
          const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1] : null
          // 插入新元素, 挂载在 container 中
          // 在源码中，这里有一个 move 方法，里面区分了 nextChild 的各种类型，并针对每种类型都进行了处理
          // hostInset(nextChild.el, container, anchor && anchor.el)
        }
      }
    } 
}

const containerBox = null   
patch(oldVirtualDom, virtualDom, containerBox)
