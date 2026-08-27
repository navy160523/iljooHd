<!-- 
  * Vue 내 용 : 안전표준서
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/21
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/21 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonExecuteApi, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"

import DATAA0010Popup01 from "./DATAA0010Popup01.vue"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"

defineOptions({
  name:'70_data-DAT_A-DATAA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const dATAA0010Popup01 = ref(null)
const fileUploadPopup = ref(null)

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV:"",
  GUBUN: "T",
  CLSFC: "",
  SEARCH: "",
  FAVORITE_YN:"N",
  NOTICE_NO1_1:'',
  NOTICE_NO1_2:'',
  NOTICE_NO1_3:'',
  NOTICE_NO1_4:'',
  EMP_NO: userStore.userId,
})

const deleteParam = reactive({
  CMPNY_DIV: "",
  NOTICE_DIV:"",
  NOTICE_NO:"",
  CLSFC:"",
})

const selectParam = reactive({
  NOTICE_LIST_FILE_ID: "",
})

/* 조회 구분 */
const dtGbn = reactive([
  { COD: "T", TXT: "제목" },
  { COD: "N", TXT: "내용" },
  { COD: "TN", TXT: "제목 + 내용" },
])

const ClassificationList = ref(
  [
    { COD: '' , TXT: '전체' },
    { COD: 'C' , TXT: '공통' },
    { COD: 'S' , TXT: '안전' },
    { COD: 'H' , TXT: '보건' },
    { COD: 'E' , TXT: '환경' },
  ],
)

