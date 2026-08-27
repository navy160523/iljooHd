<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : MSDS 찾기   -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { getJsonFromExcel } from '@/utils/excel'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { commonLogExecuteApi } from '@hiway/api/commonApi'

defineOptions({
  name: '100_health-HLT_C-HLTCA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear() - 1),
})

/*  공통코드 세팅 */
onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: 'CMPNY_NM',
      header: { text: t('회사명') },
      width: '150',
      styleName: 'left-column',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'BSNS_NM',
      header: { text: t('사업부') },
      width: '150',
      styleName: 'left-column',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      header: { text: t('부서명') },
      width: '150',
      styleName: 'left-column',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'EMP_NO',
      header: { text: t('사원번호') },
      width: '80',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'GENDER',
      header: { text: t('성별') },
      width: '50',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'AGE',
      header: { text: t('나이') },
      width: '50',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'KOR_NM',
      header: { text: t('이름') },
      width: '50',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'BIRTH_DAY',
      header: { text: t('생년월일') },
      width: '100',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HEIGHT',
      header: { text: t('신장') },
      width: '50',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'WEIGHT',
      header: { text: t('체중') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'BMI',
      header: { text: t('비만도') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'WAIST',
      header: { text: t('허리둘레') },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HTN',
      header: { text: t('혈압\n(고)'), styleName: 'multiline-editor-pre' },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'LTN',
      header: { text: t('혈압\n(저)'), styleName: 'multiline-editor-pre' },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'SUGAR',
      header: { text: t('혈당\n(식전)'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'CHOL_TOT',
      header: { text: t('총콜레스테롤') },
      width: '100',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'TG',
      header: { text: t('중성\n지방'), styleName: 'multiline-editor-pre' },
      width: '50',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HDL',
      header: {
        text: t('고밀도 지단백\n콜레스테롤'),
        styleName: 'multiline-editor-pre',
      },
      width: '100',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'LDL',
      header: {
        text: t('저밀도 지단백\n콜레스테롤'),
        styleName: 'multiline-editor-pre',
      },
      width: '100',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'KOSHA_RISK',
      header: {
        text: t('뇌심혈관계질환\n발병위험도'),
        styleName: 'multiline-editor-pre',
      },
      width: '150',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'SMOKE_YN',
      header: { text: t('흡연\n여부'), styleName: 'multiline-editor-pre' },
      width: '80',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'EXER_YN',
      header: { text: t('운동\n여부'), styleName: 'multiline-editor-pre' },
      width: '80',
      dataType: 'text',
      editable: false,
    },
    // 안보이는거
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사') },
      visible: false,
    },
  ],
  columns: [],
})

grd1Props.columns = grd1Props.fields

// 메뉴버튼
const onButtonsClick = (btn) => {
  // 'btnSearch', 'btnUpdate', 'btnDelete', 'btnExcelUpload'
  if (btn.id === 'btnSearch') {
    getData()
  }
}

const getData = () => {
  // 양식 2 같이 조회시 HLTDA0010PopUp04 파일 참조
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).showMessage(true).run()
}

//  조회
const searchData = () => {
  // console.log(searchParams)
  // HLTCA0010_SAVE_01
  return Promise.all([
    commonSearchApi({
      queryId: 'HLTCA0010_SEARCH_01',
      param: searchParams,
    }),
  ])
}

// 조회 후
const afterSearch = (res) => {
  // console.log('res : ', res)
  grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
}

const onButtonsClickForm1 = (btn) => {
  if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(MaindeleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnExcelUpload') {
    // console.log('엑셀')
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = function (event) {
      const selectedFile = event.target.files[0]
      getJsonFromExcel(selectedFile, excelUploadCallbackForm1)
    }
    input.click()
  }
}

const MaindeleteData = () => {
  let deleteParams = []
  let data = ref([])
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data = Object.assign({}, data, searchParams)
    deleteParams.push(data)
  }
  // console.log(deleteParams)
  return commonExecuteApi({
    queryId: 'HLTCA0010_DELETE_FORM_01',
    list: deleteParams,
  })
}

