<!--
  화면명 : 기성지급 이력(팝업)
  화면개요 : 
-->
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
  YYYY : dayjs().format("YYYY"),
})

const clearData = () => {
  if(grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

const searchMain = () => {
  //기본 자격증 그리드 콤보
  commonSearchApi({ queryId : 'EDUAD0010_SEARCH_01', param: searchParams }).then(res => {    
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

//******************************세팅 영역(종료)***************************************************/
// 선행보유 자격증 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'YYYYMM', dataType: 'text', header: { text: t('마감기준년월') }, editable: false, width: '30' },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('조회기간') }, editable: false, width: '70' },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('마감일시') }, editable: false, width: '50' },
    { fieldName: 'INSERT_USER_NM', dataType: 'text', header: { text: t('마감담당자') }, editable: false, width: '30' },
    { fieldName: 'BASE_COST', dataType: 'number', header: { text: t('수당기준금액') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '30' },
    { fieldName: 'EDU_USER_CNT', dataType: 'number', header: { text: t('인원수') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '30' },
    { fieldName: 'EDU_HOUR', dataType: 'number', header: { text: t('이수시간') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '30' },
    { fieldName: 'TOT_COST', dataType: 'number', header: { text: t('금액') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '40' },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '120', visible: false  },
    { fieldName: 'EDU_DATE_FR', dataType: 'text', header: { text: t('EDU_DATE_FR') }, width: '120', visible: false  },
    { fieldName: 'EDU_DATE_TO', dataType: 'text', header: { text: t('EDU_DATE_TO') }, width: '60', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
  searchMain()

  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/

//창 닫음
const onClose = () => {
  dialog.value = false
}

//추가 버튼 이벤트
const onSelectButtonClick = () => {
  searchMain()
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    onSelectButtonClick()
  } else {
    onClose()
  }
}

const keyupYYYY = event => {
  if(event.key === 'Enter'){
    onButtonsClick({ id :'btnSearch' })
  }  

  let regex = /[^.0-9]/g
  
  searchParams.YYYY = searchParams.YYYY.replaceAll(regex, '')
  if(searchParams.YYYY.length > 4){
    searchParams.YYYY = searchParams.YYYY.substring(0,4)
  }
}

const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
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
      <span>기성지급 이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-2 pb-2" >
        <v-sheet class="d-flex searchArea" style="justify-content: space-between;">
          <div>
            <i-input
              :label="$t('년도')"
              v-model="searchParams.YYYY"
              @keyup="keyupYYYY"
              @update:model-value="gridRefresh"
            />
          </div>
          <div>
            <IGridTitle
              :use-permission="false"
              :button-list="['btnSearch', 'btnClose']"
              @click-button="onButtonsClick"
            />
          </div>
        </v-sheet>
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>   
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
