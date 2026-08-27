<!-- 
  화면명 : 유해요인조사 통계
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import _ from 'lodash'
import { isEmpty } from '@/@core/utils'
defineOptions({
  name: '100_health-HLT_I-HLTIB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const isAdmin = ref(false) //화면에 대한 권한이 있는지 확인하는 변수
const isAdmin2 = ref(false) // 부서장, 간사정,부
const isAdmin3 = ref(false) // 협력사

//테스트
// userStore.userDiv = 'B'
// userStore.authGrpCd = ['HIWAYGRP0000122'];

// 컬럼 초기상태 저장용 빈배열
let defaultColumns = []
let defaultColumnLayout = []

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  YEAR: new Date().getFullYear(), //기준년도
  ES_DIV: '', //조사구분
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  VEND_CD: '', //협력사
  ASGN_NM: '', //협력사명
  WORK_STANDARD_NO: '', //작업표준번호
  // USER_DIV: 'A', //조직구분
})

const readOnlyValue = reactive({
  DEPT_CD: true,
  BSNS_CD: true,
  VEND_CD: true,
})

const codeList = reactive({
  ES_DIV: [], //조사구분
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  VEND_CD: [], //협력사
  DATAA: [], //간사현황 데이터
  HO: [], //부담작업 데이터
})

