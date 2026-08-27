<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import OZReport from '@/components/OZReport.vue'

const dialog = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const grdMain = ref(null)
const reportName = ref('/manage/hse/SAFAG0060_02.ozr')
// OzReport 팝업 여부
const showOz = ref(false)

const hapDate = reactive([
  { TXT: '합의예정일', COD: 'A' },
  { TXT: '합의일', COD: 'B' },
])

const codeList = reactive({
  grade: [], //장해등급
})

const searchParam = reactive({
  HAP_GUBUN: '', //합의예정일,합의일
  HAP_DATE: '', //날짜
})

const reportParam = reactive(['IN_CMPNY_DIV=', 'IN_EMP_NO=', 'IN_NAME=', 'IN_SANNO='])

//출력관련 로직 시작
const ozPrint = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))
    return false
  }
  reportParam[0] = 'IN_CMPNY_DIV='
  reportParam[1] = 'IN_EMP_NO='
  reportParam[2] = 'IN_NAME='
  reportParam[3] = 'IN_SANNO='

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    reportParam[0] += data.CMPNY_DIV + ','
    reportParam[1] += data.EMP_NO + ','
    reportParam[2] += data.KOR_NM + ','
    reportParam[3] += data.SANNO + ','
    if (i == chkNum.length) {
      console.log('i', i)
      console.log('num', chkNum.length)
      reportParam[0] += data.CMPNY_DIV
      reportParam[1] += data.EMP_NO
      reportParam[2] += data.KOR_NM
      reportParam[3] += data.SANNO
    }
  }

  showOz.value = true
}
//출력관련 로직 끝

const openPopup = () => {
  dialog.value = true
  commonSearchApi({
    //장해등급 조회
    queryId: 'searchCommonCode',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      ALL_UP_CD: 'HHIB250040',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
    },
  }).then((res) => {
    codeList.grade = res.ORESULT_CUR
    grdMain.value.setBindingColumn('GRADE', codeList.grade, 'COD', 'TXT')
  })
}

const closePopup = () => {
  dialog.value = false
}

const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -1달 ~ TO : 오늘날짜
  let date = dayjs()

  searchParam.HAP_DATE =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    { fieldName: 'KOR_NM', editable: false, dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'BIRTH_DAY', editable: false, dataType: 'text', header: { text: t('생년월일') } },
    { fieldName: 'DEPT_NM', editable: false, dataType: 'text', header: { text: t('소속') } },
    {
      fieldName: 'HLD_OFFI_GBN',
      editable: false,
      dataType: 'text',
      header: { text: t('재직여부') },
    },
    { fieldName: 'OCCURDATE', editable: false, dataType: 'text', header: { text: t('재해일') } },
    { fieldName: 'ENDDTE', editable: false, dataType: 'text', header: { text: t('요양종결') } },
    { fieldName: 'SANGBYUNG', editable: false, dataType: 'text', header: { text: t('상병명') } },
    {
      fieldName: 'GRADE',
      dataType: 'text',
      lookupDisplay: true,
      editable: false,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('등급') },
    },
    {
      fieldName: 'HAPAMT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      header: { text: t('위로금(천원)') },
    },

    { fieldName: 'HAPBIGO', editable: false, dataType: 'text', header: { text: t('비고') } },
    {
      fieldName: 'SANNO',
      editable: false,
      visible: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      editable: false,
      visible: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'EMP_NO',
      editable: false,
      visible: false,
      dataType: 'text',
      header: { text: t('') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnPrint') {
    console.log('이거탐?')
    ozPrint()
  } else {
    closePopup()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAG0060_PRINT01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//조회관련 로직 끝
onMounted(() => {
  defaultDate()
  searchParam.HAP_GUBUN = 'A'
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1300"
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
      <div class="title-bar" @mousedown="startDragging">품의서출력</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('합의일구분')"
              v-model="searchParam.HAP_GUBUN"
              :items="hapDate"
              item-title="TXT"
              item-value="COD"
              width="200px"
            >
            </i-select>
            <i-input
              :label="$t('날짜선택')"
              v-model="searchParam.HAP_DATE"
              type="date"
              width="200px"
            >
            </i-input>
          </v-sheet>
          <v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 420px)"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="reportParam"
      @close="showOz = $event"
    />
  </v-dialog>
</template>
