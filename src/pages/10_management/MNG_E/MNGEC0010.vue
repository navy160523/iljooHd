<!--
  화면명 : MNGEC0010.vue
  화면개요 :질의회시
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonRequest, commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import MNGEC0010Popup from "./MNGEC0010Popup.vue"

defineOptions({
  name:'10_management-MNG_E-MNGEC0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const ckDisabled = ref(true)
const mNGEC0010Popup = ref(null)


//조회조건
let searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE: "A",
  DATE_FROM: "",
  DATE_TO: "",
  GUBUN: "T",
  SEARCH: "",
  NOTICE_RANGE: "A",
  NOTICE_DIV: "MNZFDB11002Y",
})


const codeList = reactive({
  GUBUN: [
    { TXT: "제목",        COD: "T" },
    { TXT: "내용",        COD: "N" },
    { TXT: "제목 + 내용", COD: "TN" },
  ],

})


const rowSearchParam = reactive({
  CMPNY_DIV: "",
  NOTICE_DIV: "",
  NOTICE_NO: "",
})

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  rowSearchParam.CMPNY_DIV = row.CMPNY_DIV
  rowSearchParam.NOTICE_DIV = row.NOTICE_DIV
  rowSearchParam.NOTICE_NO = row.NOTICE_NO

  new queryFlowHelper(vm, t)
    .setQuery(serachData02)
    .setAfter(afterSearch02)
    .run()
}

const serachData02 = () => {
  return commonRequest("/hse/operation/search01", {
    queryId: "MNGEC0010_SEARCH_02",
    param: rowSearchParam,
  })
}

const afterSearch02 = async res => {
  let noticeInfo = await res.ORESULT_CUR[0]
  mNGEC0010Popup.value.openPopup(true, noticeInfo)
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnRegist'){
    mNGEC0010Popup.value.openPopup(false)
  }
}

const searchData = () => {
  return commonRequest("/hse/operation/search01", {
    queryId: "MNGEC0010_SEARCH_01",
    param: searchParam,
  })
  // return commonSearchApi({ queryId: "MNGEC0010_SEARCH_01", param: searchParam })
}

const afterSearch = res => {
  //console.log('res:',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '200', header: { text: t('제목') }, editable: false, styleName: "left-column" },
    { fieldName: 'FILE_CNT', dataType: 'text', header: { text: t('첨부자료(건)') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('작성자') }, editable: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('작성일시') }, editable: false },
    { fieldName: 'NOTICE_CNT', dataType: 'text', header: { text: t('조회(건)') }, editable: false },
    
    // 출력 안함
    { fieldName: 'REPLY_DATE', dataType: 'text', header: { text: t('답글일시') }, editable: false, visible: false },
    { fieldName: 'SORT_NO', dataType: 'text', header: { text: t('일련번호') }, editable: false, visible: false },   
    { fieldName: 'NOTICE_PERIOD', dataType: 'text', header: { text: t('게시기간') }, editable: false,  visible: false},
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_RANGE', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_TAG', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'NOTICE_TITLE',
    'FILE_CNT',
    'KOR_NM',
    'INSERT_DATE',
    'NOTICE_PERIOD',
    'NOTICE_CNT',
    'NOTICE_CNT',
    'SORT_NO',
  ],
})

grdMainProps.columns = grdMainProps.fields

watch(() => searchParam.DATE,  (newValue, oldValue) => {
  //console.log('newValue:',newValue)
  let today = dayjs()

  if(newValue === 'A'){
    searchParam.DATE_FROM = ''
    searchParam.DATE_TO = ''
    ckDisabled.value = true
  }
  else if(newValue === 'W'){
    searchParam.DATE_FROM = today.subtract(1, 'week').format('YYYY-MM-DD')
    searchParam.DATE_TO = today.format('YYYY-MM-DD')
    ckDisabled.value = false
  }
  else if(newValue === 'M'){
    searchParam.DATE_FROM = today.subtract(1, 'month').format('YYYY-MM-DD')
    searchParam.DATE_TO = today.format('YYYY-MM-DD')
    ckDisabled.value = false
  }
  else if(newValue === 'C'){
    searchParam.DATE_FROM = ''
    searchParam.DATE_TO = ''
    ckDisabled.value = false
  }
})

//초기 데이터셋팅
onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnRegist']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select 
            :label="$t('조회 구분')"
            labelWidth="70px"
            width="200px" 
            v-model="searchParam.GUBUN"
            :items="codeList.GUBUN"
            item-value="COD"
            item-title="TXT"
            class="mr-1"
            />
          <i-input
            v-model="searchParam.SEARCH" 
            width="250px"
            @keydown.enter=" e => {
              onButtonsClick({id:'btnSearch'})
            }"
          />
        </v-sheet>
        <v-sheet class="mb-3">
          <!-- 현업 요청으로 그리드 타이틀 제거, 수정일 : 2024.07.04-->
          <!-- <IGridTitle
            :title="$t('게시판 목록')"
          >
            <template #editors />
          </IGridTitle> -->
          <RealGrid
            ref="grdMain"
            style="height: calc(100vh - 260px)"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <mNGEC0010Popup
      @after-search="() => onButtonsClick({ id: 'btnSearch' })"
      ref="mNGEC0010Popup"
    />
  </v-card>
</template>

