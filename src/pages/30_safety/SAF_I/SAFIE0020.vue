<!--
  화면명 : 협력사 안전관리자 지원금 신청
  화면개요 : 협력사 안전관리자 지원금 신청 조회 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IButtonList from '@/components/IButtonList.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'

defineOptions({
  name: '30_safety-SAF_I-SAFIE0020',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const buttonList1 = ref(null)
const buttonList2 = ref(null)
const saveParams= ref([])
const isAdmin = ref(false)

let findIndex = 0
let asgnInfo = ref(null)
let closeInfo = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  FROM_YYMM : dayjs(new Date).format('YYYY-MM'), // 신청년월
  YYYY : dayjs(new Date).format('YYYY'), // 년도
  MM : dayjs(new Date).format('MM'), // 월
  ASGN_CD : userStore.asgnCd,//소속
  ASGN_NM : userStore.asgnNm,//소속명
  STATUS : '',//진행상태
  BSNS_CD : userStore.bsnsCd,
  WORKER_CNT : 0, //인원수
  PAY_STANDARD : '', // 협력사 지급기준 코드
  APPLY_YN : 'Y', // 신청가능 여부
})



//안전관리자 목록 그리드
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  fields : [ 
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, styleName:'left-column', editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
    { fieldName: 'START_DATE', dataType: 'text', header: { text: t('접수일') }, editable: false },
    { fieldName: 'CAREER', dataType: 'text', header: { text: t('경력(근무일수)') }, editable: false },
    { fieldName: 'ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, editable: false },
    { fieldName: 'GRADE_NM', dataType: 'text', header: { text: t('자격순위') }, editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_NM', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'REG_NO', dataType: 'text', visible: false },
    { fieldName: 'AGE_INT', dataType: 'text', visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', visible: false },
    { fieldName: 'CAREER_SUM', dataType: 'text', visible: false },
    { fieldName: 'MONEY', dataType: 'text', visible: false },
    { fieldName: 'REMARK', dataType: 'text', visible: false },
    { fieldName: 'CAREER_GBN', dataType: 'text', visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false },
    { fieldName: 'END_VAL', dataType: 'text', visible: false },
    { fieldName: 'LICE_NAME', dataType: 'text', visible: false },
    { fieldName: 'LICE_CNT', dataType: 'text', visible: false },
    { fieldName: 'PAYMENT_CODE', dataType: 'text', visible: false },
    { fieldName: 'CNT', dataType: 'text', visible: false },
    { fieldName: 'AGE_OLD', dataType: 'text', visible: false },
    { fieldName: 'LICE_INFO', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'WORKER_CNT', dataType: 'text', visible: false },
    { fieldName: 'PAY_STANDARD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'WORK_FROM_DT', dataType: 'text', visible: false },
    { fieldName: 'WORK_TO_DT', dataType: 'text', visible: false },
    { fieldName: 'REAL_WORK_DAYS', dataType: 'text', visible: false },
    { fieldName: 'CHK', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false }, //자격순위
  ],
  columns: [],
  columnLayout: [],
})

// 지원금 신청 대상 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { header: { height: 60 }, checkBar: { visible: true }, stateBar: { visible: false } },
  fields : [ 
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
    { fieldName: 'START_DATE', dataType: 'text', header: { text: t('접수일') }, editable: false },
    { fieldName: 'CAREER', dataType: 'text', header: { text: t('경력(근무일수)') }, editable: false },
    { fieldName: 'ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, editable: false },
    { fieldName: 'GRADE_NM', dataType: 'text', header: { text: t('자격순위') }, editable: false },
    //{ fieldName: 'WORK_FROM_DT', dataType: 'text', header: { text: t('시작일') }, editable: false },
    //{ fieldName: 'WORK_TO_DT', dataType: 'text', header: { text: t('종료일') }, editable: false },
    //{ fieldName: 'REAL_WORK_DAYS', dataType: 'text', header: { text: t('실근무일수') }, styleName: 'right-column', editable: false },
    { fieldName: 'WORK_FROM_DT', dataType: 'text', header: { text: t('시작일'), styleName: 'header_validit' }, styleName: 'editable_column', editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'WORK_TO_DT', dataType: 'text', header: { text: t('종료일'), styleName: 'header_validit' }, styleName: 'editable_column', editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'REAL_WORK_DAYS', dataType: 'number', header: { text: t('실근무일수'), styleName: 'header_validit' }, styleName: 'right-column editable_column'
    , editable: true, numberFormat: "#,###", editor: { type: "line", inputCharacters: "0-9", maxLength: 2, },},
    { fieldName: 'PRIORITY', dataType: 'text', header: { text: t('지원금 우선순위'), styleName: 'header_validit'}, width: '150', styleName: 'right-column editable_column', lookupDisplay: true
    , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'PAY_RATIO', dataType: 'text', header: { text: t('지급비중') }, styleName: 'right-column', editable: false },
    { fieldName: 'SUPPORT_FUND', dataType: 'number', header: { text: t('지원금(원)') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태')}, width: '150', lookupDisplay: true, editor: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column', editable: false },

     //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_NM', dataType: 'text', visible: false },
    { fieldName: 'REG_NO', dataType: 'text', visible: false },
    { fieldName: 'AGE_INT', dataType: 'text', visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', visible: false },
    { fieldName: 'CAREER_SUM', dataType: 'text', visible: false },

    

    { fieldName: 'GRADE', dataType: 'text', visible: false },
    { fieldName: 'MONEY', dataType: 'text', visible: false },
    { fieldName: 'CAREER_GBN', dataType: 'text', visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false },
    { fieldName: 'END_VAL', dataType: 'text', visible: false },
    { fieldName: 'LICE_NAME', dataType: 'text', visible: false },
    { fieldName: 'LICE_CNT', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'CLOSE_YYYYMM', dataType: 'text', visible: false },
    { fieldName: 'PAY_STANDARD', dataType: 'text', visible: false },
    { fieldName: 'WORKER_CNT', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: 
  [
    'BSNS_NM', 'DEPT_NM', 'EMP_NO', 'KOR_NM', 'HLD_OFFI_GBN_NM', 'START_DATE', 'CAREER', 'ENT_DATE', 'RETI_TMP_DATE', 'GRADE_NM',
    {
      name: 'H01',
      fieldName : 'H01',
      direction: 'horizontal',
      items: [ 'WORK_FROM_DT', 'WORK_TO_DT'],
      header: { 
        text: '근무기간',
        values: { headerText: t('근무기간')}
      },
    },
    'REAL_WORK_DAYS', 'PRIORITY', 'PAY_RATIO', 'SUPPORT_FUND', 'STATUS', 'REMARK',
  ],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  year : [], // 년도
  mnth : [], // 월
  priority : [{ TXT: '1', COD: '1' },{ TXT: '2', COD: '2' }], // 지원금 우선순위
  status : [], // 진행상태
})

//코드리스트 셋팅
const initCodeList = () => {
  // 년도 월 바인딩
  searchParams.YYYY = dayjs(searchParams.FROM_YYMM).format('YYYY') // 년도
  searchParams.MM = dayjs(searchParams.FROM_YYMM).format('MM') // 월
  // 관리자 설정 관리자만 소속을 변경할수 있음
  if(userLogStore.isMenuAdmin === "Y"){
    isAdmin.value = true
  }
  Promise.all([
    // 지원금 접수 진행상태
    getCodeList(userStore.cmpnyDiv+'ZH70010'), // 지원금 신청 진행상태
    // 협력사 정보
    commonSearchApi({ queryId : 'SAFIE0020_SEARCH_00', param : { CMPNY_DIV: userStore.cmpnyDiv, YYYY : searchParams.YYYY, MM : searchParams.MM, ASGN_CD: searchParams.ASGN_CD} }),
  ]).then(res => {
    //console.log("레스 확인",res)

    // 지원금 신청 진행상태 
    codeList.status = res[0].ORESULT_CUR

    // 그리드 세팅
    // 지원금 우선순위 lookup set
    grdSub.value.setBindingColumn("PRIORITY", codeList.priority, "COD", "TXT")
    // 지원금 우선순위 
    grdSub.value.setBindingColumn("STATUS", codeList.status, "COD", "TXT")

    
    // 신청기간 화면 출력
    if(res[1].ORESULT_CUR1.length!=0){
      if(res[1].ORESULT_CUR1[0].APPLY_YN ==="Y"){
        closeInfo.value = "신청기간 : " + res[1].ORESULT_CUR1[0].FROM_DATE + " ~ " + res[1].ORESULT_CUR1[0].TO_DATE
      } else{
        closeInfo.value = "신청기간 : " + res[1].ORESULT_CUR1[0].FROM_DATE + " ~ " + res[1].ORESULT_CUR1[0].TO_DATE + "    ◈ 신청기간이 아닙니다.";
      }
      searchParams.APPLY_YN = res[1].ORESULT_CUR1[0].APPLY_YN
    }

    // 협력사 정보 세팅
    // 신청당시 협력사 인원
    // 신청당시 협력사 지급기준 코드 (A: 50명 미만, B : 50명부터 100명 미만, C: 100명 이상)
    if(res[1].ORESULT_CUR2.length!=0){
      searchParams.WORKER_CNT = res[1].ORESULT_CUR2[0].CNT
      searchParams.PAY_STANDARD = res[1].ORESULT_CUR2[0].PAYMENT_CODE
      asgnInfo.value = "재직인원 : " + res[1].ORESULT_CUR2[0].CNT + "명 지급기준 :" + res[1].ORESULT_CUR2[0].PAYMENT
    }

    // 현재시점 지원금 접수 진행상태
    let status ="01"
    if(res[1].ORESULT_CUR3.length!=0){
      status = res[1].ORESULT_CUR3[0].STATUS
    }

    findIndex = res[0].ORESULT_CUR.findIndex(item => item.COD == status)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams.STATUS = codeList.status[findIndex].COD
  }).finally(() => {
    // 버튼 처리
    controllerSetting()
  })
}

// 신청년월 바뀌면 진행상태 변경 및 버튼 세팅
watch(() => searchParams.FROM_YYMM, async (newValue, oldValue) => {
  //  console.log('searchTab02Params.FROM_YYMM newValue : ', newValue)
  //  console.log('searchTab02Params.FROM_YYMM oldValue : ', oldValue)
  if(newValue !== oldValue){
    // 년도 월 바인딩
    searchParams.YYYY = dayjs(searchParams.FROM_YYMM).format('YYYY'), // 년도
    searchParams.MM = dayjs(searchParams.FROM_YYMM).format('MM'), // 월
    
    // 선택된 부서정보 검색
    selectedAsgnInfo()
  }
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){ //조회
  // 안전관리자 목록
    new queryFlowHelper(vm, t)
      //.setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === 'btnCreate'){// 추가
    // 안전관리자 목록에 선택된 데이터가 있는지 확인 후 선택된 데이터가 있으면
    // 지원금 신청 대상으로 데이터 입력후 안전관리자 목록에서는 삭제
    // 안전관리자 목록에 선택된 항목
    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    } else {
      // 지원금 신청 대상 그리드에 선택된 데이터 넣기
      chekedRow.forEach( val => {
        let data = grdMain.value.getDataProvider().getJsonRow(val)
        // 실근무 일수
        data.REAL_WORK_DAYS = dayjs(data.WORK_TO_DT).diff(dayjs(data.WORK_FROM_DT), 'day') + 1
        // 진행상태
        data.STATUS = "01"
        // 저장여부
        data.SAVE_YN = "N"
        //협력사 지급기준 코드
        data.PAY_STANDARD = searchParams.PAY_STANDARD
        //인원수
        data.WORKER_CNT = searchParams.WORKER_CNT
        console.log("data : ", data)
        grdSub.value.addRow(data)
      })
      // 안전관리자 목록 그리드에 선택된 데이터 삭제
      grdMain.value.getDataProvider().removeRows(chekedRow)
    }
  } else if(btn.id === 'btnDelete'){//삭제
    // 지원금 신청 대상 목록에 선택된 데이터가 있는지 확인 후 선택된 데이터가 있으면
    // 안전관리자 목록으로 데이터 입력후 지원금 신청 대상에서는 삭제
    // 지원금 신청 대상 목록에서 선택된 항목
    let chekedRow = grdSub.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    } else {
      
      // 지원금 신청 대상 그리드에 선택된 데이터 넣기
      chekedRow.forEach( val => {
        let data = grdSub.value.getDataProvider().getJsonRow(val)
        console.log("data : ", data)
        grdMain.value.addRow(data)
      })
      // 안전관리자 목록 그리드에 선택된 데이터 삭제
      grdSub.value.getDataProvider().removeRows(chekedRow)
    }
  } else if(btn.id === 'btnApplication'){//신청
    // 지원금 신청 대상 신청
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(saveCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnReqCancel'){//신청취소
    // 지원금 신청 대상 신청 취소
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(saveCheck2)
      .setQuery(saveData2)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

// //그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }else if(val === 'grdSub'){
    grdSub.value.getDataProvider().setRows([])
  }
}

//셀변경 이벤트 시작
const onCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdSub.value.getGridView().getColumn(field).name
  
  // 해당하는 로우 데이터 가져 오기
  let data = grdSub.value.getDataProvider().getJsonRow(row)

  // 지원금 : 기본지원금 / 해당월일수 * 실근무일수 * 지급비중
  let MONEY = isNullCheck(data.MONEY) * 10000
  //console.log("MONEY :", MONEY)

  // 해당월을 마지낙 날
  let MONTH_DAY = dayjs(data.YYYY+"-"+data.MM+"-01").daysInMonth()
  // 실근무일수
  let REAL_WORK_DAYS = isNullCheck(data.REAL_WORK_DAYS)
  // 지원금 우선순위
  let PAY_STANDARD = data.PAY_STANDARD

  
  // console.log("MONTH_DAY :", MONTH_DAY)
  // console.log("REAL_WORK_DAYS :", REAL_WORK_DAYS)
  // console.log("PAY_STANDARD :", PAY_STANDARD)

  // 근무기간 시작일 / 종료일
  if(fieldName === "WORK_FROM_DT" || fieldName === "WORK_TO_DT"){
    // 실근무일수
    REAL_WORK_DAYS = dayjs(data.WORK_TO_DT).diff(dayjs(data.WORK_FROM_DT), 'day') + 1
    // 그리드에 추가
    grdSub.value.getDataProvider().setValue(row, "REAL_WORK_DAYS", REAL_WORK_DAYS)

    if(!isNullCheck2(data.PAY_RATIO)){
      // 근무일수 변경시 우선순위가 입력되어 있으면 지급금 계산
      if(data.PAY_RATIO==="100%"){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }else if(data.PAY_RATIO==="50%"){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / (MONTH_DAY *2))
      }
    }
    // 그리드 내용 커밋
    grdSub.value.getGridView().commit()
  }else if(fieldName === "REAL_WORK_DAYS"){
    // 실근무 일수 변경시
    if(!isNullCheck2(data.PAY_RATIO)){
      // 근무일수 변경시 우선순위가 입력되어 있으면 지급금 계산
      if(data.PAY_RATIO==="100%"){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }else if(data.PAY_RATIO==="50%"){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / (MONTH_DAY *2))
      }
      // 그리드 내용 커밋
      grdSub.value.getGridView().commit()
    }
  }else if(fieldName === "PRIORITY"){
    // 지원금 우선순위 변경시
    // 지원금 우선순위
    let PRIORITY = data.PRIORITY

    // 1 ~ 49명 : 1명( 100% : 1명)
    if (PAY_STANDARD === "A"){
      grdSub.value.getDataProvider().setValue(row, "PAY_RATIO", "100%")
      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }
    }else if (PAY_STANDARD === "B"){
      // 50 ~ 99명 : 2명(100% : 1명, 50% : 1명)
      // 협력사 재직인원수에 따라 지원금 우선순위로 비중 세팅
      if (PRIORITY === "1"){
        grdSub.value.getDataProvider().setValue(row, "PAY_RATIO", "100%")
      }else if (PRIORITY === "2"){
        grdSub.value.getDataProvider().setValue(row, "PAY_RATIO", "50%")
      }

      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0){
        if (PRIORITY === "1"){
          grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
        }else if (PRIORITY === "2"){
          grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / (MONTH_DAY*2))
        }
      }
    }else if (PAY_STANDARD === "C"){
      // 100 ~ : 2명 (100% : 2명)
      // 협력사 재직인원수에 따라 지원금 우선순위로 비중 세팅
      if (PRIORITY === "1"){
        grdSub.value.getDataProvider().setValue(row, "PAY_RATIO", "100%")
      }else if (PRIORITY === "2"){
        grdSub.value.getDataProvider().setValue(row, "PAY_RATIO", "100%")
      }

      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0){
        grdSub.value.getDataProvider().setValue(row, "SUPPORT_FUND", (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }
    }
    // 그리드 내용 커밋
    grdSub.value.getGridView().commit()
  }
}

