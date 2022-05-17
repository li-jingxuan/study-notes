const virtualDom = {
  "el": {},
  "component": null,
  "type": "div",
  "props": {},
  "children": [
      {
          "el": {},
          "component": null,
          "type": "children",
          "props": {},
          "children": [
              {
                  "el": {},
                  "component": null,
                  "key": "a",
                  "type": "div",
                  "props": {
                      "key": "a",
                      "id": "old-a"
                  },
                  "children": "a",
                  "shapeFlag": 9
              },
              {
                  "el": {},
                  "component": null,
                  "key": "b",
                  "type": "div",
                  "props": {
                      "key": "b",
                      "id": "old-b"
                  },
                  "children": "b",
                  "shapeFlag": 9
              },
              {
                  "el": {},
                  "component": null,
                  "key": "c",
                  "type": "div",
                  "props": {
                      "key": "b",
                      "id": "old-b"
                  },
                  "children": "b",
                  "shapeFlag": 9
              }
          ],
          "shapeFlag": 17
      }
  ],
  "shapeFlag": 17
}

const oldVirtualDom = {
  "el": {},
  "component": null,
  "type": "div",
  "props": {},
  "children": [
      {
          "el": {},
          "component": null,
          "type": "children",
          "props": {},
          "children": [
              {
                  "el": {},
                  "component": null,
                  "key": "b",
                  "type": "div",
                  "props": {
                      "key": "b",
                      "id": "old-b"
                  },
                  "children": "b",
                  "shapeFlag": 9
              },
              {
                  "el": {},
                  "component": null,
                  "key": "a",
                  "type": "div",
                  "props": {
                      "key": "a",
                      "id": "old-a"
                  },
                  "children": "a",
                  "shapeFlag": 9
              }
          ],
          "shapeFlag": 17
      }
  ],
  "shapeFlag": 17
}
module.exports = {
  virtualDom,
  oldVirtualDom
}
