<!--
  화면명 : MNGCA0010.vue
  화면개요 :HSE 조직도 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import Message from "@hiway/utils/notify"
import TuiTree from '@/components/TuiTree.vue'
import MNGCA0010Popup1 from './MNGCA0010Popup1.vue'
import MNGCA0010Popup2 from './MNGCA0010Popup2.vue'

import OrganizationChart from '@/components/OrganizationChartNode.vue'
// import OrganizationChart from 'vue3-organization-chart'
import 'vue3-organization-chart/dist/orgchart.css'

defineOptions({
  name:'10_management-MNG_A-MNGCA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어
let treeDatas = ref('')

const menuTitle = ref(null)
const gridTitle = ref(null)
const gridTitle1 = ref(null)
const grdMain = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
let searchCk = ref(false)
let createNew = ref(true)
let hiddenJoBtn = ref(true)
let searchBSNSCD = ref(false)
const empPopup = ref(null)
const mNGCA0010Popup1 = ref(null)
const mNGCA0010Popup2 = ref(null)
const deleteNodeList = ref([])
const ds = ref('')

// 코드리스트 선언
const codeList = reactive({
  FULL_DATE: [], //YYYYMMDD
  YEAR: [], //년도
  DATE: [], //월,일
  GUBN: ['안전','환경'], //저장구분 (유지보수 시 이 부분만 수정)
})

const initCodeList = async(val) => {
  Promise.all([
    commonSearchApi({ queryId: "MNGCA0010_SEARCH_03", param: { }, }),
    // commonSearchApi({ queryId: "MNGCA0010_SEARCH_08", param: { }, }),
  ]).then(async (res) => {

    searchParams.YEAR = ''
    searchParams.DATE = ''

    codeList.FULL_DATE = []
    codeList.YEAR = []
    codeList.DATE = []
    // YYYYMMDD
    res[0].ORESULT_CUR.forEach(e => {
      codeList.FULL_DATE.push(e.INSERT_DATE)
    })
    // 년도
    let year = []
    res[0].ORESULT_CUR.forEach(e => {
      year.push(e.INSERT_DATE.slice(0,4))
    })
    
    // 년도 중복 제거
    const set = new Set(year)
    codeList.YEAR = [...set]
    
    // 맨 처음엔 마지막 저장 조직도 조회
    if(val === 'init'){
      if(codeList.YEAR.length > 0){
        searchParams.YEAR = codeList.YEAR[codeList.YEAR.length-1]
        codeList.FULL_DATE.forEach(e => {
          if(e.slice(0,4) === searchParams.YEAR){
            codeList.DATE.push( {title : e.slice(4,6) + '월 ' + e.slice(6,8) + '일', value : e.slice(4,6) + e.slice(6,8) } )
          }
        })
        searchParams.DATE = codeList.DATE[codeList.DATE.length-1].value
        searchParams.FULL_DATE = searchParams.YEAR + searchParams.DATE
        for(let gubnName of codeList.GUBN){
          searchParams.GUBN = gubnName
          let res = await commonSearchApi({ queryId : 'MNGCA0010_SEARCH_09', param: searchParams })
          if(res.ORESULT_CUR[0].COUNT > 0) {
            onButtonsClick({ id: 'btnSearch' })
            break 
          }
        }
      }
    }

    if(val === 'del'){
      searchParams.FULL_DATE = ''
      searchParams.YEAR = '',
      searchParams.DATE = ''
    }
    
    if(val === true){
      searchParams.YEAR = dayjs().format("YYYY")
      searchParams.DATE = dayjs().format("MMDD")
      onButtonsClick({ id: 'btnSearch' })
    }
  })
}

// ---------------------------- Toast Tree ----------------------------
const tree = ref(null)
const tree2 = ref(null)

let treeOptions = reactive({
  tree: {
    text: 'MENUNM', // 트리 구조를 만들 때 화면에 보여질 컬럼
    parent: 'PARENTID', // 트리 구조를 만들 때 사용 할 부모 아이디 컬럼
    id: 'MENUID', // 트리 구조를 만들 때 사용 할 아이디 컬럼
    root: '#', // parent 값 중 루트 노드가 될 값
    dept: 'DEPT_CD',
    asgn: 'ASGN_CD',
    cmpny: 'CMPNY_DIV',
  },
  nodeDefaultState: 'opened', // 'opened', 'closed' 트리 펼침 여부
  isDraggable: true, // 트리 노드 이동 가능 여부
  isEditable: true, // 트리 노드 더블 클릭 수정 가능 여부
})

let treeOptions2 = reactive({
  tree: {
    text: 'MENUNM', // 트리 구조를 만들 때 화면에 보여질 컬럼
    parent: 'PARENTID', // 트리 구조를 만들 때 사용 할 부모 아이디 컬럼
    id: 'MENUID', // 트리 구조를 만들 때 사용 할 아이디 컬럼
    root: '#', // parent 값 중 루트 노드가 될 값
    dept: 'DEPT_CD',
    asgn: 'ASGN_CD',
    cmpny: 'CMPNY_DIV',
  },
  nodeDefaultState: 'opened', // 'opened', 'closed' 트리 펼침 여부
  isDraggable: false, // 트리 노드 이동 가능 여부
  isEditable: false, // 트리 노드 더블 클릭 수정 가능 여부
})

const treeData = ref([]) 

let clickData = reactive({
  CMPNY_DIV : '',
  ASGN_CD : '',
  BSNS_CD : '',
  MENUNM : '',
})

onMounted(() => {
  initCodeList('init')

  menuTitle.value.disableBtn("btnNewVersion", true)
  
  tree.value.setTreeData(treeData.value)
  tree.value.resetAllData()

  nextTick(() => {
    // 일자 가져옴
    tree.value.getTreeTui().on('select', function(event) {
      let nodeData = tree.value.getNodeData(event.nodeId)
      commonRequest("/hse/common/selectList", 
        { queryId : 'MNGCA0010_SEARCH_02', param: nodeData },
        "post",
        "application/json;charset=utf8",
        {useProgress : false} ).then(res => {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })  
    })

    // 조직리스트 선택 이벤트
    tree2.value.getTreeTui().on('select', function(event) {
      clickTree2(event.nodeId)
    })

    // 조직리스트 drag & drop 이벤트로 부모id를 바꿈
    tree2.value.getTreeTui().on('move', function(evt) {
      var nodeId = evt.nodeId;
      var originalParentId = evt.originalParentId;
      var newParentId = evt.newParentId;
      var index = evt.index;

      let getNodeData = tree2.value.getTreeObj().getNodeData(nodeId)
      getNodeData.PARENTID = tree2.value.getTreeObj().getNodeData(newParentId).ASGN_CD
      getNodeData.DEPT_CD = tree2.value.getTreeObj().getNodeData(newParentId).DEPT_CD
      getNodeData.DEPT_NM = tree2.value.getTreeObj().getNodeData(newParentId).DEPT_NM
      getNodeData.node_status = getNodeData.node_status ? getNodeData.node_status : 'updated'
      tree2.value.getTreeObj().setNodeData(nodeId, getNodeData)
    })
  })
})

let clickNodeId= ref('')

const clickTree2 = (nodeId) =>{
  clickNodeId.value = nodeId
  let nodeData = tree2.value.getNodeData(nodeId)
  createNew.value = searchCk.value 
  if(nodeData.node_status === 'created'){
    // 새로 만든 메뉴를 클릭했을때 임직원 목록 추가 저장 삭제 막기
    // searchCk.value = false 
    createNew.value = false
  }
  clickData.CMPNY_DIV = nodeData.CMPNY_DIV
  clickData.ASGN_CD = nodeData.ASGN_CD
  clickData.BSNS_CD = nodeData.BSNS_CD
  clickData.MENUNM = nodeData.MENUNM
  nodeData.FULL_DATE = searchParams.FULL_DATE
  nodeData.GUBN = searchParams.GUBN
  
  commonRequest("/hse/common/selectList", 
    { queryId : 'MNGCA0010_SEARCH_05', param: nodeData},
    "post",
    "application/json;charset=utf8",
    {useProgress : false} ).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
// ---------------------------- Toast Tree ----------------------------

//조회조건
const searchParams = reactive({
  FULL_DATE: '',
  YEAR: '',
  DATE: '',
  GUBN: '안전',
})

const orgParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  ORGN_DIV: 'A',
  // BSNS_CD: userStore.bsnsCd,
  BSNS_CD: '',
  TO_TEAM: 'Y',
  ASGN_CD: ''
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  fields : [
    { fieldName: 'EMP_NO', dataType: 'text', width: '70', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', width: '70', header: { text: t('성명') },  editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '70', header: { text: t('소속') }, editable : false  },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '70', header: { text: t('직위') }, editable : false  },
    { fieldName: 'TEL_NO', dataType: 'text', width: '70', header: { text: t('내선번호') }, editable : false  },
    { fieldName: 'HND_PHN', dataType: 'text', width: '70', header: { text: t('휴대폰번호') }, editable : false  },
    { fieldName: 'EMAIL', dataType: 'text', width: '70', header: { text: t('이메일') }, editable : false  },
    { fieldName: 'ORD', dataType: 'text', width: '30', header: { text: t('순서') }, editable : false  },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
  'EMP_NO',
  'KOR_NM',
  'ASGN_NM',
  'JOB_TIT_NM',
  'TEL_NO',
  'HND_PHN',
  'EMAIL',
  'ORD',
  ],
})

grdMainProps.columns = grdMainProps.fields



watch(() => [searchParams.YEAR, searchParams.DATE, searchParams.GUBN],([newValueYEAR, newValueDATE, newValueGUBN], [oldValueYEAR, oldValueDATE, oldValueGUBN]) => {
  grdMain.value.getDataProvider().setRows()
  treeDatas.value = null
  searchCk.value = false
  createNew.value = false
  menuTitle.value.disableBtn("btnThisDelete", true)
  menuTitle.value.disableBtn("btnOrgPrint", true)
  codeList.DATE = [] 
  codeList.DATE.title = []
  codeList.DATE.value = []


  // 월, 일
  codeList.FULL_DATE.forEach(e => {
    if(e.slice(0,4) === newValueYEAR){
      codeList.DATE.push( {title : e.slice(4,6) + '월 ' + e.slice(6,8) + '일', value : e.slice(4,6) + e.slice(6,8) } )
    }
  })
})

const searchedData = ref('')

const afterSearchData = data => {
  searchedData.value = data
  commonSearchApi({ queryId : 'MNGCA0010_SEARCH_01', param: { BSNS_CD: data.BSNS_CD, PART_CD: data.PART_CD } }).then(res => {
      tree.value.setTreeData(res.ORESULT_CUR)
      treeDatas.value = res.ORESULT_CUR
      tree.value.resetAllData()
      searchCk.value = false
      createNew.value = false
      menuTitle.value.disableBtn("btnThisDelete", true)
      menuTitle.value.disableBtn("btnOrgPrint", false)
    })
  menuTitle.value.disableBtn("btnNewVersion", false)
}

//메뉴버튼
const onButtonsClick = async btn => {
  //debugger
  if (btn.id === 'btnInsa') {
    searchParams.YEAR = ''
    searchParams.DATE = ''
    searchParams.FULL_DATE = ''

    mNGCA0010Popup2.value.openPopup()
  }
  else if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnNewVersion') {
    if(!searchParams.GUBN){
      Message.warn(t("구분을 선택하세요"))
      return false
    }
    let title = '조직도를 새 버전('+dayjs().format("YYYY-MM-DD")+' / '+searchParams.GUBN+')으로 저장하시겠습니까?'
    let ck = await vm.$swal({
      title: title,
      showCancelButton: true,
    })
    if(!ck.isConfirmed){
      Message.warn('취소되었습니다.')

      return 
    }

    let param = [{
      DATE: dayjs().format("YYYYMMDD"),  
      GUBN: searchParams.GUBN,  
      BSNS_CD: (searchedData.value.BSNS_CD === ' ' ? '' : searchedData.value.MENUID),
      userId: userStore.userId
    }]
    await commonExecuteApi({ queryId : 'MNGCA0010_SAVE_01', list: param })
    commonExecuteApi({ queryId : 'MNGCA0010_SAVE_02', list: param }).then( res => {
      Message.success('저장 되었습니다.')
      initCodeList(true)
    })
  }
  else if(btn.id === 'btnThisDelete') {
    if(!searchCk.value){
      Message.warn('삭제할 데이터가 없습니다.')
    }
    if(!createNew.value){
      Message.warn('삭제할 데이터가 없습니다.')
    }
    let ck = await vm.$swal({
      title: t('저장된 조직도를 삭제하시겠습니까?'),
      showCancelButton: true,
    })
    if(!ck.isConfirmed){
      Message.warn('취소되었습니다.')

      return 
    }

    let delParam = { DATE : searchParams.YEAR+searchParams.DATE, GUBN: searchParams.GUBN}

    commonExecuteApi({ queryId : 'MNGCA0010_DELETE_01', list: [delParam] }).then( () => {
      initCodeList('del')
    })

  }
  else if(btn.id === 'btnOrgPrint'){
    if(searchCk.value === true){
      await commonSearchApi({ queryId : 'MNGCA0010_SEARCH_06', param: searchParams }).then( ress => {
        let treeData = tree2.value.getTreeData()

        tree2.value.setTreeData(ress.ORESULT_CUR)
        tree2.value.resetAllData()

        let jsonStr = JSON.stringify(...ress.ORESULT_CUR)
        jsonStr = jsonStr.replace(/<br>/g, "\\r")
        jsonStr = jsonStr.replace(/TITLE/g, "name")
        jsonStr = jsonStr.replace(/NAME/g, "title")
        let json = JSON.parse(jsonStr)

        let dataSource = {
          MENUID: 'AAA1', 
          name: '현대중공업', 
          PARENTID:'#', 
          title: '', 
          children: [],
        }
        dataSource.children.push(json)
        ds.value = dataSource
        
        tree2.value.setTreeData(treeData)
        tree2.value.resetAllData()
      })
    }
    else {
      await commonSearchApi({ queryId : 'MNGCA0010_SEARCH_07', param: { BSNS_CD : searchedData.value.MENUID } }).then( ress => {
        let treeData = tree.value.getTreeData()

        tree.value.setTreeData(ress.ORESULT_CUR)
        tree.value.resetAllData()

        let jsonStr = JSON.stringify(...ress.ORESULT_CUR)
        jsonStr = jsonStr.replace(/<br>/g, "\\r")
        jsonStr = jsonStr.replace(/TITLE/g, "name")
        jsonStr = jsonStr.replace(/NAME/g, "title")
        let json = JSON.parse(jsonStr)
        let dataSource = {
          MENUID: 'AAA1', 
          name: '현대중공업', 
          PARENTID:'#', 
          title: '', 
          children: [],
        }
        dataSource.children.push(json)
        ds.value = dataSource

        tree.value.setTreeData(treeData)
        tree.value.resetAllData()
      })
    }
    const divPrint = document.getElementById("divPrint")
      
      mNGCA0010Popup1.value.openPopup({
        divPrint: divPrint,
        fullDate: searchParams.FULL_DATE ? dayjs(searchParams.FULL_DATE).format("YYYY-MM-DD") +' 버전 조직도' : dayjs().format("YYYY-MM-DD") +' 기준 조직도'
      })
  }
}

// 조직리스트 버튼 클릭
const onLeftButtonsClick = btn => {
  if(btn.id === 'btnAdd'){
      const data = {
        MENUID: Math.random().toString(36).substring(2, 6).toUpperCase(),
        MENUNM: '새메뉴',
        MENUPARENT: '#',
      }

      tree2.value.addRootNode(data)
      hiddenJoBtn.value = false
  }
  else if(btn.id === 'btnUpdate') {
    let createParam = ref(null)
    let updateParam = ref(null)
    let deleteParam = []

    createParam.value = tree2.value.getSaveDataSet().created.map(item => {
      return {
        ...item._data,
        DATE: searchParams.YEAR+searchParams.DATE,
        GUBN: searchParams.GUBN
      }
    }) 

    updateParam.value = tree2.value.getSaveDataSet().updated.map(item => {
      return {
        ...item._data,
        DATE: searchParams.YEAR+searchParams.DATE,
        GUBN: searchParams.GUBN
      }
    }) 
    
    for(let i = 0; i < deleteNodeList.value.length; i++) {
      let deleteMap = {
        MENUID: deleteNodeList.value[i].MENUID,
        DATE: searchParams.YEAR+searchParams.DATE,
        GUBN: searchParams.GUBN
      }
      deleteParam.push(deleteMap)
    }

    if(tree2.value.getSaveDataSet().created.length > 0){
      commonExecuteApi({ queryId : 'MNGCA0010_SAVE_03', list: createParam.value }).finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    }
    if(tree2.value.getSaveDataSet().updated.length > 0){
      commonExecuteApi({ queryId : 'MNGCA0010_SAVE_04', list: updateParam.value }).finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    }
    if(tree2.value.getSaveDataSet().deleted.length > 0){
      commonExecuteApi({ queryId : 'MNGCA0010_DELETE_02', list: deleteParam }).finally(() => {
        deleteNodeList.value = []
        onButtonsClick({ id: 'btnSearch' })
      })
    }
    
    hiddenJoBtn.value = true
  }
  else if(btn.id === 'btnDelete') {
    const getNodeId = tree2.value.getTreeObj().getSelectedNodeId()
    if (!getNodeId) {
      return Message.err('트리 메뉴를 선택해주세요.') 
    }
    for(let node of tree2.value.getTreeData()) {
      if(node.MENUID == tree2.value.getNodeData(getNodeId).MENUID) {
        addDeleteList(node)
        break
      }
    }
    tree2.value.removeNode(getNodeId)
  } else if(btn.id === 'btnExpand') {
    if(searchCk.value) {
      openNode(tree2, tree2.value.getTreeObj().getChildIds(tree2.value.getTreeObj().getRootNodeId()))
    } else {
      
      openNode(tree1, tree1.value.getTreeObj().getChildIds(tree1.value.getTreeObj().getRootNodeId()))
    }

  } else if(btn.id === 'btnCollapse') {
    if(searchCk.value) {
      tree2.value.getTreeObj().close(tree2.value.getTreeObj().getRootNodeId(), true)
    } else {
      tree1.value.getTreeObj().close(tree1.value.getTreeObj().getRootNodeId(), true)
    }
  }
}

// 트리노드 재귀적으로 오픈
const openNode = (tree, nodeId) => {
  tree.value.getTreeObj().open(nodeId, true)
  for(let childId of tree2.value.getTreeObj().getChildIds(nodeId)) {
    openNode(tree, childId)
  }
}

// 삭제 리스트에 추가
const addDeleteList = (parentId) => {
  deleteNodeList.value.push(parentId)
  for(let child of parentId.children) {
    addDeleteList(child)
  }
}
  
// 임직원 목록 버튼 클릭
const onRightButtonsClick = btn => {
  if(btn.id === 'btnAdd') {
    grdMain.value.addRow({
      ORD: grdMain.value.getDataProvider().rowCount + 1
    })
  }
  else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)      
      .setQuery(saveGrdData)
      .setAfter(() => { 
        clickTree2(clickNodeId.value) 
      })
      .run()
  }
  else if(btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { 
        clickTree2(clickNodeId.value) 
      })
      .run()
  } else if (btn.id === 'btnMoveUp') {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdData = grdMain.value.getDataProvider().getJsonRows()
    if(grdData.length > 1 && rowIdx > 0) {
      grdMain.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
      grdMain.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
      grdMain.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdMain.value.getDataProvider().setValue(i, 'ORD', i + 1)
    }
  } else if (btn.id === 'btnMoveDown') {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdData = grdMain.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && grdData.length > rowIdx + 1) {
      grdMain.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
      grdMain.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
      grdMain.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdMain.value.getDataProvider().setValue(i, 'ORD', i + 1)
    }
  }
}

