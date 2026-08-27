<!--
  화면명 : MNGCA0010Popup2.vue
  화면개요 :HSE 조직도 -> 부서 데이터 선택 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import TuiTree from '@/components/TuiTree.vue'
import Message from "@hiway/utils/notify"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
let treeDatas = ref('')
let getNodeData = ref('')
const emit = defineEmits(["afterSearch"])

const openPopup =  () => {
  dialog.value = true 
  commonSearchApi({ queryId : 'MNGCA0010_SEARCH_01', param: { BSNS_CD: '', PART_CD: '' } }).then(res => {
    // console.log('res:',res.ORESULT_CUR)
      tree3.value.setTreeData(res.ORESULT_CUR)
      tree3.value.resetAllData()
    })
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnClose') {
    dialog.value = false
  }else if(btn.id === 'btnSelect') {
    // console.log('getNodeData.value.MENUID:',getNodeData.value.BSNS_CD)
    if(!getNodeData.value.BSNS_CD ){
      Message.err('부서를 선택 해 주세요.')
      return false
    }
    // console.log('getNodeData.value:',getNodeData.value)
    commonSearchApi({ queryId : 'MNGCA0010_SEARCH_01', param: { BSNS_CD: getNodeData.value.BSNS_CD, PART_CD: getNodeData.value.MENUID } }).then(res => {
      //console.log('res:',res.ORESULT_CUR)
      if(res.ORESULT_CUR.length === 0){
        Message.err('데이터가 없거나 너무 많습니다. 다른 부서를 선택 해 주세요.')
      }
      else{
        // console.log(getNodeData.value)
        emit("afterSearch", getNodeData.value)
        dialog.value = false
      }
    })

  }
}

defineExpose({
  openPopup,
})


// ---------------------------- Toast Tree ----------------------------
const tree3 = ref(null)

let treeOptions = reactive({
  tree: {
    text: 'MENUNM', // 트리 구조를 만들 때 화면에 보여질 컬럼
    parent: 'PARENTID', // 트리 구조를 만들 때 사용 할 부모 아이디 컬럼
    id: 'MENUID', // 트리 구조를 만들 때 사용 할 아이디 컬럼
    root: '#', // parent 값 중 루트 노드가 될 값
    bsns: 'BSNS_CD',
    dept: 'DEPT_CD',
    asgn: 'ASGN_CD',
    cmpny: 'CMPNY_DIV',
  },
  nodeDefaultState: 'opened', // 'opened', 'closed' 트리 펼침 여부
  isDraggable: false, // 트리 노드 이동 가능 여부
  isEditable: false, // 트리 노드 더블 클릭 수정 가능 여부
})


onMounted(() => {
  
  nextTick(() => {
    // // 날짜 가져옴
    // tree.value.getTreeTui().on('select', function(event) {
    //   let nodeData = tree.value.getNodeData(event.nodeId)
    //   commonRequest("/hse/common/selectList", 
    //     { queryId : 'MNGCA0010_SEARCH_02', param: nodeData },
    //     "post",
    //     "application/json;charset=utf8",
    //     {useProgress : false} ).then(res => {
    //     grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    //   })  
    // })

    // 조직리스트 선택 이벤트
    tree3.value.getTreeTui().on('select', function(event) {
      getNodeData.value = tree3.value.getTreeObj().getNodeData(event.nodeId)
 
      // clickTree2(event.nodeId)
    })

    // 조직리스트 drag & drop 이벤트로 부모id를 바꿈
    // tree2.value.getTreeTui().on('move', function(evt) {
    //   var nodeId = evt.nodeId;
    //   var originalParentId = evt.originalParentId;
    //   var newParentId = evt.newParentId;
    //   var index = evt.index;
      
    //   let getNodeData = tree2.value.getTreeObj().getNodeData(nodeId)
    //   getNodeData.PARENTID = tree2.value.getTreeObj().getNodeData(newParentId).ASGN_CD
    //   getNodeData.DEPT_CD = tree2.value.getTreeObj().getNodeData(newParentId).DEPT_CD
    //   getNodeData.DEPT_NM = tree2.value.getTreeObj().getNodeData(newParentId).DEPT_NM
    //   getNodeData.node_status = getNodeData.node_status ? getNodeData.node_status : 'updated'

    //   tree2.value.getTreeObj().setNodeData(nodeId, getNodeData)

    // })
  })
})



// let clickNodeId= ref('')
// const clickTree2 = (nodeId) =>{
//   clickNodeId.value = nodeId
//   let nodeData = tree2.value.getNodeData(nodeId)
      
//   clickData.CMPNY_DIV = nodeData.CMPNY_DIV
//   clickData.ASGN_CD = nodeData.ASGN_CD
//   clickData.BSNS_CD = nodeData.BSNS_CD
//   clickData.MENUNM = nodeData.MENUNM
//   nodeData.FULL_DATE = searchParams.FULL_DATE
  

//   commonRequest("/hse/common/selectList", 
//     { queryId : 'MNGCA0010_SEARCH_05', param: nodeData},
//     "post",
//     "application/json;charset=utf8",
//     {useProgress : false} ).then(res => {
//     grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
//   })
// }
// ---------------------------- Toast Tree ----------------------------


//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
    height="780"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>부서 데이터 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column fill-height">
            <v-card
                border
                class="h-auto fill-height overflow-y-auto mb-5"
              >
            <TuiTree
              treeId="treetui3"
              ref="tree3"
              class="pa-5"
              :options="treeOptions"
              width="inherit"
            />
            </v-card>
          </v-sheet>
          
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

</style>