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
import SAFCD0010Tab02Popup01 from './SAFCD0010Tab02Popup01.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010Tab02',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const sAFCD0010Tab02Popup01 = ref(null)
const deptPopup = ref(null)

const readOnlyValue = reactive({
  BSNS_CD: false, //테스트하려고 false로함 나중에 true로 변경해야함 2024.07.05 김현재 작성
  DEPT_CD: false,
})

//안전경영부가 아닐때는 icon 감춤
const iconStyle = reactive({
  display: 'none',
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //회사
  FROM_DATE: '', //점검기간 FROM
  TO_DATE: '', //점검기간 TO
  BSNS_CD: userStore.bsnsCd, //사업부
  CHECK_TARGET: '', //점검대상
  //CHECK_DEPT_CD: userStore.deptCd, //점검부서
})

const codeList = reactive({
  BSNS_CD: [], //사업부
  CHECK_TAGET: [], //점검대상
  CHECK_GROUP: [], //점검그룹
})

//사용자에게 보여지는 값일뿐이고 조회할때 필요하지는 않음
const showName = reactive({
  DEPT_NM: userStore.deptNm, //점검부서이름
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }),
    getCodeList('HHIP060'),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.CHECK_GROUP = res[1].ORESULT_CUR
    codeList.CHECK_GROUP.push({ TXT: '점검인원', CODE_DESC1: ' ' })

    grdSub.value.setBindingColumn(
      'CHECK_GROUP',
      codeList.CHECK_GROUP,
      'CODE_DESC1',
      'TXT'
    )
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'CHECK_TARGET',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검대상') },
    },
    {
      fieldName: 'CHECK_CYCLE_NM',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('주기구분') },
    },
    {
      fieldName: 'FROM_DATE',
      dataType: 'text',
      editable: false,
      width: '150',
      header: { text: t('시작일') },
    },
    {
      fieldName: 'TO_DATE',
      dataType: 'text',
      editable: false,
      width: '150',
      header: { text: t('종료일') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      visible: false,
      header: { text: t('계획점검 No') },
    },
    {
      fieldName: 'CHECK_CYCLE',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('주기구분') },
    },
    {
      fieldName: 'DAILY_CHECK_SEQ',
      visible: false,
      header: { text: t('일상점검No') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      visible: false,
      header: { text: t('점검자사번') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'CHECK_EMP_NM',
      visible: false,
      header: { text: t('점검자성명') },
    },
  ],
  columns: [],
  columnLayout: [
    'CHECK_TARGET',
    {
      name: '점검 기간',
      direction: 'horizontal',
      items: ['CHECK_CYCLE_NM', 'FROM_DATE', 'TO_DATE'],
    },
  ],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, footer: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검부서') },
      footer: { styleName: 'right-column', text: '합계 : ' },
    },
    {
      fieldName: 'CHECK_CNT_SUM',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      footer: { numberFormat: '#,###', expression: 'sum' },
      header: { text: t('점검(개소)') },
    },
    {
      fieldName: 'BED_CNT_SUM',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      footer: { numberFormat: '#,###', expression: 'sum' },
      header: { text: t('불량(개소)') },
    },
    {
      fieldName: 'CHECK_GROUP',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('점검그룹명') },
    },
    {
      fieldName: 'CHECK_EMP_NM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검자') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('점검자사번') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('계획점검 SEQ') },
    },
    {
      fieldName: 'FIXED_YN',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('확정여부') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  defaultDate()
  initCodeList()
  checkSafeTyManage()
  onButtonsClick({ id: 'btnSearch' })
  grdSub.value.getGridView().footer.visible = true
  //등록버튼 비활성화
  gridTitle.value.disableBtn('btnModify', true)
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch01)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else if (btn.id === 'btnModify') {
    let getFocusedRowData = grdSub.value.getFocusedRowData()
    getFocusedRowData.FROM_DATE = grdMain.value.getFocusedRowData().FROM_DATE
    getFocusedRowData.TO_DATE = grdMain.value.getFocusedRowData().TO_DATE
    getFocusedRowData.CHECK_TARGET =
      grdMain.value.getFocusedRowData().CHECK_TARGET
    sAFCD0010Tab02Popup01.value.openPopup(getFocusedRowData)
  }
}

//계획점검 현황 관련 로직 시작
const beforeSearch01 = () => {
  return true
}

const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCD0010_SEARCH03',
    param: searchParam,
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if (res.ORESULT_CUR.length === 0) {
    //조회값이 없을시 계획점검 결과 그리드 비워줌
    grdSub.value.getDataProvider().setRows(null)
  }
}
//계획점검 현환 관련 로직 끝

//디폴트 날짜 설정 -6일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -6일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(2, 'month')
  let dateTo = dayjs().add(1, 'month')
  searchParam.FROM_DATE =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.TO_DATE =
    dateTo.$y +
    '-' +
    (dateTo.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateTo.$D.toString().padStart(2, '0')
}

//점검부서 팝업 오픈
const openDeptPopup = () => {
  if (!showName.DEPT_NM) {
    deptPopup.value.openPopup()
  } else {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: showName.DEPT_NM,
    })
  }
}

//점검부서 선택 이벤트
const selectedDept = (val) => {
  searchParam.CHECK_DEPT_CD = val.DEPT_CD
  showName.DEPT_NM = val.ASGN_SHRT_NM
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdSub.value.getDataProvider().getJsonRow(clickData.itemIndex)
  if (data.CHECK_EMP_NO != userStore.empNo) {
    Message.warn(t('점검자 본인만 수정 가능합니다.'))
    return false
  } else {
    onButtonsClick({ id: 'btnModify' })
  }
}

