<template>
  <div
    :id="treeId"
    class="tui-tree-wrap"
  />
</template>

<script>
import Tree from 'tui-tree'
import { filter } from 'lodash-es'
import { ref, reactive, onMounted } from 'vue'

const defaultOptions = reactive({
  tree: {
    text: 'text', // 트리 구조를 만들 때 화면에 보여질 컬럼
    parent: 'parent', // 트리 구조를 만들 때 사용 할 부모 아이디 컬럼
    root: 'root', // parent 값 중 루트 노드가 될 값
    id: 'id', // 트리 구조를 만들 때 사용 할 아이디 컬럼
    nodeDefaultState: 'opened', // 'opened', 'closed' 트리 펼침 여부
    isDraggable: true, // 트리 노드 이동 가능 여부
    isEditable: true, // 트리 노드 더블 클릭 수정 가능 여부
    isContextMenu: { // 트리 컨텍스트 메뉴 사용 여부
      use: true,
      menuData: [], // 컨텍스트 메뉴에서 사용할 메뉴 데이터를 입력
      selecteMenu: () => {}, // 메뉴 선택 시 실행
    },
  },
})

export default {
  name: 'tuiTree',
  props: {
    treeId: {
      type: String,
      required: false,
      default() {
        return 'tuiTree'
      },
    },
    options: {
      type: Object,
      required: false,
      default() {
        return defaultOptions
      },
    },
    height: {
      type: Number,
      required: false,
      default: 500,
    },
    width: {
      type: [Number, String],
      default: 300,
    },
  },
  setup(props) {
    let tuiTree = ref('')
    let treeData = ref([])
    let realTree = reactive([])
    const treeSetData = reactive({})
    let getClickData = ref('')

    function getTreeObj() {
      return tuiTree.value
    }

    function resetAllData() {
      saveDataSet.deleted = []

      tuiTree.value.resetAllData(realTree)
    }

    // tui-tree 에 노드 생성, 수정, 삭제 를 감지 하는 이벤트가 없어서 임의로 node_status 라는 것을 만듦
    const saveDataSet = {
      deleted: [], // 삭제시에만 saveDataSet에 들어감
    }

    // 외부에서 쓰는 메소드
    const addRootNode = data => {
      // 최상위 추가
      data.node_status = 'created'
      data.text = data[props.options.tree.text]

      const rootNodeId = tuiTree.value.getRootNodeId()
      const node = tuiTree.value.add(data, rootNodeId)

      tuiTree.value.select(node)
    }

    const addParentNode = (data, nodeId) => {
      // 같은 부모를 가진 노드로 추가 (=같은 레벨)
      data.node_status = 'created'
      data.text = data[props.options.tree.text]

      const parentNodeId = tuiTree.value.getParentId(nodeId)
      const node = tuiTree.value.add(data, parentNodeId)

      tuiTree.value.select(node)
    }

    const addChildNode = (data, nodeId) => {
      // 자식 노드로 추가
      data.node_status = 'created'
      data.text = data[props.options.tree.text]

      const node = tuiTree.value.add(data, nodeId, true)

      tuiTree.value.open(nodeId, true)
      tuiTree.value.select(node)
    }

    const removeNode = nodeId => {
      // 노드 삭제
	  if (typeof nodeId === 'object') {
        nodeId = nodeId[0]
      }
	  
      const data = tuiTree.value.getNodeData(nodeId)

      if (data.node_status !== 'created') {
        data.node_status = 'deleted'

        const getData = tuiTree.value.getNodeData(nodeId)

        getData.nodeId = nodeId

        saveDataSet.deleted.push(getData)
      }

      const childNodes = tuiTree.value.getChildIds(nodeId)

      if (childNodes?.length > 0) {
        childNodes.forEach(item => {
          const getData = tuiTree.value.getNodeData(item)

          if (getData.node_status !== 'created') {
            const getData = tuiTree.value.getNodeData(item)

            getData.nodeId = item

            saveDataSet.deleted.push(getData)
          }
        })
      }
	  
	  tuiTree.value.deselect(nodeId)

      tuiTree.value.remove(nodeId)
    }

    const getNodeData = nodeId => {
      // 현재 노드의 데이터 값 확인
      return tuiTree.value.getNodeData(nodeId)
    }

    const setNodeData = (data, nodeId, flag) => {
      // 현재 노드 데이터 값 수정
      if (data.node_status !== 'created') {
        data.node_status = 'updated'
      }

      tuiTree.value.setNodeData(nodeId, data, flag)
    }

    const getTreeData = () => {
      // 현재 트리 모든 데이터 값 확인
      return treeData.value
    }

    const openParentNode = nodeId => {
      // 부모 노드 펼침
      const getParentNode =  tuiTree.value.getParentId(nodeId)

      if (getParentNode) {
        tuiTree.value.open(getParentNode)

        openParentNode(getParentNode)
      }
    }

    const setTreeData = data => {
      realTree = []
      treeData.value = data
      treeData.value.forEach(element => {
        const a = filter(treeData.value, {
          [props.options.tree.parent]: element[props.options.tree.id],
        })

        element.children = a

        element.text = element[props.options.tree.text]
      })

      const root = filter(treeData.value, {
        [props.options.tree.parent]: props.options.tree.root,
      })

      if (realTree.length !== 1) {
        realTree = root
      } else {
        realTree.push(root)
      }
    }

    const getRealTreeData = () => {
      return realTree
    }

    const getSaveDataSet = () => {
      const targetObj = {
        created: [],
        updated: [],
        deleted: saveDataSet.deleted,
      }

      tuiTree.value.eachAll(node => {
        // console.log('node:',node)
        if (node._data.node_status === 'created') {
          targetObj.created.push({ ...node })
        } else if (node._data.node_status === 'updated') {
          targetObj.updated.push({ ...node })
        }
      })


      return targetObj
    }

    onMounted(() => {
      const container = document.getElementById(props.treeId)

      tuiTree.value = new Tree(container, {
        data: realTree,
        nodeDefaultState: props.options.nodeDefaultState,
        bodyHeight: props.height,
      })
        .enableFeature('Selectable', {
          selectedClassName: 'tui-tree-selected',
        })
        
      if (props.options?.isDraggable) {
        // 트리 노드 이동이 가능한 경우
        tuiTree.value.enableFeature('Draggable', {
          helperClassName: 'tui-tree-drop',
          lineClassName: 'tui-tree-line',
          dragItemClassName: 'tui-tree-drag',
          isSortable: true,
          autoOpenDelay: 200,
        })
      }

      if (props.options?.isEditable) {
        // 트리 노드 수정이 가능한 경우
        tuiTree.value.enableFeature('Editable', {
          dataKey: 'text',
        }).on('beforeEditNode', evt => {
          const data = tuiTree.value.getNodeData(evt.nodeId)

          data.text = evt.value
          data[props.options.tree.text] = evt.value

          setNodeData(data, evt.nodeId)
        })
      }

      if (props.options?.isContextMenu && props.options?.isContextMenu.use) {
        // 트리 노드 컨텍스트 메뉴 사용하는 경우
        tuiTree.value.enableFeature('ContextMenu', {
          menuData: props.options.isContextMenu.menuData,
        })
        tuiTree.value.on('beforeOpenContextMenu', ev => {
          tuiTree.value.select(ev.nodeId)
        })
        tuiTree.value.on('selectContextMenu', props.options.isContextMenu.selecteMenu)
      }      

      container.style.width = props.width
    })

    const getTreeTui = () => {
      return tuiTree.value
    }

    const editNode = () => {
      return tuiTree.value
    }


    const treeNodeData = () => {
      return getClickData.value
    }

    return {
      getTreeObj,
      resetAllData,
      treeSetData,
      addRootNode,
      addParentNode,
      addChildNode,
      removeNode,
      getNodeData,
      setNodeData,
      getTreeData,
      setTreeData,
      getRealTreeData,
      openParentNode,
      getSaveDataSet,
      treeNodeData,
      getTreeTui,
      editNode,
    }
  },
}
</script>