// 조직원
const searchParams4 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const initCodeList = () => {
  Promise.all([
    //조사구분(평가분류)
    getCodeList('HHII620'),
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
    //협력사조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: searchParam.DEPT_CD },
    }),
    //간사현황 조직원
    commonSearchApi({ queryId: 'HLTIA0010_SEARCH_02', param: searchParams4 }),
    //조사구분 조회
    // getCodeList('HHII620'),
    //신체부위 조회
    // getCodeList('HHII820D'),
    // 부담작업
    commonSearchApi({ queryId: 'HLTIB0020_SEARCH_HO', param: { WORK_STANDARD_ID: '' } }),
  ]).then((res) => {
    // console.log('res', res)
    codeList.ES_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.VEND_CD = res[3].ORESULT_CUR
    codeList.DATAA = res[4].ORESULT_CUR
    codeList.HO = res[5].ORESULT_CUR
    codeList.ES_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.VEND_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    // 유해요인조사 마스터테이블에 BSNS_CD가 없어서 부서까지 선택 후
    // codeList에서 사업부명을 찾아옴

    // if (searchParam.BSNS_CD && !searchParam.DEPT_CD) {
    //   Message.warn('부서를 선택해주세요!')
    //   return // 조회 실행 안 함
    // }
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

// console.log('서치파람:', searchParam)
const searchData = () => {
  // console.log("searchParam:",searchParam)
  return commonSearchApi({
    queryId: 'HLTIB0020_SEARCH_99',
    param: searchParam,
  })
}

//코드리스트에서 사업부명, 부서명 찾기
const convertDeptCdToNm = (dataList) => {
  return dataList.map((row) => {
    // 부서명 및 사업부명 찾기 (DEPT_CD 기준)
    const dept = codeList.DEPT_CD.find((item) => item.DEPT_CD === row.DEPT_CD)

    const bsns = codeList.BSNS_CD.find((item) => item.BSNS_CD === row.BSNS_CD);

    return {
      ...row,
      DEPT_NM: dept ? dept.DEPT_NM : row.DEPT_CD, // 부서명
      BSNS_NM: bsns ? bsns.BSNS_NM : '', // 사업부명
    }
  })
}
//dept 기준이라서 부서가 선택이 안되면 사업부는 알수없음으로 뜸

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    // THLTIB0010W01
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사업부') },
      // styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서/협력사명') },
      // styleName: 'left-column',
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('협력사명') },
      styleName: 'left-column',
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('작업표준ID') },
      styleName: 'left-column',
    },
    {
      fieldName: 'WORK_STANDARD_NO',
      dataType: 'text',
      width: '170',
      editable: false,
      header: { text: t('작업표준번호') },
      styleName: 'left-column',
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('작업표준명') },
      styleName: 'left-column',
    },
    // TIF3010C01 ES_DIV에 정기, 수시 갯수
    // 컬럼은 ES_DIV 하나
    {
      fieldName: 'ES_A1_TOTAL',
      dataType: 'number',
      width: '50',
      editable: false,
      header: { text: t('정기조사건수') },
      numberFormat: '#,###', // 소수점 없이 정수만 표시
      // styleName: 'right-column',
    },
    {
      fieldName: 'ES_A2_TOTAL',
      dataType: 'number',
      width: '50',
      editable: false,
      header: { text: t('수시조사건수') },
      lookupDisplay: true,
      numberFormat: '#,###', // 소수점 없이 정수만 표시
      // styleName: 'right-column',
    },
    // 부담작업 번호 HO_NO 컬럼하나인데 여기서 호별 카운트
    // TIF3011C01에서 참여자수, 유증상자수
    {
      fieldName: 'T_RECORDS',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('참여자수') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'SY_COUNT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('유증상자수') },
      // styleName: 'right-column',
    },
    // 유증상 신체부위
    {
      fieldName: 'P_NECK',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('목') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_SHOULDER',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('어깨') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_ARM',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('팔/팔꿈치') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_HAND',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('손목/손가락') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_BACK',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('허리') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_LEG',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('다리/발') },
      // styleName: 'right-column',
    },
    // TIF3011C01에 부위별로 나눠져있는데 카운트해서 가져오기
    // 필드네임 임시로 적음
    // 발생시 지속기간
    {
      fieldName: 'DURATION_1DB',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1일미만') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'DURATION_1WB',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1일 - 1주일') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'DURATION_1MB',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1주일 - 1개월') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'DURATION_6MB',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1개월 - 6개월') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'DURATION_6MO',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('6개월이상') },
      // styleName: 'right-column',
    },
    // 통증정도
    {
      fieldName: 'P_WEAK',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('약함') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_MODERATE',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('중간') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_SEVERE',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('심함') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'P_MORESEVERE',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('매우심함') },
      // styleName: 'right-column',
    },
    // 통증빈도 // 컬럼 임의로
    {
      fieldName: 'S_6M',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('6개월 1회') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'S_3M',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('2~3개월 1회') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'S_1M',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1개월 1회') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'S_1W',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('1주일 1회') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'S_1D',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('매일') },
      // styleName: 'right-column',
    },
    // 업무상 질병 THLTIB0010W02
    // SAGO_BODY_CD 컬럼에서 부위별로 나눠서 카운트
    {
      fieldName: 'TOTAL_SAGO_COUNT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('승인건수') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_NECK',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('목') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_SHOULDER',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('어깨') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_ELBOW',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('팔/팔꿈치') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_HAND_TOTAL',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('손목/손가락') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_BACK',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('허리') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_LEG_TOTAL',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('다리/발') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'B_ETC',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('기타') },
      // styleName: 'right-column',
    },
    //개선
    {
      fieldName: 'IMP_COUNT',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('개선가능') },
      // styleName: 'right-column',
    },
    {
      fieldName: 'COMP_COUNT',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('개선완료') },
      // styleName: 'right-column',
    },
  ],
  columns: [],
  columnLayout: [
    {
      name: '작업표준',
      direction: 'horizontal',
      items: ['BSNS_NM', 'DEPT_NM', 'WORK_STANDARD_NO', 'WORK_STANDARD_NM'],
    },
    {
      name: '조사',
      direction: 'horizontal',
      items: ['ES_A1_TOTAL', 'ES_A2_TOTAL'],
    },
    {
      name: '부담작업(호)',
      direction: 'horizontal',
      items: [],
    },
    {
      name: '증상설문',
      direction: 'horizontal',
      items: [
        'T_RECORDS', //참여자수
        'SY_COUNT', //유증상자수
        {
          name: '유증상 신체부위',
          direction: 'horizontal',
          items: ['P_NECK', 'P_SHOULDER', 'P_ARM', 'P_HAND', 'P_BACK', 'P_LEG'],
        },
        {
          name: '발생 시 지속기간',
          direction: 'horizontal',
          items: ['DURATION_1DB', 'DURATION_1WB', 'DURATION_1MB', 'DURATION_6MB', 'DURATION_6MO'],
        },
        {
          name: '통증정도',
          direction: 'horizontal',
          items: ['P_WEAK', 'P_MODERATE', 'P_SEVERE', 'P_MORESEVERE'],
        },
        {
          name: '통증빈도',
          direction: 'horizontal',
          items: ['S_6M', 'S_3M', 'S_1M', 'S_1W', 'S_1D'],
        },
      ],
    },
    {
      name: '업무상질병',
      direction: 'horizontal',
      items: [
        'TOTAL_SAGO_COUNT', //승인건수
        {
          name: '승인 신체부위',
          direction: 'horizontal',
          items: ['B_NECK', 'B_SHOULDER', 'B_ELBOW', 'B_HAND_TOTAL', 'B_BACK', 'B_LEG_TOTAL', 'B_ETC'],
        },
      ],
    },
    {
      name: '개선',
      direction: 'horizontal',
      items: ['IMP_COUNT', 'COMP_COUNT'],
    },
  ],
})
grdMainProps.columns = grdMainProps.fields