const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  if (newIdx === -1) {
    return false
  }
  let row = grdMain.value.getDataProvider().getJsonRow(newIdx)

  //계획점검 결과 조회
  let Subparam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH04',
    param: Subparam,
  }).then((res) => {
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      //점검그룹명에 GRP가 포함되어 있지 않으면 점검인원으로
      //점검인원으로 점검했다는뜻
      if (!res.ORESULT_CUR[i].CHECK_GROUP.includes('GRP')) {
        res.ORESULT_CUR[i].CHECK_GROUP = ' '
      }
    }
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdSub.value.getGridView().setFocus(0)
  })
  //선택한 계획점검에 등록된 인원,그룹이 로그인사용자와 일치하는지 여부를 확인
  //일치하면 등록버튼 활성화
  //일치하지 않으면 등록버튼 비활성화
  let guidParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH96',
    param: guidParam,
  }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      let empNo = res.ORESULT_CUR.filter((x) => x.GU_ID === userStore.empNo)
      let groupCode = res.ORESULT_CUR.filter((x) =>
        userStore.authGrpCd.includes(x.GU_ID)
      ).map((x) => x.GU_ID) //로그인유저 권한그룹과 계획점검에 등록된 권한을 비교하여 일치하는 것만 추출
      if (empNo.length > 0 || groupCode.length > 0) {
        //권한또는 인원에 등록되어 있으면 수정버튼 활성화
        gridTitle.value.disableBtn('btnModify', false)
      } else {
        //수정버튼 비활성화
        gridTitle.value.disableBtn('btnModify', true)
      }
    }
    //GU_ID가 존재하지 않으면 (계획점검에 그룹,인원에 아무것도 등록되지 않으면)
    else {
      //수정버튼 비활성화
      gridTitle.value.disableBtn('btnModify', true)
    }
  })
}

//로그인유저가 IT관리자,안전직원인지 확인
const checkSafeTyManage = () => {
  //로그인유저가 IT관리자,안전직원이면 사업부변경 가능
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369')
  ) {
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
  }
}

const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  let data = grdSub.value.getDataProvider().getJsonRow(newIdx)
  //점검자와 로그인유저가 일치하지 않으면
  if (data.CHECK_EMP_NO != userStore.empNo) {
    gridTitle.value.disableBtn('btnModify', true) //수정버튼 비활성화
  } else {
    gridTitle.value.disableBtn('btnModify', false) //수정버튼 활성화
  }
}

//점검기간 FROM 변경 감지
watch(
  () => searchParam.FROM_DATE,
  (newValue, oldValue) => {
    let param = {
      FROM_DATE: newValue,
      TO_DATE: searchParam.TO_DATE,
      BSNS_CD: searchParam.BSNS_CD,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH97',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        codeList.CHECK_TAGET = res.ORESULT_CUR
        codeList.CHECK_TAGET.unshift({ TXT: '전체', COD: '' })
      }
    })
  }
)

//점검기간 TO 변경감지
watch(
  () => searchParam.TO_DATE,
  (newValue, oldValue) => {
    let param = {
      FROM_DATE: searchParam.FROM_DATE,
      TO_DATE: newValue,
      BSNS_CD: searchParam.BSNS_CD,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH97',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        codeList.CHECK_TAGET = res.ORESULT_CUR
        codeList.CHECK_TAGET.unshift({ TXT: '전체', COD: '' })
      }
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            label-width="60px"
            :label="$t('점검기간')"
            type="date"
            width="210px"
            class="mr-0"
            v-model="searchParam.FROM_DATE"
            required
          />
          <span class="mx-1 mt-1">~</span>
          <i-input type="date" width="150px" v-model="searchParam.TO_DATE" />
          <i-select
            :label="$t('사업부')"
            width="200px"
            v-model="searchParam.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            required
            :readonly="readOnlyValue.BSNS_CD"
          />
          <i-select
            label-width="50px"
            :label="$t('점검대상')"
            width="280px"
            :items="codeList.CHECK_TAGET"
            item-title="TXT"
            item-value="COD"
            v-model="searchParam.CHECK_TARGET"
          />
          <!-- <i-input
            :label="$t('점검계획부서')"
            width="200px"
            v-model="showName.DEPT_NM"
            :readonly="readOnlyValue.DEPT_CD"
            @keydown.enter="openDeptPopup"
          >
            <template v-slot:append-inner>
              <v-icon
                @click="openDeptPopup"
                icon="mdi-magnify"
                :style="{ display: iconStyle.display }"
              />
            </template>
          </i-input> -->
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="40%" class="h-auto mr-3">
            <IGridTitle title="계획점검 현황"> </IGridTitle>
            <RealGrid
              ref="grdMain"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </v-sheet>
          <v-sheet width="60%" class="h-auto">
            <IGridTitle
              ref="gridTitle"
              title="계획점검 결과"
              :button-list="['btnModify']"
              @click-button="onButtonsClick"
            >
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCellDblClicked="onCellDblClicked"
              @onCurrentRowChanged="onCurrentRowChanged"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <SAFCD0010Tab02Popup01 ref="sAFCD0010Tab02Popup01"></SAFCD0010Tab02Popup01>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
