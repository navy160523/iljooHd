<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import dayjs from 'dayjs'
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR : dayjs().format("YYYY"),
  BSNS_CD: '',
  DEPT_CD: '',
  IN_OUT: '',
  USE_DIV: 'Y',
})

//코드리스트
const codeList = reactive({
  BSNS : [],
  DEPT : [],
  IN_OUT: [{ COD: '', TXT: '전체' }, { COD: 'IN', TXT: '내부' }, { COD: 'OT', TXT: '외부' }],
})

const clearData = () => {
  if(grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

const searchMain = async () => {
  //기본 자격증 그리드 콤보
  await commonSearchApi({ queryId : 'MNGDA0040_POP1_SEARCH_01', param: searchParams }).then(res => {    
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

//******************************세팅 영역(종료)***************************************************/
// 선행보유 자격증 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, footer: { visible: true }, editable: false },
  keys : [],
  fields : [ 
    { fieldName: 'CERT_DT', dataType: 'text', header: { text: t('심사일') }, editable : false, width: '65' },
    { fieldName: 'DEPT_FULL_NM', dataType: 'text', header: { text: t('피심사부서') }, editable : false, width: '200', styleName: 'left-column' },    
    { fieldName: 'IN_OUT_NM', dataType: 'text', header: { text: t('내/외부') },  footer: { text: "합계" },
      editable : false, width: '40' },
    { fieldName: 'RESULT_CD', dataType: 'number', header: { text: t('부적합') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
    { fieldName: 'RESULT_CD4', dataType: 'number', header: { text: t('관찰사항') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
    { fieldName: 'RESULT_CD5', dataType: 'number', header: { text: t('권고사항') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" }, editable : false, width: '50' },
    { fieldName: 'RESULT_CD3', dataType: 'number', header: { text: t('경부적합') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
    { fieldName: 'RESULT_CD2', dataType: 'number', header: { text: t('중부적합') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
      { fieldName: 'RESULT_CD1', dataType: 'number', header: { text: t('작업중지') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
    { fieldName: 'TOTAL', dataType: 'number', header: { text: t('계') }, numberFormat: "#,###",
      footer: { numberFormat: "#,###", expression: "sum" },editable : false, width: '50' },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
  initCombo(data)
  searchMain()

  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/

//창 닫음
const onClose = () => {
  dialog.value = false
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    searchMain()
  } else {
    onClose()
  }
}

//사업부 설정
const setBsnsCombo = () =>{
  codeList.BSNS = []
  // codeList.DEPT = []
  codeList.BSNS.push({ BSNS_CD: '', BSNS_NM: '전체'  })
  commonSearchApi({ queryId : 'searchBSNS', param: searchParams }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.BSNS.push(element)
    })
  })
}

//연도 서식
const keyupYYYY = event => {
  if(event.key === 'Enter'){
    onButtonsClick({ id :'btnSearch' })
  }  

  let regex = /[^.0-9]/g
  
  searchParams.YEAR = searchParams.YEAR.replaceAll(regex, '')
  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = searchParams.YEAR.substring(0,4)
  }
}

//콤보박스 설정
const initCombo = (data) => {  
  //사업부 설정
  setBsnsCombo()
  searchParams.YEAR = data.YEAR
  searchParams.BSNS_CD = data.BSNS_CD
  searchParams.IN_OUT = data.IN_OUT
  inOutChange()
}

const inOutChange = async () =>{
  let visibleColumns1 = ['RESULT_CD']
  let visibleColumns2 = ['RESULT_CD1','RESULT_CD2','RESULT_CD3','RESULT_CD4','RESULT_CD5']   
  await grdMainProps.fields.forEach(item =>{
    if(visibleColumns1.includes(item.fieldName)){
      if(searchParams.IN_OUT === 'IN' || searchParams.IN_OUT === '' )
        item.visible = true
      else
        item.visible = false
    }

    if(visibleColumns2.includes(item.fieldName)){
      if(searchParams.IN_OUT === 'OT' || searchParams.IN_OUT === '' )
        item.visible = true
      else
        item.visible = false
    }
  })
  await grdMain.value.getDataProvider().setFields(grdMainProps.fields)
  await grdMain.value.getGridView().setColumns(grdMainProps.fields)
  searchMain()
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1000"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="60"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>부서별 부적합 현황(건수) 팝업</span>
    </v-sheet>  
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <!-- 조회조건 -->
          <VForm ref="searchArea" class="mt-3 searchArea justify-space-between d-flex">
            <div class="d-flex">

              <!--  년도  -->
              <i-input
              :label="$t('년도')"
              label-width="35px"
              width="150px"
              v-model="searchParams.YEAR"
              type="Number"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
              />
              <!-- 사업부 -->
              <i-select
                :label="$t('사업부')"
                label-width="60px"
                width="230px" 
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <!-- 내외 여부 -->
              <i-select
                :label="$t('내/외부')"
                label-width="70px"
                width="300px"
                v-model="searchParams.IN_OUT"
                :items="codeList.IN_OUT"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="inOutChange"
              />
            </div>
            <div>
              <IGridTitle
                class="mt-2"
                :use-permission="false"
                :button-list="['btnSearch', 'btnClose']"
                @click-button="onButtonsClick"
              />
            </div>
          </VForm>
          <RealGrid
            ref="grdMain"
            class="mt-2 h-auto"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </div>
      </v-card-text>
    </v-card>       
  </VDialog>
</template>

<style lang="scss" scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 500px;
  }
}
</style>
