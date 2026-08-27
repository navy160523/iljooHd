
<!-- 
  화면명   : 작업표준/위험성평가 현황 - 교육 이수자 팝업
  화면개요 : 해당 작업표준의 교육 이수자 리스트를 조회
-->

<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance }                   from 'vue'
import { startDragging, handleDragging, stopDragging }                    from '@/utils/useDrag.js'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel     from '@/components/ILabel.vue'
import RealGrid   from '@/components/RealGrid.vue'
import Message    from '@hiway/utils/notify'
import dayjs      from 'dayjs'
import _          from 'lodash'

defineOptions({
  name:'20_risk-assessment-RSK_B-RSKBA0020Popup2',
})

// ------------------------- Variable ------------------------- //

const dialog = ref(false)
const router = useRouter()

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const searchArea = ref(null)

const grdMain = ref(null)
const grdSub = ref(null)

let flag       = ref(1)
let mainData   = ref(null)
let filterData = ref(null)

//조회조건
let searchParams = reactive({    
  WORK_STANDARD_ID : '',
  EDU_DIV : 'Y'
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD : [],
  BSNS_CD    : [],
  DEPT_CD    : [],
  PARTNER_CD : [],
  PROGRESS_STATUS : [],
  RISK_TYPE  : [],
})

//그리드 속성셋팅
const grdProps = reactive({
  gridViewOption : { checkBar: { visible: false }, display: { selectionStyle: 'rows', useFocusClass: true} },
  keys: ['EDU_ID'],
  fields: [ 
    { fieldName: 'BSNS_NM',  dataType: 'text', width: '160', styleName: 'left-column',   header: { text: t('사업부') },  editable : false },
    { fieldName: 'ASGN_NM',  dataType: 'text', width: '160', styleName: 'left-column',   header: { text: t('부서') },    editable : false },
    { fieldName: 'KOR_NM',   dataType: 'text', width: '120', styleName: 'center-column', header: { text: t('이름') },    editable : false },
    { fieldName: 'EMPNO',    dataType: 'text', width: '120', styleName: 'center-column', header: { text: t('사번') },    editable : false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', width: '100', styleName: 'center-column', header: { text: t('차수') },    editable : false },
    { fieldName: 'EDU_DIV',  dataType: 'text', width: '100',  styleName: 'center-column', header: { text: t('이수여부')}, editable : false },    
  ],
  columns : [],
})

grdProps.columns = grdProps.fields

// ------------------------- Method ------------------------- //

//코드리스트 셋팅
const initCodeList = () => {
  
}

// 조회
const searchData = () => {

  return commonSearchApi({ queryId : 'RSKBA0020_SEARCH02', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  
  //mainData = res.ORESULT_CUR
  //filterData = res.ORESULT_CUR.filter(row => row.RISK_TYPE == 'RISK_TYPE-02')

  //menuTitle.value.setBtnProperty('btnAssessment', 'text', '안전사고 위험성평가 : ' + filterData.length + '건')
}

// 팝업 호출시
const openPopup = popupParam => {
  dialog.value = true
  searchParams.EDU_DIV = 'N'
  
  searchParams.WORK_STANDARD_ID = popupParam.WORK_STANDARD_ID

  // 데이터 조회
  onButtonsClick({ id : 'btnSearch'})
/*
  vm.$nextTick(() => {
    grdMain.value.getDataProvider().setRows(tempData)
  })
  */
}

defineExpose({
  openPopup,
})

// ------------------------- Event ------------------------- //

// 버튼 클릭 이벤트
const onButtonsClick = btn => {

  console.log('edu div = ', searchParams.EDU_DIV)

  // 조회
  if (btn.id === 'btnSearch') {

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  // 신규
  else if (btn.id === 'btnClose') {
    
    onClose()
  }
}

const onClose = () => {
  dialog.value = false
}

onMounted(() => {
  initCodeList()

  // 사업부 전체 추가
  codeList.BSNS_CD.unshift({ BSNS_NM : '전체', BSNS_CD : '' }) 
})
</script>

<template>
  <VDialog
    v-model="dialog"
    width="900px"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet 
      height="50"
      color="primarySub"
      class="px-4 d-flex align-center rounded-t-5 cursor-move topBetween"
      @mousedown="startDragging"
    >
      <div>교육이수자 확인</div>      
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <v-checkbox
              v-model="searchParams.EDU_DIV"
              label="교육미이수"
            />
          </v-sheet>
          <v-sheet>
            <RealGrid
            ref="grdMain"
            style="height: 500px"
            :grid-view-option="grdProps.gridViewOption"
            :keys="grdProps.keys" 
            :fields="grdProps.fields"
            :columns="grdProps.columns"
            @onCellClicked="onDeptSelect"
          />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
/* div.v-col-md-12.v-col-12 {
  text-align: center;
  background-color: #cdd2d9;
  border-radius: 6px;
  font-size: large;
} */

.v-input--reverse .v-input__slot {
  flex-direction: row-reverse;
  justify-content: flex-end;
  .v-application--is-ltr & {
    .v-input--selection-controls__input {
      margin-right: 0;
      margin-left: 8px;
    }
  }
  .v-application--is-rtl & {
    .v-input--selection-controls__input {
      margin-left: 0;
      margin-right: 8px;
    }
  }
}

.topBetween {
  justify-content: space-between;
}

input#input-33.v-field_input {
  background-color: black;
}
</style>
