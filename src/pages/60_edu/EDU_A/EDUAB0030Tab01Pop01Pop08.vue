<!--
  화면명 : 안전 교육장 검색(팝업)
  화면개요 : 교육장을 검색하고 데이터를 선택하여 일별 교시 상세의 장소 컬럼에 데이터를 추가한다. 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits([])
const _ChkVR = ref(null)
const popupData = reactive({
  EPLACE_NM : '',  //교육장명
  DATE_FROM : '',  //예약기간(시작)
  DATE_TO : '',    //예약기간(종료)
})

//교육장 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'EPLACE_NM', dataType: 'text', width:'150', header: { text: t('교육장명') }, styleName: "left-column", editable: false },
    { fieldName: 'CNT', dataType: 'text', width:'60', header: { text: t('예약건수') }, editable: false },
    { fieldName: 'EPLACE_ORGN', dataType: 'text', width:'130', header: { text: t('관리부서') }, styleName: "left-column", editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'EPLACE_ADDRESS', dataType: 'text', header: { text: t('교육장 장소') }, styleName: "left-column", editable: false },
    { fieldName: 'EPLACE_TEL', dataType: 'text', header: { text: t('교육장 연락처') }, editable: false },
    { fieldName: 'EPLACE_EQUIP', dataType: 'text', width:'150', header: { text: t('교육 가능장비') }, editable: false },
    { fieldName: 'EPLACE_NUM', dataType: 'text', header: { text: t('가능인원') }, editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ID', dataType: 'text', header: { text: t('EPLACE_ID') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false, visible: false },
  ],
  columns: [],
})

//예약현황
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('예약일시') }, editable: false,
      'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }  },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('예약시간') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('소요시간') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('교육 아이디') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('소속 아이디') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : '' } }),//교육명
  ]).then(res => {
    console.log("레스 확인",res)
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  gridRefresh()
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  console.log("data확인",data)
  _ChkVR.value = 'N'
  //initCodeList()
  if(isNullCheck(data.DATE_FROM) || isNullCheck(data.DATE_TO)){
    popupData.DATE_FROM = dayjs().add(-1, 'month').format('YYYY-MM-DD')
    popupData.DATE_TO = dayjs(new Date()).format('YYYY-MM-DD')
  }else{
    popupData.DATE_FROM = dayjs(data.DATE_FROM).format('YYYY-MM-DD')
    popupData.DATE_TO = dayjs(data.DATE_TO).format('YYYY-MM-DD')
  }

  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : ''
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP08_SEARCH_01', param : searchParams }).then(res => {
    grdMain.value.setBindingColumn("EPLACE_ORGN",res.ORESULT_CUR, "DEPT_CD", "DEPT_NM")
    console.log("레스 확인",res)
  })

  grdMainSearch()
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    grdMainSearch()
  }
  if(btn.id === 'btnSelect'){
    let focusedRow = grdMain.value.getFocusedRowData()
    emit('onSelect', focusedRow)
    dialog.value = false
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//교육장 목록 ROW 클릭 이벤트
const grdMainRowChanged = (grid, index, clickData) => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let rowData = grdMain.value.getGridView().getValues(clickData)
  let rowData = grdMain.value.getRowData(clickData)
  grdSubSearch(rowData)
}

//교육장 목록 ROW 더블 클릭 이벤트
const grdMainRowDblClick = (grid, clickData) => {
  console.log("더블클릭 데이터",clickData)
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let rowData = grdMain.value.getGridView().getValues(clickData.dataRow)
  let rowData = grdMain.value.getRowData(clickData.dataRow)
  console.log("로우데이터 확인",rowData)
  emit('onSelect', rowData)
  dialog.value = false
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > popupData.DATE_TO){
    popupData.DATE_TO = popupData.DATE_FROM
  }
  grdMainSearch()
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(data.target.value < popupData.DATE_FROM){
    popupData.DATE_FROM = popupData.DATE_TO
  }
  grdMainSearch()
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//교육장 목록 조회
const grdMainSearch = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    EPLACE_NM : popupData.EPLACE_NM,
    EDU_DATE_FROM : popupData.DATE_FROM,
    EDU_DATE_TO : popupData.DATE_TO
  }
  console.log("교육장 목록 조회 파람",searchParams)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP08_SEARCH_02', param : searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      Message.success(t('조회되었습니다.'))
      if(_ChkVR === 'Y'){
      let filterDt = []
      res.ORESULT_CUR.forEach(val => {
        if(val.MEDIA_YN === 'Y'){
          filterDt.push(val)
        }
      })
      grdMain.value.getDataProvider().setRows(filterDt)
    }else{
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
      grdMain.value.getGridView().setFocus(0)
      console.log("레스 확인",res)
    }else{
      Message.warn(t('데이터가 없습니다'))
      grdMain.value.getDataProvider().setRows([])
      grdSub.value.getDataProvider().setRows([])
      return
    }

  })
}

//예약현황 조회
const grdSubSearch = data => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    EPLACE_ID : data.EPLACE_ID === null ? '' : data.EPLACE_ID,
    EDU_DATE_FROM : isNullCheck(popupData.DATE_FROM) == true ? '' : popupData.DATE_FROM,
    EDU_DATE_TO : isNullCheck(popupData.DATE_TO) == true ? '' : popupData.DATE_TO
  }
  console.log("서브 그리드 조회 파람",searchParams)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP08_SEARCH_03', param : searchParams }).then(res => {
    console.log("서브 그리드 조회 :::: >>>> ", res)
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//*************************************************조회 영역(종료)**********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>안전 교육장 검색</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSearch','btnSelect','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet class="flex-column searchArea">
          <i-input
            :label="$t('교육장명')"
            leftLabel
            v-model="popupData.EPLACE_NM"
            width="300px"
            @keydown.enter="() => grdMainSearch()"
          />
        </v-sheet>
        <div class="d-flex" style="height:80%">
          <v-sheet width="55%" class="flex-column mr-10">
            <div class="flex-column" style="height:90%">
              <IGridTitle
                :title="$t('교육장 목록')"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="grdMainRowDblClick"
                @onCurrentRowChanged="grdMainRowChanged"
              />
            </div>
          </v-sheet>
          <v-sheet width="40%" height="100%" class="flex-column">
            <div width="40%" class="d-flex" style="align-items: baseline">
              <IGridTitle
                :title="$t('예약현황')"
              >
                <template #editors />
              </IGridTitle>
              <i-input labelWidth="30px" width="155px" 
                :label="$t('기간')" type="date"
                v-model="popupData.DATE_FROM"
                @focusout="dateFrChanged"
                margin="5px"
              />
              <i-input width="132px"
                :label="$t('-')" type="date"
                v-model="popupData.DATE_TO"
                @focusout="dateToChanged"
              />
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
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
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (430px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>