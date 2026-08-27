<!--
  화면명 : 강사 검색(팝업)
  화면개요 : 강사를 조회하고 데이터를 선택하여 일별 교시 상세의 강사명 컬럼에 데이터를 추가한다
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import EDUAA0010Pop01 from '@/pages/60_edu/EDU_A/EDUAA0010Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const deptPopup = ref(null)
const dialog = ref(false)
const grdMain = ref(null)
const eDUAA0010Pop01 = ref(null)
const emit = defineEmits(['onSelect'])
const _LECTURER_ID = ref(null)
const popupData = reactive({
  DIVISION : '',  //구분
  NAME : '',      //이름
  ASGN_NM : '',   //소속명
  ASGN_CD : '',   //소속코드
})

const codeList = reactive({
  division : [], //구분
})


//교육장 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'NAME', dataType: 'text', width:'70', header: { text: t('이름') }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width:'150', header: { text: t('소속') }, styleName:'left-column', editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width:'70', header: { text: t('직급') }, editable: false },
    { fieldName: 'OFFI_TEL', dataType: 'text', header: { text: t('사내번호') }, editable: false },
    { fieldName: 'MOBILE', dataType: 'text', header: { text: t('휴대폰') }, editable: false },
    { fieldName: 'EMAIL', dataType: 'text', width:'150', header: { text: t('이메일') }, styleName: "left-column", editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('LECTURER_ID') }, editable: false, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('EMP_NO') }, editable: false, visible: false },
    { fieldName: 'BIRTHDAY', dataType: 'text', header: { text: t('BIRTHDAY') }, editable: false, visible: false },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('DIVISION') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('JOB_TIT_CD') }, editable: false, visible: false },
    { fieldName: 'ADDRESS', dataType: 'text', header: { text: t('ADDRESS') }, editable: false, visible: false },
    { fieldName: 'CURRICULUM', dataType: 'text', header: { text: t('CURRICULUM') }, editable: false, visible: false },
    { fieldName: 'DELETE_YN', dataType: 'text', header: { text: t('DELETE_YN') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false, visible: false },
  ],
  columns: [],
})

//예약현황
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('예약일시') }, editable: false },
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
    codeList.division.push({COD : '', TXT : '전체'},{COD : 'A', TXT : '사내'},{COD : 'B', TXT : '사외'})
    popupData.DIVISION = codeList.division[1].COD
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  if(!isNullCheck(data)){
    _LECTURER_ID.value = data.LECTURER_ID.split(',')
  }
  gridRefresh()
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  initCodeList()
  //grdMainSearch()
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    grdMainSearch()
  }
  else if(btn.id === 'btnLectAdd'){
    eDUAA0010Pop01.value.openPopup({
      CREATE_YN : 'Y'
    })
  }
  else if(btn.id === 'btnSelect'){
    btnSelect()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : popupData.ASGN_NM,
    HSE_SYS : 'N',
  })
}

//부서 조회 선택 데이터
const onDeptSelected = row => {
  popupData.ASGN_NM = row.ASGN_SHRT_NM
  popupData.ASGN_CD = row.ASGN_CD
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

//널값체크
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//교육장 목록 조회
const grdMainSearch = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    DIVISION : popupData.DIVISION,
    NAME : popupData.NAME,
    ASGN_CD : popupData.ASGN_CD
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP09_SEARCH_01', param : searchParams }).then(res => {
    if(res.ORESULT_CUR.length <= 0){
      Message.warn(t('데이터가 없습니다'))
      grdMain.value.getDataProvider().setRows([])
      return
    }
    Message.success(t('조회되었습니다.'))
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    if(!isNullCheck(_LECTURER_ID.value)){

      for(let i = 0; i < res.ORESULT_CUR.length; i++){
        _LECTURER_ID.value.forEach(val => {
          if(res.ORESULT_CUR[i].NAME === val){
            grdMain.value.getGridView().checkRow(i, true)
          }
        })
      }
    }
  })
}

//강사 추가 후 이벤트
const onSavedDetailData = () => {
}
//*************************************************조회 영역(종료)**********************************************************/
//************************************************데이터 선택 영역**********************************************************/
const btnSelect = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  
  // 2024.08.07 박용훈 한민규 매니저 요청 선택된 강사가 없이 선택 버튼 클릭시 선택된 강사가 없습니다 메세지 출력
  if (checkedRows.length === 0) {
    Message.warn(t("선택된 강사가 없습니다."));
    return false;
  }

  let selectDataRows = []
  checkedRows.forEach(val => {
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  emit('onSelect',selectDataRows)
  dialog.value = false
}
//**********************************************데이터 선택 영역(종료)******************************************************/
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
      <span>강사 검색</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSearch','btnLectAdd','btnSelect','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="flex-column fill-height">
          <div style="height:100%">
            <v-sheet class="d-flex searchArea">
              <div class="d-flex">
                <i-select
                  :label="$t('구분')"
                  leftLabel
                  v-model="popupData.DIVISION"
                  :items="codeList.division"
                  item-title="TXT"
                  item-value="COD"
                  width="170px"
                  @update:model-value="gridRefresh"
                />
                <i-input
                  :label="$t('이름')"
                  leftLabel
                  v-model="popupData.NAME"
                  width="200px"
                  @keydown.enter="() => grdMainSearch()"
                  @update:model-value="gridRefresh"
                />
                <i-input
                  :label="$t('소속')"
                  leftLabel
                  v-model="popupData.ASGN_NM"
                  width="300px"
                  @keydown.enter="() => openDeptPopup()"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openDeptPopup()"
                  @update:model-value="() => popupData.ASGN_CD = null"
                  class="ma-0 mr-2"
                />
                <i-input
                  v-model="popupData.ASGN_CD"
                  readonly
                  width="100px"
                  disabled
                />
              </div>
            </v-sheet>
            <v-sheet width="100%" height="80%" class="flex-column">
              <IGridTitle
                :title="$t('강사 목록')"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <!-- 부서/ 협력사 팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  <EDUAA0010Pop01
    ref="eDUAA0010Pop01"
    @saved="onSavedDetailData"
  />
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (400px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>