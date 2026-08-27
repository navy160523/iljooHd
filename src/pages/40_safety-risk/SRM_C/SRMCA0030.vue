<!-- 
  화면명   : Hi-SAFE 연도별 우수과제 현황
  화면개요 : Hi-SAFE 등록된 주제 중 연도별로 우수과제를 조회
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import HiSafePopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup01.vue'

defineOptions({
  name: '40_safety-risk-SRM_C-SRMCA0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const userLogStore = useLogsStore()   
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const grdMain = ref(null)

// Hi-Safe 팝업
const hiSafePopup = ref(null)

// 파일업로드 팝업
const fileUploadPopup = ref(null)

const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY')
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  EXCELLENT: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '대상' },
    { COD: 'B', TXT: '최우수상' },
    { COD: 'C', TXT: '우수상' },
    { COD: 'D', TXT: '장려상' },
    { COD: 'E', TXT: '안전개선상' },
  ]
})

const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      }, 
    }),
    // 부서[2]
    commonSearchApi({ 
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV:'Y'
      } 
    })
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
  })
}

// 그리드 세팅
const grdMainProps = reactive({
  gridViewOption : {
    stateBar: { visible: false }, 
    edit: { editable: false }, 
    checkBar: { visible: false }
  },
  keys : [],
  fields : [
    { fieldName: 'EXCELLENT', dataType: 'text', width: '155', header: { text: t('수상') }, 
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.EXCELLENT }
    }, 
    { fieldName: 'BSNS_CD', dataType: 'text', width: '270', header: { text: t('사업부') }, lookupDisplay: true },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '270', header: { text: t('부서') }, lookupDisplay: true },
    { fieldName: 'RISK_NM', dataType: 'text', width: '300', header: { text: t('과제') }, styleName: 'left-column multiline-editor' },
    { fieldName: 'IMP_PLAN', dataType: 'text', width: '300', header: { text: t('개선내용') }, styleName: 'left-column multiline-editor' },
    { fieldName: 'FILE_ID', dataType: 'text', width: '70', header: { text: t('자료') }, 
      styleCallback: function(grid, dataCell) {
        // 아이콘 세팅
        let ret = {}
        ret.renderer = {
          type: 'icon',
          iconLocation: 'left',
          iconCallback: function(grid, cell) { 
            return new URL('/src/assets/images/icons/list-box-outline.png', import.meta.url).href
          },
          iconHeight: 20,
          iconWidth: 20
        }

        return ret
      },
      displayCallback: function(grid, dataCell) {
        return ''
      }
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'TASK_SEQ', dataType: 'text', visible: false },
    { fieldName: 'TASK_NO', dataType: 'text', visible: false },
    { fieldName: 'REG_DT', dataType: 'text', visible: false },
    { fieldName: 'CUR_PLOB', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

// 조회

const searchData = () => {
  if (!searchParams.YEAR) {
    return Message.warn(t('년도를 선택해주세요.'))
  }

  return commonSearchApi({ queryId : 'SRMCA0030_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  console.log('isAdmin', isAdmin.value)
}

// 셀(자료) 아이콘 클릭 이벤트 - 파일 업로드 팝업 오픈
const onCellItemClicked = (grid, index, col) => {
  fileUploadPopup.value.openPopup(col.value)
}

// 더블 클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)

  hiSafePopup.value.openPopup({
    TASK_NO_1: data.TASK_NO,
    TEMP_YN: 'N'
  })
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="flex-column">
          <div class="searchArea d-flex">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              width="300px"
              type="YEAR"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto mt-3">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div> 
    </v-card-text>
  </v-card>

  <!-- UPLOAD 팝업 -->
  <IUploadPopup
    ref="fileUploadPopup"
    :buttonList="isAdmin === true ? ['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'] : ['btnDownLoad', 'btnClose']" 
    :autoUpload="isAdmin === true ? true : false"
    :isVisibled="isAdmin === true ? true : false"
  />
  
  <!-- Hi-Safe -->
  <HiSafePopup ref="hiSafePopup" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

</style>