const afterSearch = async (res) => {
  // debugger
  // console.log('resssSS', res)

  // 조회 첫 실행 시, 컬럼/레이아웃 초기 상태 복사 (한 번만 복사)
  if (defaultColumns.length === 0) {
    defaultColumns = _.cloneDeep(grdMainProps.columns) // 최초 1회 저장
    defaultColumnLayout = _.cloneDeep(grdMainProps.columnLayout)
  }

  // 매 조회 시 기존 컬럼/레이아웃을 초기 상태로 리셋 (중복 방지)
  grdMainProps.columns = _.cloneDeep(defaultColumns) // 초기 컬럼 정의
  grdMainProps.columnLayout = _.cloneDeep(defaultColumnLayout)

  const ress = await commonSearchApi({
    queryId: 'HLTIB0020_SEARCH_HO',
    param: { WORK_STANDARD_ID: '' }, // or 특정 ID
  })
  // 부담작업을 제외한 데이터
  const rowData = _.cloneDeep(res.ORESULT_CUR)
  // 부담작업 데이터
  const hoData = _.cloneDeep(ress.ORESULT_CUR)
  const honoRaw = _.cloneDeep(res.ORESULT_CUR2) //깊은복사
  // console.log('honoRaw', honoRaw)
  //조회한 HO_NO순으로 그리드 컬럼 생성후 세팅
  honoRaw.forEach((item, index) => {
    let hoNumberColumn = {
      fieldName: `${item.HO_NO}`,
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t(`${item.HO_NO}`) },
    }
    grdMainProps.columns.splice(8 + index, 0, hoNumberColumn) //8번째부터 HO_NO넣기
    // console.log('hoNumberColumn.fieldName', hoNumberColumn.fieldName)
    grdMainProps.columnLayout[2].items.push(hoNumberColumn.fieldName) //
  })
  // console.log('columnLayout', grdMainProps.columnLayout)
  // console.log('columns:',grdMainProps.columns)

  grdMain.value.getDataProvider().setFields(grdMainProps.columns)
  grdMain.value.getGridView().setColumns(grdMainProps.columns)
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)

  // 기존데이터에 부담작업 데이터 병합
  const rowMapp = {}
  rowData.forEach((row) => {
    rowMapp[row.WORK_STANDARD_ID] = row // 또는 WORK_STANDARD_NO, 기준 키 맞춰서
  })
  // 부담작업 데이터 병합
  hoData.forEach((item) => {
    const targetRow = rowMapp[item.WORK_STANDARD_ID]
    if (targetRow) {
      Object.keys(item).forEach((key) => {
        if (key.startsWith('HO_')) {
          targetRow[key] = item[key] ?? 0
        }
      })
    }
  })

  // console.log("부담작업 추가 : ", rowData)

  // ORESULT_CUR에서 정기(A1) 또는 수시(A2) 조사 건수가 0보다 큰 데이터만 필터링
  const filteredData = rowData.filter(
    (item) =>
      (searchParam.ES_DIV === 'A1' && item.ES_A1_TOTAL > 0) ||
      (searchParam.ES_DIV === 'A2' && item.ES_A2_TOTAL > 0) ||
      searchParam.ES_DIV === '' // 전체 조회 시 필터링 없이 출력
  )
  // console.log('필터링된 데이터:', filteredData)
  // 코드 리스트에서 부서명, 사업부명 변환
  const convertDept = convertDeptCdToNm(filteredData)
  // console.log('변환 데이터:', convertDept)
  // 그리드에 적용
  // grdMain.value.getDataProvider().setRows(convertDept)
  grdMain.value.getGridView().setFixedOptions({
    colCount: 1,
  })

  //---------------------------
  //동적 컬럼에 데이터 연결
  // debugger

  const hoFields = honoRaw.map((item) => `${item.HO_NO}`)

  const rowMap = {}

  // 컬럼에 기본 값 0
  convertDept.forEach((row) => {
    rowMap[row.WORK_STANDARD_ID] = row
    hoFields.forEach((field) => {
      if (row[field] === undefined || row[field] === null || row[field] === '') {
        row[field] = 0
      }
    })
  })

  // console.log("rowMap ", rowMap)

  // hoData = HO_2:1, HO_5:1 형식 데이터
  hoData.forEach((item) => {
    const targetRow = rowMap[item.WORK_STANDARD_ID]

    // console.log("targetRow1 ", targetRow)

    if (!targetRow) return

    Object.entries(item).forEach(([key, value]) => {
      if (key.startsWith('HO_')) {
        const col = key.slice(3) // "HO_2" → "2"

        // 숫자인지, 컬럼에 포함되는지 검증
        if (col && !isNaN(Number(col)) && hoFields.includes(col)) {
          // console.log(`값 매핑됨: ${col} → ${value}`);
          targetRow[col] = value ?? 0
        } else {
          // "HO_" 뒤에 숫자가 없으면 걸러내기
          // console.log(`HO_ 뒤에 숫자가 없어서 걸러짐: ${key}`);
        }
      }
    })
  })
  grdMain.value.getDataProvider().setRows(convertDept)
  //----------------------

  const gridView = grdMain.value.getGridView()
  gridView.setAllCheck(false)
  gridView.checkAll(false)
}