//경력에 따른 행스타일 적용
const gridCellColorSetting = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    let ret = {
      style: {
        "background-color": undefined,
      },
    }
    //let AGE_OLD = grid.getValue(dataCell.index.itemIndex, "AGE_OLD")
    let CAREER_GBN = grid.getValue(dataCell.index.itemIndex, "CAREER_GBN")
    //console.log("CAREER_GBN : ", CAREER_GBN)

    if(dataCell.dataColumn.fieldName === "CAREER"){
      if(CAREER_GBN==="A"){
        ret.style["background-color"] = "#90EE90"
      }else if(CAREER_GBN==="B"){
        ret.style["background-color"] = "#FFA500"
      }else if(CAREER_GBN==="C"){
        ret.style["background-color"] = "#FF0000"
      }
    }
    return ret
  })

  grdSub.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    let ret = {
      style: {
        "background-color": undefined,
      },
    }
    //let AGE_OLD = grid.getValue(dataCell.index.itemIndex, "AGE_OLD")
    let CAREER_GBN = grid.getValue(dataCell.index.itemIndex, "CAREER_GBN")
    //console.log("CAREER_GBN : ", CAREER_GBN)

    if(dataCell.dataColumn.fieldName === "CAREER"){
      if(CAREER_GBN==="A"){
        ret.style["background-color"] = "#90EE90"
      }else if(CAREER_GBN==="B"){
        ret.style["background-color"] = "#FFA500"
      }else if(CAREER_GBN==="C"){
        ret.style["background-color"] = "#FF0000"
      }
    }
    return ret
  })
}