//그리드 속성셋팅
//표준서번호, 표준서명(현, 제목), 분류(공통, 안전, 보건, 환경), 등록(수정)자, 등록(수정)일시, 조회수
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  keys : ['CMPNY_DIV','NOTICE_NO','NOTICE_DIV'],
  fields : [
    { 
      fieldName: 'NOTICE_NO1', 
      dataType: 'text', 
      width: '150', 
      header: { text: t('표준서번호') }, 
      editable:false,
    },    
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '300', header: { text: t('제목') }, editable:false, styleName: "left-column"  },
    { fieldName: 'CLSFC_NM', dataType: 'text', width: '75', type: 'data', header: { text: t('분류') }, editable:false },
    { fieldName: 'FILE_CNT', dataType: 'text', width: '60', header: { text: t('첨부자료 [건]') }, editable:false, styleName: "right-column" },
    { fieldName: 'FILE_ORG_CNT', dataType: 'text', width: '60', header: { text: t('서식첨부자료 [건]') }, editable:false, styleName: "right-column" },
    { fieldName: 'KOR_NM', dataType: 'text', width: '95', header: { text: t('등록(수정)자') }, editable:false },
    { fieldName: 'INSERT_DATE', dataType: 'datetime', width: '100', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('등록(수정)일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable:false },
    { fieldName: 'FAVORITE_CHK', dataType: 'text', width: '60', editable: false, header: { text: t('즐겨찾기') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

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
    { fieldName: 'NOTICE_CNT', dataType: 'text', width: '55', header: { text: t('조회수') }, editable:false, styleName: "right-column" },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text', visible: false },
    { fieldName: 'NOTICE_NOTE', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID_ORG', dataType: 'text' , visible: false },
    { fieldName: 'CLSFC', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_LIST_FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'ECM_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  vm.$nextTick(() => {
    initPage()
  })
})

const initPage = () => {
  let path = useLogsStore().path.split('/')
  let menuId = path[path.length -1]

  console.log("menuId", menuId)
  searchParams.NOTICE_DIV = menuId
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnNew') {
    dATAA0010Popup01.value.openPopup(null, searchParams.NOTICE_DIV)
  } 
  else if (btn.id === 'btnDelete') {
    
    new deleteFlowHelper(vm, t) 
      .setBefore(beforeDelete)  
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
  else if (btn.id === 'btnStdDocStatus') {
    fileUploadPopup.value.openPopup(selectParam.NOTICE_LIST_FILE_ID)
  }
}

/* ************ 삭제 *************** */
const beforeDelete = () => {
  if(isEmpty(deleteParam.NOTICE_NO)) {
    return Message.warn('저장되지 않았거나, 선택된 정보가 없습니다.')
  }

  return true
}

const deleteData = () => {
  let deleteParams = []

  deleteParams.push(
    {
      CMPNY_DIV: deleteParam.CMPNY_DIV,
      NOTICE_DIV: deleteParam.NOTICE_DIV,
      NOTICE_NO: deleteParam.NOTICE_NO,
      CLSFC: deleteParam.CLSFC,
    },
  )
  return commonExecuteApi({ queryId : 'DATAA0010_DELETE_02', list: deleteParams })
}

// 조회
const searchData = () =>{
  return commonRequest("/hse/data/DATAA0010_SEARCH_01", { queryId : 'DATAA0010_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  
  selectParam.NOTICE_LIST_FILE_ID = res.ORESULT_CUR2[0].NOTICE_LIST_FILE_ID
}

// 조회조건 엔터키 클릭 시 자동 조회 (조회조건 컨트롤마다 걸어줘야한다.)
const controlKeyUp = async event => {
  if(event.key === 'Enter'){
    onButtonsClick({ id :'btnSearch' })
  }  
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  let rcod = ''
  let rmsg = ''

  if (col.field === 6) {
    let iFAVORITE_CHK = data.FAVORITE_CHK

    if (iFAVORITE_CHK === '0') {

      iFAVORITE_CHK = '-1'

      let deleteParams = {
        CMPNY_DIV: data.CMPNY_DIV,
        NOTICE_DIV: data.NOTICE_DIV,
        NOTICE_NO: data.NOTICE_NO,
        EMP_NO: userStore.userId,
      }
      Promise.all([
        commonExecuteApi({ queryId: "DATAA0010_DELETE_01", list: [deleteParams] }),
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
      }

      Promise.all([
        commonExecuteApi({ queryId: "DATAA0010_SAVE_02", list: [saveParams] }),
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
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType === "data" && clickData.fieldName != "FAVORITE_CHK") {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    dATAA0010Popup01.value.openPopup(row, searchParams.NOTICE_DIV)
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    if(userStore.userId == row.NOTICE_REG_EMPNO || useLogsStore().isMenuAdmin == 'Y') {
      menuTitle.value.disableBtn('btnDelete', false)
    } else {
      menuTitle.value.disableBtn('btnDelete', true)
    }
    deleteParam.CMPNY_DIV = row.CMPNY_DIV
    deleteParam.NOTICE_DIV = row.NOTICE_DIV
    deleteParam.NOTICE_NO = row.NOTICE_NO
    deleteParam.CLSFC = row.CLSFC
  }
}

// 팝업에서 종료 후 재조회
const afterPopupClosed = () => {
  onButtonsClick({ id: "btnSearch" })
}

// 파일 업로드 후 저장 
const uploaded = param => {
  if (param.fileId) {
    selectParam.NOTICE_LIST_FILE_ID = param.fileId
    saveStandardStatus()
  } else {
    selectParam.NOTICE_LIST_FILE_ID = ''
  }
}

const saveStandardStatus = () => {
  let rcod = ''
  let rmsg = ''

  let saveParams = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    NOTICE_DIV: searchParams.NOTICE_DIV,
    NOTICE_LIST_FILE_ID: selectParam.NOTICE_LIST_FILE_ID,
    USER_ID: userStore.userId,
  }

  Promise.all([
    commonExecuteApi({ queryId: "DATAA0010_SAVE_04", list: [saveParams] }),
  ]).then(res => {
    rcod = res[0].list[0].OUT_RES_COD
    rmsg = res[0].list[0].OUT_RES_MSG

    if (rcod != '0') {
      return Message.err(t(rmsg))
    }
    else {
      Message.info(t('표준서 현황 문서가 저장되었습니다.'))
    }
  })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnNew', 'btnDelete', 'btnStdDocStatus']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CLSFC" 
            :label="$t('분류')"
            :items="ClassificationList"
            item-title="TXT"
            item-value="COD"
            label-width="50px"
            append-inner-icon="mdi-magnify"
            width="150px"
            required
          />
          <i-input
            v-model="searchParams.NOTICE_NO1" 
            :label="$t('표준서번호')"
            label-width="70px"
            width="250px"
          />
          <i-select
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            label-width="70px"
            append-inner-icon="mdi-magnify"
            :items="dtGbn"
            item-title="TXT"
            item-value="COD"
            width="230px"
            clearable
            @update:model-value="reset"
          />
          <i-input 
            v-model="searchParams.SEARCH" 
            width="350px"
            @keyup="controlKeyUp"
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
          <IGridTitle :title="$t('게시판 목록')">
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
            @on-cell-clicked="onCellClicked"
          />
        </v-sheet>
      </div>
      <!-- 표준서등록 팝업 -->
      <DATAA0010Popup01
        ref="dATAA0010Popup01" 
        @closed="afterPopupClosed"
      />
      <!-- 표준서 현황 파일첨부 -->
      <IUploadPopup 
        ref="fileUploadPopup"
        @uploaded="uploaded($event)"
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
