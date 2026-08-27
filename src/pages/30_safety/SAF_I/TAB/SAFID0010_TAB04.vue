<!-- 
  * Vue 내 용 : 협력사 안전관리자 경력관리-멘토링 교육 tab04
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/06/12
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/06/12 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { isEmpty } from 'lodash-es'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const menuTitle = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: '',
  EMP_NO: '',
})

const dtCompletion = reactive([
  { COD: "Y", TXT: "이수" },
  { COD: "N", TXT: "미이수" },
])

const dtRemark = reactive([
  { COD: "", TXT: "" },
  { COD: "1", TXT: "기준충족" },
])

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { 
      fieldName: 'COMPLETION', 
      dataType: 'text', 
      width: '120', 
      requiredMessage: '[이수유무]는 필수입니다.', 
      editable: true, 
      header: { 
        text: t('이수유무'), 
        styleName: 'header_validit',
      }, 
      styleName: 'editable_column', 
      width : '100', 
      editor: { 
        type: 'dropdown',
      }, 
      lookupDisplay: true,
    },
    { 
      fieldName: 'COMPLETION_DATE', 
      dataType: "text",
      header: { text: t("이수일자"), styleName: 'header_validit' },
      width: '80',
      styleName: "editable_column",
      
      // 미이수: 이수일자 '-' 처리
      // 이수: 1. 비고 기준중촉 '-' 처리
      // 이수: 2. 비고 빈 값일 경우 날짜 입력
      styleCallback: function(grid, dataCell){ 
        let ret = {}
        let completion = grid.getValue(dataCell.index.itemIndex, "COMPLETION")
        let remark = grid.getValue(dataCell.index.itemIndex, 'REMARK')
        
        grid.commit()

        if(completion === 'N'){
          ret.editButtonVisibility = "hidden"
          ret.editable = false
          ret.styleName = ''
          grid.setValue(dataCell.index.itemIndex, 'COMPLETION_DATE', '')
        }
        else {
          if(completion === 'Y' && isEmpty(remark)) {
            ret.editButtonVisibility = "always"
            ret.editor = {
              type: "date",
              datetimeFormat: "yyyy-MM-dd",
              textReadOnly: true
            }
            ret.styleName = 'editable_column'
            ret.editable = true
          }
          else {
            ret.editButtonVisibility = "hidden"
            ret.styleName = ''
            ret.editable = false
            grid.setValue(dataCell.index.itemIndex, 'COMPLETION_DATE', '')
          }
        }
  
        return ret
      },
    },
    { 
      fieldName: 'REMARK', 
      dataType: 'text', 
      width: '120', 
      editable: true, 
      header: { 
        text: t('비고'), 
        styleName: 'header_validit',
      }, 
      styleName: 'editable_column', 
      width : '100', 
      editor: { 
        type: 'dropdown',
      }, 
      lookupDisplay: true,
    },

    { fieldName: 'CHK', dataType: 'text', width: '120', header: { text: t('CHK') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', header: { text: t('회사구분') }, visible : false },
    { fieldName: 'GBN', dataType: 'text', width: '120', header: { text: t('구분') }, visible : false  },
    { fieldName: 'EMP_NO', dataType: 'text', width: '120', header: { text: t('사번') }, visible : false  },
    { fieldName: 'SEQ', dataType: 'text', width: '120', header: { text: t('SEQ') }, visible : false  },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const getCode = () => {
  grdMain.value.setBindingColumn('COMPLETION', dtCompletion, 'COD', 'TXT') 
  grdMain.value.setBindingColumn('REMARK', dtRemark, 'COD', 'TXT') 
}

const parsingDate = date => {
  if(date == null) return ''
  let res = ''
  let words = date.split('-')

  for (let date of words) {
    res = res + date
  }

  console.log('[parsingDate] res = ', res)

  return res
}

// 상단 버튼 클릭
const onButtonsClick = btn => {
  if(searchParams.CMPNY_DIV == '' || searchParams.EMP_NO == '') {
    Message.warn(t('안전관리자를 선택하십시오.'))

    return
  }

  if(btn.id === 'btnCreate') {
    grdMain.value.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      EMP_NO: searchParams.EMP_NO,
      SEQ: '9999',
      COMPLETION: 'N',
      COMPLETION_DATE: '',
      REMARK: '',
      GBN: 'D',
      USER_ID: userStore.userId,
    })
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
  }
}


// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.COMPLETION)) {
      return Message.warn(t('이수유무를 선택하십시오.'))
    }
    
    if(data.COMPLETION === 'Y' && isEmpty(data.COMPLETION_DATE) && isEmpty(data.REMARK)) {
      return Message.warn(t('이수일자를 입력하십시오.'))
    }

    if(data.COMPLETION === 'N' && data.REMARK === '1') {
      return Message.warn(t('미이수 상태에 기준 충족 상태입니다. 확인하십시오.'))
    }
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let completion_date = null

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    console.log('completion_date = ', data.COMPLETION_DATE)

    if(data.COMPLETION_DATE === '-') {
      completion_date = data.COMPLETION_DATE
    }
    else {
      completion_date = parsingDate(data.COMPLETION_DATE)
    }

    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,   
        EMP_NO : data.EMP_NO,
        SEQ : data.SEQ,
        GBN : data.GBN,  
        COMPLETION : data.COMPLETION,
        COMPLETION_DATE : completion_date,
        REMARK : data.REMARK,
        USER_ID : userStore.userId,
      },
    )
  }
  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFID0010_SAVE_05', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  searchGridData()
  Message.success(t('성공적으로 저장되었습니다'))
}

/* ******************* 삭제 ******************** */
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  console.log('deleteData = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFID0010_DELETE_02', list: saveParams })
}

const afterDelete = () => {
  searchGridData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const searchData = userData => {
  searchParams.CMPNY_DIV = userData.CMPNY_DIV
  searchParams.EMP_NO = userData.EMP_NO
  console.log('[searchData] userData: ', userData)
  searchGridData()
}

const searchGridData = () => {
  grdMain.value.getDataProvider().setRows([])

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

const searchMainData = () => {
  return commonSearchApi({ queryId : 'SAFID0010_SEARCH_05', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  searchData,
})

onMounted(() => {
  getCode()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 상단 제목 및 버튼 -->
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t('멘토링 교육')"
        :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
        hiddenManuel
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="h-grow">
        <v-sheet 
          class="h-auto mr-2" 
          width="100%"
        >
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 100%;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>      
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  // height: calc(100vh - 180px);
  height: 25vh;
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 100%;
  }
}
</style>