// 부서 조회 팝업 오픈
const openDeptPopup = () => {
  console.log("isAdmin.value : ",isAdmin.value)
  if(isAdmin.value){
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      ASGN_NM : searchParams.ASGN_NM,
      ORGN_DIV : 'B',
      HSE_SYS : 'N',
    })
  }
}

//부서 조회 선택 데이터
const onDeptSelected = row => {
  searchParams.BSNS_CD = row.BSNS_CD
  searchParams.ASGN_NM = row.ASGN_SHRT_NM
  searchParams.ASGN_CD = row.ASGN_CD

  // 선택된 부서정보 검색
  selectedAsgnInfo()
}

// 선택된 부서정보 검색
const selectedAsgnInfo = async() => {
  await commonSearchApi({ queryId : 'SAFIE0020_SEARCH_00', param : { CMPNY_DIV: userStore.cmpnyDiv, YYYY : searchParams.YYYY, MM : searchParams.MM, ASGN_CD: searchParams.ASGN_CD} })
  .then(res => {
    //console.log("레스 확인",res)
    // 신청기간 화면 출력
    if(res.ORESULT_CUR1.length!=0){
      if(res.ORESULT_CUR1[0].APPLY_YN ==="Y"){
        closeInfo.value = "신청기간 : " + res.ORESULT_CUR1[0].FROM_DATE + " ~ " + res.ORESULT_CUR1[0].TO_DATE
      } else{
        closeInfo.value = "신청기간 : " + res.ORESULT_CUR1[0].FROM_DATE + " ~ " + res.ORESULT_CUR1[0].TO_DATE + "    ◈ 신청기간이 아닙니다.";
      }
      searchParams.APPLY_YN = res.ORESULT_CUR1[0].APPLY_YN
    }

    // 협력사 정보 세팅
    // 신청당시 협력사 인원
    // 신청당시 협력사 지급기준 코드 (A: 50명 미만, B : 50명부터 100명 미만, C: 100명 이상)
    if(res.ORESULT_CUR2.length!=0){
      searchParams.WORKER_CNT = res.ORESULT_CUR2[0].CNT
      searchParams.PAY_STANDARD = res.ORESULT_CUR2[0].PAYMENT_CODE
      asgnInfo.value = "재직인원 : " + res.ORESULT_CUR2[0].CNT + "명 지급기준 :" + res.ORESULT_CUR2[0].PAYMENT
    }

    // 현재시점 지원금 접수 진행상태
    let status ="01"
    if(res.ORESULT_CUR3.length!=0){
      status = res.ORESULT_CUR3[0].STATUS
    }

    findIndex = codeList.status.findIndex(item => item.COD == status)
    if(findIndex < 0){
        findIndex = 0
    }
    // console.log('codeList.status : ',codeList.status)
    // console.log('findIndex : ',findIndex)

    searchParams.STATUS = codeList.status[findIndex].COD
  }).finally(() => {
    controllerSetting()
    gridRefresh('grdMain')
    gridRefresh('grdSub')
  })
}

