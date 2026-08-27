<!--
  화면명 : 실습/체험형 안전교육대상자(직무별 대상자) (팝업)
  화면개요 : 실습/체험형 안전교육대상자(직무별 대상자)를 조회하고 데이터를 선택하여 대상자 목록 그리드에 데이터를 추가한다.
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
const dutyCdAll = ref('N')
const selectAll = ref(false)
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : null,     //사업부
  DEPT_CD : '',       //부서
  ASGN_CD : '',       //협력사
  USER_DIV : '',      //직영, 협력사 구분
  EDU_DT_FROM : '',   //교육이수일(시작)
  EDU_DT_TO : '',     //교육이수일(종료)
  DUTY_CD : '',       //교육필요직무
})

const codeList = reactive({
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  asgnCd : [],  //협력사
  userDiv : [], //직영, 협력사 구분
  dutyCd : []   //교육필요직무
})


//교육장 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', width:'150', header: { text: t('소속') }, styleName: "left-column", editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'NATN_CD', dataType: 'text', header: { text: t('국적') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') },  editable: false },
    { fieldName: 'DUTY_NM', dataType: 'text', header: { text: t('인사직무') }, editable: false },
    { fieldName: 'EDU_DUTY_NM', dataType: 'text', header: { text: t('교육필요직무') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육과정') }, styleName: "left-column", editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('이수일자') }, editable: false,
      editor: {type :'date', timeSelectType: 'day', datetimeFormat: 'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: "left-column", editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'DUTY_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
  ],
  columns: [],
})

//예약현황
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('예약일시') }, editable: false,
      editor: {type :'date', timeSelectType: 'day', datetimeFormat: 'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('예약시간') }, editable: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
  ]).then(res => {
    console.log("레스 확인",res)
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({BSNS_NM : '전체', BSNS_CD : ''})
    searchParams.BSNS_CD = codeList.bsnsCd[0].COD
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  console.log("searchParams.BSNS_CD 확인",searchParams.BSNS_CD)
  console.log("newValue 확인",newValue)
  if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.deptCd[0].COD
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } }).then(res => {
    codeList.deptCd = res.ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.deptCd[0].COD
    // if(firstLock.value === 0){
    //   let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
    //   searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
    //   firstLock.value = 1
    // } else {
    //   searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    // }
  })
})

//부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  console.log("협력사 데이터",newValue)
  if(isNullCheck(newValue)){
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams.ASGN_CD = codeList.asgnCd[0].COD
    return
  }
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
    .then(res => {
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
      if(userStore.asgnCd === (res.ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd))){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
        searchParams.ASGN_CD = res.ORESULT_CUR[findIndex].ASGN_CD
      }else{
        searchParams.ASGN_CD = codeList.asgnCd[0].ASGN_CD
      }
    })

  let params = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : newValue,
    USER_DIV : searchParams.USER_DIV,
    ASGN_CD : searchParams.USER_DIV === 'A' ? '' : searchParams.ASGN_CD
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP06_SEARCH_01', param : params }).then(res => {
    console.log("부서별 직무조회 조회 결과 :::: >>>>",res)
    codeList.dutyCd = res.ORESULT_CUR
  })

})

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  //gridRefresh()
  console.log("data확인",data)
  initCodeList()
  searchParams.EDU_DT_FROM = dayjs().add(-3, 'month').format('YYYY-MM-DD')
  searchParams.EDU_DT_TO = dayjs(new Date()).format('YYYY-MM-DD')
  // let searchParams = {
  //   CMPNY_DIV : userStore.cmpnyDiv,
  //   BSNS_CD : ''
  // }
  // commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP08_SEARCH_01', param : searchParams }).then(res => {
  //   grdMain.value.setBindingColumn("EPLACE_ORGN",res.ORESULT_CUR, "DEPT_CD", "DEPT_NM")
  //   console.log("레스 확인",res)
  // })

  // grdMainSearch()
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    grdMainSearch()
  }
  else if(btn.id === 'btnSelect'){
    btnTargetAdd()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//교육장 목록 ROW 클릭 이벤트
const grdMainRowChanged = (grid, index, clickData) => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  //let rowData = grdMain.value.getGridView().getValues(clickData)
  let rowData = grdMain.value.getRowData(clickData)
  grdSubSearch(rowData)
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.EDU_DT_TO){
    searchParams.EDU_DT_TO = searchParams.EDU_DT_FROM
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.EDU_DT_FROM){
    searchParams.EDU_DT_FROM = searchParams.EDU_DT_TO
  }
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//교육장 목록 조회
const grdMainSearch = () => {
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP06_SEARCH_02', param : searchParams }).then(res => {
    console.log("메인그리드 조회 결과 :::: >>>> ",res)
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdMain.value.getGridView().setFocus(0)
      Message.success(t('조회되었습니다.'))
    }else{
      Message.warn(t('데이터가 없습니다.'))
    }
  })
}