const saveParam = ref(null)

const beforeSave = () => {
  saveParam.value = []

  let result = true

  // 상태바가 체크된 항목
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userId.value
      data.INSERT_DATE = searchParams.YEAR+searchParams.DATE
      data.GUBN = searchParams.GUBN
      saveParam.value.push(data)
    })
  }
  return result
}

const saveGrdData = () => {
  return commonExecuteApi({ queryId : 'MNGCA0010_SAVE_06', list: saveParam.value })
}

const beforeSearch = () => {
  menuTitle.value.disableBtn("btnNewVersion", true)
  if(!searchParams.YEAR){
    Message.warn(t("년도를 선택하세요"))
    return false
  }
  else if(!searchParams.DATE){
    Message.warn(t("일자를 선택하세요"))
    return false
  }
  else if(!searchParams.GUBN){
    Message.warn(t("구분을 선택하세요"))
    return false
  }
  return true
}

const deleteData = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    let delParams = []
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.DATE = searchParams.YEAR+searchParams.DATE
      data.GUBN = searchParams.GUBN
      delParams.push(data)
    })

    return commonExecuteApi({ queryId : 'MNGCA0010_DELETE_03', list: delParams })
  }
}

const searchData = () => {
  searchParams.FULL_DATE = searchParams.YEAR + searchParams.DATE
  return commonSearchApi({ queryId : 'MNGCA0010_SEARCH_04', param: searchParams }) 
}

