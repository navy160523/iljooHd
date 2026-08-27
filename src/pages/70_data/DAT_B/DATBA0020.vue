<!-- 
  * Vue 내 용 : 안전지침서 제개정 요청
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/20
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/20 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonRequest, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'

import DATBA0010Popup03 from "./DATBA0010Popup03.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"

defineOptions({
  name:'70_data-DAT_B-DATBA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

const dATBA0010Popup03 = ref(null)
const empPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_FROM: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  DATE_TO: dayjs().format("YYYY-MM-DD"),
  STATUS: '',
  EMP_NM: userStore.userName,
  EMP_NO: userStore.userId,
  USER_ID: userStore.userId,
})

//조회조건
const sendParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_FROM: '',
  DATE_TO: '',
  STATUS: '',
  EMP_NM: userStore.userName,
  EMP_NO: userStore.userId,
  USER_ID: userStore.userId,
})

const statusParam = reactive(
  {
    EMP_NO_READONLY: false,
  },
)

//코드리스트
const codeList = reactive({
  STATUS : [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { 
      fieldName: 'ER_GUBUN', 
      dataType: 'text',
      width: '50',
      header: { text: t('제개정구분') },
    },
    { 
      fieldName: 'REQ_NOTICE_TITLE', 
      dataType: 'text',
      width: '450',
      styleName: "left-column",
      header: { text: t('지침서명') },
    },
    { 
      fieldName: 'STATUS_NM', 
      dataType: 'text', 
      width: '75', 
      header: { text: t('제개정 진행상태') },
    },
    { 
      fieldName: 'REQ_EMP_NM', 
      dataType: 'text', 
      width: '75',
      header: { text: t('신청자') },
    },
    { 
      fieldName: 'ASGN_NM', 
      dataType: 'text', 
      width: '120', 
      header: { text: t('신청자조직') }, 
    },
    { 
      fieldName: 'APPLY_DATE',
      dataType: 'text', 
      width: '75', 
      header: { text: t('신청일자') },
    },
    { 
      fieldName: 'APP_NAMES',
      dataType: 'text', 
      width: '75', 
      header: { text: t('승인자') },
    },
    { 
      fieldName: 'APP_DATE',
      dataType: 'text', 
      width: '75', 
      header: { text: t('최종승인일시') },
    },


    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_NOTE', dataType: 'text' , visible: false },
    { fieldName: 'SEQ', dataType: 'text' , visible: false },
    { fieldName: 'REQ_EMP_NO', dataType: 'text' , visible: false },
    { fieldName: 'REQ_REJECT_DESC', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_TITLE', dataType: 'text' , visible: false },
    { fieldName: 'GUBUN1', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_TAG', dataType: 'text' , visible: false },
    { fieldName: 'GUBUN2', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_FILEID', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  vm.$nextTick(() => {
    initCombo()
  })
})

//콤보박스 셋팅
const initCombo = () => {
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'Z090C'),
  ]).then(res => {
    codeList.STATUS = res[0].ORESULT_CUR

    codeList.STATUS.unshift({ TXT: "전체", COD: "" })

    searchParams.STATUS = ''

    if(userLogStore.isMenuAdmin === 'N') {
      statusParam.EMP_NO_READONLY = true
    }

    onButtonsClick({ id :'btnSearch' })
  })
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    console.log('조회')
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

// 데이터 조회
// NOTICE_NOTE 타입 CLOB 조회 처리
const searchData = () => {

  sendParams.CMPNY_DIV = searchParams.CMPNY_DIV
  sendParams.DATE_FROM = dayjs(searchParams.DATE_FROM).format('YYYYMMDD')
  sendParams.DATE_TO = dayjs(searchParams.DATE_TO).format('YYYYMMDD')
  sendParams.STATUS = searchParams.STATUS
  sendParams.EMP_NO = searchParams.EMP_NO
  sendParams.USER_ID = searchParams.USER_ID

  return commonRequest("/hse/data/DATBA0010_SEARCH_02", 
    { 
      queryId: "DATBA0010_SEARCH_02", 
      param: sendParams,
    })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearch : ', res)
  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

const deptValidation = () => {
  searchParams.EMP_NM = searchParams.EMP_NM.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  // 화면 관리자가 아닐 시 reutrn
  if(userLogStore.isMenuAdmin === 'N') {
    return
  }
  
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParams.EMP_NM,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = val => {
  console.log('[onEmpSelected] val : ', val)

  searchParams.EMP_NM = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}

// 담당자 x 클릭
const clearEmpNo = () => {  
  // 화면 관리자가 아닐 시 reutrn
  if(userLogStore.isMenuAdmin === 'N') {
    return
  }
  searchParams.EMP_NM = ''
  searchParams.EMP_NO = ''
}

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (clickData.cellType !== "header") {
    dATBA0010Popup03.value.openPopup(row, userLogStore.isMenuAdmin ,false)
  }
}

// 팝업에서 종료 후 재조회
const afterPopupClosed = () => {
  onButtonsClick({ id: "btnSearch" })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.DATE_FROM"
            :label="$t('제개정 일자')"
            label-width="80px"
            type="date"
            width="235px"
            required
          />
          <i-input
            v-model="searchParams.DATE_TO"
            :label="$t('~')"
            width="165px"
            type="date"
          />
          <i-input
            v-model="searchParams.EMP_NM"
            width="235px"
            :label="$t('담당자(신청자)')"
            :rules="[deptValidation]"
            required
            :readonly="statusParam.EMP_NO_READONLY"
            @click:append-inner="openEmpPopup"
            @keydown.enter="() => openEmpPopup('인원조회')"
          >
           <template v-slot:append-inner>
              <v-icon @click="openEmpPopup" icon="mdi-magnify" />
              <v-icon color="error" @click="clearEmpNo" icon="mdi-window-close" />
            </template>
          </i-input>
          <i-select
            v-model="searchParams.STATUS" 
            :label="$t('진행상태')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="codeList.STATUS"
            item-value="COD"
            item-title="TXT"
            width="235px"
            required
          />
        </v-sheet>
        <v-sheet 
          height="100%" 
          class="mb-2"
        >
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('안전지침서 제개정 요청')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <!-- 안전지침서 제개정 요청 팝업 -->
      <DATBA0010Popup03
        ref="dATBA0010Popup03"
        editor-id="400"
        @closed="afterPopupClosed"
      />
      <!-- 인원조회팝업 -->
      <EmpPopup 
        ref="empPopup" 
        @selected="onEmpSelected" 
      />
    </v-card-text>
  </v-card>
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
</style>
