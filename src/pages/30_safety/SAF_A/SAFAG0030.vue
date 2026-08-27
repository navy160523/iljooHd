<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonExecuteApi, commonSearchApi } from '@/@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { commonLogExecuteApi } from '@hiway/api/commonApi'

defineOptions({
  name: '30_safety-SAF_A-SAFAG0030',
})
//변수 선언부 시작

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
const ASGN_FULL_NM = ref(null) //부서전체이름
const ASGN_SHRT_NM = ref(null) //부서이름
const EMP_NM = ref(null) //재해자 이름
const fileUploadPopup = ref(null)
const fileUpload = ref(null)

const searchParam = reactive({
  CMPNY_DIV: '', //회사
  DATE_DIV: '', //승인여부
  FROM: '', //승인일 FROM
  TO: '', //승인일 TO
  EMP_NO: '', //재해자 사원번호
  NAME: '', //재해자이름
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  USER_ID: userStore.userId, //유저아이디
  IP_ADDRESS: userStore.clientIp, //아이피주소
})

const readOnlyValue = reactive({
  CMPNY_DIV: true,
  BSNS_CD: true,
  DEPT_CD: true,
})

const codeList = reactive({
  company: [],
  //승인여부
  approved: [
    { TXT: '전체', COD: '' },
    { TXT: '승인', COD: 'Y' },
    { TXT: '불승인', COD: 'N' },
  ],
  bsnsCd: [],
  DEPT_CD: [],
})
//재직구분
const hldOffIGbn = reactive([
  { TXT: '재직', COD: '1' },
  { TXT: '재직', COD: '2' },
  { TXT: '퇴직', COD: '3' },
  { TXT: '재직', COD: '4' },
])

//변수선언부 끝

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'SANOK',
      dataType: 'text',
      header: { text: t('승인여부') },
      visible: false,
      editable: false,

      styleName: 'left-column',
    },
    {
      fieldName: 'SANOK_NM',
      dataType: 'text',
      width: '40',
      header: { text: t('승인여부') },
      editable: false,
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '40',
      header: { text: t('재직여부') },
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '40',
      header: { text: t('사업부') },
      editable: false,
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '40',
      header: { text: t('부서') },
      editable: false,
      styleName: 'left-column',
    },
    {
      fieldName: 'EMPLNO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
      width: '40',
      styleName: 'left-column',
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '50',
      header: { text: t('성명') },
      editable: false,
    },
    {
      fieldName: 'BIRTH_DAY',
      dataType: 'text',
      width: '50',
      header: { text: t('생년월일') },
      editable: false,
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'text',
      width: '50',
      header: { text: t('재해일') },
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
    },
    {
      fieldName: 'SANGBYUNG',
      dataType: 'text',
      width: '50',
      header: { text: t('상병명') },
      styleName: 'editable_column',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
    },
    {
      fieldName: 'OKDTE',
      dataType: 'text',
      width: '50',
      header: { text: t('승인일자') },
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
    },
    {
      fieldName: 'INS_TRNS_AMOUNT',
      dataType: 'number',
      width: '50',
      header: { text: t('보험급여대체청구금액') },
      numberFormat: '#,###',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
        maxLength: 10,
      },
      styleName: 'editable_column-right',
    },
    {
      fieldName: 'REFUND_REQ_DT',
      dataType: 'text',
      width: '50',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('환급신청일') },
      styleName: 'editable_column',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
    },
    {
      fieldName: 'GRP_ENT_DATE',
      dataType: 'text',
      width: '50',
      header: { text: t('입사일자') },
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'text',
      width: '50',
      header: { text: t('퇴사일자') },
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
    },
    {
      fieldName: 'BIGO',
      dataType: 'text',
      width: '50',
      header: { text: t('비고') },
      styleName: 'editable_column',
    },
    {
      fieldName: 'RESULT_FILE_ID',
      dataType: 'text',
      width: '20',
      header: { text: t('유첨') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'SANNO',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then((res) => {
    //현대중공업,한국조선해양,모스
    codeList.company = res[0].ORESULT_CUR.filter(
      (x) => x.COD === 'HHI' || x.COD === '100' || x.COD === '230'
    )
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  })
}

const deptPopupOpen = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: ASGN_SHRT_NM,
    })
  } else {
    deptPopup.value.openPopup()
  }
}

const openEmpPopup = (gbn) => {
  empPopup.value.openPopup({
    EMP_NM: searchParam.NAME,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    SANJE: true,
  })
}

const onEmpSelected = (val) => {
  searchParam.NAME = val.EMP_NM
  searchParam.EMP_NO = val.EMP_NO
}

