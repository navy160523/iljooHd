<!-- 
  * Vue 내 용 : 안전지침서 목록
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/13
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/13 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

import DATBA0010Popup01 from "./DATBA0010Popup01.vue"
import DATBA0010Popup02 from "./DATBA0010Popup02.vue"
import DATBA0010Popup03 from "./DATBA0010Popup03.vue"

defineOptions({
  name:'70_data-DAT_B-DATBA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const dATBA0010Popup01 = ref(null)
const dATBA0010Popup02 = ref(null)
const dATBA0010Popup03 = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: '',
  SEARCH_CATEGORY: '',
  TEXT: '',
  GUBUN1: '',
  GUBUN2: '',
  DATE_FROM: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  DATE_TO: dayjs().format("YYYY-MM-DD"),
  DATE_YN: 'N',
  FAVORITE_YN: 'N',

  EMP_NO: userStore.userId,
})

//조회조건
const sendParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: "",  
  SEARCH_CATEGORY: "",
  TEXT: "",
  GUBUN1: "",
  GUBUN2: "",
  DATE_FROM: "",
  DATE_TO: "",
  DATE_YN: "",
  FAVORITE_YN: "",
  EMP_NO: "",
})

//코드리스트
const codeList = reactive({
  SEARCH_GBN1 : [],
  SEARCH_GBN2 : [],
})