onMounted(() => {
  initCodeList()
  checkGroupAuth()
})

//로그인유저의 권한을 확인하는 함수
const checkGroupAuth = () => {
  //권한이 보건총괄관리자,근골격계질환 예방 모듈 관리자,admin그룹이면 모든 데이터 조회 및 수정가능
  if (
    userStore.authGrpCd.includes('GRP00372') ||
    userStore.authGrpCd.includes('HLTI001') ||
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    logsStore.isMenuAdmin === 'Y'
  ) {
    // console.log('관리자')
    isAdmin.value = true
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
    readOnlyValue.VEND_CD = false
    return false
  }
  //HEMP운영조직의 부서장,간사(정),간사(부),관리자권한 인지 확인
  //해당되지 않으면 조회버튼 이외에 모든버튼 비활성화
  if (userStore.userDiv === 'A') {
    // console.log('직영일때')
    //직영일때
    commonSearchApi({
      queryId: 'HLTIA0010_SEARCH_02',
      param: searchParam,
    }).then((res) => {
      res.ORESULT_CUR.forEach((e) => {
        if (userStore.empNo === e.EMP_NO) {
          //부서장,간사(정),간사(부) 관리자가 아니면 조회만
          if (!['0', '1', '2'].some((code) => e.DIV_CD.includes(code))) {
            isAdmin2.value = false
            // console.log('부서장,간사(정),간사(부)가 아니다. 조회만')
            searchParam.BSNS_CD = userStore.bsnsCd
            searchParam.DEPT_CD = userStore.deptCd
          } else {
            //부서장,간사(정),간사(부)면 등록,수정가능
            // console.log('부서장,간사(정),간사(부)이다. 본인부서 데이터만 접근가능')
            isAdmin2.value = false
            searchParam.BSNS_CD = userStore.bsnsCd
            searchParam.DEPT_CD = userStore.deptCd
          }
        } else {
          // //직영인데 부서장,간사(정,부)가 아니고 관리자도 아니면 조회만
          // console.log('아무것도 아니다. 조회만')
          searchParam.BSNS_CD = userStore.bsnsCd
          searchParam.DEPT_CD = userStore.deptCd
          isAdmin2.value = false
          // console.log("searchParam.BSNS_CD", searchParam.BSNS_CD)
          // console.log("searchParam.DEPT_CD", searchParam.DEPT_CD)
        }
      })
    })
  }
  //직영이 아닐때(협력사일때)
  else {
    // console.log('직영이 아닐때 본인소속 데이터만 접근가능')
    //본인 소속에 대한 데이터만 수정가능
    isAdmin3.value = false
    searchParam.BSNS_CD = userStore.bsnsCd
    searchParam.DEPT_CD = userStore.deptCd
    searchParam.VEND_CD = userStore.asgnCd
  }
}

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    // if(!isAdmin2.value) return;
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

//부서변경시 협력사 조회
watch(
  () => searchParam.DEPT_CD,
  (newValue, oldValue) => {
    // if ((!isAdmin3.value)) return;
    //협력사조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: newValue },
    }).then((res) => {
      searchParam.VEND_CD = ''
      codeList.VEND_CD = res.ORESULT_CUR
      codeList.VEND_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('기준년도')" width="200px" v-model="searchParam.YEAR" type="YEAR"></i-select>
            <i-select
              :label="$t('조사구분')"
              :items="codeList.ES_DIV"
              item-title="TXT"
              item-value="COD"
              width="200px"
              v-model="searchParam.ES_DIV"
            ></i-select>
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="200px"
              label-width="50px"
              v-model="searchParam.BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="200px"
              label-width="50px"
              v-model="searchParam.DEPT_CD"
              :readonly="isEmpty(searchParam.BSNS_CD) || readOnlyValue.DEPT_CD"
            ></i-select>
            <i-select
              :label="$t('협력사')"
              width="200px"
              :items="codeList.VEND_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              label-width="50px"
              v-model="searchParam.VEND_CD"
              :readonly="isEmpty(searchParam.DEPT_CD) || readOnlyValue.VEND_CD"
            ></i-select>
            <i-input
              :label="$t('작업표준번호')"
              width="300px"
              labelWidth="80px"
              v-model="searchParam.WORK_STANDARD_NO"
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            ></i-input>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
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
    min-height: 400px;
  }
}
</style>
