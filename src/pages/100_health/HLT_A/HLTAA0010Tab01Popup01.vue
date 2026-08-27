<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 평가대상 조직관리(탭) > 대상 조직 설정(팝업)
-->

<script setup>
import { ref, reactive, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { isEmpty } from '@/@core/utils'
import { commonSearchApi } from "@hiway/api/commonApi"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const props = defineProps({
  NOTICE_DIV_LIST: {
    Type: Array,
    default: [],
  },
  id: {
    Type: String,
    default: "",
  },
})

const emit = defineEmits(['add-dept'])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const errMsg = ref('')
const tempList = ref([])

const codeList = reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
})

/* 안전요원 조회 조건 */
const searchParams = reactive({
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: '',
    HALF_DIV: '',
    REG_DIV: '',
    BSNS_CD: '',
    ORGN_DIV: 'A',
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: false } },
  keys : ['KFIELD'],
  fields : [
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', header: { text: t('회사코드') }, visible : false },  
    { fieldName: 'ASGN_CD', dataType: 'text', width: '120', header: { text: t('부서코드') }, visible : false  },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '120', header: { text: t('사업부 조직') }, styleName: 'left-column', width : '100' },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '120', header: { text: t('사업부코드') }, visible : false },
    { fieldName: 'BSNS_NM', dataType: 'text', width: '120', header: { text: t('사업부코드') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '120', header: { text: t('부서코드') }, visible : false  },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '120', header: { text: t('부서코드') }, visible : false  },
    { fieldName: 'WK_REL_CD', dataType: 'text', width: '120', header: { text: t('WK_REL_CD') }, visible : false  },
    { fieldName: 'PPIELD', dataType: 'text', width: '120', header: { text: t('PPIELD') }, visible : false  },
    { fieldName: 'KFIELD', dataType: 'text', width: '120', header: { text: t('KFIELD') }, visible : false  },
    { fieldName: 'ORGN_DIV', dataType: 'text', width: '120', header: { text: t('조직구분') }, visible : false  },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  // 받아온 값 저장
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.YEAR = param.YEAR
  searchParams.REG_DIV = param.REG_DIV
  getData()
  dialog.value = true
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchData = () => { 
  return commonSearchApi({ queryId : 'HLTAA0010_TAB01_POPUP01', param: searchParams })
}

//조회 후 반영
const afterSearch = res =>{
  // console.log('res : ' , res)
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'KFIELD')
  grdMain.value.getGridView().expandAll()

  // 협력사만 조회하기 할 때 하위노드에 협력사가 없으면 나타나지 않도록 필터
  if(searchParams.ORGN_DIV === 'B') {
    let rootList = []
    tempList.value = []
    
    // 루트노드를 찾아내기 위한 대?장정
    for(let i = 1; i <= grdMain.value.getDataProvider().getRowCount(); i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(i)
      if(data.KFIELD.split(',').length <= 4) {
        rootList.push(i)
      }
    }

    // 재귀함수 시작 해버리기~
    for(let idx of rootList) {
      nodeOrganize(idx)
    }
    tempList.value = tempList.value.sort((a,b) => a.KFIELD.localeCompare(b.KFIELD))
    grdMain.value.getDataProvider().setRows([])
    grdMain.value.getDataProvider().setRows(tempList.value, 'KFIELD')
    grdMain.value.getGridView().expandAll() 
  }
}

// 최하위 노드가 없으면 행삭제(재귀함수로 확인)
const nodeOrganize = (index) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index)
  let childList = grdMain.value.getDataProvider().getChildren(index)
  let result = false
  // 하위 노드가 없을때
  if(isEmpty(childList)) {
    if(data.ORGN_DIV == 'B') {
      // 협력사면 return true
      if(!tempList.value.includes(data)) {
        tempList.value.push(data)
      }
      return true
    } else {
      // 아니면 return false
      return false
    }
  } else { // 하위노드가 있을 때
    for(let idx of childList) {
      // 재귀로 돌려버리기~
      if(nodeOrganize(idx)) {
        // 하위데이터중 협력사가 있다고 하면? 리스트에 넣어버리기~
        if(!tempList.value.includes(data)) {
          tempList.value.push(data)
        }
        result = true
      } 
    }
  }
  return result
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnCreate') {
    addDept()
  } else if (btn.id === "btnClose") {
    closePopup()
  } else if (btn.id === 'btnExpand') {
    grdMain.value.getGridView().expandAll()
  } else if (btn.id === 'btnCollapse') {
    grdMain.value.getGridView().collapseAll()
  }
}

const addDept = () => {
  // console.log('ㄱㄱ')
  let cnt = 0
  errMsg.value = ''

  for(var dept of grdMain.value.getGridView().getCheckedRows(true)) {
    let data = grdMain.value.getDataProvider().getJsonRow(dept)
    // console.log('data : ', data)
    // 최하위 노드(부서) 가 아닐 시 continue
    if(isEmpty(data.DEPT_CD)) continue
    if(!isEmpty(searchParams.ORGN_DIV) && searchParams.ORGN_DIV != data.ORGN_DIV) continue
    cnt += 1
    emit('add-dept', data)
  }
  if(cnt === 0) {
    return Message.err(t('부서를 선택하세요.'))
  }
  showError()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onCellClicked = (grid, clickData) => { 
  itemCheckSibling(clickData.dataRow, grid.getCheckedRows().includes(clickData.dataRow))
  if(grdMain.value.getGridView().getCheckedRows(true).includes(clickData.dataRow)) {
    grdMain.value.getGridView().expand(clickData.itemIndex, true)
  }
}

const itemCheckSibling = (i, checked) => {
  // 일단 check
  grdMain.value.getGridView().checkRow(i, checked, false, false)
  
  // 더 이상 자식이 없을 시엔 return
  if(isEmpty(grdMain.value.getDataProvider().getChildren(i))) return  
  for(var i of grdMain.value.getDataProvider().getChildren(i)) {
    itemCheckSibling(i, checked)
  }
}

const setErrorMsg = (err) => {
  errMsg.value += err + ','
}

const showError = () => {
  if(!isEmpty(errMsg.value)) {
    Message.err(t('이미 존재하는 부서가 있습니다.[' + errMsg.value.slice(0,-1) + ']'))
  }
}

watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  getData()
})

defineExpose({
  openPopup,
  setErrorMsg
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="900"
    class="p-absolute user-select-none"
  >
    <v-sheet 
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>보건 위험성 평가 대상 조직 설정</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnExpand', 'btnCollapse','btnCreate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <i-select
            v-model="searchParams.ORGN_DIV"
            :label="$t('조직구분')"
            label-width="50px"
            :items="codeList.ORGN_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />  
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="height:680px;">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                :is-tree="true"
                style="height: 640px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
