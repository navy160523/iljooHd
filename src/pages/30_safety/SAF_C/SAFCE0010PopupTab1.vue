<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCE0010Popup from './SAFCE0010Popup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import causePopup from '@/components/popup/causePopup.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const causepopup = ref(null)
const userStore = useUserStore()
const sAFCE0010Popup = ref(null)
const emit = defineEmits(['selected'])
const codeList = {
  sagoGubun: [],
}
const DEPT_NM = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM: '', //발생일자 FROM
  TO: '', //발생일자 TO
  DEPT_CD: '', //부서코드
  GBN: '', //사고구분
  GIINMUL1_CD: '', //기인물1
  GIINMUL2_CD: '', //기인물2
})

const searchField = reactive({
  GIINMUL1_NM: '', //기인물1 이름
  GIINMUL2_NM: '', //기인물2 이름
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIB010')]).then((res) => {
    codeList.sagoGubun = res[0].ORESULT_CUR
    codeList.sagoGubun.unshift({ TXT: '전체', COD: '' })
  })
}

//디폴트 날짜 설정 -3달~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -3달 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(3, 'month')
  searchParam.FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'OCCUR_DT',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('발생일시') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('사고구분') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('사고유형') },
    },
    {
      fieldName: 'GIINMUL1_CD_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('') },
    },
    {
      fieldName: 'GIINMUL2_CD_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_LOC_DTL',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      header: { text: t('장소') },
    },
    {
      fieldName: 'SAGO_GAEYO',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      width: '350',
      styleName: 'left-column',
      header: { text: t('사고개요') },
    },
    {
      fieldName: 'INJR_DEPT_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      width: '150',
      styleName: 'left-column',
      header: { text: t('재해부서') },
    },
    {
      fieldName: 'RESP_DEPT_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      width: '150',
      styleName: 'left-column',
      header: { text: t('책임부서') },
    },
    {
      fieldName: 'VNDR_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      width: '150',
      styleName: 'left-column',
      header: { text: t('협력사') },
    },
    {
      fieldName: 'RESPON_DIV_NM',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('소속') },
    },
    {
      fieldName: 'RSN_GRP_CD1_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('') },
    },
    {
      fieldName: 'RSN_GRP_CD2_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('') },
    },
    {
      fieldName: 'RSN_CD_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('원인') },
    },
    {
      fieldName: 'RSN_DET',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('상세원인') },
    },
    {
      fieldName: 'DAECHEK',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('재발방지대책') },
    },
  ],
  columns: [],
  columnLayout: [
    'OCCUR_DT',
    'SAGO_DIV_L_NM',
    'SAGO_DIV_M_NM',
    {
      name: '기인물',
      direction: 'horizontal',
      hideChildHeaders: true,
      items: ['GIINMUL1_CD_NM', 'GIINMUL2_CD_NM'],
    },
    'SAGO_LOC_DTL',
    'SAGO_GAEYO',
    'INJR_DEPT_NM',
    'RESP_DEPT_NM',
    'VNDR_NM',
    'RESPON_DIV_NM',
    {
      name: '구분',
      direction: 'horizontal',
      hideChildHeaders: true,
      items: ['RSN_GRP_CD1_NM', 'RSN_GRP_CD2_NM'],
    },
    'RSN_CD_NM',
    'RSN_DET',
    'DAECHEK',
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  defaultDate()
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnSelect') {
    checkListSelect()
  }
}
//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFCE0010_SEARCH03',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//선택관련 로직 시작
const checkListSelect = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  let daeCheck = [] //재발방지대책을 담고있는 배열
  if (chkNum.length === 0) {
    Message.warn(t('점검항목에 추가할 데이터를 선택하세요.'))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (!data.DAECHEK) {
      Message.warn(t('재발방지대책이 없습니다.'))
      return false
    }
    let emitData = {
      DAECHEK: data.DAECHEK,
    }
    daeCheck.push(emitData)
  }
  emit('selected', daeCheck)
}
//선택관련 로직 끝

//부서팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup()
}

//부서선택 이벤트
const deptSelected = (val) => {
  searchParam.DEPT_CD = val.DEPT_CD
  DEPT_NM.value = val.ASGN_SHRT_NM
}

//재해부서 X아이콘 클릭 이벤트
const clearDept = () => {
  searchParam.DEPT_CD = ''
  DEPT_NM.value = ''
}

//기인물팝업 오픈
const openCausePopup = () => {
  causepopup.value.openPopup()
}

//기인물 선택 이벤트
const giinSelected = (val) => {
  searchParam.GIINMUL1_CD = val[0].COD
  searchField.GIINMUL1_NM = val[0].TXT
  searchParam.GIINMUL2_CD = val[1].COD
  searchField.GIINMUL2_NM = val[1].TXT
}

//기인물 X아이콘 선택 이벤트
const clearGiin = () => {
  searchParam.GIINMUL1_CD = ''
  searchParam.GIINMUL2_CD = ''
  searchField.GIINMUL1_NM = ''
  searchField.GIINMUL2_NM = ''
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :use-permission="false"
        :button-list="['btnSearch', 'btnSelect']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pb-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParam.FROM"
            class="mr-1"
            :label="$t('발생일자')"
            type="date"
            width="200px"
          ></i-input>
          <span class="mt-2">~</span>
          <i-input
            v-model="searchParam.TO"
            class="ml-1"
            type="date"
            width="150px"
          ></i-input>
          <i-input
            readonly
            v-model="DEPT_NM"
            :label="$t('재해부서')"
            class="mr-1"
            width="200px"
          >
            <template v-slot:append-inner>
              <v-icon @click="openDeptPopup" icon="mdi-magnify" />
              <v-icon
                color="error"
                @click="clearDept"
                icon="mdi-window-close"
              />
            </template>
          </i-input>
          <i-input
            readonly
            v-model="searchParam.DEPT_CD"
            width="100px"
          ></i-input>
          <i-select
            v-model="searchParam.GBN"
            :label="$t('사고구분')"
            :items="codeList.sagoGubun"
            item-title="TXT"
            item-value="COD"
            width="200px"
          ></i-select>
          <i-input
            v-model="searchField.GIINMUL1_NM"
            readonly
            class="mr-1"
            :label="$t('기인물')"
            width="250px"
          >
            <template v-slot:append-inner>
              <v-icon @click="openCausePopup" icon="mdi-magnify" />
              <v-icon
                color="error"
                @click="clearGiin"
                icon="mdi-window-close"
              />
            </template>
          </i-input>
          <i-input
            v-model="searchField.GIINMUL2_NM"
            readonly
            width="200px"
          ></i-input>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('재발방지대책리스트')"> </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :column-layout="grdMainProps.columnLayout"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="deptSelected"></DeptPopup>
  <causePopup ref="causepopup" @selectedArr="giinSelected"></causePopup>
  <SAFCE0010Popup ref="sAFCE0010Popup"></SAFCE0010Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 114px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