//예약현황 조회
const grdSubSearch = data => {
  if(isNullCheck(data)){
    return
  }
  let grdSubSearchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    TARGET_ID : data.EMP_NO,
    DATE_FR : isNullCheck(searchParams.EDU_DT_FROM) == true ? '' : searchParams.EDU_DT_FROM,
    DATE_TO : isNullCheck(searchParams.EDU_DT_TO) == true ? '' : searchParams.EDU_DT_TO
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP06_SEARCH_03', param : grdSubSearchParams }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//*************************************************조회 영역(종료)**********************************************************/
const btnTargetAdd = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let selectDataRows = []
  checkedRows.forEach(val => {
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  emit('onSelect',selectDataRows)
  gridRefresh()
  dialog.value = false
}

const dutyCdAllClick = e => {
  if(dutyCdAll.value === 'Y'){
    dutyCdAll.value = 'N'
  } else {
    dutyCdAll.value = 'Y'
  }

  dutyCdSelectAll()
}

const dutyCdSelectAll = () => {
  if(dutyCdAll.value === 'Y'){
    searchParams.DUTY_CD = []
    searchParams.DUTY_CD = codeList.dutyCd
  } else {
    searchParams.DUTY_CD = []  
  }
}

const handleSelect = () => {
  dutyCdAll.value = 'N'
}

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
      <span>실습/체험형 안전교육대상자(직무별 대상자)</span>
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
        <v-sheet class="flex-column searchArea" height="20%">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              width="200px"
              labeldWidth="37px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD" 
              @update:model-value="gridRefresh"
            />
            <i-select
             :label="$t('부서')"
              labelWidth="26px"
              width="300px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD" 
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="37px"
              width="300px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD" 
              @update:model-value="gridRefresh"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              labelWidth="37px" 
              width="193px" 
              :label="$t('기　간')" 
              type="date"
              v-model="searchParams.EDU_DT_FROM"
              @focusout="dateFrChanged"
              class="mr-2"
              @update:model-value="gridRefresh"
            />
            <i-input 
              width="160px"
              :label="$t('-')" 
              type="date"
              v-model="searchParams.EDU_DT_TO"
              @focusout="dateToChanged"
              @update:model-value="gridRefresh"
            />
            <div class="mt-2 mr-1" style="font-size: 14px;">교육필요직무</div>
            <VAutocomplete
              label-loc="left"
              v-model="searchParams.DUTY_CD"
              :items="codeList.dutyCd"
              item-title="TXT"
              item-value="COD"
              multiple
              clearable
              class="test"
              @update:model-value="handleSelect()"
            >
              <template v-slot:prepend-item>
                <v-list-item 
                  :class="dutyCdAll === 'Y' ? 'select' : 'unselect'"
                  @click="dutyCdAllClick"
                >
                  <v-list-item-title>
                    <VRow align="center">
                      <VCol cols="auto pl-1">
                        <v-checkbox 
                          v-model="dutyCdAll"
                          @change="dutyCdSelectAll"
                          color="rgb(33, 33, 33)"
                        />
                      </VCol>
                      <VCol>
                        <span>전체 선택</span>
                      </VCol>
                    </VRow>
                  </v-list-item-title>
                </v-list-item>
              </template>
            </VAutocomplete>
          </div>
        </v-sheet>
        <div class="d-flex" style="height:75%">
          <v-sheet width="58%" class="flex-column mr-10">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="grdMainRowChanged"
              />
          </v-sheet>
          <v-sheet width="40%" class="flex-column">
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
.test{
  width: 250px;
}
::v-deep(.v-field__field) {
  overflow-y: auto;
  // overflow-y: hidden;
  max-height: 35px;
}
</style>