const searchCombo = ref({
  COD: 'TITLE',
  LIST : [
    { COD: 'TITLE', TXT: '제목' }, 
    { COD: 'CONTENT', TXT: '내용' },
    { COD: 'TITLE_CONTENT', TXT: '제목+내용' },
  ],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV'],
  fields : [ 
    { fieldName: 'GUBUN1', dataType: 'text', width: '100', header: { text: t('적용사업부') }, editable:false },
    { fieldName: 'GUBUN2', dataType: 'text', width: '80', header: { text: t('작업구분') }, editable:false },
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '300', header: { text: t('지침서명') }, editable:false, styleName: "left-column" },
    { fieldName: 'CATEGORY1', dataType: 'text', width: '60', header: { text: t('개정No.') }, editable:false },
    { fieldName: 'FILE_CNT', dataType: 'text', width: '55', header: { text: t('첨부자료 [건]') }, editable:false, styleName: "right-column" },
    { fieldName: 'KOR_NM', dataType: 'text', width: '95', header: { text: t('담당자') }, editable:false },
    { fieldName: 'TEL_NO', dataType: 'text', width: '75', header: { text: t('연락처') }, editable:false },
    { fieldName: 'CATEGORY3', dataType: 'datetime', width: '100', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('제정일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable:false },
    { fieldName: 'CATEGORY4', dataType: 'datetime', width: '100', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('개정일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable:false },
    { fieldName: 'FAVORITE_CHK', dataType: 'text', width: '60', editable: false, header: { text: t('즐겨찾기') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        // const val = grid.getValue(dataCell.index.itemIndex, "FAVORITE_CHK")

        if (dataCell.value === '-1') {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/favorite_off.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/favorite_on.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    { fieldName: 'REQ_STATUS', dataType: 'text', width: '75', header: { text: t('개정진행') }, editable:false },
    { fieldName: 'REQUEST', dataType: 'text', width: '60', editable: false, header: { text: t('개정신청') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/images/icons/add_file_icon.png', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      }, visible: (userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369') || userStore.userId === 'BP23198') ? true:false,
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DOC_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'datetime' , visible: false },
    { fieldName: 'NOTICE_PERIOD', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_CNT', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_RANGE', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_TAG', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text' , visible: false },
    { fieldName: 'REPLY_DATE', dataType: 'text' , visible: false },
    { fieldName: 'SEQ', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'REJECT_DESC', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_TITLE', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_NOTE', dataType: 'text' , visible: false },
    { fieldName: 'REQ_REJECT_DESC', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'REQ_EMP_NO', dataType: 'text' , visible: false },
    { fieldName: 'REQ_EMP_NM', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text' , visible: false },
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
    //getCodeList(userStore.cmpnyDiv + 'Z090BA'), //분류1 콤보
    //getCodeList(userStore.cmpnyDiv + 'Z090BB'), //분류2 콤보

    // cmpnyDiv가 일렉일 경우 데이터가 조회되지 않아서 HHI로 고정함 (2024.10.23 by kykim)
    getCodeList('HHI' + 'Z090BA'), //분류1 콤보
    getCodeList('HHI' + 'Z090BB'), //분류2 콤보

  ]).then(res => {
    codeList.SEARCH_GBN1 = res[0].ORESULT_CUR
    codeList.SEARCH_GBN2 = res[1].ORESULT_CUR

    codeList.SEARCH_GBN1.unshift({ TXT: "전체", COD: "" })
    codeList.SEARCH_GBN2.unshift({ TXT: "전체", COD: "" })

    searchParams.GUBUN1 = ''
    searchParams.GUBUN2 = ''
    searchParams.SEARCH_CATEGORY = 'TITLE'

    let path = useLogsStore().path.split('/')
    let menuId = path[path.length -1]

    searchParams.NOTICE_DIV = menuId
    if (userStore.userDiv === 'A') {
      //로그인유저가 IT관리자,안전직원이면, 2025.07.02 윤찬양책임 요청으로 추가
      if (userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369')) {
        menuTitle.value.setBtnProperty('btnRequest', 'visible', true)
      } else {
        menuTitle.value.setBtnProperty('btnRequest', 'visible', false)
      }
    }
    else {
      menuTitle.value.setBtnProperty('btnRequest', 'visible', false)
    }

    onButtonsClick({ id :'btnSearch' })
  })
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnRequest') {
    dATBA0010Popup03.value.openPopup(null, 'N', false)
  } 
  else if (btn.id === 'btnSearch') {

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnRegist') {
    dATBA0010Popup02.value.openPopup(null, searchParams.NOTICE_DIV,  'NEW')
  }
}

// 조회
const searchData = () =>{
  sendParams.CMPNY_DIV = searchParams.CMPNY_DIV
  sendParams.NOTICE_DIV = searchParams.NOTICE_DIV
  sendParams.SEARCH_CATEGORY = searchParams.SEARCH_CATEGORY
  sendParams.TEXT = searchParams.TEXT
  sendParams.GUBUN1 = searchParams.GUBUN1
  sendParams.GUBUN2 = searchParams.GUBUN2
  sendParams.DATE_FROM = dayjs(searchParams.DATE_FROM).format('YYYYMMDD')
  sendParams.DATE_TO = dayjs(searchParams.DATE_TO).format('YYYYMMDD')
  sendParams.DATE_YN = searchParams.DATE_YN
  sendParams.FAVORITE_YN = searchParams.FAVORITE_YN
  sendParams.EMP_NO = searchParams.EMP_NO

  return commonSearchApi({ queryId : 'DATBA0010_SEARCH_01', param: sendParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

// 조회조건 엔터키 클릭 시 자동 조회 (조회조건 컨트롤마다 걸어줘야한다.)
const controlKeyUp = async event => {
  if(event.key === 'Enter'){
    onButtonsClick({ id :'btnSearch' })
  }  
}

// col.field === 9 : 즐겨찾기
// col.field === 11 : 개정신청
const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  let rcod = ''
  let rmsg = ''

  if (col.field === 9) {
    let iFAVORITE_CHK = data.FAVORITE_CHK

    if (iFAVORITE_CHK === '0') {

      iFAVORITE_CHK = '-1'

      let deleteParams = {
        CMPNY_DIV: data.CMPNY_DIV,
        NOTICE_DIV: data.NOTICE_DIV,
        NOTICE_NO: data.NOTICE_NO,
        EMP_NO: userStore.userId,
        RES_COD: '',
        RES_MSG: '',
        RES_COL: '',
      }

      Promise.all([
        commonExecuteApi({ queryId: "DATBA0010_DELETE_01", list: [deleteParams] }),
      ]).then(res => {
        rcod = res[0].list[0].OUT_RES_COD
        rmsg = res[0].list[0].OUT_RES_MSG

        if (rcod != '0') {
          return Message.err(t(rmsg))
        }
        else {
          Message.info(t('즐겨찾기가 삭제되었습니다.'))
        }

        onButtonsClick({ id :'btnSearch' })
      })
    }
    else {
      iFAVORITE_CHK = '0'

      let saveParams = {
        CMPNY_DIV: data.CMPNY_DIV,
        NOTICE_DIV: data.NOTICE_DIV,
        NOTICE_NO: data.NOTICE_NO,
        EMP_NO: userStore.userId,
        RES_COD: '',
        RES_MSG: '',
        RES_COL: '',
      }

      Promise.all([
        commonExecuteApi({ queryId: "DATBA0010_SAVE_02", list: [saveParams] }),
      ]).then(res => {
        rcod = res[0].list[0].OUT_RES_COD
        rmsg = res[0].list[0].OUT_RES_MSG

        if (rcod != '0') {
          return Message.err(t(rmsg))
        }
        else {
          Message.info(t('즐겨찾기가 추가되었습니다.'))
        }

        onButtonsClick({ id :'btnSearch' })
      })
    }
  }
  else if (col.field === 11) {
    let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

    dATBA0010Popup03.value.openPopup(data, userLogStore.isMenuAdmin, true)
  }
}

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (clickData.cellType !== "header" && clickData.fieldName != "REQUEST" && clickData.fieldName != "FAVORITE_CHK") {
    dATBA0010Popup01.value.openPopup(row, userLogStore.isMenuAdmin)
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
        :button-list="['btnRequest', 'btnSearch', 'btnRegist']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.SEARCH_CATEGORY" 
            :label="$t('검색')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="searchCombo.LIST"
            item-value="COD"
            item-title="TXT"
            width="215px"
            required
          />
          <i-input 
            v-model="searchParams.TEXT"
            width="350px"
            @keyup="controlKeyUp"
          />
          <i-select
            v-model="searchParams.GUBUN1" 
            :label="$t('적용사업부')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="codeList.SEARCH_GBN1"
            item-value="COD"
            item-title="TXT"
            width="235px"
          />
          <i-select
            v-model="searchParams.GUBUN2" 
            :label="$t('작업구분')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="codeList.SEARCH_GBN2"
            item-value="COD"
            item-title="TXT"
            width="235px"
          />
          <i-input
            v-model="searchParams.DATE_FROM"
            :label="$t('제개정 일자')"
            label-width="80px"
            type="date"
            width="235px"
          />
          <i-input
            v-model="searchParams.DATE_TO"
            :label="$t('~')"
            width="165px"
            type="date"
          />
          <VCheckbox
            v-model="searchParams.DATE_YN"
            :label="$t('기간조건 포함')"
            class="pe-2"
          />
          <VCheckbox
            v-model="searchParams.FAVORITE_YN"
            :label="$t('즐겨찾기')"
            class="pe-2"
          />
        </v-sheet>
        <v-sheet 
          height="100%" 
          class="mb-2"
        >
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('안전지침서 목록')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @on-cell-item-clicked="onCellItemClicked"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <!-- 안전지침서관리 팝업 -->
      <DATBA0010Popup01
        ref="dATBA0010Popup01" 
      />
      <!-- 안전지침서등록 팝업 -->
      <DATBA0010Popup02
        ref="dATBA0010Popup02"
        editor-id="100"
        @closed="afterPopupClosed"
      />
      <!-- 안전지침서 제개정 요청 팝업 -->
      <DATBA0010Popup03
        ref="dATBA0010Popup03"
        editor-id="300"
        @closed="afterPopupClosed"
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
