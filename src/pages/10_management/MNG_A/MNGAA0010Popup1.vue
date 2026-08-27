<!--
  화면명 : MNGAA0010Popup1.vue
  화면개요 :HSE 경영시스템 모니터링 -> HSE 목표 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import dayjs from 'dayjs'

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const grdSub1 = ref(null)
const readonly = ref(true)

const grdTitle = reactive({
  subTitle : ''
})
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  // BSNS_CD: '',
  YEAR: dayjs().get("year"),
  ORGN_DIV: 'A',
  PROD_DIV: '',
})
const STATUS_NM = reactive([
  { code: '-', text: '미작성' },
  { code: '10', text: '작성중' },
  { code: '11', text: '재작성요청' },
  { code: '20', text: '검토요청' },
  { code: '30', text: '검토완료' },
  { code: '40', text: '결재진행중' },
  { code: '50', text: '수정요청중' },
  { code: '60', text: '수정승인' },
  { code: '70', text: '결재완료/확정' },
])

// 코드리스트 선언
const codeList = reactive({
  // BSNS: [], //사업부
  orgnDiv: [
    { name: "전체", code: "" },
    { name: "직영", code: "A" },
    { name: "협력사", code: "B" },
  ],
  PRODList: [
    { TXT: '전체', COD: '' },
    { TXT: '생산', COD: 'Y' },
    { TXT: '비생산', COD: 'N' },
  ],
})


const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : ['COL01'],
  field: [
    { fieldName: "BSNS_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("사업부") } },
    { fieldName: "CNT_ASGN_CD", dataType: "text", width: '70', editable: false, header: { text: t("부서수") } },
    { fieldName: "CNT_NONE", dataType: "text", width: '70', editable: false, header: { text: t("미작성") } },
    { fieldName: "CNT_CNFM", dataType: "text", width: '70', editable: false, header: { text: t("완료") } },
    { fieldName: "CNT_RATE", dataType: "text", width: '70', editable: false, header: { text: t("진행율(%)") } },

    { fieldName: 'BSNS_CD', dataType: 'text', visible: false},
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM', 
    'CNT_ASGN_CD',
    'CNT_NONE',
    'CNT_CNFM',
    'CNT_RATE',
  ]
})

grdMainProps.columns = grdMainProps.field

const grdSub1Props = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : ['COL01'],
  field: [
    { fieldName: "BSNS_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("사업부") } },
    { fieldName: "DEPT_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("부서명") } },
    { fieldName: "VEND_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("협력사명") } },
    { fieldName: "CNT_NONE_PLAN", dataType: "text", width: '70', editable: false, header: { text: t("목표\n미작성"), styleName: 'multiline-editor' } },
    { fieldName: "CNT_NONE", dataType: "text", width: '70', editable: false, header: { text: t("계획\n미작성"), styleName: 'multiline-editor' } },
    { fieldName: "CNT_CNFM", dataType: "text", width: '70', editable: false, header: { text: t("완료") } },
    { fieldName: "EMP_NO1", dataType: "text", styleName: "left-column", editable: false, header: { text: t("정") } },
    { fieldName: "EMP_NO2", dataType: "text", styleName: "left-column", editable: false, header: { text: t("부") } },
    { fieldName: "EMP_NO3", dataType: "text", styleName: "left-column", editable: false, header: { text: t("데이터") } },
    { fieldName: "STATUS", dataType: "text", lookupDisplay: true, styleName: "left-column", editable: false, header: { text: t("진행상태") } },

    { fieldName: 'BSNS_CD', dataType: 'text', visible: false},
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false},
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM', 
    'DEPT_NM',
    'VEND_NM',
    'CNT_NONE_PLAN',
    'CNT_NONE',
    'CNT_CNFM',
    {
      name: '시스템 담당자',
      direction: 'horizontal',
      items: [
        'EMP_NO1',
        'EMP_NO2',
        'EMP_NO3',
      ],
    },
    'STATUS',
  ]
})

grdSub1Props.columns = grdSub1Props.field