//널값체크후 숫자 리턴
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? 0 : Number(val)
}

//널값체크후 참 거짓 리턴
const isNullCheck2 = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

//콤마 추가
const isNullCheck3 = val => {
  return (val === undefined || val === null || val === '') ? 0 : val.toLocaleString("en-US")
}

// 지원금 접수의 진행 상태에 따라 버튼 활성화 및 비활성화
/* ******************* true: 비활성화 , false: 활성화 ******************** */
const controllerSetting = () => {
  //console.log("searchParams:",searchParams)
  // 신청가능 기간 여부
  grdSub.value.getGridView().setColumn({name: 'WORK_FROM_DT', editable: false})
  grdSub.value.getGridView().setColumn({name: 'WORK_TO_DT', editable: false})
  grdSub.value.getGridView().setColumn({name: 'REAL_WORK_DAYS', editable: false})
  grdSub.value.getGridView().setColumn({name: 'PRIORITY', editable: false})
  if(searchParams.APPLY_YN === "Y"){
    // 진행상태 일 때 추가 삭제 버튼 활성화 처리
    if(searchParams.STATUS !== "01"){
      buttonList1.value.disableBtn('btnCreate', true)
      buttonList2.value.disableBtn('btnDelete', true)
      buttonList2.value.disableBtn('btnApplication', true)
      buttonList2.value.disableBtn('btnReqCancel', false)
    } else{
      buttonList1.value.disableBtn('btnCreate', false)
      buttonList2.value.disableBtn('btnDelete', false)
      buttonList2.value.disableBtn('btnApplication', false)
      buttonList2.value.disableBtn('btnReqCancel', true)
      grdSub.value.getGridView().setColumn({name: 'WORK_FROM_DT', editable: true})
      grdSub.value.getGridView().setColumn({name: 'WORK_TO_DT', editable: true})
      grdSub.value.getGridView().setColumn({name: 'REAL_WORK_DAYS', editable: true})
      grdSub.value.getGridView().setColumn({name: 'PRIORITY', editable: true})
    }
  } else {
    buttonList1.value.disableBtn('btnCreate', true)
    buttonList2.value.disableBtn('btnDelete', true)
    buttonList2.value.disableBtn('btnApplication', true)
    buttonList2.value.disableBtn('btnReqCancel', true)
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 안전관리자 목록/지원금 신청 대상 조회
const searchData = async idx => {
  await selectedAsgnInfo()
  //console.log('searchParams : ',searchParams)
  return commonSearchApi({ queryId : 'SAFIE0020_SEARCH_01', param: searchParams })
}

// 안전관리자 목록/지원금 신청 대상 조회
const afterSearch = async res => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  // console.log('res.ORESULT_CUR1 : ',res.ORESULT_CUR1)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR1)
  gridCellColorSetting()
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/
// 지원금 신청 대상 저장 전 유효성 검사
const saveCheck = () => {
  //console.log("여기 오냐?????")
  let result = true

  if(searchParams.APPLY_YN ==="N"){
    // 신청가능 할때만
    Message.warn(t('신청가능 기간이 아닙니다. 신청기간에 신청해주세요.'))
    result = false
  } else if(searchParams.STATUS !=="01"){
    // 진행상태가 작성중일때만
    Message.warn(t('진행상태가 작성중 일 때 신청가능합니다.'))
    result = false
  }

  saveParams.value = []

  // 상태바가 체크된 항목
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    try {
      chekedRow.forEach( val => {
        let data = grdSub.value.getDataProvider().getJsonRow(val)
        
        if(isNullCheck2(data.WORK_FROM_DT)){
          // 근무 시작일이 없으면 안됨
          throw new Error("WORK_FROM_DT")
        } else if(isNullCheck2(data.WORK_TO_DT)){
          // 근무 종료일이 없으면 안됨 // WORK_TO_DT
          throw new Error("WORK_TO_DT")
        } else if(isNullCheck2(data.REAL_WORK_DAYS)){
          // 실근무일수가 없으면 안됨 // REAL_WORK_DAYS
          throw new Error("REAL_WORK_DAYS")
        } else if(isNullCheck2(data.PRIORITY)){
          // 지원금 우선순위가 없으면 안됨 // PRIORITY
          throw new Error("PRIORITY")
        }
        
        data.USER_ID = userStore.userId
        saveParams.value.push(data)
      })
    } catch(error){
      if(error=="Error: WORK_FROM_DT"){
        Message.warn(t('근무 시작일을 입력 후 신청해주세요.'))
      } else if(error=="Error: WORK_TO_DT"){
        Message.warn(t('근무 종료일을 입력 후 신청해주세요.'))
      } else if(error=="Error: REAL_WORK_DAYS"){
        Message.warn(t('실근무일수를 입력 후 신청해주세요.'))
      } else if(error=="Error: PRIORITY"){
        Message.warn(t('지원금 우선순위를 입력 후 신청해주세요.'))
      }
      result = false
    }
  }
  // console.log('saveTab01Check saveParams.value:',saveParams.value)
  return result
}

// 지원금 신청 대상 취소 저장 전 유효성 검사
const saveCheck2 = () => {
  let result = true
  
  if(searchParams.APPLY_YN ==="N"){
    // 신청가능 할때만
    Message.warn(t('신청가능 기간이 아닙니다. 신청기간에 신청해주세요.'))
    result = false
  }

  saveParams.value = []

  // 상태바가 체크된 항목
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    try {
      chekedRow.forEach( val => {
        let data = grdSub.value.getDataProvider().getJsonRow(val)

        if(!isNullCheck2(data.CLOSE_YYYYMM)){
          // 지원금 우선순위가 없으면 안됨 // PRIORITY
          throw new Error("CLOSE_YYYYMM")
        }

        data.USER_ID = userStore.userId
        //console.log('data:',data)
        saveParams.value.push(data)
      })
    } catch(error){
      if(error=="Error: CLOSE_YYYYMM"){
        Message.warn(t('마감완료 된 대상이 존재하여 신청취소가 불가능 합니다.'))
      } 
      result = false
    }
  }
  return result
}

