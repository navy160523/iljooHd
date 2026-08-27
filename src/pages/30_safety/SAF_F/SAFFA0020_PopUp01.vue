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
import SAFFA0020_PopUp02 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp02.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdMain = ref(null)
const saffa0020_popup02 = ref(null)
const titleNm = ref('')
const searchParams = reactive({
  CMPNY_DIV: 'HHI',
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
  YYYYMMDD: '',
  DIV: '',
  TARGET_DIV: 'Y'
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'ASGN_NM', width: 300, dataType: 'text', header: { text: t('소속') }, editable: false, styleName: 'left-column',},
    { fieldName: 'EMP_NO', width: 100, dataType: 'text', header: { text: t('사번') }, editable: false, },
    { fieldName: 'KOR_NM', width: 100, dataType: 'text', header: { text: t('성명') }, editable: false, styleName: 'rg_blue cursor_pointer' },
    { fieldName: 'JOB_TIT_NM', width: 100, dataType: 'text', header: { text: t('직위') }, editable: false,},
    { fieldName: 'R_A', width: 80, dataType: 'text', header: { text: t('영상안전교육\n이수(분)') }, editable: false, styleName: 'right-column',},
    { fieldName: 'R_B', width: 80, dataType: 'text', header: { text: t('현장안전교육\n이수(분)') }, editable: false, styleName: 'right-column',},
    { fieldName: 'R_C', width: 80, dataType: 'text', header: { text: t('월간안전교육\n이수(분)') }, editable: false, styleName: 'right-column',},
    { fieldName: 'SUM_R', width: 80, dataType: 'text', header: { text: t('합계\n이수(분)') }, editable: false, styleName: 'right-column',},
    { fieldName: 'RESULT_YN', width: 80, dataType: 'text', header: { text: t('SLI감점대상\n이수') }, editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'USER_DIV', dataType: 'text', visible: false },
    { fieldName: 'P_A', dataType: 'text', visible: false },
    { fieldName: 'P_B', dataType: 'text', visible: false },
    { fieldName: 'P_C', dataType: 'text', visible: false },
    { fieldName: 'PLAN_YN', dataType: 'text', visible: false },
    { fieldName: 'TARGET_YN', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam, dept) => {
  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  // searchParams.YYYYMMDD = popupParam.TMP_TO_DT
  searchParams.YYYYMMDD = popupParam.YYYYMMDD.replaceAll('-','')
  searchParams.DIV = popupParam.DIV
  searchParams.TARGET_DIV = 'Y'
  titleNm.value = dept + '(' + popupParam.YYYYMMDD + '기준)'
  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

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
  return commonSearchApi({ queryId: 'SAFFA0020_SEARCH_05', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if(clickData.fieldName === 'KOR_NM') {
    data.YYYYMM = searchParams.YYYYMMDD.replaceAll('-','').substring(0,6)
    console.log(data)
    saffa0020_popup02.value.openPopup(data)
  }
}

watch(() => searchParams.TARGET_DIV, (newValue, oldValue) => {
  onButtonsClick({ id : 'btnSearch' })
})

defineExpose({
  openPopup,
}) 
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1150"
    height="900"
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
      <span>부서 정기안전보건교육 현황</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :title="titleNm"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      <div class="pt-2 pl-5 pb-2 notice">
        <h3 class="pt-2">※ [필독] SLI감점 기준</h3>
        <div class="notice-content">
          <p>● 계획합계 120분, 이수합계 120분 모두 충족이 되어야 SLI 감점이 안됩니다.</p>
          <p>● 교육 제외/불참처리는 미이수로 간주됩니다. 제외/불참자는 별도로 시간을 채워야 합니다.</p>
          <p>● 휴직/파견/휴직복귀 등으로 해당 월에 120분 교육 이수가 불가능한 경우에는 [SLI점수(안전교육)집계 제외신청] 메뉴에서 제외 신청을 해 주시기 바랍니다.</p>
          <p>● 금월 8일 내에 전월 실적 등록 안 될 경우 해당교육은 미이수처리 됩니다.(결재필수)</p>
          <p>● 교육시간(분) 기준은 교육계획 수립 시 "소요시간"에 입력 된 값 기준입니다.</p>
          <p>● 아래 목록에서 성명을 클릭 하면 상세 교육현황을 볼 수 있습니다.</p>
          <p>● SLI점수는 매일 새벽에 1회 집계를 하므로, 금일 수정/입력 된 교육 건은 내일 반영이 됩니다.</p>
        </div>
      </div>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <v-radio-group 
                class="mt-1"
                v-model="searchParams.TARGET_DIV"
                inline
              >
                <v-radio class="mr-5" :value="'Y'" color="primary" label="감점대상"/>
                <v-radio :value="'N'" color="primary" label="전체" />
              </v-radio-group>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
        <SAFFA0020_PopUp02
          ref="saffa0020_popup02"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.notice {
  background-color: rgb(var(--v-theme-base));
  margin-bottom: 10px;
  border-radius: 5px;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 2;
  .notice-content {
    font-size: 1rem;
    padding: 10px;
  }
}

.cell-click {
  color: blue;
  cursor: pointer;
}
</style>