const openPopup = (param) => {

  searchParams.YEAR = param.YEAR

  // initCodeList()

  onButtonsClick({ id :'btnSearch' })
  
  dialog.value = true  
}

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })


//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

/*메뉴버튼 조회*********************************************/
// 조회로직
const searchData = () => {
  return commonSearchApi({ queryId : 'MNGAA0010_POPUP_01_SEARCH_01', param: searchParams }) 
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchParams2 = reactive({})

const onGrdMainCellClicked = async (grid, oldRow, newRow) => {


  if(newRow === -1){
    grdMain.value.getDataProvider().setRows()
    grdSub1.value.getDataProvider().setRows()
    return
  }
  
  let selectedGrdMain = grdMain.value.getDataProvider().getJsonRow(newRow)
  searchParams2.CMPNY_DIV = userStore.cmpnyDiv
  searchParams2.BSNS_CD = selectedGrdMain.BSNS_CD
  searchParams2.YEAR = searchParams.YEAR
  searchParams2.ORGN_DIV = searchParams.ORGN_DIV
  searchParams2.PROD_DIV = searchParams.PROD_DIV
  searchParams2.BSNS_NM = selectedGrdMain.BSNS_NM
   
  commonSearchApi({ queryId : 'MNGAA0010_POPUP_01_SEARCH_02', param: searchParams2 }).then( res => {  
    if(res.ORESULT_CUR.length === 0){
      Message.err('데이터가 없습니다.')
      return false
    }
    grdTitle.subTitle = '사업부별('+searchParams2.BSNS_NM+') 진행현황'
    grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdSub1.value.setBindingColumn('STATUS', STATUS_NM, 'code', 'text')
  })

}

const onClose = () => {
  clearField()
  dialog.value = false
}

watch(() => [searchParams.YEAR, searchParams.ORGN_DIV, searchParams.PROD_DIV],([newValueYEAR, newValueORGN_DIV, newValuePROD_DIV]) => {
  grdMain.value.getDataProvider().setRows()
  grdSub1.value.getDataProvider().setRows()
})

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const clearField = () => {
  grdMain.value.getDataProvider().setRows(null)
}

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="900"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>HSE 목표</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                width="180px"
                :label="$t('목표 년도')"
                v-model="searchParams.YEAR"
                label-width="60px"
                type="YEAR"
              />

              <div class="d-flex">
                <VRadioGroup
                  v-model="searchParams.ORGN_DIV"
                  class="mt-auto pl-3 pr-3 radio"
                  inline
                >
                  <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
                </VRadioGroup>
              </div>
              
              <div class="d-flex ml-3">
                <VRadioGroup
                  v-model="searchParams.PROD_DIV"
                  class="mt-auto pl-3 pr-3 radio"
                  inline
                >
                  <VRadio v-for="(item, i) in codeList.PRODList" :key="i" :value="item.COD" :label="item.TXT" />
                </VRadioGroup>
              </div>
            </div>
          </v-sheet>
          <div class="d-flex fill-height">
            <v-sheet class="mr-2" width="30%">
              <IGridTitle 
                  ref="grdMainTitle"
                  :title="$t('전사 진행 현황')"
                />
              <RealGrid
                ref="grdMain"
                class="mt-2 mb-0"
                :gridViewOption="grdMainProps.gridViewOption"
                :fields="grdMainProps.field"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCurrentRowChanged="onGrdMainCellClicked"
              />
            </v-sheet>
            <v-sheet class="ml-2" width="70%">
              <IGridTitle 
                  ref="grdSub1Title"
                  :title="$t(grdTitle.subTitle)"
                />
              <RealGrid
                ref="grdSub1"
                class="mt-2 mb-0"
                :gridViewOption="grdSub1Props.gridViewOption"
                :fields="grdSub1Props.field"
                :columns="grdSub1Props.columns"
                :column-layout="grdSub1Props.columnLayout"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.radio {
  border-radius: 3px;
  padding-top: 2px;
  padding-bottom: 2px;
  border: 1px solid #E4E4E4;
  background-color: white;
}
</style>