// 지원금 신청 대상 신청 저장
const saveData = ()=> {
  return commonExecuteApi({ queryId : 'SAFIE0020_SAVE_01', list: saveParams.value })
}

// 지원금 신청 대상 신청 취소
const saveData2 = ()=> {
  return commonExecuteApi({ queryId : 'SAFIE0020_DELETE_01', list: saveParams.value })
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('소속')"
              leftLabel
              v-model="searchParams.ASGN_NM"
              width="300px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup()"
              @keydown.enter="e => {openDeptPopup()}"
              @update:model-value="() => searchParams.ASGN_CD = null"
              :required="isAdmin"
              :readonly="!isAdmin"
              class="ma-0 mr-2"
            />
            <i-input
              v-model="searchParams.ASGN_CD"
              readonly
              width="100px"
              disabled
            />
            
            <i-input
              v-model="searchParams.FROM_YYMM"
              :label="$t('신청년월')"
              type="month"
              width="200px"
            />
            <i-select
              :label="$t('진행상태')"
              width="200px"
              v-model="searchParams.STATUS"
              :items="codeList.status"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <v-sheet class="d-flex justify-end align-center slotText mr-5">
              {{ asgnInfo }}
            </v-sheet>
            <v-sheet class="d-flex justify-end align-center slotText">
              {{ closeInfo }}
            </v-sheet>
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet height="50%" class="mb-2">
            <IGridTitle
              ref="buttonList1"
              :title="$t('안전관리자 목록')"
              :button-list="['btnCreate']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              
            />
          </v-sheet>
          <v-sheet class="h-auto">
            <IGridTitle
              ref="buttonList2"
              :title="$t('지원금 신청 대상')"
              :button-list="['btnDelete','btnApplication','btnReqCancel']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
              @onCellEdited="onCellEdited"
            />
          </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> 
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
    min-height: 300px;
  }
}
</style>
