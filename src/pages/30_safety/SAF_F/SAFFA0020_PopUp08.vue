<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)

const deptNm = ref('')
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  YYYYMMDD: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'VND_NAME', width: 100, dataType: 'text', header: { text: t('업체명') }, editable: false,},
    { fieldName: 'CERT_VNO', width: 100, dataType: 'text', header: { text: t('사번') }, editable: false, },
    { fieldName: 'NAME', width: 80, dataType: 'text', header: { text: t('성명') }, editable: false, styleName: 'right-column',},
    { fieldName: 'DEPT_EMP_NM', width: 80, dataType: 'text', header: { text: t('부서담당자') }, editable: false, styleName: 'right-column',},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'BIZ_REG_NO', dataType: 'text', visible: false },
    { fieldName: 'VEND_CD', dataType: 'text', visible: false },
    { fieldName: 'WORK_NO', dataType: 'text', visible: false },
    { fieldName: 'REV_NO', dataType: 'text', visible: false }
  ],
  columns: [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'VND_NAME', width: 100, dataType: 'text', header: { text: t('업체명') }, editable: false, },
    { fieldName: 'CERT_VNO', width: 100, dataType: 'text', header: { text: t('사번') }, editable: false, styleName: 'right-column',},
    { fieldName: 'NAME', width: 80, dataType: 'text', header: { text: t('성명') }, editable: false, styleName: 'right-column',},
    { fieldName: 'DEPT_EMP_NM', width: 80, dataType: 'text', header: { text: t('부서담당자') }, editable: false, styleName: 'right-column', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false }
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field
grdSubProps.columns = grdSubProps.field

const openPopup = (popupParam,getDeptNm) => {  
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.YYYYMMDD = popupParam.TO_DT

  deptNm.value = getDeptNm

  //그리드, 선택 상태 초기화
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])

  onButtonsClick({ id : 'btnSearch' })
  dialog.value = true
}

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnClose') {
    grdMain.value.getDataProvider().setRows([])
    dialog.value = false
  }
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SAFFA0020_SEARCH_12', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR2)
}

defineExpose({
  openPopup,
}) 
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="950"
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
      <span>단기공사교육 미실시자 목록 : {{ deptNm }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="notice">
          <span> ※ 교육제외(SLI점수 집계 제외)필요 시 [안전]->[단기공사 관리]->[단기공사 안전교육 대상자 현황/관리]에서 제외처리 하시기 바랍니다.</span>
        </div>
        <div class="d-flex" style="height: 97%">
          <v-sheet class="mt-3 mr-3" width="50%">
            <div class="d-flex">
              <div class="">
                <span> ※ 아래 조건으로 등록/이수처리(결재필수)된 교육만 단기공사 SLI교육으로 처리 됩니다.</span><br>
                <span>    교육 -> 교육계획/신청 및 실적->교육계획/실적관리->교육일정등록</span><br>
                <span>    - 분류: 법정</span><br>
                <span>    - 교육명: 신규채용자 안전보건교육(단기공사-안전통합경영실)</span><br>
                <span>    단기공사-안전통합경영실 교육 미실시자</span>
              </div>
            </div>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <v-sheet class="mt-3" width="50%">
            <div class="d-flex">
              <div class="">
                <span> ※ 아래 조건으로 등록/이수처리(결재필수)된 교육만 단기공사 SLI교육으로 처리 됩니다.</span><br>
                <span>    교육 -> 교육계획/신청 및 실적->교육계획/실적관리->교육일정등록</span><br>
                <span>    - 분류: 법정</span><br>
                <span>    - 교육명: 신규채용자 안전보건교육(단기공사-생산부서)</span><br>
                <span>    단기공사-생산부서 교육 미실시자</span>
              </div>
            </div>
            <RealGrid
              ref="grdSub"
              class="mt-2"
              :gridViewOption="grdSubProps.gridViewOption"
              :fields="grdSubProps.field"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.notice {
  z-index: 9999;
  color: red;
  font-size: 1.1rem;
  font-weight: bold;
  margin-top:2px;
}
</style>

