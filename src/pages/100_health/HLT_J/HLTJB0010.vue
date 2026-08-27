<!-- 
  화면명 : 업무상질병 신청 관리
  화면개요 : 업무상질병 신청 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonLogExecuteApi, getCompanyList } from '@hiway/api/commonApi'
import { useRoute, useRouter } from 'vue-router'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTJB0010Popup01 from '@/pages/100_health/HLT_J/HLTJB0010Popup01.vue'
import HLTJB0010Popup02 from '@/pages/100_health/HLT_J/HLTJB0010Popup02.vue'
import HLTJB0010Popup03 from '@/pages/100_health/HLT_J/HLTJB0010Popup03.vue'
import HLTJB0010Popup04 from '@/pages/100_health/HLT_J/HLTJB0010popup04.vue'
import HLTJB0010Popup05 from '@/pages/100_health/HLT_J/HLTJB0010Popup05.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재

defineOptions({
  name:'100_health-HLT_J-HLTJB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter() 

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

const isAdmin = ref(0)
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const hltjb0010Popup01 = ref(null) // 추가,변경
const hltjb0010Popup02 = ref(null) // 사실통지
const hltjb0010Popup03 = ref(null)
const hltjb0010Popup04 = ref(null) // 작업표준 복사
const hltjb0010Popup05 = ref(null) // 최종제출
const approvalPopup = ref(null) // 결재
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)
const selectedCol = ref(null)
const fileTitle = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  EMP_NO: '',
  EMP_NM: '',
  APPLI_GUBUN: '',
  TMP_DIAGNOSIS_DATE_FROM: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_FROM: '',
  TMP_DIAGNOSIS_DATE_TO: dayjs().format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_TO: '',
  RETI_YN: 'N'
})

