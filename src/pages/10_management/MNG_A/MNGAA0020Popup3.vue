<!--
  화면명 : MNGAA0020Popup3.vue
  화면개요 :HSE 방침/목표/중점추진사항 - 목표/계획 작성 팝업 -> 환경 데이터 추가 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonSearchApi } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

// Grid SelectCheckBox
const wrkList = reactive([])
const occrList = reactive([])
const impctList = reactive([])
const dtrList = reactive([])
const EM_GRD_LIST = reactive([])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),  
  REV: null,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.deptCd,
  // ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  YN_OUT: 'Y',
  ADD_YN: null,
})

// Grid SelectCheckBox 값 조회
const initCodeList = () => {
  Promise.all([    
    // 작업조건
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF13', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 발생시점
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF14', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 영향범위
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF15', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),

    // 직/간접영향
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF16', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),

    commonSearchApi({ queryId : 'MNGAC0020_SEARCH_04', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
  ]).then(res => {
    
    wrkList.value = res[0].ORESULT_CUR
    occrList.value = res[1].ORESULT_CUR
    impctList.value = res[2].ORESULT_CUR
    dtrList.value = res[3].ORESULT_CUR

    EM_GRD_LIST.value = res[4].ORESULT_CUR

    grdMain.value.setBindingColumn("WRK_COND_CD", wrkList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("OCCR_CD", occrList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("EM_IMPCT_CD", impctList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("DRT_DIV", dtrList.value, "COD", "TXT")
  })
}

const grdMainProps = reactive({
  gridViewOption : { checkBar: {  visible: false }, header: { height: 68 }, stateBar: { visible: false } },
  keys : ['PRCS_CD','DET_PRCS_CD','EM_PART_CD'],
  field: [
  { fieldName: 'PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'PRCS_DESC', dataType: 'text', header: { text: t('명칭') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" } },
    //{ fieldName: 'INPUT', dataType: 'text', header: { text: t('투입') }, styleName: 'left-column', editable: false }, // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'DET_PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'DET_PRCS_DESC', dataType: 'text', header: { text: t('명칭') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" }  },
    //{ fieldName: 'DISPOSE', dataType: 'text', header: { text: t('배출') }, styleName: 'left-column', editable: false }, // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'EM_PART_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false },
    { fieldName: 'EM_PART_DESC', dataType: 'text', width: '200', header: { text: t('명칭') }, styleName: 'left-column', editable: false },
    { fieldName: 'WRK_COND_CD', dataType: 'text', width: '100', header: { text: t('작업조건') }, editable: false ,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'OCCR_CD', dataType: 'text', header: { text: t('발생시점') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'EM_IMPCT_CD', dataType: 'text', header: { text: t('영향범위') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'COMP_GRD', dataType: 'text', width: '80', header: { text: t('등급') }, editable: false  },
    { fieldName: 'DRT_DIV', dataType: 'text', header: { text: t('직/간접영향') }, editable: false,lookupDisplay: true  },
    { fieldName: 'IMPR_PLAN', dataType: 'text', width: '200', header: { text: t('개선계획') }, editable: false },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false  },
    { fieldName: 'REV', dataType: 'text', header: { text: t('차수') } , visible: true },    
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부') } , visible: false },
    { fieldName: 'rowGbn', dataType: 'text', header: { text: t('원본 데이터 구분') } , visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') } , visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') } , visible: false },
    
  ],
  columns: [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'PRCS_CD', 'PRCS_DESC' ],
      header: { text: t('구분') },
    },
    //'INPUT', 
    {
      name: '활동공정',
      direction: 'horizontal',
      items: [ 'DET_PRCS_CD', 'DET_PRCS_DESC' ],
      header: { text: t('활동공정') },
    },
    //'DISPOSE',
    {
      name: '환경영향 측면',
      direction: 'horizontal',
      items: [ 'EM_PART_CD', 'EM_PART_DESC' ],
      header: { text: t('환경영향 측면') },
    },
    'WRK_COND_CD',
    'OCCR_CD',
    'EM_IMPCT_CD',
    'COMP_GRD' ,
    // {
    //   name: 'popupBtn',
    //   direction: 'horizontal',
    //   items: [ 'COMP_FREQ', 'COMP_INTEN', ],
    //   header: { text: '환경영향 평가 기준' },
    // },
    'DRT_DIV',
    'IMPR_PLAN',
  ]
})

grdMainProps.columns = grdMainProps.field

const openPopup = (searchParam) => {
  initCodeList()

  new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData02) 
      .setAfter(afterSearch)
      .run()


  // searchParam.value.YN_OUT = ''
  // console.log('searchParam.value:',searchParam.value)
  // commonSearchApi({ queryId: "MNGAC0030_SEARCH_04", param: searchParam.value }).then(res => {
  //   console.log('res:',res)
  //   if(res.ORESULT_CUR.length === 0){ 
  //     Message.warn('데이터가 없습니다.')
  //     return
  //   }
  //   commonSearchApi({ queryId : 'MNGAC0030_SEARCH_02', param: res.ORESULT_CUR[0] }).then( res => {
  //     grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  //   })
  // })

  dialog.value = true  

}

// 메인그리드
const searchData02 = () => {
  searchParams.REV = searchParams.REV === null ? searchParams.YEAR + '-01' : searchParams.REV

  return commonSearchApi({ queryId : 'MNGAC0030_SEARCH_02', param: searchParams })
}

const afterSearch = async res => {
  let cnt = 0
  res.ORESULT_CUR.forEach(element => {
    element.rowGbn = cnt++
  })
  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setFocus(0)
}

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })


//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnFinish") {
    //여기서 등록 팝업으로 데이터 보내기
    let checkedItem = grdMain.value.getGridView().getCheckedRows()
    let newArr = []
    if (checkedItem.length != 0) {
      for (let i of checkedItem) {
        let pushArr = grdMain.value.getDataProvider().getJsonRow(i)
        newArr.push(pushArr)
      }
      emit("selected", newArr)
      onClose()
    }
    else {
      Message.err('선택한 데이터가 없습니다.')
    }
  }
  else {
    onClose()
  }
}

const onClose = () => {
  clearField()
  dialog.value = false
}

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
    width="2000"
    height="800"
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
      <span>중대환경영향 내역</span>
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
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