<style lang="scss">
.tui-tree-wrap {
  ul {
    padding-inline-start: 24px;
  }
}

.tui-contextmenu-wrap {
  padding: 10px;
  list-style: none;
}

.tui-contextmenu-item {
  padding: 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  margin-block-end: -1px;
}

.tui-contextmenu-item:hover {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-surface));
}

.tui-tree-wrap .tui-tree-toggle-btn:not(:active) > .tui-ico-tree {
  padding-inline-start: 1px;
}

.v-theme--dark {
  .tui-tree-wrap {
    background-color: transparent;
    cursor: pointer;
    inline-size: 300px;
  }

  .tui-tree-text {
    padding: 2px;
    font-size: 16px;
  }

  .tui-tree-root .tui-tree-node {
    position: relative;
    list-style: none;
  }

  .tui-tree-root .tui-tree-node::before {
    position: absolute;
    background-color: rgb(var(--v-theme-on-surface));
    content: " ";
    inline-size: 1px;
    inset-block: -3px -19px;
    inset-inline-start: -10px;
  }

  body > .tui-tree-root > .tui-tree-node:first-child::before {
    inset-block-start: 12px;
  }

  .tui-tree-root .tui-tree-node:not(:first-child):last-child::before {
    display: none;
  }

  .tui-tree-root .tui-tree-node:only-child::before {
    position: absolute;
    display: list-item;
    background-color: rgb(var(--v-theme-on-surface));
    block-size: 15px;
    content: " ";
    inline-size: 1px;
    inset-block: -2px 7px;
    inset-inline-start: -10px;
  }

  .tui-tree-root .tui-tree-node::after {
    position: absolute;
    background-color: rgb(var(--v-theme-on-surface));
    block-size: 1px;
    content: " ";
    inline-size: 17px;
    inset-block-start: 12px;
    inset-inline-start: -10px;
  }

  .tui-tree-root.child > .tui-tree-node:last-child .tui-tree-node::after {
    position: absolute;
    background: rgb(var(--v-theme-on-surface)); /* background of the site */
    content: "";
    inline-size: 1px;
    inset-block: -9px 4px;
    inset-inline-start: -27px;
  }

  .tui-tree-content-wrapper {
    margin-block-end: 6px;
    margin-inline-start: 6px;
    padding-block: 0;
    padding-inline: 3px 0;
  }

  .tui-tree-selected > .tui-tree-content-wrapper .tui-tree-text {
    border-radius: 3px;
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-background));
  }

  .tui-tree-selected > .search-tui-tree-text {
    .tui-tree-text {
      color: rgb(var(--v-theme-background)) !important;
    }
  }

  .tui-tree-content-wrapper:hover .tui-tree-text,
  .tui-tree-hover > .tui-tree-content-wrapper .tui-tree-text {
    border-radius: 3px;
    background-color: rgb(var(--v-border-color));
    color: rgb(var(--v-theme-background));
  }

  .tui-tree-content-wrapper:active {
    color: rgb(var(--v-theme-primary));
    font-weight: bold;
  }

  .tui-tree-wrap .tui-tree-toggle-btn {
    position: absolute;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    border: solid rgb(var(--v-theme-on-surface)) 1.4px;
    background: rgb(var(--v-theme-on-surface));
    block-size: 13px;
    color: rgb(var(--v-theme-background));
    cursor: pointer;
    font-family: serif;
    font-size: 1em;
    inline-size: 13px;
    inset-block-start: 6px;
    inset-inline-start: -15px;
    padding-block-start: 1px;
  }

  .tui-tree-drop {
    position: fixed !important;
    display: inline-flex;
    align-items: center;
    border: 1px solid #3b355a;
    background-color: rgb(var(--v-theme-on-surface));
    block-size: 20px;
    color: #3b355a;
    font-weight: bold;
    padding-block: 13px;
    padding-inline: 5px;
  }

  .tui-tree-line {
    padding: 0;
    margin: 0;
    background-color: rgb(var(--v-theme-primary));
    block-size: 1px;
    font-size: 0;
    inline-size: 200px;
  }
}

