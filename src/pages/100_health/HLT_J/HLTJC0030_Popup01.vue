<!--
  화면명 : 직업병 통계 근로자 수 관리
  화면개요 : 근로자 수 관리
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, getCodeList, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})
 
//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys : [],
  fields : [ 
    { fieldName: 'YEAR', dataType: 'number', width: '60', numberFormat: "####", styleName: 'editable_column', header: { text: t('년도') }, editor: { 
        ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", 
        maxLength: 4,
      }, 
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }
    },
    { fieldName: 'WORKER_CNT', dataType: 'number', width: '60', numberFormat: "#,###", styleName: 'editable_column right-column', header: { text: t('직원 수') },  editor: { 
        ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", 
        maxLength: 10,
      }, 
    },

    { fieldName: 'SAVE_YN', dataType: 'text', width: '120', header: { text: t('저장여부') }, visible : false },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  grdMain.value.getDataProvider().setRows([])

  grdMain.value.getGridView().filterPanel.visible = true

  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      YEAR: '',
      WORKER_CNT: '0',
      SAVE_YN: ''
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === "btnClose") {
    closePopup()
  } 
}

// 메인 데이터 조회
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
  return commonSearchApi({ queryId : 'HLTJC0030_SEARCH_02', param: searchParams })
}

//조회 후 반영
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let grdData = grdMain.value.getDataProvider().getJsonRows()
  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력입니다.'))
    } else if (isEmpty(data.WORKER_CNT)) {
      return Message.warn(t('근로자 수는 필수 입력입니다.'))
    } else if (!isEmpty(grdData.find(item => item.YEAR == data.YEAR && item.SAVE_YN == 'Y'))) {
      return Message.warn(t('중복된 년도가 있습니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTJC0030_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {    
      continue
    }
    saveParams.push(data) 
  }
  
  if(saveParams.length > 0) {
    return commonExecuteApi({ queryId : 'HLTJC0030_DELETE_01', list: saveParams })
  }else {
    // 체크된게 저장된 데이터가 아닌것만 있을때는 그냥 grid에서만 삭제
    grdMain.value.getDataProvider().removeRows(checkedRows)
    return
  }
}

const afterDelete = (data) => {  
  if(data) {
    getData()
  }
  Message.success(t('성공적으로 삭제되었습니다'))
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

defineExpose({
  openPopup
})

onMounted(() => {
  
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="800"
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
      <span>근로자 수 저장</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="height:600px;">
          <v-sheet class="searchArea flex-column">
            <RealGrid 
              ref="grdMain"
              style="height: 530px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
