<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import EmpPopup from '@/components/popup/EmpPopup.vue' // 인원 검색 팝업
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList, selectFunction } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const empPopup = ref(null) //인원검색 팝업 ref

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NM: '', //성명
  EMP_NO: '', //사번
  ASGN_NM: '', //부서,협력사
  JOB_ROW_NM: '', //직군
  STD_DUTY_NM: '', //직렬
  UNT_DUTY_NM: '', //직무
  STANDARD: '', //지급기준
  USER_DIV: '', //조직구분
})

const codeList = reactive({
  CLOTHE_COUNT: [], //지급수량
  REQ_DIV: [], //구분(정기,수시)
  REQ_CHA: [], //신청시기
  CLOTHE_SIZE: [], //사이즈
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIT080'), getCodeList('HHIT090'), getCodeList('HHIT050'), getCodeList('HHIT100')]).then(
    (res) => {
      codeList.CLOTHE_COUNT = res[0].ORESULT_CUR
      codeList.REQ_DIV = res[1].ORESULT_CUR
      codeList.REQ_CHA = res[2].ORESULT_CUR
      codeList.CLOTHE_SIZE = res[3].ORESULT_CUR
      grdMain.value.setBindingColumn('REQ_DIV', codeList.REQ_DIV, 'COD', 'TXT')
      grdMain.value.setBindingColumn('REQ_CHA', codeList.REQ_CHA, 'COD', 'TXT')
      grdMain.value.setBindingColumn('CLOTHE_SIZE', codeList.CLOTHE_SIZE, 'COD', 'TXT')
    }
  )
}

const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
  for (let i in searchParam) {
    if (i === 'CMPNY_DIV') {
      continue
    }
    searchParam[i] = ''
  }
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDBC0010_SEARCH_02',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('년도') },
    },
    {
      fieldName: 'REQ_DIV',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_CHA',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('신청시기') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'CLOTHE_SIZE',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('사이즈') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_COUNT',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('신청수량') },
    },
    {
      fieldName: 'PAYMENT_DATE',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('지급일자') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('소속부서') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//인원팝업 오픈 이벤트
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParam.EMP_NM,
  })
}

//인원팝업 선택 이벤트
const selectedEmpPopup = (val) => {
  searchParam.EMP_NM = val.EMP_NM //성명
  searchParam.EMP_NO = val.EMP_NO //사번
  searchParam.ASGN_NM = val.ASGN_NM //부서,협력사
  searchParam.JOB_ROW_NM = val.JOB_ROW_NM //직군
  searchParam.STD_DUTY_NM = val.STD_DUTY_NM //안전,환경
  searchParam.UNT_DUTY_NM = val.UNT_DUTY_NM //직무
  searchParam.USER_DIV = val.USER_DIV //조직구분
  let day = dayjs().format('MM-DD')
  let REQ_CHA = ''
  //오늘날짜 기준으로 상,하반기 구분
  if (day >= '07-01') {
    //하반기
    REQ_CHA = '1'
  } else {
    //상반기
    REQ_CHA = '0'
  }
  if (val.USER_DIV === 'A') {
    selectFunction({
      queryId: 'GET_CLD_STANDARD_A',
      CMPNY_DIV: val.CMPNY_DIV,
      EMP_NO: val.EMP_NO,
      BSNS_CD: val.BSNS_CD,
      OFFI_RES_CD: val.OFFI_RES_CD,
      OFFI_RES_DATE: val.OFFI_RES_DATE,
      JOB_DEPT_CD: val.JOB_DEPT_CD,
      YEAR: dayjs().format('YYYY'),
      REQ_CHA: REQ_CHA,
    }).then((res) => {
      searchParam.STANDARD = res.ORESULT_CUR
    })
  } else {
    selectFunction({
      queryId: 'GET_CLD_STANDARD_B',
      CMPNY_DIV: val.CMPNY_DIV,
      EMP_NO: val.EMP_NO,
      JOB_TIT_NM: val.JOB_TIT_NM,
      STD_DUTY_CD: val.STD_DUTY_CD,
      UNT_DUTY_CD: val.UNT_DUTY_CD,
    }).then((res) => {
      searchParam.STANDARD = res.ORESULT_CUR
    })
  }

  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>개인별지급이력조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnSearch', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="mt-2 d-flex">
              <i-input
                :label="$t('성명')"
                width="150px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openEmpPopup"
                @keydown.enter="openEmpPopup"
                v-model="searchParam.EMP_NM"
              >
              </i-input>
              <i-input :label="$t('사번')" readonly width="150px" v-model="searchParam.EMP_NO"> </i-input>
              <i-input :label="$t('부서/협력사')" readonly width="350px" v-model="searchParam.ASGN_NM"> </i-input>
            </div>
            <div class="mt-2 d-flex">
              <i-input :label="$t('직군')" readonly width="150px" v-model="searchParam.JOB_ROW_NM"> </i-input>
              <i-input :label="$t('직렬')" readonly width="150px" v-model="searchParam.STD_DUTY_NM"> </i-input>
              <i-input :label="$t('직무')" readonly width="150px" v-model="searchParam.UNT_DUTY_NM"> </i-input>
              <i-select
                :label="$t('지급기준')"
                readonly
                width="200px"
                v-model="searchParam.STANDARD"
                :items="codeList.CLOTHE_COUNT"
                item-title="TXT"
                item-value="COD"
              >
              </i-select>
            </div>
          </v-sheet>
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="selectedEmpPopup" :auto-emit="false"></EmpPopup>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 350px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