const onDeptSelected = (val) => {
  ASGN_SHRT_NM.value = val.ASGN_SHRT_NM
  searchParam.DEPT_CD = val.DEPT_CD
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAG0030_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  searchParam.EMP_NO = ''

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

//저장관련 로직 시작

const beforeSave = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  } else {
    return true
  }
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      SANNO: data.SANNO,
      USER_ID: userStore.userId,
      SANGBYUNG: data.SANGBYUNG,
      BIGO: data.BIGO,
      INS_TRNS_AMOUNT: data.INS_TRNS_AMOUNT,
      REFUND_REQ_DT: data.REFUND_REQ_DT,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFAG0030_SAVE01',
    list: saveParam,
  }).then(() => {
    let params = {
      userStore: userStore,
      params: saveParam,
      mgs: '개인정보관련 수정했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  })
}

const afterSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
  }
  grdMain.value.getGridView().checkAll(false)
  //onButtonsClick({ id: 'btnSearch' })
}

//저장관련 로직 끝

const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  fileUploadPopup.value.openPopup(data.RESULT_FILE_ID)
}

onMounted(() => {
  initCodeList()
  //초기값 세팅
  // searchParam.CMPNY_DIV = userStore.cmpnyDiv
  // searchParam.DATE_DIV = ''
  let date = dayjs()
  searchParam.TO = date.format('YYYY-MM-DD')
  searchParam.FROM = date.subtract(1, 'M').format('YYYY-MM-DD')
  // searchParam.BSNS_CD = userStore.bsnsCd
  // searchParam.DEPT_CD = userStore.deptCd
  grdMain.value.setBindingColumn('HLD_OFFI_GBN', hldOffIGbn, 'COD', 'TXT')
  checkGroup() //권한그룹별 체크
  //onButtonsClick({ id: 'btnSearch' })
})

const checkGroup = () => {
  //권한그룹이 산재모듈 관리자이면
  if (userStore.authGrpCd.includes('GRP00374')) {
    console.log('산재관리 모듈 관리자일때')
    console.log('모든권한')
    readOnlyValue.CMPNY_DIV = false
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
    searchParam.CMPNY_DIV = ''
    searchParam.BSNS_CD = ''
    searchParam.DEPT_CD = ''
  }
  //권한그룹이 산재관리 모듈(난청조회면)
  else if (userStore.authGrpCd.includes('GRP00396')) {
    console.log('산재관리 모듈 난청조회면일때')
    console.log('전체사업부 조회만')
    readOnlyValue.CMPNY_DIV = false
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
    searchParam.CMPNY_DIV = userStore.cmpnyDiv
    searchParam.BSNS_CD = ''
    menuTitle.value.visibleBtn('btnUpdate', false) //저장 버튼 숨기기
  }
  //권한그룹이 산재관리 모듈(보건)이면
  else if (userStore.authGrpCd.includes('GRP00267')) {
    console.log('산재관리 모듈 관리자일때')
    console.log('수정권한? 조회권한은?')
  }
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: searchParam.CMPNY_DIV, BSNS_CD: newValue },
    }).then((res) => {
      searchParam.DEPT_CD = '' //사업부가 바뀌면 부서에 코드값이 남아 있어서 추가함
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  },
  {
    immediate: true,
  }
)
</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사')"
            v-model="searchParam.CMPNY_DIV"
            :readonly="readOnlyValue.CMPNY_DIV"
            :items="codeList.company"
            item-title="TXT"
            item-value="COD"
            width="200px"
          >
          </i-select>
          <i-select
            :label="$t('사업부')"
            :items="codeList.bsnsCd"
            :readonly="readOnlyValue.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam.BSNS_CD"
            width="200px"
            label-width="50px"
          >
          </i-select>
          <i-select
            :label="$t('부서')"
            :items="codeList.DEPT_CD"
            :readonly="readOnlyValue.DEPT_CD"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            v-model="searchParam.DEPT_CD"
            width="200px"
          >
          </i-select>
          <i-select
            :label="$t('승인여부')"
            :items="codeList.approved"
            v-model="searchParam.DATE_DIV"
            item-title="TXT"
            item-value="COD"
            width="200px"
          >
          </i-select>
          <span class="mt-2">재해일</span>
          <i-input
            class="ml-2 mr-1"
            type="date"
            v-model="searchParam.FROM"
            width="150px"
          >
          </i-input>
          <span class="mt-2">~</span>
          <i-input
            class="ml-1"
            type="date"
            v-model="searchParam.TO"
            width="150px"
          ></i-input>
          <i-input
            :label="$t('재해자')"
            v-model="searchParam.NAME"
            @click:appendInner="openEmpPopup()"
            @keydown.enter="
              (e) => {
                openEmpPopup('인원조회')
              }
            "
            append-inner-icon="mdi-magnify"
            width="200px"
          >
          </i-input>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('난청현황')"> </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellButtonClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서조회팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"> </DeptPopup>
    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <!-- 파일업로드팝업 -->
    <IUploadPopup ref="fileUploadPopup"></IUploadPopup>
  </v-card>
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