const afterSearch = async res => {
  searchCk.value = true
  createNew.value = true
  menuTitle.value.disableBtn("btnThisDelete", false)
  menuTitle.value.disableBtn("btnOrgPrint", false)

  await commonSearchApi({ queryId : 'MNGCA0010_SEARCH_06', param: searchParams }).then( ress => {
    tree2.value.setTreeData(ress.ORESULT_CUR)
    tree2.value.resetAllData()

    let jsonStr = JSON.stringify(...ress.ORESULT_CUR)
    jsonStr = jsonStr.replace(/<br>/g, "\\r")
    jsonStr = jsonStr.replace(/TITLE/g, "name")
    jsonStr = jsonStr.replace(/NAME/g, "title")
    
    let json = JSON.parse(jsonStr)
    ds.value = json
     
  })
    
  tree2.value.setTreeData(res.ORESULT_CUR)
  tree2.value.resetAllData()
  hiddenJoBtn.value = true

}

const saveData = async () => {
  let param = [{
    DATE: dayjs().format("YYYYMMDD"),  
    BSNS_CD: (searchedData.value.BSNS_CD === ' ' ? '' : searchedData.value.MENUID),
    userId: userStore.userId
  }]
  await commonExecuteApi({ queryId : 'MNGCA0010_SAVE_01', list: param })
  return commonExecuteApi({ queryId : 'MNGCA0010_SAVE_02', list: param })
  
}

