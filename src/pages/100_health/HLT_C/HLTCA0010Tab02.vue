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
const grdSub = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear() - 1),
})

/*  공통코드 세팅 */
onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
  grdSub.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd2Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: ['BIRTH_DAY'],
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
      fieldName: 'CIG_USE',
      header: { text: t('흡연유무') },
      width: '80',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'CIG_NOW',
      header: { text: t('현재피움') },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'CIG_YEARS',
      header: { text: t('흡연기간\n(년)'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'CIG_DAY',
      header: { text: t('하루평균\n개수'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'CIG_QUIT',
      header: { text: t('끊은기간\n(년)'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'ECIG_USE',
      header: { text: t('흡연유무') },
      width: '80',
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'ECIG_NOW',
      header: { text: t('현재피움') },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'ECIG_YEARS',
      header: { text: t('흡연기간\n(년)'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'ECIG_DAY',
      header: { text: t('하루평균\n개수'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'ECIG_QUIT',
      header: { text: t('끊은기간\n(년)'), styleName: 'multiline-editor-pre' },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'VAPE_USE',
      header: { text: t('흡연유무') },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'VAPE_DAYS',
      header: { text: t('사용일수') },
      width: '80',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'DRINK_FREQ_YR',
      header: { text: t('지난1년간\n횟수'), styleName: 'multiline-editor-pre' },
      width: '90',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'U_SOJU_AMT',
      header: { text: t('소수량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'U_BEER_AMT',
      header: { text: t('맥주량') },
      width: '70',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'U_WHISKY_AMT',
      header: { text: t('양주량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'U_MAK_AMT',
      header: { text: t('막걸리량') },
      width: '70',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'U_WINE_AMT',
      header: { text: t('와인량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'B_SOJU_AMT',
      header: { text: t('소수량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'B_BEER_AMT',
      header: { text: t('맥주량') },
      width: '70',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'B_WHISKY_AMT',
      header: { text: t('양주량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'B_MAK_AMT',
      header: { text: t('막걸리량') },
      width: '70',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'B_WINE_AMT',
      header: { text: t('와인량') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HI_DAYS',
      header: { text: t('일수') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HI_HOUR',
      header: { text: t('시간') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'HI_MIN',
      header: { text: t('분') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'MI_DAYS',
      header: { text: t('일수') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'MI_HOUR',
      header: { text: t('시간') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'MI_MIN',
      header: { text: t('분') },
      width: '50',
      // styleName: "left-column",
      dataType: 'text',
      editable: false,
    },
    {
      fieldName: 'MUSCLE_DAYS',
      header: { text: t('근력운동') },
      width: '80',
      // styleName: "left-column",
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
  columnLayout: [
    'CMPNY_NM',
    'BSNS_NM',
    'DEPT_NM',
    'EMP_NO',
    'GENDER',
    'AGE',
    'KOR_NM',
    'BIRTH_DAY',
    {
      name: '일반담배',
      direction: 'horizontal',
      items: ['CIG_USE', 'CIG_NOW', 'CIG_YEARS', 'CIG_DAY', 'CIG_QUIT'],
      header: { text: t('일반담배') },
    },
    {
      name: '전자담배',
      direction: 'horizontal',
      items: ['ECIG_USE', 'ECIG_NOW', 'ECIG_YEARS', 'ECIG_DAY', 'ECIG_QUIT'],
      header: { text: t('전자담배') },
    },
    {
      name: '액상담배',
      direction: 'horizontal',
      items: ['VAPE_USE', 'VAPE_DAYS'],
      header: { text: t('액상담배') },
    },
    {
      name: '음주',
      direction: 'horizontal',
      items: [
        'DRINK_FREQ_YR',
        {
          name: '보통',
          direction: 'horizontal',
          items: ['U_SOJU_AMT', 'U_BEER_AMT', 'U_WHISKY_AMT', 'U_MAK_AMT', 'U_WINE_AMT'],
          header: { text: t('보통') },
        },
        {
          name: '폭음',
          direction: 'horizontal',
          items: ['B_SOJU_AMT', 'B_BEER_AMT', 'B_WHISKY_AMT', 'B_MAK_AMT', 'B_WINE_AMT'],
          header: { text: t('폭음') },
        },
      ],
      header: { text: t('음주') },
    },
    {
      name: '신체활동',
      direction: 'horizontal',
      items: [
        {
          name: '고강도',
          direction: 'horizontal',
          items: ['HI_DAYS', 'HI_HOUR', 'HI_MIN'],
          header: { text: t('고강도') },
        },
        {
          name: '중강도',
          direction: 'horizontal',
          items: ['MI_DAYS', 'MI_HOUR', 'MI_MIN'],
          header: { text: t('중강도') },
        },
        'MUSCLE_DAYS',
      ],
      header: { text: t('신체활동') },
    },
  ],
  columns: [],
})

grd2Props.columns = grd2Props.fields

// 메뉴버튼
const onButtonsClick = (btn) => {
  // 'btnSearch', 'btnUpdate', 'btnDelete', 'btnExcelUpload'
  if (btn.id === 'btnSearch') {
    getData()
  }
}

const getData = () => {
  // 양식 2 같이 조회시 HLTDA0010PopUp04 파일 참조
  new queryFlowHelper(vm, t).setGridList([grdSub]).setQuery(searchData).setAfter(afterSearch).showMessage(true).run()
}

//  조회
const searchData = () => {
  // console.log(searchParams)
  // HLTCA0010_SAVE_01
  return Promise.all([
    commonSearchApi({
      queryId: 'HLTCA0010_SEARCH_02',
      param: searchParams,
    }),
  ])
}

// 조회 후
const afterSearch = (res) => {
  // console.log('res : ', res)
  grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
}

const onButtonsClickForm2 = (btn) => {
  if (btn.id === 'btnDelete') {
    // console.log('삭제')
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(SubdeleteData)
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
      getJsonFromExcel(selectedFile, excelUploadCallbackForm2)
    }
    input.click()
  }
}

const SubdeleteData = () => {
  let deleteParams = []
  let data = ref([])
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data = Object.assign({}, data, searchParams)
    deleteParams.push(data)
  }
  // console.log(deleteParams)
  return commonExecuteApi({
    queryId: 'HLTCA0010_DELETE_FORM_02',
    list: deleteParams,
  })
}

const fieldMapForm2 = {
  사원번호: 'EMP_NO',
  나이: 'AGE',
  성별: 'GENDER',
  검진유형: 'CHECKUP_TYPE',
  일반담배_흡연유무: 'CIG_USE',
  일반담배_현재피움: 'CIG_NOW',
  일반담배_흡연기간: 'CIG_YEARS',
  일반담배_하루평균개수: 'CIG_DAY',
  일반담배_끊은기간: 'CIG_QUIT',
  전자담배_흡연유무: 'ECIG_USE',
  전자담배_현재피움: 'ECIG_NOW',
  전자담배_흡연기간: 'ECIG_YEARS',
  전자담배_하루평균개수: 'ECIG_DAY',
  전자담배_끊은기간: 'ECIG_QUIT',
  액상담배_흡연유무: 'VAPE_USE',
  액상담배_사용일수: 'VAPE_DAYS',
  음주_횟수: 'DRINK_FREQ',
  음주_지난1년간횟수: 'DRINK_FREQ_YR',
  보통_소주: 'U_SOJU',
  보통_소주량: 'U_SOJU_AMT',
  보통_맥주: 'U_BEER',
  보통_맥주량: 'U_BEER_AMT',
  보통_양주: 'U_WHISKY',
  보통_양주량: 'U_WHISKY_AMT',
  보통_막걸리: 'U_MAK',
  보통_막걸리량: 'U_MAK_AMT',
  보통_와인: 'U_WINE',
  보통_와인량: 'U_WINE_AMT',
  폭음_소주: 'B_SOJU',
  폭음_소주량: 'B_SOJU_AMT',
  폭음_맥주: 'B_BEER',
  폭음_맥주량: 'B_BEER_AMT',
  폭음_양주: 'B_WHISKY',
  폭음_양주량: 'B_WHISKY_AMT',
  폭음_막걸리: 'B_MAK',
  폭음_막걸리량: 'B_MAK_AMT',
  폭음_와인: 'B_WINE',
  폭음_와인량: 'B_WINE_AMT',
  신체활동_고강도: 'HI_DAYS',
  신체활동_고강도_시간: 'HI_HOUR',
  신체활동_고강도_분: 'HI_MIN',
  신체활동_중강도: 'MI_DAYS',
  신체활동_중강도_시간: 'MI_HOUR',
  신체활동_중강도_분: 'MI_MIN',
  근력운동: 'MUSCLE_DAYS',
}

const excelUploadCallbackForm2 = (excelData) => {
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

    for (const [normalizedKey, dbColumn] of Object.entries(fieldMapForm2)) {
      rowData[dbColumn] = item[normalizedKey]
    }
    saveList.push(rowData)
  })

  if (saveList.length === 0) return
  commonExecuteApi({ queryId: 'HLTCA0010_SAVE_FORM_02', list: saveList }).then((res) => {
    onButtonsClick({ id: 'btnSearch' })
    Message.success(t('성공적으로 저장되었습니다.'))
    // wkdvlfrn
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
      :title="$t('공통문진 리스트')"
      :use-permission="false"
      :button-list="['btnDelete', 'btnExcelUpload']"
      @click-button="onButtonsClickForm2"
    />
    <div style="text-align: end">
      <span style="font-size: 15px; font-weight: bold; color: red">
        ※ 엑셀업로드시(공통문진표) 검진유형은 특수건강진단(상), 일반건강진단 만 저장된 파일을 업로드 하십시요!
      </span>
    </div>
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdSub"
        :grid-view-option="grd2Props.gridViewOption"
        :fields="grd2Props.fields"
        :columns="grd2Props.columns"
        :column-layout="grd2Props.columnLayout"
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
          <i-select :label="$t('기준년도')" v-model="searchParams.YEAR" width="180px" type="YEAR" />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('양식1')" :button-list="['btnDelete', 'btnExcelUpload']"
            @click-button="onButtonsClickForm2" />
          <RealGrid ref="grdSub" class="mt-2" :grid-view-option="grd2Props.gridViewOption" :keys="grd2Props.keys"
            :fields="grd2Props.fields" :columns="grd2Props.columns" />
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