const codeList = reactive({
  COMPANY: [],
  BSNS_CD: [],
  DEPT_CD: [],
  APPLI_GUBUN: [],
  HOSPITAL: [],
  BODY1: [],
  BODY2: [],
  DISEASE: [],
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // HLTJ001 (직업병관리 모듈 담당자)
  // HLTJ002 (직업병관리 부서 담당자)
  // GRP00372 (보건 총괄)
  // 0: 일반 사용자, 1:부서담당자 ,2: 직엽병관리 모듈 담당자
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTJ001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = 2
  else if (userStore.authGrpCd.includes('GRP00387') || userStore.authGrpCd.includes('GRP00389') || userStore.authGrpCd.includes('HLTJ002')) isAdmin.value = 1
  else isAdmin.value = 0

  onButtonsClick({ id: 'btnSearch' })

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 1,
    })
  })  
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 회사구분
    getCompanyList(),
    // 사업부
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_BSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y'} }),
    // 신청구분
    getCodeList('HHII820A'),
    // 진단기관
    getCodeList('HHII820C'),
    // 신체부위1
    getCodeList('HHII820D'),
    // 신체부위2
    getCodeList('HHII820E'),
    // 상병
    getCodeList('HHII820F'),
  ]).then((res) => {
    codeList.COMPANY = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.APPLI_GUBUN = res[3].ORESULT_CUR
    codeList.HOSPITAL = res[5].ORESULT_CUR
    codeList.BODY1 = res[5].ORESULT_CUR
    codeList.BODY2 = res[6].ORESULT_CUR
    codeList.DISEASE = res[7].ORESULT_CUR

    codeList.APPLI_GUBUN = codeList.APPLI_GUBUN.filter(item => item.TXT.replaceAll(' ', '') != '직접입력')
    codeList.APPLI_GUBUN.unshift({ TXT : '전체', COD : '' })
    // grdMain.value.setBindingColumn('APPLI_GUBUN', codeList.APPLI_GUBUN, 'COD', 'TXT')
    // grdMain.value.setBindingColumn('HOSPITAL_CODE', codeList.HOSPITAL, 'COD', 'TXT')
    // grdMain.value.setBindingColumn('BODY1_CODE', codeList.BODY1, 'COD', 'TXT')
    // grdMain.value.setBindingColumn('BODY2_CODE', codeList.BODY2, 'COD', 'TXT')
    // grdMain.value.setBindingColumn('DISEASE_CODE', codeList.DISEASE, 'COD', 'TXT')
    grdMain.value.setBindingColumn('HLD_OFFI_GBN', codeList.HLD_OFFI_GBN, 'COD', 'TXT')

    codeList.COMPANY.unshift({ TXT: '전체', COD: ''})
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

//그리드 속성셋팅 
const grd1Props = reactive({ 
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 }},
  keys : [], 
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', editable: false, dataType: 'text', header: { text: t('사번') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }},
    { fieldName: 'CMPNY_NM', width: '120', editable: false, dataType: 'text', header: { text: t('회사구분') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }},
    { fieldName: 'BSNS_NM', width: '120', editable: false, dataType: 'text', header: { text: t('사업부') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '120', editable: false, dataType: 'text', header: { text: t('부서') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true},
    { fieldName: 'GWA_NM', width: '80', editable: false, dataType: 'text', header: { text: t('과') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'KOR_NM', width: '80', editable: false, dataType: 'text', header: { text: t('성명') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'JOB_TIT_NM', width: '80', editable: false, dataType: 'text', header: { text: t('직위') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'HLD_OFFI_GBN', width: '80', editable: false, dataType: 'text', header: { text: t('재직구분') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'BIRTH_DAY', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'COM_ENT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('입사일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"]+ value' } },
    { fieldName: 'RETI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('휴•퇴직일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'WORK_YEAR', width: '100', editable: false, dataType: 'text', header: { text: t('근속연수') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'UNT_DUTY_NM', width: '100', editable: false, dataType: 'text', header: { text: t('직종') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'APPLI_GUBUN_NM', width: '100', editable: false, dataType: 'text', header: { text: t('신청구분') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"]  + value' } },
    { fieldName: 'APPLI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진정일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'DIAGNOSIS_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진단일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'CMPNY_RCPT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('회사접수일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'HOSPITAL_NM', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('진단기관') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'BODY1_NM', width: '120', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('신체부위1') }, lookupDisplay: true },
    { fieldName: 'BODY2_NM', width: '120', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('신체부위2') }, lookupDisplay: true },
    { fieldName: 'DISEASE_NM', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('상병명') }, lookupDisplay: true },
    { fieldName: 'EXPIRATION_DATE', width: '100', editable: false, dataType: 'text', header: { text: t('유효기간') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'WORK_EVALNM', width: '120', editable: false, dataType: 'text', header: { text: t('자체작업력평가') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'NOTIFY_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('사실통지일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' },
      'styleCallback': function(grid, dataCell){
        if(dayjs().diff(dayjs(grid.getValue(dataCell.index.itemIndex, 'NOTIFY_DATE')), 'month') >= 1 && 
          isEmpty(grid.getValue(dataCell.index.itemIndex, 'FINAL_DATE'))) {
          return { style: { background:'#fffb3e' } }
        } else {
          return { style: { background:'#ffffff' } }
        }
      }
    },
    { fieldName: 'IND_MANAGE', width: '120', editable: false, dataType: 'text', header: { text: t('공단담당자') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'WORK_STANDARD_NM', width: '200', editable: false, dataType: 'text', header: { text: t('작업표준'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let btnValue = '등록'
          let btnBackColor = '#e52b2b'
          if(!isEmpty(cell.value.trim())) {
            btnValue = '완료'
            btnBackColor = '#1eaf1e'
          }
          let bsnsCd = grid.getValue(cell.index.itemIndex, 'BSNS_CD')
          let bsnsNm = grid.getValue(cell.index.itemIndex, 'BSNS_NM')
          if(bsnsCd === 'AE00' || bsnsNm === '특수선사업부') {
            btnValue = '미해당'
            btnBackColor = '#7f7b7b'
          }
          

          "AE00"
          var str = 
          `<div class="d-flex justify-space-between" style="align-items: center;">
            <p style="max-width: 80%; text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value}</p>
            <button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px; height:22px; width: 40px;"
            >${btnValue}</button>
          </div>`;
          return str;
        },
      }
    },
    { fieldName: 'WRITE', width: '80', editable: false, dataType: 'text', header: { text: t('자료등록'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"]' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let btnValue = cell.value == 'Y' ? '완료' : '등록'
          let btnBackColor = cell.value == 'Y' ? '#1eaf1e' : '#e52b2b'
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px; height:22px; width: 40px;"
            >${btnValue}</button>`;
          return str;
        },
      }
    },
    { fieldName: 'APPROVAL_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('결재완료'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'HR_DEPT', width: '80', editable: false, dataType: 'text', header: { text: t('인사부서'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"]' }, 
      renderer: {
        type: "html", 
        callback: function (grid, cell, w, h) {
          let btnValue = cell.value == 'Y' ? '완료' : '등록'
          let btnBackColor = cell.value == 'Y' ? '#1eaf1e' : '#e52b2b'
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px; height:22px; width: 40px;"
            >${btnValue}</button>`;
          return str;
        },
      } 
    },
    { fieldName: 'FINAL_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최종제출일'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
   
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'NOTIFY_FILE_ID', dataType: 'text', header: { text: t('통지 첨부파일ID') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관') },visible: false, },
    { fieldName: 'BODY1_CODE', dataType: 'text', header: { text: t('부위1') },visible: false, },
    { fieldName: 'BODY2_CODE', dataType: 'text', header: { text: t('부위2') },visible: false, },
    { fieldName: 'DISEASE_CODE', dataType: 'text', header: { text: t('상병') },visible: false, },
    { fieldName: 'APPLI_GUBUN', dataType: 'text', header: { text: t('신청구분') },visible: false, },
    { fieldName: 'ADD_FILE_ID', dataType: 'text', header: { text: t('추가 첨부파일ID') },visible: false, },
    { fieldName: 'INCIDENT_CODE', dataType: 'text', header: { text: t('발생경위 코드') },visible: false, },
    { fieldName: 'INCIDENT_NM', dataType: 'text', header: { text: t('발생경위') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('상병IDX') },visible: false, },
    { fieldName: 'APPROVAL_STATUS', dataType: 'text', header: { text: t('결재상태') },visible: false, },
    { fieldName: 'HR_MEMO_FILE_ID', dataType: 'text', header: { text: t('인사기록부') },visible: false, },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('작업표준ID') },visible: false, },
    { fieldName: 'HR_ATTEND_FILE_ID', dataType: 'text', header: { text: t('근태기록부') },visible: false, },
    { fieldName: 'HR_REMARK_FILE_ID', dataType: 'text', header: { text: t('인사부서용 기타자료') },visible: false, },
    { fieldName: 'DEPT_REMARK_FILE_ID', dataType: 'text', header: { text: t('현업부서용 기타자료') },visible: false, },
    { fieldName: 'WORK_EVAL', dataType: 'text', header: { text: t('작업력평가') },visible: false, },
    { fieldName: 'CHK_DISEASE', dataType: 'text', header: { text: t('체크된 상병명') },visible: false, },
    { fieldName: 'CHK_STD1', dataType: 'text', header: { text: t('체크된 용접') },visible: false, },
    { fieldName: 'CHK_STD2', dataType: 'text', header: { text: t('체크된 취부') },visible: false, },
    { fieldName: 'CHK_STD3', dataType: 'text', header: { text: t('체크된 배관') },visible: false, },
    { fieldName: 'CHK_STD4', dataType: 'text', header: { text: t('체크된 도장') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SEX', dataType: 'text', header: { text: t('성별') },visible: false, },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('성별') },visible: false, },
  ],
  columnLayout: [
    {
      name: '대상자 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'EMP_NO', 'CMPNY_NM', 'BSNS_NM', 'DEPT_NM', 'GWA_NM', 'KOR_NM', 'JOB_TIT_NM', 'HLD_OFFI_GBN'],
      header: { text: t('대상자 정보') },
    },
    {
      name: '대상자 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'BIRTH_DAY', 'COM_ENT_DATE', 'RETI_DATE', 'WORK_YEAR', 'UNT_DUTY_NM' ],
      header: { text: t('대상자 정보') },
    },
    { 
      name: '신청 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'APPLI_GUBUN_NM', 'APPLI_DATE', 'DIAGNOSIS_DATE', 'CMPNY_RCPT_DATE', 'HOSPITAL_NM', 'BODY1_NM', 'BODY2_NM', 'DISEASE_NM', 'EXPIRATION_DATE', 'WORK_EVALNM', 'NOTIFY_DATE', 'IND_MANAGE' ],
      header: { text: t('신청 정보') },
    },
    {
      name: '자료 제출',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 
        {
          name: '현업부서',
          styleName: 'multiline-editor-pre',
          direction: 'horizontal',
          items: [ 'WORK_STANDARD_NM', 'WRITE', 'APPROVAL_DATE' ],
          header: { text: t('현업부서') },
        },
        'HR_DEPT',
        'FINAL_DATE' 
      ],
      header: { text: t('자료 제출') },
    }
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(isAdmin.value == 0) {
    return Message.warn(t('권한이 없습니다.'))
  }

  if (btn.id === 'btnSearch') {
    // 조회
    getData()
  } else if (btn.id === 'btnCreate') {
    // 추가
    if(isAdmin.value != 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    hltjb0010Popup01.value.openPopup()
  } else if (btn.id === 'btnDelete') { 
    // 삭제
    if(isAdmin.value != 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    for (let rowIdx of checkRow) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      if(!isEmpty(data.NOTIFY_DATE)) {
        return Message.warn(t('사실통지가 된 건에 대해서는 삭제가 불가능 합니다.'))
      }
    }

    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnReqApply') {
    // 결재상신
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let rowList = []
    let bodyList = []

    // 같은 사건을 하나로 뭉치는 작업
    for (let rowIdx of checkRow) {
      let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      dt.ROW_INDEX = rowIdx
      let sameList = rowList.filter(item => item.CMPNY_DIV == dt.CMPNY_DIV && 
        item.EMP_NO == dt.EMP_NO && 
        dayjs(item.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') &&
        item.HOSPITAL_CODE == dt.HOSPITAL_CODE && 
        item.HOSPITAL_NM == dt.HOSPITAL_NM)
      if(isEmpty(sameList)) {
        dt.BODY_LIST = []
        dt.BODY_LIST.push(dt.BODY1_NM)
        rowList.push(dt)
      }else{
        sameList[0].BODY_LIST.push(dt.BODY1_NM)
      }
    }

    // 체크 여부 확인
    if(isEmpty(checkRow)) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    }

    // 사실통지 확인
    let notify_item = rowList.filter(item => isEmpty(item.NOTIFY_DATE))
    if(!isEmpty(notify_item)) {
      // 결재된 항목 포커싱
      let gridView = grdMain.value.getGridView()
      gridView.setCurrent({
        itemIndex: notify_item[0].ROW_INDEX,
        column: 'NOTIFY_DATE'
      })
      return Message.warn(t('사실통지가 되지 않은 항목이 있습니다.'))
    }

    // 표준작업 업로드 확인
    let work_standard_item = rowList.filter(item => isEmpty(item.WORK_STANDARD_NM.trim()))
    if(!isEmpty(work_standard_item)) {
      // 결재된 항목 포커싱
      let gridView = grdMain.value.getGridView()
      gridView.setCurrent({
        itemIndex: work_standard_item[0].ROW_INDEX,
        column: 'WORK_STANDARD_NM'
      })
      return Message.warn(t('표준작업을 등록하지 않은 항목이 있습니다.'))
    }

    // 현업부서 자료 확인
    let dept_write_item = rowList.filter(item => item.WRITE != 'Y')
    if(!isEmpty(dept_write_item)) {
      // 결재된 항목 포커싱
      let gridView = grdMain.value.getGridView()
      gridView.setCurrent({
        itemIndex: dept_write_item[0].ROW_INDEX,
        column: 'WRITE'
      })
      return Message.warn(t('현업부서 자료를 등록하지 않은 항목이 있습니다.'))
    }

    // 체크된 데이터 중 결재완료 상태인거 확인
    let approval_item = rowList.filter(item => item.APPROVAL_STATUS === 'Y')
    if(!isEmpty(approval_item)) {
      // 결재된 항목 포커싱
      let gridView = grdMain.value.getGridView()
      gridView.setCurrent({
        itemIndex: approval_item[0].ROW_INDEX,
        column: 'APPROVAL_DATE'
      })
      return Message.warn(t('이미 결재가 완료된 항목이 있습니다.'))
    }
    let dateTime = dayjs().format('YYYYMMDDHHmmss')

    approvalPopup.value.openPopup({
      CLSS_ID: 'HLTJB0010',
      TITLE: '업무상질병(산재) 부서 의견 제출',
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
      rowList[0].CMPNY_DIV +
        ';' +
        rowList[0].EMP_NO +
        ';' +
        dayjs(rowList[0].DIAGNOSIS_DATE).format('YYYYMMDD') +
        ';' +
        rowList[0].HOSPITAL_CODE +
        ';' +
        dateTime,
      REPORT: approvalHtml(rowList), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE: 'CLR_15', //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
  } else if (btn.id === 'btnNoticeFact') {
    if(isAdmin.value != 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    // 사실통지
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let rowList = []
    let diseaseList = []

    for (let rowIdx of checkRow) {
      let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      let sameList = rowList.filter(item => item.CMPNY_DIV == dt.CMPNY_DIV && 
        item.EMP_NO == dt.EMP_NO && 
        dayjs(item.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') &&
        item.HOSPITAL_CODE == dt.HOSPITAL_CODE && 
        item.HOSPITAL_NM == dt.HOSPITAL_NM)
      if(isEmpty(sameList)) {
        rowList.push(dt)
      } 
      diseaseList.push(dt.DISEASE_NM)
    }

    if(isEmpty(rowList)) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    } else if(rowList.length > 1) {
      return Message.warn(t('한개의 데이터만 클릭하셔야 합니다.'))
    } else if(dayjs().diff(dayjs(rowList[0].NOTIFY_DATE), 'month') < 1) {
      return Message.warn(t('이미 사실통지가 된 건입니다.'))
    } else if(!isEmpty(rowList[0].FINAL_DATE)) {
      return Message.warn(t('이미 최종제출이 완료되었습니다.'))
    }

    rowList[0].DISEASE_NM = [...new Set(diseaseList)].join(", ")

    hltjb0010Popup02.value.openPopup(rowList[0])
  } else if (btn.id === 'btnFinalSubmit') {
    if(isAdmin.value != 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    // 최종제출
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let rowList = []

    for (let rowIdx of checkRow) {
      let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      let sameList = rowList.filter(item => item.CMPNY_DIV == dt.CMPNY_DIV && 
        item.EMP_NO == dt.EMP_NO && 
        dayjs(item.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') &&
        item.HOSPITAL_CODE == dt.HOSPITAL_CODE && 
        item.HOSPITAL_NM == dt.HOSPITAL_NM)
      if(isEmpty(sameList)) {
        rowList.push(dt)
      }  
    }
    if (isEmpty(rowList)) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    } else if (rowList.length > 1) {
      return Message.warn(t('한개의 데이터만 클릭하셔야 합니다.'))
    } 

    hltjb0010Popup05.value.openPopup(rowList[0])
  } 
}

// 그리드 데이터 조회
const getData = () => {
  if(isAdmin.value == 0) {
    return Message.warn(t('권한이 없습니다.'))
  }

  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DIAGNOSIS_DATE_FROM = searchParams.TMP_DIAGNOSIS_DATE_FROM.replaceAll('-','')
  searchParams.DIAGNOSIS_DATE_TO = searchParams.TMP_DIAGNOSIS_DATE_TO.replaceAll('-','')
  return commonSearchApi({ queryId: 'HLTJB0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[업무상질병 신청 관리] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}


const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTJB0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//팝업 선택 이벤트
const onEmpSelected = val => {
  searchParams.EMP_NO = val.EMP_NO
  searchParams.EMP_NM = val.EMP_NM
  onButtonsClick({ id: 'btnSearch'})
}

const openEmpPopup = () => {
  if(isAdmin.value != 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }
  empPopup.value.openPopup({MENU_ID: 'HLTJB0010', USER_DIV: 'A', FLAG: 'Y', readonly: true});
}

const clearEmp = () => {
  if(isAdmin.value != 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }
  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
  onButtonsClick({ id: 'btnSearch'})
}

const onCellItemClicked = (grid, index, col) => {
  // 관리자 아닐 시 return
  if(isAdmin.value < 1) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }
  
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if(col.target.className === 'v-btn' && col.column === 'WORK_STANDARD_NM'){
    if(data.BSNS_CD === 'AE00' || data.BSNS_NM === '특수선사업부') {
      return
    }
    selectedRow.value = index.dataRow
    hltjb0010Popup04.value.openPopup(data)
  } else if (col.target.className === 'v-btn' && col.column === 'WRITE') {
    selectedRow.value = index.dataRow
    selectedCol.value = col.column
    hltjb0010Popup03.value.openPopup(data, 'dept')
  } else if (col.target.className === 'v-btn' && col.column === 'HR_DEPT') {
    selectedRow.value = index.dataRow
    selectedCol.value = col.column
    hltjb0010Popup03.value.openPopup(data, 'hr')
  }
}

// 체크박스 클릭
const onItemChecked = (grid, itemIndex, checked) => {
  let data = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getDataRow(itemIndex))
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(i == grdMain.value.getGridView().getDataRow(itemIndex)) {
      continue
    }
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getGridView().checkRow(i, checked, false, false)
    }
  }
}

// 작업표준 등록 시
const onSelectStandard = row => {
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
  let updatedData = row.map(obj => ({...obj, CMPNY_DIV: data.CMPNY_DIV, EMP_NO: data.EMP_NO, DIAGNOSIS_DATE: data.DIAGNOSIS_DATE, HOSPITAL_CODE: data.HOSPITAL_CODE, HOSPITAL_NM: data.HOSPITAL_NM }))
  commonExecuteApi({ queryId : 'HLTJB0010_DELETE_03', list: [data] }).then(res => {
    commonExecuteApi({ queryId : 'HLTJB0010_SAVE_05', list: updatedData }).then(res => {
      Message.info(t('작업표준을 저장하였습니다.'))
      
      // 같은 사건은 모두 다같이 업데이트
      for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
        let dt = grdMain.value.getDataProvider().getJsonRow(i)
        if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
          grdMain.value.getDataProvider().setValue(i, 'WORK_STANDARD_NM', row.map(obj => obj.WORK_STANDARD_NM).join(', <br>'))
          grdMain.value.getDataProvider().setValue(i, 'WORK_STANDARD_ID', row.map(obj => obj.WORK_STANDARD_ID).join('||'))
        }
      }
    })
  })
}

// 자료등록, 인사부서 모든 파일 업로드 시
const allRegister = () => {
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // 같은 사건은 모두 다같이 업데이트
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getDataProvider().setValue(i, selectedCol.value, 'Y')
    }
  }
}

// 자료등록, 인사부서 하나라도 삭제 시
const fileDelete = () => {
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // 같은 사건은 모두 다같이 업데이트
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getDataProvider().setValue(i, selectedCol.value, '')
    }
  }
}

// 해당 직원 정보 및 상병명 상세 보기
const onCellDblClicked = (grid, clickData) => { 
  if(isAdmin.value < 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  } 
  if(clickData.cellType !== 'data') return
  const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  // 결재상신 했을시 읽기 전용으로 보여주기
  // 2025.09.17 최종제출일때만 읽기전용으로
  if(!isEmpty(rowData.FINAL_DATE)) {
    rowData.ONLY_VIEW = true
  }

  hltjb0010Popup01.value.openPopup(rowData)
}

// 사실통지 후 사실통지일에 날짜 투입
const sendNotify = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(isEmpty(checkedRows)) {
    return 
  }
  // 같은 사건은 모두 다같이 업데이트
  for(let chk of checkedRows) {
    grdMain.value.getDataProvider().setValue(chk, 'NOTIFY_DATE', dayjs().format('YYYY-MM-DD'))
  }
}

// 최종제출 후 최종제출일에 날짜 투입
const sendFinal = (finalDate) => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(isEmpty(checkedRows)) {
    return 
  }
  // 같은 사건은 모두 다같이 업데이트
  for(let chk of checkedRows) {
    grdMain.value.getDataProvider().setValue(chk, 'FINAL_DATE', dayjs(finalDate).format('YYYY-MM-DD'))
  }
}

const approvalHtml = (data) => {
  let tableHtml = ``
  for(let item of data) {
    item.BODY1_NM = [...new Set(item.BODY_LIST)].join(", ")
    tableHtml += `
      <br>
      <table class="content-table mb-3">
        <tbody>
          <tr>
            <th class="title-text" rowspan=2>신청자 정보</th>
            <th class="title-text">사업부</th>
            <th class="title-text">부서</th>
            <th class="title-text">과</th>
            <th class="title-text">성명</th>
            <th class="title-text">직위</th>
            <th class="title-text">나이</th>
            <th class="title-text">진단일</th>
            <th class="title-text">진단명</th>
            <th class="title-text">신체부위</th>
            <th class="title-text">입사일</th>
            <th class="title-text">휴/퇴직일</th>
          </tr>
          <tr>
            <td>${item.BSNS_NM}</td>
            <td>${item.DEPT_NM}</td>
            <td>${item.GWA_NM}</td>
            <td>${item.KOR_NM}</td>
            <td>${item.JOB_TIT_NM}</td>
            <td>${item.AGE}</td>
            <td>${dayjs(item.DIAGNOSIS_DATE).format('YYYY-MM-DD')}</td>
            <td>${item.DISEASE_NM}</td>
            <td>${isEmpty(item.BODY1_NM) ? '' : item.BODY1_NM}</td>
            <td>${dayjs(item.COM_ENT_DATE).format('YYYY-MM-DD')}</td>
            <td>${isEmpty(item.RETI_DATE) ? '': dayjs(item.RETI_DATE).format('YYYY-MM-DD')}</td>
          </tr>
          <tr>
            <td rowspan=2 class="title-text"> 작업정보</td>
            <td colspan=2 class="title-text">인사상 직무</td>
            <td colspan=4 class="title-text">작업표준번호</td>
            <td colspan=5 class="title-text">작업표준명</td>
          </tr>
          <tr>
            <td colspan=2>${item.STD_DUTY_NM}</td>
            <td colspan=4>${isEmpty(item.WORK_STANDARD_ID) ? '' : item.WORK_STANDARD_ID.replaceAll('||', '<br>')}</td>
            <td colspan=5>${isEmpty(item.WORK_STANDARD_NM) ? '' : item.WORK_STANDARD_NM.replaceAll(',', '')}</td>
          </tr>
          <tr>
            <td rowspan=2 class="title-text">부서의견</td>
            <td colspan=2 class="title-text">인정여부</td>
            <td colspan=9 class="title-text">불인정 사유</td>
          </tr>
          <tr>
            <td>${item.WORK_EVAL == 'Y' ? '▣ 인정' : '인정'}</td>
            <td>${data.WORK_EVAL == 'Y' ? '불인정' : '▣ 불인정'}</td>
            <td colspan=9></td>
          </tr>
        </tbody>
      </table>
      <br>
    `
  }

  return  `<html xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
                  <head>
                    <meta http-equiv=Content-Type content="text/html; charset=ks_c_5601-1987">
                  <style >
                    .head-table {
                      display: flex;
                      justify-content: flex-end;
                      tr {
                        height: 30px;
                      }
                      td {
                        text-align: center;
                      }
                      .left-cell {
                        width: 60px;
                      }
                      .right-cell {
                        width: 80px;
                      }
                    }
                    .content-table {
                      width: 100%;
                      tr {
                        height: 40px;
                      }
                      td {
                        width: 200px;
                      }
                    }
                    
                    .title-text {
                      background: #dcdce9;
                      font-weight: bold;
                      text-align: center;
                    }                
                    .red {
                      color:red;
                    }
          </style>
        </head>
        
    <body link="#0563C1" vlink="#954F72">
      ${tableHtml}
      <div class="text-left">
        (신청인 소속/이름/직급)의 업무상질병(산재) 신청 관련하여<br>
        상기와 같이 근로복지공단에 자료를 제출하려고 하오니 검토 후 재가 바랍니다.
      <br>
        <div class="red">
        *관계 법령: 산업재해보상보험법 제 31조(자료제공의 요청), 제 117조(사업장 등에 대한 조사)
        </div>
      </div>
    </body>
    </html>` 
}

/* ------------ 결재 후 결재라인 가져오기 저장 ------------ */
const approvalClrLine = val => {
  let saveParams = []
  let checkRow = grdMain.value.getGridView().getCheckedRows(true)
  for(let rowIdx of checkRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
    data.APPROVAL_STATUS = 'B'
    data.APPROVAL_KEY = val.appkey
    saveParams.push(data)
  }

  commonExecuteApi
    ({ 
        queryId : 'HLTJB0010_SAVE_04'
      , list: saveParams
    }).then(res=>{
    })
}

// 회사구분 변경 이벤트
watch(() => searchParams.CMPNY_DIV, (newValue) => {
  searchParams.BSNS_CD = ''
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_BSNS', param: { CMPNY_DIV: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({BSNS_NM: '전체', BSNS_CD: ''})
  })
})

watch(() => searchParams.BSNS_CD, (newValue) => {
  searchParams.DEPT_CD = ''
  if(isEmpty(newValue)) {
    codeList.DEPT_CD = [
      {DEPT_NM: '전체', DEPT_CD: ''}
    ]
    return
  }
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

watch(() => searchParams.APPLI_GUBUN, (newValue, oldValue) => {
  getData()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete', 'btnNoticeFact', 'btnReqApply', 'btnFinalSubmit']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사구분')"
            label-width="50px"
            :items="codeList.COMPANY"
            item-value="COD"
            item-title="TXT" 
            width="200px"
            :readonly="isAdmin < 2"
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            label-width="50px"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM" 
            width="200px"
            :readonly="isAdmin < 2 || isEmpty(searchParams.CMPNY_DIV)"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="50px"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="200px"
            :readonly="isAdmin < 2 || isEmpty(searchParams.BSNS_CD)"
          />
          <i-input
              v-model="searchParams.EMP_NM"
              :label="$t('신청인')"
              label-width="50px"
              width="200px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
              :readonly="isAdmin < 2"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearEmp"
                />
              </template>
          </i-input>
          <i-select
            v-model="searchParams.APPLI_GUBUN"
            :label="$t('신청구분')"
            label-width="50px"
            :items="codeList.APPLI_GUBUN"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_FROM"
            label-width="50px"
            :label="$t('진단일')"
            type="date"
            width="200px"
            class="mr-2"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_TO"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
          />
          <v-checkbox
            v-model="searchParams.RETI_YN"
            :label="$t('퇴직포함')"
            true-value="Y" 
            false-value="N"
            class="mt-1"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onItemChecked="onItemChecked"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
    <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" :buttonList="buttonList" />
    <HLTJB0010Popup01 ref="hltjb0010Popup01" @after-search="getData"/>
    <HLTJB0010Popup02 ref="hltjb0010Popup02" @send-notify="sendNotify"/>
    <HLTJB0010Popup03 ref="hltjb0010Popup03" @all-register="allRegister" @delete="fileDelete"/>
    <HLTJB0010Popup04 ref="hltjb0010Popup04" @selected="onSelectStandard"/>
    <HLTJB0010Popup05 ref="hltjb0010Popup05" @send-final="sendFinal"/>
    <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalClrLine"/>
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