// 1. 키 매핑 사전 (정규화된 키 => DB 컬럼명)
const fieldMapForm1 = {
  사원번호: 'EMP_NO',
  나이: 'AGE',
  성별: 'GENDER',
  신장: 'HEIGHT',
  체중: 'WEIGHT',
  // 'BMI(비만도)': 'BMI',
  허리둘레: 'WAIST',
  '혈압(고)': 'HTN',
  '혈압(저)': 'LTN',
  '혈당(식전)': 'SUGAR',
  흉부촬영: 'CHEST_XRAY',
  총콜레스테롤: 'CHOL_TOT',
  중성지방: 'TG',
  HDL: 'HDL',
  LDL: 'LDL',
  KOSHA발병위험도: 'KOSHA_RISK',
  일반검진발병위험도: 'GENCHK_RISK',
  최종평가: 'FINAL_EVAL',
  근무상조치: 'WORK_ACTION',
  흡연유뮤: 'SMOKE_YN',
  하루담배개수: 'SMOKE_CNT',
  운동유무: 'EXER_YN',
  고강도운동유무: 'H_EXER_YN',
  조기발병가족력: 'FAMILY_HISTORY',
  표적장기손상여부: 'ORGAN_DAMAGE_YN',
  동반된질병상태: 'COMORBID_COND',
  '고혈압(약물치료)유무': 'HTN_MED_YN',
  '당뇨(약물치료)유무': 'DM_MED_YN',
  '이상지질(약물치료)유무': 'LIPID_MED_YN',
  'e-GFR(신사구체여과율)': 'EGFR',
  요단백: 'PROTEIN_URINE',
  음주여부: 'DRINK_YN',
}

const excelUploadCallbackForm1 = (excelData) => {
  let saveList = []
  const normalizedData = excelData.map((row) => {
    const normalizedRow = {}
    for (const key in row) {
      const cleanKey = key.replace(/\s+/g, '').replace(/\n/g, '')
      normalizedRow[cleanKey] = row[key]
    }
    return normalizedRow
  })

  normalizedData.forEach((item) => {
    const rowData = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USER_ID: searchParams.USER_ID,
      YEAR: searchParams.YEAR,
    }

    for (const [normalizedKey, dbColumn] of Object.entries(fieldMapForm1)) {
      rowData[dbColumn] = item[normalizedKey]
    }
    saveList.push(rowData)
  })

  if (saveList.length === 0) return
  commonExecuteApi({ queryId: 'HLTCA0010_SAVE_FORM_01', list: saveList }).then((res) => {
    onButtonsClick({ id: 'btnSearch' })
    Message.success(t('성공적으로 저장되었습니다.'))
    let params = {
      userStore: userStore,
      params: searchParams,
      mgs: '개인정보관련 엑셀 업로드 하였습니다.',
      crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '정보 등록', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  })
}
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <IGridTitle ref="menuTitleM" :button-list="['btnSearch']" @click-button="onButtonsClick" />
    <v-sheet class="searchArea d-flex">
      <i-select :label="$t('기준년도')" v-model="searchParams.YEAR" width="200px" type="YEAR" margin="10px" />
    </v-sheet>
    <IGridTitle
      ref="menuTitleD"
      :title="$t('뇌심평가 리스트')"
      :use-permission="false"
      :button-list="['btnDelete', 'btnExcelUpload']"
      @click-button="onButtonsClickForm1"
    />
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grd1Props.gridViewOption"
        :fields="grd1Props.fields"
        :columns="grd1Props.columns"
        :column-layout="grd1Props.columnLayout"
      />
    </v-sheet>
  </div>

  <!-- <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('기준년도')"
            v-model="searchParams.YEAR"
            width="180px"
            type="YEAR"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('양식1')" :button-list="['btnDelete', 'btnExcelUpload']"
            @click-button="onButtonsClickForm1" />
          <RealGrid ref="grdMain"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys"
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card> -->
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
    min-height: 400px;
  }
}

.ext-red {
  color: red !important;
  font-weight: bold;
}

.ext-blue {
  color: blue !important;
  font-weight: bold;
}

.ext-green {
  color: green !important;
  font-weight: bold;
}

.ext-orange {
  color: orange !important;
  font-weight: bold;
}

.ext-purple {
  color: purple !important;
  font-weight: bold;
}

.ext-teal {
  color: teal !important;
  font-weight: bold;
}

.ext-brown {
  color: brown !important;
  font-weight: bold;
}

.ext-default {
  color: black;
}
</style>