// 년도 선택 시 자동으로 월,일 변경
const changedYEAR = year => {
  codeList.DATE = [] 
  codeList.DATE.title = []
  codeList.DATE.value = []

  // 월, 일
  codeList.FULL_DATE.forEach(e => {
    if(e.slice(0,4) === year){
      codeList.DATE.push( {title : e.slice(4,6) + '월 ' + e.slice(6,8) + '일', value : e.slice(4,6) + e.slice(6,8) } )
    }
  })

}

const rowIdx = ref('')
const popupOpen = ( grid, clickInfo, column ) => {
  if(clickInfo.itemIndex <= -1) {
    return false
  }
  if(searchCk === false){
    return false
  }
  if(grdMain.value.getDataProvider().getRowState(clickInfo.itemIndex) === 'created'){
    rowIdx.value = clickInfo.itemIndex 
    let row = grdMain.value.getRowData(clickInfo.itemIndex)
    empPopup.value.openPopup({ EMP_NM : row.KOR_NM, DISABLE:["전체","사내협력사","단기공사","기타"], })    
  }
}

const selectedEmpData = val => {
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'KOR_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'ASGN_NM', clickData.MENUNM)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'JOB_TIT_NM', val.JOB_TIT_NM)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'TEL_NO', val.TEL_NO)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'HND_PHN', val.HND_PHN)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'EMAIL', val.EMAIL)

  grdMain.value.getDataProvider().setValue(rowIdx.value, 'CMPNY_DIV', clickData.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'ASGN_CD', clickData.ASGN_CD)
  grdMain.value.getDataProvider().setValue(rowIdx.value, 'BSNS_CD', clickData.BSNS_CD)
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        @click-button="onButtonsClick"
        :button-list="['btnInsa', 'btnNewVersion', 'btnSearch', 'btnOrgPrint', 'btnThisDelete']"
      />
    </v-card-title>
      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 d-flex content-area">
        <div class="d-flex flex-column fill-height h-auto">
          <v-sheet class="searchArea d-flex">
            
              <i-select 
                :label="$t('년도')"
                labelWidth="35px"
                width="200px"
                class="ml-4"
                v-model="searchParams.YEAR"
                :items="codeList.YEAR"
                item-value="INSERT_DATE"
                item-title="INSERT_DATE"
                />
                <!-- @update:modelValue="changedYEAR" -->

              <i-select 
                :label="$t('일자')"
                labelWidth="35px"
                width="250px"
                class="ml-4"
                v-model="searchParams.DATE"
                :items="codeList.DATE"
                item-value="value"
                item-title="title"
                />

              <i-select 
                :label="$t('구분')"
                labelWidth="35px"
                width="200px"
                class="ml-4"
                v-model="searchParams.GUBN"
                :items="codeList.GUBN"
                />
          </v-sheet>

          <div class="h-grow">
            <v-sheet class="h-auto mr-2" width="30%">
              <div class="d-flex justify-space-between">
                <IGridTitle 
                  ref="gridTitle"
                  :title="$t('조직 리스트')"
                  @click-button="onButtonsClick"
                />
                <div class="d-flex">
                  <v-btn :disabled="!searchCk" @click="onLeftButtonsClick({ id : 'btnExpand'})">확장</v-btn>
                  <v-btn :disabled="!searchCk" @click="onLeftButtonsClick({ id : 'btnCollapse'})">축소</v-btn>
                  <v-btn :disabled="(hiddenJoBtn ? !searchCk : !hiddenJoBtn)" @click="onLeftButtonsClick({ id : 'btnAdd'})">추가</v-btn>
                  <v-btn :disabled="!searchCk" @click="onLeftButtonsClick({ id : 'btnUpdate'})">저장</v-btn>
                  <v-btn :disabled="!searchCk" @click="onLeftButtonsClick({ id : 'btnDelete'})">삭제</v-btn>
                  <!-- <v-btn @click="save">저장</v-btn> -->
                  <!-- <v-btn @click="openClose">열기/닫기</v-btn> -->
                </div>
              </div>

              <v-card
                border
                class="h-auto overflow-y-auto"
                style="height:300px !important;"
              >
                <TuiTree
                  v-show="!searchCk"
                  treeId="treetui"
                  ref="tree"
                  class="pa-5"
                  :options="treeOptions2"
                  width="inherit"
                />
                  <!-- :tree-data-prop="treeData" -->

                <TuiTree
                  v-show="searchCk"
                  treeId="treetui2"
                  ref="tree2"
                  class="pa-5"
                  :options="treeOptions"
                  width="inherit"
                  
                />
                  <!-- :tree-data-prop="treeData" -->
              </v-card>
              
            </v-sheet>
            <v-sheet class="h-auto" width="70%">
              <div class="d-flex justify-space-between">
                <IGridTitle 
                  ref="gridTitle1"
                  :title="$t('임직원 목록')"
                  @click-button="onButtonsClick" 
                />
                <div class="d-flex">
                  <v-btn :disabled="!createNew" @click="onRightButtonsClick({ id : 'btnMoveUp'})">위로 이동</v-btn>
                  <v-btn :disabled="!createNew" @click="onRightButtonsClick({ id : 'btnMoveDown'})">아래로 이동</v-btn>
                  <v-btn :disabled="!createNew" @click="onRightButtonsClick({ id : 'btnAdd'})">추가</v-btn>
                  <v-btn :disabled="!createNew" @click="onRightButtonsClick({ id : 'btnUpdate'})">저장</v-btn>
                  <v-btn :disabled="!createNew" @click="onRightButtonsClick({ id : 'btnDelete'})">삭제</v-btn>
                  <!-- <v-btn @click="save">저장</v-btn> -->
                  <!-- <v-btn @click="openClose">열기/닫기</v-btn> -->
                </div>
              </div>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellDblClicked="popupOpen"
                />
              </v-sheet>
            </div>
          </div>
          <organization-chart :datasource="ds" id="divPrint" zoom="true" style="display: none; height: 800px; width:1000px; overflow: auto;"/>
      </v-card-text>
    <!-- 인원 팝업 -->
    <EmpPopup ref="empPopup" @selected ="selectedEmpData" />
    <!-- 조직도 확인 팝업 -->
    <MNGCA0010Popup1 ref="mNGCA0010Popup1" /> 
    <!-- 인사데이터 선택 팝업 -->
    <MNGCA0010Popup2 ref="mNGCA0010Popup2" @afterSearch="afterSearchData"/> 
  </v-card>
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
    min-height: 400px;
  }
}

</style>
<style>
.chartOrgchart .chartTitle {
  background: #618fdd !important;
}
.chartOrgchart .chartTopLine{
  border-top-color: #618fdd !important;
}
.chartOrgchart .chartLeftLine{
  border-left-color: #618fdd !important;
}
.chartOrgchart .chartDownLine{
  background: #618fdd !important;
}
.chartOrgchart .chartRightLine{
  border-right-color: #618fdd !important;
}
.chartOrgchart .chartNode{
  border: 2px solid #618fdd !important;
  margin: 0 10px 2px 10px;
}
</style>