.v-theme--light {
  .tui-tree-wrap {
    background-color: transparent;
    cursor: pointer;
    inline-size: 300px;
  }

  .tui-tree-text {
    padding: 2px;
    font-size: 16px;
  }

  .tui-tree-root .tui-tree-node {
    position: relative;
    list-style: none;
  }

  .tui-tree-root .tui-tree-node::before {
    position: absolute;
    background-color: rgb(var(--v-border-color));
    content: " ";
    inline-size: 1px;
    inset-block: -3px -19px;
    inset-inline-start: -10px;
  }

  body > .tui-tree-root > .tui-tree-node:first-child::before {
    inset-block-start: 12px;
  }

  .tui-tree-root .tui-tree-node:not(:first-child):last-child::before {
    display: none;
  }

  .tui-tree-root .tui-tree-node:only-child::before {
    position: absolute;
    display: list-item;
    background-color: rgb(var(--v-border-color));
    block-size: 15px;
    content: " ";
    inline-size: 1px;
    inset-block: -2px 7px;
    inset-inline-start: -10px;
  }

  .tui-tree-root .tui-tree-node::after {
    position: absolute;
    background-color: rgb(var(--v-border-color));
    block-size: 1px;
    content: " ";
    inline-size: 17px;
    inset-block-start: 12px;
    inset-inline-start: -10px;
  }

  .tui-tree-root.child > .tui-tree-node:last-child .tui-tree-node::after {
    position: absolute;
    background: rgb(var(--v-border-color)); /* background of the site */
    content: "";
    inline-size: 1px;
    inset-block: -9px 4px;
    inset-inline-start: -27px;
  }

  .tui-tree-content-wrapper {
    margin-block-end: 6px;
    margin-inline-start: 6px;
    padding-block: 0;
    padding-inline: 3px 0;
  }

  .tui-tree-selected > .tui-tree-content-wrapper .tui-tree-text {
    border-radius: 3px;
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-background));
  }

  .tui-tree-selected > .search-tui-tree-text {
    .tui-tree-text {
      color: rgb(var(--v-theme-background)) !important;
    }
  }

  .tui-tree-selected > .search-tui-tree-text:hover {
    .tui-tree-text {
      color: rgb(var(--v-theme-primary)) !important;
      background-color: rgb(var(--v-theme-background)) !important;
    }
  }

  .tui-tree-content-wrapper:hover .tui-tree-text,
  .tui-tree-hover > .tui-tree-content-wrapper .tui-tree-text {
    border-radius: 3px;
    background-color: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-surface));
  }

  .tui-tree-content-wrapper:active {
    color: rgb(var(--v-theme-primary));
    font-weight: bold;
  }

  .tui-tree-wrap .tui-tree-toggle-btn {
    position: absolute;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    border: solid rgb(var(--v-border-color)) 1.4px;
    background: rgb(var(--v-theme-background));
    block-size: 13px;
    cursor: pointer;
    font-family: serif;
    font-size: 1em;
    inline-size: 13px;
    inset-block-start: 6px;
    inset-inline-start: -15px;
    padding-block-start: 1px;
  }

  .tui-tree-drop {
    position: fixed !important;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgb(var(--v-theme-background));
    block-size: 20px;
    color: rgb(var(--v-theme-primary));
    font-weight: bold;
    padding-block: 13px;
    padding-inline: 5px;
  }

  .tui-tree-line {
    padding: 0;
    margin: 0;
    background-color: rgb(var(--v-theme-primary));
    block-size: 1px;
    font-size: 0;
    inline-size: 200px;
  }
}

// editable
.tui-tree-input {
  position: absolute;
  top: 0.9%;
  width: 130px;
  margin: 0 0 0 10px;
  padding: 7px 9px;
  height: 1.6em;
  background: rgb(var(--v-theme-background));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.tui-tree-input:focus {
  outline: none;
}

.tui-tree-selected:has(.tui-input-wrap) > .tui-tree-content-wrapper .tui-tree-text  {
  visibility: hidden !important;
}

.tui-tree-selected .tui-input-wrap {
  padding: 0px !important;
}
</style>
