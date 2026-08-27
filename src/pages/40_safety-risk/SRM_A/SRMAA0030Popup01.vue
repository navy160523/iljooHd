<!-- 
  화면명   : 안전리스크 제보/관리
  화면개요 : 안전리스크 제보 및 관리자 검토 페이지
-->
<script setup>
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
  commonDeletFilesApi,
} from '@hiway/api/commonFileApi'
import { ref, reactive, onMounted, getCurrentInstance, watch, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import _ from 'lodash'

import SearchRiskPopup from '@/components/popup/SearchRiskPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import YardMapPopup from '@/components/popup/YardMapPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import WorkPopup from '@/components/popup/WorkPopup.vue'
import DiscriptRiskLevel from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup02.vue'
import SRMFA0010 from '@/pages/40_safety-risk/SRM_F/SRMFA0010.vue'
import CkEditor from '@/components/ckEditor/CKEditor.vue'
import CkEditor2 from '@/components/ckEditor/CKEditor.vue'
import SRMAA0030Popup01_pop01 from '@/pages/40_safety-risk/SRM_A/Popup/SRMAA0030Popup01_pop01.vue'
import SRMAA0030Popup01_pop02 from '@/pages/40_safety-risk/SRM_A/Popup/SRMAA0030Popup01_pop02.vue'
import SearchSafetyInstructPopup from '@/components/popup/SearchSafetyInstructPopup.vue'

// import LocationPopup from "@/components/popup/LocationPopup.vue"
import LocationPopup from '@/components/popup/CommonCodePopUpSAF.vue'

import OZReport from '@/components/OZReport.vue'

const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const router = useRouter()

const emit = defineEmits(['close', 'selected'])

defineOptions({
  name: '40_safety-risk-SRM_A-SRMAA0030Popup01',
})

/* *********** 안전리스크 제보 팝업시만 관리자영역 보임 *********** */
const props = defineProps({
  isAdminDiv: {
    Type: Boolean,
    default: false,
  },
  btnList: {
    Type: Array,
    default: ['btnDupSearch', 'btnTemporaryStorage', 'btnDelete', 'btnUpdate'],
  },
})

//TODO: 테스트
const riskReport = ref(null)

const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)

const fileInput = ref(null)
const fileInput2 = ref(null)

// 매뉴얼 보기버튼 보여지기
const showManuel = ref(true)
const carousel = ref(0)
const carousel2 = ref(0)

const isReadonly = ref(false)
const isReadonly2 = ref(false)
const isHiSafe = ref(false)

// TODO: 기존의 개선 담당 및 유관 부서 변경 시 부서장 메일 발송 기능 추가 요청(2024.07.04) - 관련된 Flag 변수
const isBeforeDeptCdImp = reactive({ COD: '', TXT: '' }) // 개선담당부서
const isBeforeDeptCdRel = reactive({ COD: '', TXT: '' }) // 개선유관부서

// 권한 (SRMAA001: 안전 관리자 그룹)
const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
// const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)

const isNewData = ref(false)
const reviewDisabled = ref(true)
const carouselIdx = ref(0)
const carouselIdx2 = ref(0)

// 그리드 썸네일 표시 구분 변수
const grdThumbnail = ref('')

const fileList = reactive({
  src: [],
  art: [],
  fileName: [],
  file: [],
  fileNo: [],
  fileId: [],
})
const fileList2 = reactive({
  src: [],
  art: [],
  fileName: [],
})

// 팝업
const yardMapPopup = ref(null)
const deptPopup = ref(null) // 부서
const deptPopupAdmin = ref(null) // 부서
const deptD_Popup = ref(null) // 개선담당부서
const deptU_Popup = ref(null) // 개선유관부서
const deptLisk = ref(null)
const deptLisk2 = ref(null)
const workPopup = ref(null)
const workPopup2 = ref(null)
const empPopup = ref(null)
const adminEmpPopup = ref(null)
const adminEmpPopup2 = ref(null)
const locationPopup = ref(null)
const ckEditor = ref(null)
const ckEditor2 = ref(null)
const searchRiskPopup = ref(null) // 중복제안
const discriptRiskLevel = ref(null) // 위험등급 설명
const saveParams = ref([])
const sRMFA0010 = ref(null) // 안전긴급예산 신청
const sRMAA0030Popup01_pop01 = ref(null)
const sRMAA0030Popup01_pop02 = ref(null)
const searchSafetyInstructPopup = ref(null) // 안전지침

const selectAll = ref('N')
const selectAllSago = ref('N')
const reviewRsult = ref(null)

let accCheck = ref(true)
let impCheck = ref(true)

const Imp = ref({})
const dummy = ref(null)

// TODO: 중복제안검색 확인 유무 FLAG (2024.06.18 이형운 책임 요청)
const chkSearchRisk = ref(false)

// 콤보박스 바인딩
const sysCodeList = reactive({
  HHIJJC11: [],
  HHIJJC04: [],
  HHIJJC13: [],
  RISKLIST: [],
  HHIJJE07: [],
  HHIJJE08: [],
  HHIJJA03: [],
  HHIJJA05: [],
  HHIJJC03: [],
  HHIJJE14: [],
})

const searchParams = reactive({
  TASK_SEQ: '',
  REG_DT: dayjs().format('YYYY-MM-DD'),
  // IMP_ST_DT: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  // IMP_FI_DT: dayjs().format("YYYY-MM-DD"),
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  TEL_NO: userStore.telNo,
  EMP_NO: userStore.empNo,
  EMP_NM: userStore.userName,
  CHECK_ACC: [],
  CHECK_ACC2: '',
  TYPE_IMP: [],
  TYPE_IMP2: '',
  // 부서
  DEPT_CD: userStore.deptCd,
  BSNS_CD: userStore.bsnsCd,
  INJR_DEPT_CD: userStore.asgnCd,
  DEPT_NM: userStore.deptNm,
  BSNS_NM: userStore.bsnsNm,

  RISK_NM: '',

  // 개선담당부서
  CMPNY_DIV_IMP: '',
  DEPT_CD_IMP: '',
  IMP_BSNS_NM: '',
  IMP_DEPT_NM: '',
  IMP_INJR_DEPT_CD: '',

  // 개선유관부서
  CMPNY_DIV_REL: '',
  DEPT_CD_REL: '',
  REL_BSNS_NM: '',
  REL_DEPT_NM: '',
  REL_INJR_DEPT_CD: '',

  //파일
  FILE_ID_1: null,
  TEMP: '',

  GRADE: '',
  PLACE: '', // 발생장소 코드
  PLACE_NM: '', // 발생장소명
  PLACE_MD_DIV: '', // 중구분 코드
  PLACE_MD_NM: '', // 중구분명
  PLACE_SM_DIV: '', // 소구분 코드
  PLACE_SM_NM: '', // 소구분명
  DETAIL_PLACE: '', // 세부장소
  THUMBNAIL_FILE_ID: '', // 썸네일
  CUR_PROB: '', // 문제개요

  /* ***** 관리자 ***** */
  MANAGE_DATE: dayjs().format('YYYY-MM-DD'), // 관리일자
  CMPNY_DIV_MNG: null, // 관리자 회사
  BSNS_CD_MNG: null, // 관리자 사업부
  BSNS_NM_MNG: null, // 관리자 사업부 이름
  DEPT_CD_MNG: null, // 관리자 부서
  DEPT_NM_MNG: null, // 관리자 부서 이름
  EMP_NO_MNG: null, // 관리자 사번
  EMP_NM_MNG: null, // 관리자 이름
  RISK_REVIEW_RESULT: null, // 진행상태
  DEPT_CD_IMP_2: null, // 진행상태 부서변경(부서코드)
  DEPT_NM_IMP_2: null, // 진행상태 부서변경(부서명)
  IMP_ST_DT: dayjs().format('YYYY-MM-DD'), // 개선 시작일
  IMP_FI_DT: dayjs().add(1, 'month').format('YYYY-MM-DD'), // 개선 종료일
  IMP_PLAN: null, // 개선 계획
  IMP_RESULT: null, // 개선 결과
  IMP_REMARK: null, // 개선 결과 비고
  FILE_ID_2: null,
  MIT_ACTION: null, // 개선실적
  WORK_STANDARD_ID: null, // 작업표준/위험성평가
  WORK_STANDARD_NM: null, // 작업표준/위험성평가
  RIVISION_STATUS: null, // 작업표준/위험성평가 상세
  TASK_NO_1: null,
  TASK_NO_4: null,
  TASK_NO_3: null,
  NOTICE_NO: null,
  NOTICE_TITLE: '',
  EXCELLENT: null,
  EXCELLENT_REMARK: null,

  // 안전긴급예산 신청여부
  CHK_BUDGET: '',

  // 임시저장 여부
  TEMP_YN: '',

  STATUS_NM: '',

  SET_DEPT: '',
  LATITUDE: null,
  LONGITUDE: null,

  HRZN_STATUS: '',
  HRZN_REVIEW_REQ: 'N',
  HRZN_SAFE_REMARK: '',
  HRZN_USER_ID: userStore.userId,

  CONTEST_DIFFICULTY: '',

  CMPNY_DIV_IMP_2: null,
  MANAGE_DATE2: dayjs().format('YYYY-MM-DD'),
  CMPNY_DIV_MNG2: null,
  BSNS_CD_MNG2: null,
  BSNS_NM_MNG2: null,
  DEPT_CD_MNG2: null,
  DEPT_NM_MNG2: null,
  EMP_NO_MNG2: null,
  EMP_NM_MNG2: null,
  REL_ST_DT: dayjs().format('YYYY-MM-DD'),
  REL_FI_DT: dayjs().add(1, 'month').format('YYYY-MM-DD'),
  RISK_REVIEW_RESULT2: 'J',
  CMPNY_DIV_REL_2: null,
  DEPT_CD_REL_2: null,
  DEPT_NM_REL_2: null,
  REL_PLAN: null,
  REL_RESULT: null,
  REL_REMARK: null,
  CMPNY_DIV_MNG_EMP: null,
  CMPNY_DIV_MNG2_EMP: null,
  RIVISION_STATUS2: null,
  WORK_STANDARD_ID2: null,
  WORK_STANDARD_NM2: null,
  MIT_ACTION2: null,
})

const searchParamsInit = _.cloneDeep(searchParams)

// OZ REPORT
const ozName = ref('')
const ozParams = ref([])
const showOz = ref(false)

const COORDINATE = computed(() => {
  const latitude = searchParams.LATITUDE === null ? '' : searchParams.LATITUDE
  const longitude = searchParams.LONGITUDE === null ? '' : searchParams.LONGITUDE

  return `${latitude}, ${longitude}`
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD: [],
  excellentList: [
    { COD: 'A', TXT: '최우수' },
    { COD: 'B', TXT: '우수' },
    { COD: 'C', TXT: '장려' },
    { COD: 'D', TXT: '이벤트' },
  ],
  RIVISION_STATUS: [
    { COD: 'A', TXT: '개정필요' },
    { COD: 'B', TXT: '개정 불필요' },
    { COD: 'C', TXT: '개정 중' },
    { COD: 'D', TXT: '개정완료' },
  ],
})

const editorOptions = reactive({
  components: {
    CkEditor,
  },
  editorOptions: {
    id: 'test-ck-editor',
    data: '',
    lang: 'ko',
  },
})

const editorOptions2 = reactive({
  components: {
    CkEditor2,
  },
  editorOptions: {
    id: 'test-ck-editor2',
    data: '',
    lang: 'ko',
  },
})

/* **************************************** 제보자 자료첨부 그리드 ***************************************** */
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
    {
      fieldName: 'OPINION_CMPNY',
      dataType: 'text',
      header: { text: t('파일명'), styleName: 'header_color' },
      renderer: {
        type: 'html',
        callback: function (grid, model, width, height) {
          let ret = ''

          if (model.value === grdThumbnail.value) {
            ret = `<div style='width: 100%;'>
                      <div style='width: 100%; display: flex;'>
                        <div class='ml-6'>
                          <span style='width: 50%; text-align: center;' class='text-red font-weight-bold'>(썸네일)</span>
                        </div>
                        <div style='width: 50%;'>
                          <p>${model.value}</p>
                        </div>
                      </div>
                    </div>
                  `
          } else {
            ret = model.value
          }

          return ret
        },
      },
    },

    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
    { fieldName: 'FILE_PATH', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'FILE_TYPE', dataType: 'text', visible: false },
    { fieldName: 'FILE_SIZE', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE', dataType: 'text', visible: false },
    { fieldName: 'THUMBNAIL_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields

/* **************************************** 관리자 자료첨부 그리드 ***************************************** */
const grdSubProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
    {
      fieldName: 'OPINION_CMPNY',
      dataType: 'text',
      header: { text: t('파일명'), styleName: 'header_color' },
      renderer: {
        type: 'html',
        callback: function (grid, model, width, height) {
          let ret = ''

          if (model.value === grdThumbnail.value) {
            ret = `<div style='width: 100%;'>
                      <div style='width: 100%; display: flex;'>
                        <div class='ml-6'>
                          <span style='width: 50%; text-align: center;' class='text-red font-weight-bold'>(썸네일)</span>
                        </div>
                        <div style='width: 50%;'>
                          <p>${model.value}</p>
                        </div>
                      </div>
                    </div>
                  `
          } else {
            ret = model.value
          }

          return ret
        },
      },
    },

    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
    { fieldName: 'FILE_PATH', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'FILE_TYPE', dataType: 'text', visible: false },
    { fieldName: 'FILE_SIZE', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE', dataType: 'text', visible: false },
    { fieldName: 'THUMBNAIL_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdSubProps.columns = grdSubProps.fields

// 리스크 제보 버튼 클릭 이벤트
const onRegistButtonsClick = (btn) => {
  if (btn.id === 'btnTemporaryStorage') {
    // 임시저장
    searchParams.TEMP_YN = 'Y' // 임시저장 여부
    save()
  } else if (btn.id === 'btnUpdate') {
    // 저장
    searchParams.TEMP_YN = 'N' // 임시저장 여부
    save()
  } else if (btn.id === 'btnDupSearch') {
    openPopup('dup')
  } else if (btn.id === 'btnClose') {
    // dialog.value = false
    showManuel.value = true
    emit('close', false)
  } else if (btn.id === 'btnDelete') {
    vm.$swal({
      title: t('삭제 하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId: 'SRMAA0030_DELETE_01',
          list: [{ TASK_SEQ: searchParams.TASK_SEQ }],
        })
          .then((res) => {
            if (res.result.status === '200') {
              Message.success(t('삭제 되었습니다.'))
              emit('selected', res.list[0])
            }
          })
          .catch((err) => {
            return Message.err(err)
          })
      }
    })
  } else if(btn.id === 'btnPrint') {
    ozReport()
  }
}

const ozReport = () => {
  ozName.value = '/manage/hse/SRMAA0030.ozr'
  ozParams.value = [
    'IN_TASK_SEQ=' + searchParams.TASK_SEQ,
  ]

  showOz.value = true
}

// 리스크 관리 버튼 클릭 이벤트
const onManageButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    save()
  }
}

// 안전 리스크 공모전 관리 버튼 클릭 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    save()
  }
}

// 사진 및 자료 첨부 버튼 클릭 이벤트
const onImgButtonsClick = (btn) => {
  if (btn.id === 'btnThumbnail') {
    if (isNewData.value) {
      return Message.warn(
        t('신규 등록시 썸네일은 데이터 저장후 변경 해주세요.')
      )
    }
    thumbnail('main')
  } else if (btn.id === 'btnDownLoad') {
    downLoad('1')
  } else if (btn.id === 'btnCreate') {
    fileInput.value.click()
  }
}

const thumbnail = async (grdType) => {
  let chekedRow = []

  if (grdType === 'main') {
    chekedRow = await grdMain.value.getGridView().getCheckedRows()
  } else {
    chekedRow = await grdSub.value.getGridView().getCheckedRows()
  }

  if (chekedRow.length === 0) {
    return Message.warn(t('선택한 데이터가 없습니다.'))
  } else if (chekedRow.length > 1) {
    return Message.warn(t('썸네일 이미지는 한장만 선택 가능합니다.'))
  }

  let result = await vm.$swal({
    title: t('썸네일을 등록 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    chekedRow.forEach(async (e) => {
      let data = {}

      if (grdType === 'main') {
        data = grdMain.value.getDataProvider().getJsonRow(e)
      } else {
        data = grdSub.value.getDataProvider().getJsonRow(e)
      }

      data.USER_ID = userStore.userId
      data.THUMBNAIL_FILE_ID = searchParams.THUMBNAIL_FILE_ID
        ? searchParams.THUMBNAIL_FILE_ID
        : create_UUID()

      const lFileType = ['gif', 'jpeg', 'jpg', 'png']

      if (lFileType.includes(data.FILE_TYPE) === false) {
        Message.warn(t('썸네일은 이미지만 등록 가능합니다.'))
        return
      }
      /*
      if(data.FILE_TYPE !== 'gif' && data.FILE_TYPE !== 'jpeg' && data.FILE_TYPE !== 'png'){
        Message.warn(t('썸네일은 이미지만 등록 가능합니다.'))
        return 
      }*/

      commonExecuteApi({
        queryId: 'SRMAA0040_FILE_SAVE_01',
        list: [data],
      })
        .then((res) => {
          // 썸네일 구분
          commonSearchApi({
            queryId: 'searchFile',
            param: {
              CMPNY_DIV: res.list[0].CMPNY_DIV,
              FILE_ID: res.list[0].THUMBNAIL_FILE_ID,
            },
          }).then(async (res2) => {
            // 구분자 지정
            grdThumbnail.value = res2.ORESULT_CUR.length > 0 ? res2.ORESULT_CUR[0].FILE_TITLE : ''
          })
          Message.success(t('썸네일이 등록 되었습니다.'))
        })
        .catch((err) => {
          return Message.err(err)
        })
        .finally(() => {
          fileSet()
          fileSet2()
        })
    })
  }
}

/* ************ 관리자 자료첨부 버튼 ************ */
const onImgButtonsClick2 = (btn) => {
  if (btn.id === 'btnCreate') {
    fileInput2.value.click()
  } else if (btn.id === 'btnDownLoad') {
    downLoad('2')
  } else if (btn.id === 'btnThumbnail') {
    thumbnail('sub')
  } else {
    deleteData2()
  }
}

const beforeDelete = async () => {
  let result = false
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  } else {
    chekedRow.forEach(async (e) => {
      let data = await grdMain.value.getDataProvider().getJsonRow(e)
      saveParams.value.push(data)
    })
    result = true
  }

  return result
}

const deleteData = () => {
  // return commonDeletFilesApi(saveParams.value)
  let deleteParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.CMPNY_DIV = searchParams.CMPNY_DIV

    deleteParams.push(data)
  }

  vm.$swal({
    title: t('삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      // 썸네일 등록 확인 및 삭제 기능 추가
      deleteParams.forEach((item) => {
        // item.THUMBNAIL_FILE_ID = null
        item.THUMBNAIL_FILE_ID = searchParams.THUMBNAIL_FILE_ID
      })
      commonExecuteApi({
        queryId: 'SRMAA0040_CHECK_01',
        list: deleteParams,
      }).then(async (res) => {
        // 썸네일 등록 이미지면 썸네일도 같이 삭제
        await res.list.forEach(async (item) => {
          if (item.IS_THUMBNAIL === '1') {
            let result = await vm.$swal({
              title: t(
                '[ ' +
                  item.FILE_NAME +
                  ' ] 는 썸네일로 등록 되어 있습니다. 삭제 하시겠습니까?'
              ),
              showCancelButton: true,
            })
            if (result.isConfirmed) {
              let params = [
                {
                  CMPNY_DIV: item.CMPNY_DIV,
                  FILE_ID: item.FILE_ID,
                  FILE_NO: item.FILE_NO,
                },
                {
                  CMPNY_DIV: item.CMPNY_DIV,
                  FILE_ID: item.THUMBNAIL_FILE_ID,
                  FILE_NO: '1',
                },
              ]
              commonDeletFilesApi(params).then(() => {
                Message.success(t('삭제 되었습니다.'))
                fileSet()
              })
            }
          } else {
            let params = [
              {
                CMPNY_DIV: item.CMPNY_DIV,
                FILE_ID: item.FILE_ID,
                FILE_NO: item.FILE_NO,
              },
            ]
            // 썸네일 등록 이미지 아니면 이미지만 삭제
            commonDeletFilesApi(params).then((res) => {
              Message.success(t('삭제 되었습니다.'))
            })
          }
        })
        fileSet()
      })
    }
  })
}

const beforeDelete2 = async () => {
  let result = false
  saveParams.value = []
  let chekedRow = await grdSub.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  } else {
    chekedRow.forEach(async (e) => {
      let data = await grdSub.value.getDataProvider().getJsonRow(e)
      saveParams.value.push(data)
    })
    result = true
  }

  return result
}

const deleteData2 = () => {
  let deleteParams = []

  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    data.CMPNY_DIV = searchParams.CMPNY_DIV

    deleteParams.push(data)
  }

  vm.$swal({
    title: t('삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      // 썸네일 등록 확인 및 삭제 기능 추가
      deleteParams.forEach((item) => {
        // item.THUMBNAIL_FILE_ID = null
        item.THUMBNAIL_FILE_ID = searchParams.THUMBNAIL_FILE_ID
      })
      commonExecuteApi({
        queryId: 'SRMAA0040_CHECK_01',
        list: deleteParams,
      }).then(async (res) => {
        // 썸네일 등록 이미지면 썸네일도 같이 삭제
        await res.list.forEach(async (item) => {
          if (item.IS_THUMBNAIL === '1') {
            let result = await vm.$swal({
              title: t(
                '[ ' +
                  item.FILE_NAME +
                  ' ] 는 썸네일로 등록 되어 있습니다. 삭제 하시겠습니까?'
              ),
              showCancelButton: true,
            })
            if (result.isConfirmed) {
              let params = [
                {
                  CMPNY_DIV: item.CMPNY_DIV,
                  FILE_ID: item.FILE_ID,
                  FILE_NO: item.FILE_NO,
                },
                {
                  CMPNY_DIV: item.CMPNY_DIV,
                  FILE_ID: item.THUMBNAIL_FILE_ID,
                  FILE_NO: '1',
                },
              ]
              commonDeletFilesApi(params).then(() => {
                Message.success(t('삭제 되었습니다.'))
                fileSet2()
              })
            }
          } else {
            let params = [
              {
                CMPNY_DIV: item.CMPNY_DIV,
                FILE_ID: item.FILE_ID,
                FILE_NO: item.FILE_NO,
              },
            ]
            // 썸네일 등록 이미지 아니면 이미지만 삭제
            commonDeletFilesApi(params).then((res) => {
              Message.success(t('삭제 되었습니다.'))
            })
          }
        })
        fileSet2()
      })
    }
  })
}

/* ****************** 저장전 필수입력 체크 ********************* */
const save = async () => {
  /* ********** 문제 개요 html로 변환 ********** */
  // searchParams.CUR_PROB = ckEditor.value.getContent()
  // searchParams.MIT_ACTION = ckEditor2.value.getContent()

  if (isReadonly && !isAdmin.value && searchParams.RISK_REVIEW_RESULT) {
    return Message.warn(t('이미 개선 진행중입니다.'))
  }

  if (!searchParams.DEPT_NM) {
    return Message.warn(t('부서는 필수 선택입니다.'))
  } else if (!searchParams.EMP_NM) {
    return Message.warn(t('제보자를 정확히 입력 하세요.'))
  } else if (!searchParams.RISK_NM) {
    return Message.warn(t('제목을 정확히 입력 하세요.'))
  } else if (!searchParams.IMP_DEPT_NM) {
    return Message.warn(t('개선담당부서는 필수 선택입니다.'))
  } else if (!searchParams.REL_DEPT_NM) {
    return Message.warn(t('개선유관부서는 필수 선택입니다.'))
  } else if (searchParams.CHECK_ACC.length < 1) {
    return Message.warn(t('사고유형은 필수 선택입니다.'))
  } else if (searchParams.TYPE_IMP.length < 1) {
    return Message.warn(t('개선유형은 필수 선택입니다.'))
  } else if (!searchParams.CUR_PROB) {
    return Message.warn(t('문제 개요를 정확히 입력 하세요.'))
  } else if (!searchParams.PLACE_NM) {
    return Message.warn(t('발생장소를 정확히 입력 하세요.'))
  } else if (!searchParams.GRADE) {
    return Message.warn(t('위험등급은 필수 선택입니다.'))
  }

  if (searchParams.CHECK_ACC.includes('200') && !searchParams.CHECK_ACC2) {
    return Message.warn(t('사고유형(서술)을 입력해주세요.'))
  }
  if (searchParams.TYPE_IMP.includes('080') && !searchParams.TYPE_IMP2) {
    return Message.warn(t('개선유형(서술)을 입력해주세요.'))
  }

  /* ************ 테스트후 주석제거 *************** */
  if (isAdmin.value && !isNewData.value) {
    if (!searchParams.IMP_ST_DT) {
      return Message.warn(t('개선시작일은 필수 입력 입니다.'))
    } else if (!searchParams.IMP_FI_DT) {
      return Message.warn(t('개선종료일은 필수 입력 입니다.'))
    } else if (!searchParams.RISK_REVIEW_RESULT) {
      return Message.warn(t('진행상태은 필수 입력 입니다.'))
    } else if (!searchParams.IMP_PLAN) {
      return Message.warn(t('개선 계획은 필수 입력 입니다.'))
    } else if (!searchParams.MIT_ACTION) {
      return Message.warn(t('개선실적은 필수 입력 입니다.'))
    }
  }

  let result = await vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let checkAcc = ''
    let typeImp = ''

    if (searchParams.CHECK_ACC.length > 1) {
      checkAcc = searchParams.CHECK_ACC.map((element) =>
        JSON.stringify(element).replace(/"/g, '')
      ).join(',')
    } else if (searchParams.CHECK_ACC.length == 1) {
      checkAcc = searchParams.CHECK_ACC[0]
    } else {
      checkAcc = ''
    }

    searchParams.THUMBNAIL_FILE_ID = searchParams.THUMBNAIL_FILE_ID
      ? searchParams.THUMBNAIL_FILE_ID
      : create_UUID()

    if (searchParams.TYPE_IMP.length > 1) {
      typeImp = searchParams.TYPE_IMP.map((element) =>
        JSON.stringify(element).replace(/"/g, '')
      ).join(',')
    } else if (searchParams.TYPE_IMP.length == 1) {
      typeImp = searchParams.TYPE_IMP[0]
    } else {
      typeImp = ''
    }
    let params = [{}]

    for (let i in searchParams) {
      if (
        i === 'IMP_ST_DT' ||
        i === 'IMP_FI_DT' ||
        i === 'MANAGE_DATE' ||
        i === 'REL_ST_DT' ||
        i === 'REL_FI_DT' ||
        i === 'MANAGE_DATE2'
      ) {
        params[0][i] = searchParams[i]
          ? dayjs(searchParams[i]).format('YYYYMMDD')
          : ''
      } else if (i === 'CHECK_ACC') {
        params[0][i] = checkAcc
      } else if (i === 'TYPE_IMP') {
        params[0][i] = typeImp
      } else {
        params[0][i] = searchParams[i]
        params[0].USER_ID = userStore.userId
      }
    }

    // 메일 파라미터
    let mailParams = {
      EMAIL: [],
      SUBJECT: '',
      CONTENT: ``
    }

    commonSearchApi({
      queryId: 'SRMAA0040_SEARCH_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }).then((res) => {
      res.ORESULT_CUR.forEach((item) => {
        mailParams.EMAIL.push(item.EMP_NO)
      })
    })

    commonExecuteApi({
      queryId: 'SRMAA0040_SAVE_01',
      list: params,
    }).then((res) => {
      searchParams.TASK_SEQ = res.list[0].OUT_RES_KEY

      /* Y면 신규 메일발송, N 임시저장 */
      if (res.list[0].OUT_RES_COD2 === 'Y') {
        /* 개선담당부서 또는 개선유관부서가 안전경영부(N090)이면 메일 발송 */
        if (
          res.list[0].DEPT_CD_IMP === 'N090' ||
          res.list[0].DEPT_CD_REL === 'N090'
        ) {
          mailParams.SUBJECT = '[알림] 안전리스크 제보 작성 완료'
          mailParams.CONTENT = `
            <div style="text-align: center;">
              <div>
                <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전리스크 제보</span>
                <br/>
                <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Risk Management”</span>
                <br/><br/>
                <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">안전RISK 접수 완료</span>
              </div>
              <div style="margin-top: 12px;">
                <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td height="3" bgcolor="#76FF03"></td>
                  </tr>
                </table>
              </div>
              <div>
                <img 
                  width="308"
                  height="446" 
                  src="https://hises.hd.com/HiSEsFiles/hiro/04.gif"
                  alt="Safety Image"
                />
              </div>
              <div> 
                <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
                  귀하의 "${res.list[0].RISK_NM}" 안전RISK 건이 아래 내용과 같이 등록되었습니다.<br/>
                  <br/>안전RISK 등록번호: ${res.list[0].OUT_RES_KEY}
                  <br/>개선담당부서: ${res.list[0].IMP_DEPT_NM}(${res.list[0].DEPT_CD_IMP})
                  <br/>개선유관부서: ${res.list[0].REL_DEPT_NM}(${res.list[0].DEPT_CD_REL})
                  <br/>
                  <br/>
                  귀하의 안전사고 예방 노력에 깊이 감사 드립니다.
                </span>
              </div>
              <div style="margin-top: 16px;">
                <img 
                  width="180" 
                  height="50" 
                  src="https://hises.hd.com/HiSEsFiles/ci/HHI_color_ko.png"
                  alt="HHI Logo"
                />
                <img 
                  width="180" 
                  height="50" 
                  src="https://hises.hd.com/HiSEsFiles/ci/SRM.png"
                  alt="SRM Logo"
                />
              </div>
            </div>
          `
          if (hostname === 'hises.hd.com') {
            commonSendApi(mailParams)
          }
        }
      }

      if (!isNewData.value) {
        if (isBeforeDeptCdImp.COD !== searchParams.DEPT_CD_IMP || isBeforeDeptCdRel.COD !== searchParams.DEPT_CD_REL) {
          // chgDeptSendMail()
        }
      }

      Message.success(t('저장 되었습니다.'))

      if (!props.isAdminDiv && res.list[0].OUT_RES_COD2 === 'Y') {
        commonStore.loading = true
        searchParams.TASK_SEQ = ''
        router.push('/40_safety-risk/SRM_A/SRMAA0030')
      }

      // HI_SAFE로 신규 저장시 실행
      if (res.list[0].RISK_REVIEW_RESULT === 'E' && !res.list[0].TASK_NO_1) {
        sRMAA0030Popup01_pop01.value.openPopup()
      } else if (
        res.list[0].RISK_REVIEW_RESULT === 'F' &&
        !res.list[0].TASK_NO_4
      ) {
        // SOM으로 신규 저장시 실행
        sRMAA0030Popup01_pop02.value.openPopup()
        let params = {
          EMAIL: ['hhi_srm@hd.com'], // srm 추진과
          SUBJECT: '[안전 아이디어 장터] 공모주제 제출 완료',
          CONTENT: `
          <div style="text-align: center;">
            <div>
              <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전 아이디어장터</span>
              <br/>
              <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Open Market”</span>
              <br/><br/>
              <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">공모주제 제출 완료</span>
            </div>
            <div style="margin-top: 12px;">
              <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td height="3" bgcolor="#76FF03"></td>
                </tr>
              </table>
            </div>
            <div>
              <img 
                width="308"
                height="446" 
                src="https://hises.hd.com/HiSEsFiles/hiro/04.gif"
                alt="Safety Image"
              />
            </div>
            <div>
              <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
                귀하의 <b>안전 아이디어 장터 공모주제 제안</b>이 제출되었습니다!<br/>
                추진과 담당자 검토 후, 결과 회신 예정입니다.<br/>
                제출하신 공모주제는 <b><u>위험성</u></b>, <b><u>안전개선 실효성</u></b>, <b><u>아이디어 제안자의 적극성</u></b>, <b><u>독창성</u></b> 기준으로 검토됩니다.<br/>
                안전에 대한 귀하의 관심에 깊이 감사드립니다.<br/>
                <br/>
                ${dayjs().format('YYYY')}년 ${dayjs().format('MM')}월 ${dayjs().format('DD')}일<br/>
                안전 아이디어 장터 담당자 안전경영부 김승환 매니저 (2-1389)
              </span>
            </div>
            <div style="margin-top: 16px;">
              <img 
                width="180" 
                height="50" 
                src="https://hises.hd.com/HiSEsFiles/ci/HHI_color_ko.png"
                alt="HHI Logo"
              />
              <img 
                width="180" 
                height="50" 
                src="https://hises.hd.com/HiSEsFiles/ci/SRM.png"
                alt="SRM Logo"
              />
            </div>
          </div>
          `,
        }

        if (hostname === 'hises.hd.com') {
          commonSendApi(params)
        }
      }

      if (props.isAdminDiv && res.list[0].TASK_SEQ) {
        popupOpen({
          CMPNY_DIV: res.list[0].CMPNY_DIV,
          TASK_SEQ: res.list[0].TASK_SEQ,
        })
      }

      commonStore.loading = false
    })
  }
}

// TODO: 개선담당 및 유관 부서 변경 시 관련 부서장 메일 발송(2024.07.04)
const chgDeptSendMail = async () => {
  let mailParams = {
    SUBJECT: '안전RISK 담당·유관부서 변경',
    CONTENT: `
      <div style="text-align: center;">
        <div>
          <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전리스크 제보</span>
          <br/>
          <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Risk Management”</span>
          <br/><br/>
          <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">안전RISK 담당·유관부서 변경</span>
        </div>
        <div style="margin-top: 12px;">
          <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td height="3" bgcolor="#76FF03"></td>
            </tr>
          </table>
        </div>
        <div>
          <img 
            width="308"
            height="446" 
            src="https://hises.hd.com/HiSEsFiles/hiro/04.gif"
            alt="Safety Image"
          />
        </div>
        <div>
          <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
            귀하의 ${searchParams.TASK_SEQ} 안전RISK 건의 담당·유관부서가 변경되었습니다.<br/>
            <br/>${isBeforeDeptCdImp.TXT}(${isBeforeDeptCdImp.COD}) → ${searchParams.IMP_DEPT_NM}(${searchParams.DEPT_CD_IMP})
            <br/>${isBeforeDeptCdRel.TXT}(${isBeforeDeptCdRel.COD}) → ${searchParams.REL_DEPT_NM}(${searchParams.DEPT_CD_REL})
            <br/>본 안전RISK의 담당·유관부서 이관에 의문사항이 있을 경우, 안전과나 담당자에게 문의하여 주시기 바랍니다.
            <br/>
            <br/>
            ${dayjs().format('YYYY')}년 ${dayjs().format('MM')}월 ${dayjs().format('DD')}일<br/>
            안전RISK 담당자 이형운 책임매니저 (3-4675)
          </span>
        </div>
        <div style="margin-top: 16px;">
          <img 
            width="180" 
            height="50" 
            src="https://hises.hd.com/HiSEsFiles/ci/HHI_color_ko.png"
            alt="HHI Logo"
          />
          <img 
            width="180" 
            height="50" 
            src="https://hises.hd.com/HiSEsFiles/ci/SRM.png"
            alt="SRM Logo"
          />
        </div>
      </div>
    `,
    EMAIL: [],
  }

  if (isBeforeDeptCdImp.COD !== searchParams.DEPT_CD_IMP || isBeforeDeptCdRel.COD !== searchParams.DEPT_CD_REL) {
    await Promise.all([
      // 개선담당부서장, 운영과장
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_02',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          DEPT_CD: searchParams.DEPT_CD_IMP,
        },
      }),
      // 개선유관부서장, 운영과장
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_02',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          DEPT_CD: searchParams.DEPT_CD_REL,
        },
      }),
      // 작성자 이메일
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_03',
        param: { EMP_NO: searchParams.EMP_NO },
      })
    ]).then(res => {
      for (let imp of res[0].ORESULT_CUR) {
        mailParams.EMAIL.push(imp.EMAIL)
      }

      for (let rel of res[1].ORESULT_CUR) {
        mailParams.EMAIL.push(rel.EMAIL)
      }

      for (let emp of res[2].ORESULT_CUR) {
        mailParams.EMAIL.push(emp.EMAIL)
      }

      mailParams.EMAIL.push('hhi_ssm@hd.com') // SRM 추진과 메일
    })
  }

  await commonSendApi(mailParams).then((res) => {
    if (res.result.status === '200') {
      isBeforeDeptCdImp.COD = ''
      isBeforeDeptCdImp.TXT = ''
      isBeforeDeptCdRel.COD = ''
      isBeforeDeptCdRel.TXY = ''
    }
  })
}

/* ****************** 부서조회, 인원조회, 중복제안팝업 오픈 ****************** */
const openPopup = (gbn) => {
  let params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: userStore.deptCd,
    HSE_ONLY: 'Y',
  }

  const temp = _.cloneDeep(params)
  temp.CMP_DISABLE = false

  if (gbn === 'dept') {
    deptPopup.value.openPopup(params)
  } else if (gbn === 'deptPopupAdmin') {
    deptPopupAdmin.value.openPopup(params)
  } else if (gbn === 'emp') {
    empPopup.value.openPopup({
      // BSNS_CD: searchParams.BSNS_CD,
      DISABLE: ['전체', '직영', '사내협력사', '단기공사'],
      MULTI: true,
      // BSNS_CD: searchParams.BSNS_CD,
      // DEPT_CD: searchParams.DEPT_CD,
      EMP_NM: searchParams.EMP_NM,
    })
  } else if (gbn === 'imp') {
    deptD_Popup.value.openPopup(temp)
  } else if (gbn === 'rel') {
    deptU_Popup.value.openPopup(temp)
  } else if (gbn === 'dup') {
    searchRiskPopup.value.openPopup()
  } else if (gbn === 'deptLisk') {
    deptLisk.value.openPopup(temp)
  } else if (gbn === 'deptLisk2') {
    deptLisk2.value.openPopup(temp)
  } else if (gbn === 'adminEmpPopup') {
    adminEmpPopup.value.openPopup({
      DISABLE: ['전체', '사내협력사', '단기공사'],
      readonly: true,
      // EMP_NM: searchParams.EMP_NM_MNG,
    })
  } else if (gbn === 'adminEmpPopup2') {
    adminEmpPopup2.value.openPopup({
      DISABLE: ['전체', '사내협력사', '단기공사'],
      readonly: true,
      // EMP_NM: searchParams.EMP_NM_MNG2,
    })
  } else if (gbn === 'workPopup') {
    workPopup.value.openPopup()
  } else if (gbn === 'workPopup2') {
    workPopup2.value.openPopup()
  } else if (gbn === 'map') {
    yardMapPopup.value.openPopup({
      LATITUDE: searchParams.LATITUDE,
      LONGITUDE: searchParams.LONGITUDE,
    })
  }
}

const locationPopupOpen = () => {
  locationPopup.value.openPopup('장소')
}

const selectedLocation = (val) => {
  searchParams.PLACE = val[0].ALL_SYS_CD
  searchParams.PLACE_MD_DIV = val[1].ALL_SYS_CD
  searchParams.PLACE_SM_DIV = val[2].ALL_SYS_CD

  searchParams.PLACE_NM = val[0].TXT
  searchParams.PLACE_MD_NM = val[1].TXT
  searchParams.PLACE_SM_NM = val[2].TXT
}

/* ********************** 팝업에서 데이터 선택시 이벤트 ********************** */
const onDeptSelected = (val, gbn) => {
  let originAsgn = val.ASGN_FULL_NM.split('-')
  if (gbn === 'dept') {
    searchParams.BSNS_CD = val.BSNS_CD
    searchParams.DEPT_CD = val.DEPT_CD
    searchParams.INJR_DEPT_CD = val.ASGN_CD
    searchParams.BSNS_NM = originAsgn[0]
    searchParams.DEPT_NM = originAsgn[1]
  } else if (gbn === 'deptPopupAdmin') {
    searchParams.CMPNY_DIV_MNG = val.CMPNY_DIV
    searchParams.BSNS_CD_MNG = val.BSNS_CD
    searchParams.DEPT_CD_MNG = val.DEPT_CD
    searchParams.BSNS_NM_MNG = originAsgn[0]
    searchParams.DEPT_NM_MNG = originAsgn[1]
  } else if (gbn === 'deptLisk') {
    searchParams.CMPNY_DIV_IMP_2 = val.CMPNY_DIV
    searchParams.DEPT_CD_IMP_2 = val.DEPT_CD
    searchParams.DEPT_NM_IMP_2 = originAsgn[1]
  } else if (gbn === 'deptLisk2') {
    searchParams.CMPNY_DIV_REL_2 = val.CMPNY_DIV
    searchParams.DEPT_CD_REL_2 = val.DEPT_CD
    searchParams.DEPT_NM_REL_2 = originAsgn[1]
  } else {
    searchParams['CMPNY_DIV_' + gbn] = val.CMPNY_DIV
    searchParams['DEPT_CD_' + gbn] = val.DEPT_CD
    searchParams[gbn + '_INJR_DEPT_CD'] = val.ASGN_CD
    searchParams[gbn + '_BSNS_NM'] = originAsgn[0]
    searchParams[gbn + '_DEPT_NM'] = originAsgn[1]

    const temp = gbn === 'IMP' ? '' : '2'
    searchParams['CMPNY_DIV_MNG' + temp] = val.CMPNY_DIV
    searchParams['BSNS_CD_MNG' + temp] = val.BSNS_CD
    searchParams['BSNS_NM_MNG' + temp] = val.BSNS_NM
    searchParams['DEPT_CD_MNG' + temp] = val.DEPT_CD
    searchParams['DEPT_NM_MNG' + temp] = val.ASGN_SHRT_NM

    commonSearchApi({
      queryId: 'SRMAA0040_SEARCH_04',
      param: {
        CMPNY_DIV: val.CMPNY_DIV,
        BSNS_CD: val.BSNS_CD,
        DEPT_CD: val.DEPT_CD,
      }
    }).then(res => {
      const jbData = res.ORESULT_CUR

      if(jbData.length > 0) {
        searchParams[`CMPNY_DIV_MNG${temp}_EMP`] = jbData[0].CMPNY_DIV
        searchParams[`EMP_NO_MNG${temp}`] = jbData[0].EMP_NO
        searchParams[`EMP_NM_MNG${temp}`] = jbData[0].EMP_NM
      } else {
        searchParams[`CMPNY_DIV_MNG${temp}_EMP`] = null
        searchParams[`EMP_NO_MNG${temp}`] = null
        searchParams[`EMP_NM_MNG${temp}`] = null
      }
    })
  }
}

//제보자 팝업 데이터 셋팅
const selectedEmpData = (val) => {
  if (!Array.isArray(val)) {
    searchParams.EMP_NO = val.EMP_NO
    searchParams.EMP_NM = val.EMP_NM
    searchParams.BSNS_CD = val.BSNS_CD
    searchParams.DEPT_CD = val.DEPT_CD
    searchParams.INJR_DEPT_CD = val.ASGN_CD
    searchParams.BSNS_NM = val.BSNS_NM
    searchParams.DEPT_NM = val.DEPT_NM
  } else {
    searchParams.EMP_NO = val[0].EMP_NO
    searchParams.EMP_NM = val[0].EMP_NM
    searchParams.BSNS_CD = val[0].BSNS_CD
    searchParams.DEPT_CD = val[0].DEPT_CD
    searchParams.INJR_DEPT_CD = val[0].ASGN_CD
    searchParams.BSNS_NM = val[0].BSNS_NM
    searchParams.DEPT_NM = val[0].DEPT_NM
  }
}

//관리자 팝업 데이터 셋팅
const selectedEmpData2 = (val, gbn) => {
  // console.log('selectedEmpData2 val', val)

  const temp = gbn === 'imp' ? '' : '2'

  searchParams[`CMPNY_DIV_MNG${temp}_EMP`] = val.CMPNY_DIV
  searchParams[`EMP_NO_MNG${temp}`] = val.EMP_NO
  searchParams[`EMP_NM_MNG${temp}`] = val.EMP_NM
}

const selectedWork = (val) => {
  searchParams.WORK_STANDARD_ID = val.WORK_STANDARD_ID
  searchParams.WORK_STANDARD_NM = val.WORK_STANDARD_NM
  // let WORK_STANDARD = val.WORK_STANDARD_ID.slice(-2)
  // if(WORK_STANDARD === '01'){
  //   searchParams.WORK_STANDARD = '개정전'
  // }else {
  //   searchParams.WORK_STANDARD = '개정후'
  // }
}

const selectedWork2 = (val) => {
  searchParams.WORK_STANDARD_ID2 = val.WORK_STANDARD_ID
  searchParams.WORK_STANDARD_NM2 = val.WORK_STANDARD_NM
}

/* **************** 중복제안검색 팝업에서 선택 이벤트 **************** */
const onDupSelected = async (val) => {
  // console.log('val', val)
  if (val) {
    menuTitle.value.setBtnProperty('btnDupSearch', 'visible', true)
    menuTitle.value.setBtnProperty('btnTemporaryStorage', 'visible', true)
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)

    fileList.src = []
    fileList.name = []
    fileList2.src = []
    fileList2.name = []
    // grdMain.value.getDataProvider().setRows([])
    // grdSub.value.getDataProvider().setRows([])

    /* searchParams 초기화 */
    for (let i in searchParams) {
      searchParams[i] = null
    }
    /* 중복제안 선택 데이터 셋팅 */
    for (let i in val) {
      searchParams[i] = val[i]
    }

    searchParams.REG_DT = dayjs().format('YYYY-MM-DD')
    searchParams.IMP_ST_DT = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
    searchParams.IMP_FI_DT = dayjs().format('YYYY-MM-DD')
    searchParams.REL_ST_DT = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
    searchParams.REL_FI_DT = dayjs().format('YYYY-MM-DD')
    searchParams.CMPNY_DIV = userStore.cmpnyDiv
    searchParams.EMP_NO = userStore.empNo
    searchParams.EMP_NM = userStore.userName
    searchParams.GRADE = val.GRADE

    // 장소세팅
    searchParams.PLACE = val.PLACE
    searchParams.PLACE_MD_DIV = val.PLACE_MD_DIV
    searchParams.PLACE_SM_DIV = val.PLACE_SM_DIV
    searchParams.DETAIL_PLACE = val.DETAIL_PLACE

    commonSearchApi({
      queryId: 'searchCommonCodeF',
      param: {
        CMPNY_DIV: 'HHI',
        ALL_UP_CD: 'HHIZ010',
        USE_FLAG: 'Y',
      },
    }).then((res) => {
      res.ORESULT_CUR.forEach((item, index) => {
        if (item.ALL_SYS_CD === val.PLACE) {
          searchParams.PLACE_NM = item.TXT
        } else if (item.ALL_SYS_CD === val.PLACE_MD_DIV) {
          searchParams.PLACE_MD_NM = item.TXT
        } else if (item.ALL_SYS_CD === val.PLACE_SM_DIV) {
          searchParams.PLACE_SM_NM = item.TXT
        }
      })
    })

    searchParams.DEPT_CD_IMP = val.DEPT_CD_IMP
    searchParams.DEPT_CD_REL = val.DEPT_CD_REL
    searchParams.IMP_DEPT_NM = val.IMP_DEPT_NM
    searchParams.REL_DEPT_NM = val.REL_DEPT_NM

    searchParams.DEPT_CD = userStore.deptCd
    searchParams.BSNS_CD = userStore.bsnsCd
    searchParams.INJR_DEPT_CD = userStore.asgnCd
    searchParams.DEPT_NM = userStore.deptNm
    searchParams.BSNS_NM = userStore.bsnsNm

    // console.log('searchParams', searchParams)

    fileSet()
  }
}

/* ****************** 사고유형 전체선택 이벤트 ****************** */
const sagoSelectAll = (e) => {
  if (selectAllSago.value === 'Y') {
    searchParams.CHECK_ACC = []
    sysCodeList.HHIJJC11.forEach((element) => {
      searchParams.CHECK_ACC.push(element.COD)
    })
  } else {
    searchParams.CHECK_ACC = []
  }
}

/* ***************** 사고유형 전체선택 외 체크시 실행 ***************** */
const sagoSelectAll2 = (e) => {
  selectAllSago.value = 'N'
}

/* ***************** 사고유형 전체선택 체크시 값 변경 ***************** */
const sagoAllClick = (e) => {
  if (selectAllSago.value === 'Y') {
    selectAllSago.value = 'N'
  } else {
    selectAllSago.value = 'Y'
  }

  sagoSelectAll()
}

/* ***************** 개선유형 전체선택 외 체크시 실행 ***************** */
const handleSelectAll2 = (e) => {
  selectAll.value = 'N'
}

/* ***************** 개선유형 전체선택 이벤트 ***************** */
const handleSelectAll = (e) => {
  if (selectAll.value === 'Y') {
    searchParams.TYPE_IMP = []

    sysCodeList.HHIJJC04.forEach((element) => {
      searchParams.TYPE_IMP.push(element.COD)
    })
  } else {
    searchParams.TYPE_IMP = []
  }
}

/* ***************** 개선유형 전체선택 체크시 값 변경 ***************** */
const allClick = (e) => {
  if (selectAll.value === 'Y') {
    selectAll.value = 'N'
  } else {
    selectAll.value = 'Y'
  }

  handleSelectAll()
}

/* ******************* 사고유형 데이터 변경시 ******************* */
watch(
  () => searchParams.CHECK_ACC,
  (newValue) => {
    if (newValue.includes('200')) {
      accCheck.value = false
    } else {
      accCheck.value = true
      searchParams.CHECK_ACC2 = ''
    }
  }
)

/* ******************* 개선유형 데이터 변경시 ******************* */
watch(
  () => searchParams.TYPE_IMP,
  (newValue) => {
    if (newValue.includes('080')) {
      impCheck.value = false
    } else {
      impCheck.value = true
      searchParams.TYPE_IMP2 = ''
    }
  }
)

/* ******************* 제보자 파일 추가시 ******************* */
const handleFileInputChange = (e) => {
  let file = e.target.files[0]
  autoFileUpload(file)
}
/* ******************* 관리자 파일 추가시 ******************* */
const handleFileInputChange2 = (e) => {
  let file = e.target.files[0]
  autoFileUpload2(file)
}

/* ******************* FILE ID 생성 이벤트 ******************* */
const create_UUID = () => {
  let dt = new Date().getTime()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/* ******************* 제보자 파일 추가시 자동 업로드 ******************* */
const autoFileUpload = async (file) => {
  if (!searchParams.FILE_ID_1) {
    searchParams.FILE_ID_1 = create_UUID()
  }
  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0

  const sendNextFile = async () => {
    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    // form data 형식으로 전송
    const formData = new FormData()

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: searchParams.FILE_ID_1,
      // FILE_ID: 'c6a87589-ddd8-43c8-862a-cbea20b79eb1',
      FILE_NO: '',
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split('.').pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    }
    formData.append('file', chunk, file.name)
    formData.append(
      'param',
      new Blob([JSON.stringify(param)], { type: 'application/json' })
    )

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        if (res.result.status === '207') {
          currentChunk++
          if (currentChunk < totalChunks) {
            await sendNextFile()
          }
        } else if (res.result.status === '200') {
          Message.success(t('업로드 되었습니다.'))
          fileSet()
        }
      })
      .catch((e) => {
        console.log('eee', e)
      })
  }
  await sendNextFile()
}

/* ******************* 관리자 파일 추가시 자동 업로드 ******************* */
const autoFileUpload2 = async (file) => {
  if (!searchParams.FILE_ID_2) {
    searchParams.FILE_ID_2 = create_UUID()
  }

  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0

  const sendNextFile2 = async () => {
    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    // form data 형식으로 전송
    const formData = new FormData()

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: searchParams.FILE_ID_2,
      FILE_NO: '',
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split('.').pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    }

    formData.append('file', chunk, file.name)
    formData.append(
      'param',
      new Blob([JSON.stringify(param)], { type: 'application/json' })
    )

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        if (res.result.status === '207') {
          currentChunk++
          if (currentChunk < totalChunks) {
            await sendNextFile2()
          }
        } else if (res.result.status === '200') {
          Message.success(t('업로드 되었습니다.'))
          fileSet2()
        }
      })
      .catch((e) => {
        console.log('eee', e)
      })
  }
  await sendNextFile2()
}

const clearData = () => {
  isHiSafe.value = false

  // 값 초기화
  Object.keys(searchParamsInit).forEach(key => {
    searchParams[key] = searchParamsInit[key]
  })

  nextTick(() => {
    grdMain.value.getDataProvider().setRows([])
    fileList.src = []
    fileList.fileName = []
    fileList.file = []

    if(grdSub.value != null) {
      grdSub.value.getDataProvider().setRows([])
      fileList2.src = []
      fileList2.fileName = []
    }
  })
}

/* ********************** 안전 리스크 제보 팝업 오픈 ********************** */
const popupOpen = async (val) => {
  clearData()

  isNewData.value = val ? (val.TEMP_YN !== 'Y' ? false : true) : true

  // for(let i in searchParams){
  //   searchParams[i] = null
  //   if(i === 'CHECK_ACC' || i === 'TYPE_IMP'){
  //     searchParams[i] = []
  //   }
  // }
  // fileList.src = []
  // fileList.name = []
  // fileList2.src = []
  // fileList2.name = []
  // // isNewData.value = false
  // grdMain.value.getDataProvider().setRows([])
  // grdSub.value.getDataProvider().setRows([])

  showManuel.value = false

  await menuTitle.value.setBtnProperty('btnDupSearch', 'visible', false)
  await menuTitle.value.setBtnProperty('btnTemporaryStorage', 'visible', false)
  await menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)
  await menuTitle.value.setBtnProperty('btnPrint', 'visible', false)
  // /* carousel reRoad 위해 초기화 */
  // carousel.value = 0
  // carousel2.value = 0
  // /* 수정가능 여부 초기화(수정x) */
  isReadonly.value = true

  // 관리자일 때 모든 항목 수정 가능
  if (isAdmin.value) {
    isReadonly.value = false
  }

  if (val) {
    /* 신규가 아니면 실행 */
    await commonSearchApi({
      queryId: 'SRMAA0040_SEARCH_01',
      param: val,
    }).then((res) => {
      // console.log('res.ORESULT_CUR[0]', res.ORESULT_CUR[0])
      menuTitle.value.setBtnProperty('btnPrint', 'visible', true)

      for (let i in res.ORESULT_CUR[0]) {
        if (res.ORESULT_CUR[0].EMP_NO === userStore.empNo) {
          isReadonly.value = false
          /* 제보자 본인이면서 임시저장 상태가 아닐시 (개선 진행중 상태가 아닐시) */
          if (
            res.ORESULT_CUR[0].RISK_REVIEW_RESULT === 'A' ||
            !res.ORESULT_CUR[0].RISK_REVIEW_RESULT
          ) {
            isReadonly.value = false
          }
          menuTitle.value.setBtnProperty('btnDupSearch', 'visible', true)
          menuTitle.value.setBtnProperty('btnTemporaryStorage', 'visible', true)
          if (res.ORESULT_CUR[0].TEMP_YN === 'Y') {
            /* 제보자 본인이면서 임시저장 상태일시 */
            menuTitle.value.setBtnProperty('btnDupSearch', 'visible', true)
            menuTitle.value.setBtnProperty(
              'btnTemporaryStorage',
              'visible',
              true
            )
            menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
            menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
          } else {
            menuTitle.value.setBtnProperty('btnDupSearch', 'visible', false)
            menuTitle.value.setBtnProperty(
              'btnTemporaryStorage',
              'visible',
              false
            )
            menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
            menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
          }
        } else {
          menuTitle.value.setBtnProperty(
            'btnDelete',
            'visible',
            isAdmin.value ? true : false
          )
        }

        // 로그인 계정이 관리자일 경우
        if (isAdmin.value) {
          /* ************ 테스트후 주석제거 *************** */
          menuTitle.value.setBtnProperty('btnDupSearch', 'visible', false)
          menuTitle.value.setBtnProperty(
            'btnTemporaryStorage',
            'visible',
            false
          )
          menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
          menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
        }

        // 임시저장일 때 작업표준
        if (res.ORESULT_CUR[0].TEMP_YN === 'Y') {
          menuTitle.value.setBtnProperty('btnDupSearch', 'visible', true)
          menuTitle.value.setBtnProperty('btnTemporaryStorage', 'visible', true)
        }

        if (i === 'CHECK_ACC' || i === 'TYPE_IMP') {
          let array = res.ORESULT_CUR[0][i]
            ? res.ORESULT_CUR[0][i].split(',')
            : []
          searchParams[i] = array
        } else if (i === 'DEPT_CD') {
          searchParams.INJR_DEPT_CD = res.ORESULT_CUR[0][i]
          searchParams.DEPT_CD = res.ORESULT_CUR[0][i]
          // INJR_DEPT_CD
        } else {
          searchParams[i] = res.ORESULT_CUR[0][i]
        }
      }

      if(searchParams.TASK_NO_1?.length > 0) {
        isHiSafe.value = true
      }

      // TODO: 차후 변경됨에 따라 메일발송위해 확인하기 위한 용도(2024.07.04)
      isBeforeDeptCdImp.COD = searchParams.DEPT_CD_IMP
      isBeforeDeptCdRel.COD = searchParams.DEPT_CD_REL
      isBeforeDeptCdImp.TXT = searchParams.IMP_DEPT_NM
      isBeforeDeptCdRel.TXT = searchParams.REL_DEPT_NM
      
      setReviewReqDisable()
      
      fileSet()
      fileSet2()

      // 썸네일 구분
      commonSearchApi({
        queryId: 'searchFile',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          FILE_ID: searchParams.THUMBNAIL_FILE_ID,
        },
      }).then(async (res) => {
        // 구분자 지정
        grdThumbnail.value = res.ORESULT_CUR.length > 0 ? res.ORESULT_CUR[0].FILE_TITLE : ''
      })
    })
  } else {
    // TODO: 신규 시 중복제안검색 필수 (2024.06.18 이형운 책임 요청)
    vm.$swal({
      title: t('신규 등록 시 중복 제안 검색 후 등록해주십시오.'),
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        searchRiskPopup.value.openPopup()
        chkSearchRisk.value = true
      }
    })

    /* 신규 추가시 */
    isReadonly.value = false
    isNewData.value = true
    menuTitle.value.setBtnProperty('btnDupSearch', 'visible', true)
    menuTitle.value.setBtnProperty('btnTemporaryStorage', 'visible', true)
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
    menuTitle.value.setBtnProperty('btnDelete', 'visible', false)

    searchParams.REG_DT = dayjs().format('YYYY-MM-DD')
    searchParams.IMP_ST_DT = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
    searchParams.IMP_FI_DT = dayjs().format('YYYY-MM-DD')
    searchParams.REL_ST_DT = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
    searchParams.REL_FI_DT = dayjs().format('YYYY-MM-DD')
    searchParams.CMPNY_DIV = userStore.cmpnyDiv
    searchParams.EMP_NO = userStore.empNo
    searchParams.EMP_NM = userStore.userName

    // 부서
    searchParams.DEPT_CD = userStore.deptCd
    searchParams.BSNS_CD = userStore.bsnsCd
    searchParams.INJR_DEPT_CD = userStore.asgnCd
    searchParams.DEPT_NM = userStore.deptNm
    searchParams.BSNS_NM = userStore.bsnsNm
  }

  /* 관리자 영역 */
  // ;(searchParams.MANAGE_DATE = searchParams.MANAGE_DATE
  //   ? dayjs(searchParams.MANAGE_DATE).format('YYYY-MM-DD')
  //   : dayjs().format('YYYY-MM-DD')), // 관리일자
  //   (searchParams.CMPNY_DIV_MNG = searchParams.CMPNY_DIV_MNG
  //     ? searchParams.CMPNY_DIV_MNG
  //     : userStore.cmpnyDiv), // 관리자 회사
  //   (searchParams.BSNS_CD_MNG = searchParams.BSNS_CD_MNG
  //     ? searchParams.BSNS_CD_MNG
  //     : userStore.bsnsCd), // 관리자 사업부
  //   (searchParams.BSNS_NM_MNG = searchParams.BSNS_NM_MNG
  //     ? searchParams.BSNS_NM_MNG
  //     : userStore.bsnsNm), // 관리자 사업부 이름
  //   (searchParams.DEPT_CD_MNG = searchParams.DEPT_CD_MNG
  //     ? searchParams.DEPT_CD_MNG
  //     : userStore.deptCd), // 관리자 부서
  //   (searchParams.DEPT_NM_MNG = searchParams.DEPT_NM_MNG
  //     ? searchParams.DEPT_NM_MNG
  //     : userStore.deptNm), // 관리자 부서 이름
  //   (searchParams.EMP_NO_MNG = searchParams.EMP_NO_MNG
  //     ? searchParams.EMP_NO_MNG
  //     : userStore.empNo), // 관리자 사번
  //   (searchParams.EMP_NM_MNG = searchParams.EMP_NM_MNG
  //     ? searchParams.EMP_NM_MNG
  //     : userStore.empNm), // 관리자 이름
  //   (searchParams.IMP_ST_DT = searchParams.IMP_ST_DT
  //     ? dayjs(searchParams.IMP_ST_DT).format('YYYY-MM-DD')
  //     : dayjs().format('YYYY-MM-DD')), // 개선 시작일
  //   (searchParams.IMP_FI_DT = searchParams.IMP_FI_DT
  //     ? dayjs(searchParams.IMP_FI_DT).format('YYYY-MM-DD')
  //     : dayjs().add(1, 'month').format('YYYY-MM-DD')), // 개선 종료일
  //   (dialog.value = true)
}

const setReviewReqDisable = () => {
  if(searchParams.DEPT_CD === userStore.deptCd
      && searchParams.HRZN_REVIEW_REQ !== 'Y') {
    reviewDisabled.value = false
  } else {
    reviewDisabled.value = true
  }
}

/* *************************************** 제보자 파일 carousel 셋팅 *************************************** */
const fileSet = () => {
  grdMain.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  fileList.file = []
  let cnt = 0

  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: searchParams.FILE_ID_1,
    },
  }).then(async (res) => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach((e) => {
      let type = e.FILE_TYPE.toUpperCase()
      let isGbn = true
      if (
        type === 'PNG' ||
        type === 'JPG' ||
        type === 'JPEG' ||
        type === 'GIF'
      ) {
        cnt++
        isGbn = true
        fileList.fileName.push(e)
      } else {
        isGbn = false
      }
      /* ********** grid row 추가 ********** */
      grdMain.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV,
        cnt: isGbn ? cnt : null,
        FILE_PATH: e.FILE_PATH,
        FILE_NAME: e.FILE_NAME,
        FILE_NAME_ORIGINAL: e.FILE_NAME_ORIGINAL,
        FILE_SIZE: e.FILE_SIZE,
        FILE_TYPE: e.FILE_TYPE,
        FILE_TITLE: e.FILE_TITLE,
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성
      let file = null
      let fileType = null

      commonDownloadFilesApi(e)
        .then((res2) => {
          contentDisposition = res2.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

          fileType = fileName.split('.')

          if (fileType[1] === 'gif') {
            blob = new Blob([res2], { type: 'image/gif' })
          } else if (fileType[1] === 'jpeg' || fileType[1] === 'jpg') {
            blob = new Blob([res2], { type: 'image/jpeg' })
          } else if (fileType[1] === 'png') {
            blob = new Blob([res2], { type: 'image/png' })
          } else if (fileType[1] === 'pdf') {
            blob = new Blob([res2], { type: 'application/pdf' })
          } else if (fileType[1] === 'ppt') {
            blob = new Blob([res2], { type: 'application/ppt' })
          } else if (fileType[1] === 'txt') {
            blob = new Blob([res2], { type: 'text/plain' })
          } else if (fileType[1] === 'xls') {
            blob = new Blob([res2], { type: 'application/vnd.ms-excel' })
          } else if (fileType[1] === 'zip') {
            blob = new Blob([res2], { type: 'application/zip' })
          }

          file = new File([blob], fileName, { type: blob.type })

          // blob = new Blob([res2])
          imageURL = URL.createObjectURL(blob)

          img = new Image() // 이미지 요소 생성

          img.src = imageURL // 이미지 URL 설정
          img.alt = fileName
          dummy.value = imageURL
        })
        .finally(() => {
          fileList.src[idx] = imageURL
          fileList.file[idx] = file
          fileList.fileNo[idx] = e.FILE_NO
          fileList.fileId[idx] = e.FILE_ID
          carousel.value++
          grdMain.value.getGridView().checkAll(false)
          grdMain.value.getGridView().resetCurrent()
        })
    })
  })
}

/* *************************************** 관리자 파일 carousel 셋팅 *************************************** */
const fileSet2 = () => {
  grdSub.value.getDataProvider().setRows([])
  fileList2.src = []
  fileList2.fileName = []
  let cnt = 0

  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: searchParams.FILE_ID_2,
    },
  }).then(async (res) => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach((e) => {
      let type = e.FILE_TYPE.toUpperCase()
      if (
        type === 'PNG' ||
        type === 'JPG' ||
        type === 'JPEG' ||
        type === 'GIF'
      ) {
        cnt++
        fileList2.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdSub.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV,
        cnt: cnt,
        FILE_PATH: e.FILE_PATH,
        FILE_NAME: e.FILE_NAME,
        FILE_NAME_ORIGINAL: e.FILE_NAME_ORIGINAL,
        FILE_SIZE: e.FILE_SIZE,
        FILE_TYPE: e.FILE_TYPE,
        FILE_TITLE: e.FILE_TITLE,
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList2.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e)
        .then((res2) => {
          contentDisposition = res2.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

          blob = new Blob([res2])
          imageURL = URL.createObjectURL(blob)

          img = new Image() // 이미지 요소 생성

          img.src = imageURL // 이미지 URL 설정
          img.alt = fileName
          dummy.value = imageURL
        })
        .finally(() => {
          fileList2.src[idx] = imageURL
          carousel2.value++
          grdSub.value.getGridView().checkAll(false)
          grdSub.value.getGridView().resetCurrent()
        })
    })
  })
}

const downLoad = async (gbn) => {
  if (gbn === '1') {
    let chekedRow = await grdMain.value.getGridView().getCheckedRows()
    if (chekedRow.length === 0) {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    } else {
      chekedRow.forEach(async (e) => {
        let data = await grdMain.value.getDataProvider().getJsonRow(e)

        commonDownloadFilesApi(data).then((res) => {
          const file = res.contentDisposition.split('fileName="')
          const blob = new Blob([res])
          const link = document.createElement('a')

          link.href = URL.createObjectURL(blob)

          link.download = decodeURI(file[1].replace('";', ''))
          link.click()
          URL.revokeObjectURL(link.href)
        })
      })
    }
  } else {
    let chekedRow = await grdSub.value.getGridView().getCheckedRows()
    if (chekedRow.length === 0) {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    } else {
      chekedRow.forEach(async (e) => {
        let data = await grdSub.value.getDataProvider().getJsonRow(e)

        commonDownloadFilesApi(data).then((res) => {
          const file = res.contentDisposition.split('fileName="')
          const blob = new Blob([res])
          const link = document.createElement('a')

          link.href = URL.createObjectURL(blob)

          link.download = decodeURI(file[1].replace('";', ''))
          link.click()
          URL.revokeObjectURL(link.href)
        })
      })
    }
  }
}

const onCellClicked = async (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = await grdMain.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow)
    if (rowData.cnt) {
      carouselIdx.value = rowData.cnt - 1
    }
  }
}

const onCellClicked2 = async (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = await grdSub.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow)
    carouselIdx2.value = rowData.cnt - 1
  }
}

const onHelp = () => {
  discriptRiskLevel.value.openPopup()
}

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사
    getCompanyList(),
    // 사고유형 조회
    getCodeList('HHIJJC11'),
    // 개선유형 조회
    getCodeList('HHIJJC04'),
    // 리스크 검토 결과 조회
    getCodeList('HHIJJC13'),
    // 위험등급
    getCodeList('HHIJJC01'),
    // 개선결과
    getCodeList('HHIJJE07'),
    // 리스크 검토현황
    getCodeList('HHIJJE08'),
    // 횡전개 진행 상태
    getCodeList('HHIJJA03'),
    // 우수 제보 선정
    getCodeList('HHIJJA05'),
    // 공모전 난이도
    getCodeList('HHIJJC03'),
    // 리스크 검토현황(유관부서)
    getCodeList('HHIJJE14'),
  ]).then((res) => {
    codeList.COMPANY_CD = res[0].ORESULT_CUR // 회사
    sysCodeList.HHIJJC11 = res[1].ORESULT_CUR // 사고유형
    sysCodeList.HHIJJC04 = res[2].ORESULT_CUR // 개선유형
    sysCodeList.HHIJJC13 = res[3].ORESULT_CUR // 리스크 검토 결과
    sysCodeList.RISKLIST = res[4].ORESULT_CUR // 위험등급
    sysCodeList.HHIJJE07 = res[5].ORESULT_CUR // 개선결과
    sysCodeList.HHIJJE08 = res[6].ORESULT_CUR // 리스크 검토현황
    sysCodeList.HHIJJA03 = res[7].ORESULT_CUR
    sysCodeList.HHIJJA05 = res[8].ORESULT_CUR
    sysCodeList.HHIJJC03 = res[9].ORESULT_CUR
    sysCodeList.HHIJJE14 = res[10].ORESULT_CUR

    sysCodeList.HHIJJE07.unshift({ COD: '', TXT: '' })
  })
}

// 안전긴급예산 신청
const onBudgetApplication = () => {
  let params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    TASK_SEQ: searchParams.TASK_SEQ,
    EB_COD: '',
  }
  sRMFA0010.value.openPopup(params)
}

// 안저지침 팝업 오픈
const openSearchSafetyInstruct = () => {
  searchSafetyInstructPopup.value.openPopup()
}

// 안전지침 선택 후
const onSafetyInstructPopup = (val) => {
  const params = {
    CMPNY_DIV: val.CMPNY_DIV,
    SEQ: val.NOTICE_NO,
  }
  commonSearchApi({
    queryId: 'SRMAA0030_SEARCH_04',
    param: params,
  }).then((res) => {
    searchParams.NOTICE_TITLE = val.NOTICE_TITLE
    searchParams.NOTICE_NO = val.NOTICE_NO
    searchParams.STATUS_NM =
      res.ORESULT_CUR.length !== 0 ? res.ORESULT_CUR[0].STATUS_NM : ''
  })
}

// 개선 담당/유관 부서 세팅
/*const autoSetDept = () => {
  if (!searchParams.IMP_DEPT_NM) {
    searchParams.IMP_DEPT_NM = '안전경영부'
    searchParams.DEPT_CD_IMP = 'N090'
  }

  if (!searchParams.REL_DEPT_NM) {
    searchParams.REL_DEPT_NM = '안전경영부'
    searchParams.DEPT_CD_REL = 'N090'
  }
}*/

const autoSetDept = e => {
  if (e === "Y") {
    // if (!searchParams.IMP_DEPT_NM) {
      searchParams.IMP_DEPT_NM = '안전경영부'
      searchParams.DEPT_CD_IMP = 'N090'
      searchParams.CMPNY_DIV_IMP = 'HHI'

      searchParams.CMPNY_DIV_MNG = 'HHI'
      searchParams.BSNS_CD_MNG = 'AN00'
      searchParams.BSNS_NM_MNG = '안전통합경영실'
      searchParams.DEPT_CD_MNG = 'N090'
      searchParams.DEPT_NM_MNG = '안전경영부'
    // }

    // if (!searchParams.REL_DEPT_NM) {
      searchParams.REL_DEPT_NM = '안전경영부'
      searchParams.DEPT_CD_REL = 'N090'
      searchParams.CMPNY_DIV_REL = 'HHI'

      searchParams.CMPNY_DIV_MNG2 = 'HHI'
      searchParams.BSNS_CD_MNG2 = 'AN00'
      searchParams.BSNS_NM_MNG2 = '안전통합경영실'
      searchParams.DEPT_CD_MNG2 = 'N090'
      searchParams.DEPT_NM_MNG2 = '안전경영부'
    // }

    commonSearchApi({
      queryId: 'SRMAA0040_SEARCH_04',
      param: {
        CMPNY_DIV: 'HHI',
        BSNS_CD: 'AN00',
        DEPT_CD: 'N090',
      }
    }).then(res => {
      const jbData = res.ORESULT_CUR

      if(jbData.length > 0) {
        searchParams.CMPNY_DIV_MNG_EMP = searchParams.CMPNY_DIV_MNG2_EMP = jbData[0].CMPNY_DIV
        searchParams.EMP_NO_MNG = searchParams.EMP_NO_MNG2 = jbData[0].EMP_NO
        searchParams.EMP_NM_MNG = searchParams.EMP_NM_MNG2 = jbData[0].EMP_NM
      } else {
        searchParams.CMPNY_DIV_MNG_EMP = searchParams.CMPNY_DIV_MNG2_EMP = null
        searchParams.EMP_NO_MNG = searchParams.EMP_NO_MNG2 = null
        searchParams.EMP_NM_MNG = searchParams.EMP_NM_MNG2 = null
      }
    })
  } else {
    searchParams.IMP_DEPT_NM = null
    searchParams.DEPT_CD_IMP = null
    searchParams.REL_DEPT_NM = null
    searchParams.DEPT_CD_REL = null
    searchParams.CMPNY_DIV_IMP = null
    searchParams.CMPNY_DIV_REL = null

    searchParams.CMPNY_DIV_MNG = searchParams.CMPNY_DIV_MNG2 = null
    searchParams.BSNS_CD_MNG = searchParams.BSNS_CD_MNG2 = null
    searchParams.BSNS_NM_MNG = searchParams.BSNS_NM_MNG2 = null
    searchParams.DEPT_CD_MNG = searchParams.DEPT_CD_MNG2 = null
    searchParams.DEPT_NM_MNG = searchParams.DEPT_NM_MNG2 = null

    searchParams.CMPNY_DIV_MNG_EMP = searchParams.CMPNY_DIV_MNG2_EMP = null
    searchParams.EMP_NO_MNG = searchParams.EMP_NO_MNG2 = null
    searchParams.EMP_NM_MNG = searchParams.EMP_NM_MNG2 = null
  }
}

const clearCoordinate = () => {
  searchParams.LATITUDE = null
  searchParams.LONGITUDE = null
}

const reviewReq = () => {
  vm.$swal({
    title: t('검토 요청 하시겠습니까?'),
    showCancelButton: true,
  }).then(res => {
    if (res.isConfirmed === true) {
      const reviewParam = {
        TASK_SEQ: searchParams.TASK_SEQ,
        HRZN_STATUS: searchParams.HRZN_STATUS,
        HRZN_REVIEW_REQ: 'Y',
        HRZN_SAFE_REMARK: searchParams.HRZN_SAFE_REMARK,
        HRZN_USER_ID: userStore.userId,
      }

      commonExecuteApi({ queryId: 'SRMAA0040_SAVE_03', list: [reviewParam], }).then(res => {
        commonSearchApi({ queryId: 'SRMAA0040_SEARCH_01', param: searchParams, }).then(res2 => {
          const res2Data = res2.ORESULT_CUR

          // console.log('res2.ORESULT_CUR', res2.ORESULT_CUR)

          if(res2Data.length > 0) {
            searchParams.HRZN_STATUS = res2Data[0].HRZN_STATUS
            searchParams.HRZN_REVIEW_REQ = res2Data[0].HRZN_REVIEW_REQ
            searchParams.HRZN_SAFE_REMARK = res2Data[0].HRZN_SAFE_REMARK
            searchParams.HRZN_USER_ID = res2Data[0].HRZN_USER_ID

            setReviewReqDisable()

            let content = `<div>안전 리스크 제보 ${searchParams.TASK_SEQ} 건에 대한 횡전개가 요청되었습니다.</div>`
                        + '<div>검토 후 조치 바랍니다.</div>'
                        
            let emails = [
              'hhi_srm@hd.com',
              // 'BP22613@bp.hd.com'
            ]

            commonSendApi({
              SUBJECT: `[안전 리스크 관리] ${searchParams.TASK_SEQ} 횡전개 요청 건`,
              CONTENT: content,
              EMAIL: emails,
            })

            Message.success('검토 요청 되었습니다.')
          }
        })
      })
    }
  })
}

const selectPoint = pt => {
  searchParams.LATITUDE = pt.LATITUDE
  searchParams.LONGITUDE = pt.LONGITUDE
}

onMounted(() => {
  initCodeList()

  isNewData.value = searchParams.TASK_SEQ ? false : true
})

defineExpose({
  popupOpen,
})
</script>

<template>
  <!-- <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    height="980"
    class="p-absolute user-select-none"
  > -->
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    v-if="props.isAdminDiv"
  >
    <span>안전 리스크 제보/관리</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="pa-2">
        <v-sheet width="100%" class="pa-0 content-area-tab">
          <IMenuTitle
            :title="$t('리스크 제보')"
            ref="menuTitle"
            :button-list="props.btnList"
            @click-button="onRegistButtonsClick"
            :showManuel="showManuel"
          />
          <v-divider :thickness="3" class="border-opacity-75" color="primary" />
          <VForm ref="searchArea" class="searchArea">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('등록일자')"
                topLabel
                width="150px"
                v-model="searchParams.REG_DT"
                type="Date"
                readonly
                disabled
              />
              <i-select
                :label="$t('회사')"
                width="150px"
                topLabel
                v-model="searchParams.CMPNY_DIV"
                :items="codeList.COMPANY_CD"
                item-value="COD"
                item-title="TXT"
                readonly
                disabled
              />
              <i-input
                :label="$t('사업부')"
                topLabel
                v-model="searchParams.BSNS_NM"
                width="150px"
                readonly
                disabled
              />
              <i-input
                :label="$t('부서')"
                topLabel
                v-model="searchParams.DEPT_NM"
                width="215px"
                margin="5px"
                readonly
                disabled
              />
              <i-input
                v-model="searchParams.INJR_DEPT_CD"
                width="65px"
                class="mt-5"
                readonly
                disabled
              />
              <i-input
                :label="$t('제보자')"
                topLabel
                v-model="searchParams.EMP_NM"
                width="100px"
                readonly
                disabled
              />
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('제목')"
                v-model="searchParams.RISK_NM"
                topLabel
                width="320px"
                :readonly="isReadonly||isHiSafe"
                :disabled="isReadonly||isHiSafe"
                required
              />
              <i-input
                :label="$t('개선담당부서')"
                topLabel
                v-model="searchParams.IMP_DEPT_NM"
                width="180px"
                readonly
                :disabled="isReadonly||isHiSafe"
                append-inner-icon="mdi-magnify"
                @click:appendInner="
                  (e) => {
                    if (!isReadonly) openPopup('imp')
                  }
                "
                required
              />
              <i-input
                :label="$t('개선유관부서')"
                topLabel
                v-model="searchParams.REL_DEPT_NM"
                width="180px"
                readonly
                :disabled="isReadonly||isHiSafe"
                append-inner-icon="mdi-magnify"
                @click:appendInner="
                  (e) => {
                    if (!isReadonly) openPopup('rel')
                  }
                "
                required
              />
              <div>
                <div class="formLabelText">
                  <span class="d-flex">
                    {{ $t('위험등급') }}
                    <v-icon
                      icon="mdi-help-circle-outline"
                      size="small"
                      color="#6e6e6e"
                      @click="onHelp"
                      :readonly="isReadonly"
                    />
                    <svg-icon class="dot" name="redDot" />
                  </span>
                </div>
                <div class="d-flex align-center">
                  <i-select
                    width="174px"
                    v-model="searchParams.GRADE"
                    :items="sysCodeList.RISKLIST"
                    item-value="COD"
                    item-title="TXT"
                    :readonly="isReadonly||isHiSafe"
                    :disabled="isReadonly||isHiSafe"
                    required
                  />
                </div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-sheet>
                <p>
                  <span class="text-red text-caption"
                    >※ 리스크 제보(등록) 완료 시 개선담당/개선유관부서의 안전 담당자에게 알람 발송</span
                  >
                </p>                
                <v-checkbox
                      v-model="searchParams.SET_DEPT"
                      true-value="Y"
                      false-value="N"
                      :label="$t('개선담당/개선유관부서 확인이 어려운 경우 선택')"
                      style="max-height: 40 !important;"
                      @update:modelValue="autoSetDept"
                      :disabled="isHiSafe"
                    />
              </v-sheet>              
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('발생장소')"
                topLabel
                v-model="searchParams.PLACE_NM"
                width="200px"
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="
                  (e) => {
                    if (!isReadonly) {
                      locationPopupOpen()
                    }
                  }
                "
                @click="
                  (e) => {
                    if (!isReadonly) {
                      locationPopupOpen()
                    }
                  }
                "
                required
                :disabled="isReadonly"
              />
              <i-input
                :label="$t('중구분')"
                topLabel
                v-model="searchParams.PLACE_MD_NM"
                width="210px"
                readonly
                :disabled="isReadonly"
              />
              <i-input
                :label="$t('소구분')"
                topLabel
                v-model="searchParams.PLACE_SM_NM"
                width="220px"
                readonly
                :disabled="isReadonly"
              />
              <!-- <i-input
                :label="$t('세부장소')"
                topLabel
                v-model="searchParams.DETAIL_PLACE"
                width="220px"
                :readonly="isReadonly"
                :disabled="isReadonly"
              /> -->
              <i-input
                :label="$t('좌표')"
                topLabel
                v-model="COORDINATE"
                width="220px"
                readonly
                clearable
                append-inner-icon="mdi-magnify"
                @click:appendInner="
                  (e) => {
                    if (!isReadonly) {
                      openPopup('map')
                    }
                  }
                "
                @click:clearable="
                  (e) => {
                    if (!isReadonly) {
                      clearCoordinate()
                    }
                  }
                "
                :disabled="isReadonly"
              />
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('세부장소')"
                topLabel
                v-model="searchParams.DETAIL_PLACE"
                width="912px"
                :readonly="isReadonly"
                :disabled="isReadonly"
              />
            </div>
            <div class="d-flex align-center">
              <v-sheet width="320px" class="mr-5">
                <div class="formLabelText">
                  <span class="d-flex">
                    {{ $t('사고유형') }}
                    <svg-icon class="dot" name="redDot" />
                  </span>
                </div>
                <div class="d-flex align-center" style="width: 320px">
                  <VAutocomplete
                    :items="sysCodeList.HHIJJC11"
                    v-model="searchParams.CHECK_ACC"
                    item-title="TXT"
                    item-value="COD"
                    multiple
                    :clearable="!isReadonly&&!isHiSafe"
                    @update:modelValue="sagoSelectAll2"
                    close-on-item-click="false"
                    :readonly="isReadonly||isHiSafe"
                    :disabled="isReadonly||isHiSafe"
                  >
                    <template v-slot:prepend-item>
                      <v-list-item
                        :class="selectAllSago === 'Y' ? 'select' : 'unselect'"
                        @click="sagoAllClick"
                      >
                        <v-list-item-title>
                          <VRow>
                            <VCol cols="auto">
                              <v-checkbox
                                v-model="selectAllSago"
                                @change="sagoSelectAll"
                                color="rgb(81, 77, 88)"
                              />
                            </VCol>
                            <VCol>
                              <span>전체 선택</span>
                            </VCol>
                          </VRow>
                        </v-list-item-title>
                      </v-list-item>
                    </template>
                  </VAutocomplete>
                </div>
              </v-sheet>
              <i-input
                :label="$t('사고유형(서술)')"
                topLabel
                width="572px"
                v-model="searchParams.CHECK_ACC2"
                :readonly="accCheck || isReadonly||isHiSafe"
                placeholder="기타(서술) 선택 시 입력"
                :disabled="isReadonly||isHiSafe"
              />
            </div>
            <div class="d-flex align-center mt-2">
              <v-sheet width="320px" class="mr-5">
                <div class="formLabelText">
                  <span class="d-flex">
                    {{ $t('개선유형') }}
                    <svg-icon class="dot" name="redDot" />
                  </span>
                </div>
                <div class="d-flex align-center" style="width: 320px">
                  <VAutocomplete
                    :items="sysCodeList.HHIJJC04"
                    v-model="searchParams.TYPE_IMP"
                    item-title="TXT"
                    item-value="COD"
                    multiple
                    :clearable="!isReadonly"
                    @update:modelValue="handleSelectAll2"
                    close-on-item-click="false"
                    :readonly="isReadonly"
                    :disabled="isReadonly"
                  >
                    <template v-slot:prepend-item>
                      <v-list-item
                        :class="selectAll === 'Y' ? 'select' : 'unselect'"
                        @click="allClick"
                      >
                        <v-list-item-title>
                          <VRow align="center">
                            <VCol cols="auto">
                              <v-checkbox
                                v-model="selectAll"
                                @change="handleSelectAll"
                                color="rgb(81, 77, 88)"
                              />
                            </VCol>
                            <VCol>
                              <span>전체 선택</span>
                            </VCol>
                          </VRow>
                        </v-list-item-title>
                      </v-list-item>
                    </template>
                  </VAutocomplete>
                </div>
              </v-sheet>
              <i-input
                :label="$t('개선유형(서술)')"
                topLabel
                width="572px"
                v-model="searchParams.TYPE_IMP2"
                :readonly="impCheck || isReadonly"
                placeholder="기타(서술) 선택 시 입력"
                :disabled="isReadonly"
              />
            </div>
            <div class="flex-column mt-3">
              <i-textarea
                :label="$t('문제 개요')"
                v-model="searchParams.CUR_PROB"
                topLabel
                width="100%"
                :row="6"
                :readonly="isReadonly||isHiSafe"
                required
                :placeholder="'[예제1] 개구부 떨어짐 방지를 위해 반복적으로 인력이 발판을 설치해야 함\n' +
                              '-> 과도한 인력 소요 및 발판 설치 중 피트 하부로 떨어질 위험 존재\n\n' +
                              '[예제2] 개구부 떨어짐 방지용 발판의 고정이 어려움\n' +
                              '-> 블록의 형상과 블록 간 간격이 매번 달라 고정이 어렵거나 설치 불가'"
                :disabled="isReadonly||isHiSafe"
              />
            </div>
          </VForm>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle
            :title="$t('문제점 사진 및 자료')"
            ref="gridTitle"
            :button-list="
              isAdmin || searchParams.EMP_NO === userStore.userId
                ? (isHiSafe ? ['btnThumbnail', 'btnDownLoad'] : ['btnThumbnail', 'btnCreate', 'btnDownLoad', 'btnDelete'])
                : ['btnDownLoad']
            "
            @click-button="onImgButtonsClick"
          />
          <v-file-input
            style="display: none"
            @change="handleFileInputChange"
            ref="fileInput"
          />
          <div class="d-flex fill-height">
            <v-sheet width="60%">
              <!-- v-if="fileList.src.length > 0" -->
              <v-carousel
                hide-delimiters
                height="300px"
                class="border"
                show-arrows="hover"
                hide-delimiter-background
                :key="carousel"
                v-model="carouselIdx"
              >
                <v-carousel-item
                  v-for="(item, i) in fileList.src"
                  :key="i"
                  :src="item"
                  width="584"
                />
              </v-carousel>
            </v-sheet>
            <v-sheet class="h-auto ml-2">
              <RealGrid
                ref="grdMain"
                class="border"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
          </div>
        </v-sheet>

        <!-- <div v-show="(searchParams.TEMP_YN !== 'Y' && !isNewData)" class="mt-6"> -->
        <div v-if="!isNewData" class="mt-6">
          <IGridTitle
            :title="$t('리스크 관리')"
            :button-list="isAdmin ? ['btnUpdate'] : []"
            @click-button="onManageButtonsClick"
          />
          <v-divider :thickness="3" class="border-opacity-75" color="primary" />
          <v-sheet class="h-auto searchArea">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('관리일자')"
                topLabel
                width="150px"
                v-model="searchParams.MANAGE_DATE"
                type="Date"
                readonly
                disabled
              />
              <i-select
                :label="$t('회사')"
                width="150px"
                topLabel
                v-model="searchParams.CMPNY_DIV_MNG"
                :items="codeList.COMPANY_CD"
                item-value="COD"
                item-title="TXT"
                readonly
                disabled
              />
              <i-input
                :label="$t('사업부')"
                topLabel
                v-model="searchParams.BSNS_NM_MNG"
                width="150px"
                readonly
                disabled
              />
              <i-input
                :label="$t('부서')"
                topLabel
                v-model="searchParams.DEPT_NM_MNG"
                width="215px"
                margin="5px"
                readonly
                disabled
              />
              <i-input
                v-model="searchParams.DEPT_CD_MNG"
                width="65px"
                class="mt-5"
                readonly
                disabled
              />
              <i-input
                :label="$t('관리자')"
                topLabel
                v-model="searchParams.EMP_NM_MNG"
                width="100px"
                readonly
                :disabled="!isAdmin||isHiSafe"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopup('adminEmpPopup')"
              />
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('개선 시작일')"
                topLabel
                width="150px"
                v-model="searchParams.IMP_ST_DT"
                type="Date"
                :required="isAdmin"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <i-input
                :label="$t('개선 종료일')"
                topLabel
                width="150px"
                v-model="searchParams.IMP_FI_DT"
                type="Date"
                :required="isAdmin"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <i-select
                :label="$t('진행상태')"
                width="230px"
                topLabel
                v-model="searchParams.RISK_REVIEW_RESULT"
                :items="sysCodeList.HHIJJE08"
                item-value="COD"
                item-title="TXT"
                :required="isAdmin"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <div v-if="isAdmin" class="d-flex pt-5">
                <!-- :disabled="searchParams.CHK_BUDGET > 0" -->
                <v-btn
                  @click="onBudgetApplication"
                  disabled
                >
                  <p v-if="searchParams.CHK_BUDGET > 0">
                    안전긴급예산이 신청된 제보입니다.
                  </p>
                  <p v-else >안전긴급예산 신청</p>
                </v-btn>
              </div>
              <!-- 진행상태 부서 선택시 -->
              <i-input
                :label="$t('부서')"
                topLabel
                v-model="searchParams.DEPT_NM_IMP_2"
                width="215px"
                margin="5px"
                append-inner-icon="mdi-magnify"
                @keydown.enter="openPopup('deptLisk')"
                @update:modelValue="
                  (e) => {
                    searchParams.DEPT_NM_IMP_2 = null
                  }
                "
                @click:appendInner="
                  () => {
                    if (isAdmin) openPopup('deptLisk')
                  }
                "
                v-if="searchParams.RISK_REVIEW_RESULT === 'G'"
                :readonly="!isAdmin"
              />
              <i-input
                v-model="searchParams.DEPT_CD_IMP_2"
                width="65px"
                class="mt-5"
                disabled
                v-if="searchParams.RISK_REVIEW_RESULT === 'G'"
              />
            </div>
            <!-- TODO: 개선 계획 입력폼 수정 (2024.06.18 이형운 책임 요청) -->
            <div class="d-flex mb-2">
              <i-textarea
                :label="$t('개선 계획')"
                v-model="searchParams.IMP_PLAN"
                topLabel
                width="100%"
                :row="6"
                :readonly="!isAdmin||isHiSafe"
                :required="isAdmin"
                :disabled="!isAdmin||isHiSafe"
              />
              <!-- <i-input
                  :label="$t('개선 계획')"
                  topLabel
                  width="520px"
                  v-model="searchParams.IMP_PLAN"
                  :required="isAdmin"
                  :readonly="!isAdmin"
                /> -->
            </div>
            <div class="d-flex mb-2">
              <i-select
                :label="$t('개선 결과')"
                width="250px"
                topLabel
                v-model="searchParams.IMP_RESULT"
                :items="sysCodeList.HHIJJE07"
                item-value="COD"
                item-title="TXT"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <i-input
                :label="$t('')"
                topLabel
                width="250px"
                v-model="searchParams.IMP_REMARK"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
            </div>
            <div class="d-flex mb-2">
              <i-select
                :label="$t('작업표준/위험성평가')"
                v-model="searchParams.RIVISION_STATUS"
                topLabel
                width="250px"
                :items="codeList.RIVISION_STATUS"
                item-value="COD"
                item-title="TXT"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <i-input
                width="250px"
                topLabel
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopup('workPopup')"
                v-model="searchParams.WORK_STANDARD_NM"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
              />
              <!-- <i-input
                  topLabel
                  v-model="searchParams.WORK_STANDARD"
                  width="250px"
                  readonly
                /> -->
            </div>
            <div class="flex-column mb-2">
              <!-- <div class="formLabelText">
                  {{ $t('개선 실적') }}
                  <svg-icon class="dot mb-2" name="redDot" />
                </div>
                <CkEditor2               
                  ref="ckEditor2"
                  :id="editorOptions2.editorOptions.id"
                  :initialValue="editorOptions2.editorOptions.data"
                  :lang="editorOptions2.editorOptions.lang"
                  v-model="searchParams.MIT_ACTION"
                  :toolbar="toolbar"
                  class="editorStyle2 bg-white"
                /> -->
              <i-textarea
                :label="$t('개선실적')"
                v-model="searchParams.MIT_ACTION"
                topLabel
                width="100%"
                :row="6"
                :readonly="!isAdmin||isHiSafe"
                :disabled="!isAdmin||isHiSafe"
                :required="isAdmin"
              />
            </div>
          </v-sheet>

          <v-sheet v-show="!isHiSafe" class="h-auto searchArea">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('관리일자')"
                topLabel
                width="150px"
                v-model="searchParams.MANAGE_DATE2"
                type="Date"
                readonly
                disabled
              />
              <i-select
                :label="$t('회사')"
                width="150px"
                topLabel
                v-model="searchParams.CMPNY_DIV_MNG2"
                :items="codeList.COMPANY_CD"
                item-value="COD"
                item-title="TXT"
                readonly
                disabled
              />
              <i-input
                :label="$t('사업부')"
                topLabel
                v-model="searchParams.BSNS_NM_MNG2"
                width="150px"
                readonly
                disabled
              />
              <i-input
                :label="$t('부서')"
                topLabel
                v-model="searchParams.DEPT_NM_MNG2"
                width="215px"
                margin="5px"
                readonly
                disabled
              />
              <i-input
                v-model="searchParams.DEPT_CD_MNG2"
                width="65px"
                class="mt-5"
                readonly
                disabled
              />
              <i-input
                :label="$t('관리자')"
                topLabel
                v-model="searchParams.EMP_NM_MNG2"
                width="100px"
                readonly
                :disabled="!isAdmin"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopup('adminEmpPopup2')"
              />
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('개선 시작일')"
                topLabel
                width="150px"
                v-model="searchParams.REL_ST_DT"
                type="Date"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
              <i-input
                :label="$t('개선 종료일')"
                topLabel
                width="150px"
                v-model="searchParams.REL_FI_DT"
                type="Date"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
              <i-select
                :label="$t('진행상태')"
                width="230px"
                topLabel
                v-model="searchParams.RISK_REVIEW_RESULT2"
                :items="sysCodeList.HHIJJE14"
                item-value="COD"
                item-title="TXT"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
              <!-- 진행상태 부서 선택시 -->
              <i-input
                :label="$t('부서')"
                topLabel
                v-model="searchParams.DEPT_NM_REL_2"
                width="215px"
                margin="5px"
                append-inner-icon="mdi-magnify"
                @keydown.enter="openPopup('deptLisk2')"
                @update:modelValue="
                  (e) => {
                    searchParams.DEPT_NM_REL_2 = null
                  }
                "
                @click:appendInner="
                  () => {
                    if (isAdmin) openPopup('deptLisk2')
                  }
                "
                v-if="searchParams.RISK_REVIEW_RESULT2 === 'G'"
                :readonly="!isAdmin"
              />
              <i-input
                v-model="searchParams.DEPT_CD_REL_2"
                width="65px"
                class="mt-5"
                disabled
                v-if="searchParams.RISK_REVIEW_RESULT2 === 'G'"
              />
            </div>
            <!-- TODO: 개선 계획 입력폼 수정 (2024.06.18 이형운 책임 요청) -->
            <div class="d-flex mb-2">
              <i-textarea
                :label="$t('개선 계획')"
                v-model="searchParams.REL_PLAN"
                topLabel
                width="100%"
                :row="6"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
            </div>
            <div class="d-flex mb-2">
              <i-select
                :label="$t('개선 결과')"
                width="250px"
                topLabel
                v-model="searchParams.REL_RESULT"
                :items="sysCodeList.HHIJJE07"
                item-value="COD"
                item-title="TXT"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
              <i-input
                :label="$t('')"
                topLabel
                width="250px"
                v-model="searchParams.REL_REMARK"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
            </div>
            <div class="d-flex mb-2">
              <i-select
                :label="$t('작업표준/위험성평가')"
                v-model="searchParams.RIVISION_STATUS2"
                topLabel
                width="250px"
                :items="codeList.RIVISION_STATUS"
                item-value="COD"
                item-title="TXT"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
              <i-input
                width="250px"
                topLabel
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopup('workPopup2')"
                v-model="searchParams.WORK_STANDARD_NM2"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
            </div>
            <div class="flex-column mb-2">
              <i-textarea
                :label="$t('개선실적')"
                v-model="searchParams.MIT_ACTION2"
                topLabel
                width="100%"
                :row="6"
                :readonly="!isAdmin"
                :disabled="!isAdmin"
              />
            </div>
          </v-sheet>
          
          <v-sheet class="h-auto searchArea">
            <div class="d-flex align-end mb-2">
              <i-select
                :label="$t('전사 횡전개 요청 현황')"
                topLabel
                margin="5px"
                width="200px"
                v-model="searchParams.HRZN_STATUS"
                :items="sysCodeList.HHIJJA03"
                item-value="COD"
                item-title="TXT"
                :disabled="searchParams.HRZN_REVIEW_REQ !== 'Y'"
              />
              <v-btn :disabled="reviewDisabled" style="margin-bottom: 3px;" @click="reviewReq">
                검토 요청
              </v-btn>
            </div>
            <div class="d-flex">
              <i-textarea
                v-model="searchParams.HRZN_SAFE_REMARK"
                :label="$t('안전 의견')"
                topLabel
                width="100%"
                :row="6"
              />
            </div>
          </v-sheet>
          <v-sheet class="pa-0 h-auto">
            <IGridTitle
              :title="$t('개선결과 사진 및 자료')"
              ref="gridTitle"
              :button-list="
                isAdmin
                  ? (isHiSafe ? ['btnThumbnail', 'btnDownLoad'] : ['btnThumbnail', 'btnCreate', 'btnDownLoad', 'btnDelete'])
                  : ['btnDownLoad']
              "
              @click-button="onImgButtonsClick2"
            />
            <v-file-input
              style="display: none"
              @change="handleFileInputChange2"
              ref="fileInput2"
            />
            <div class="d-flex fill-height">
              <v-sheet width="60%">
                <v-carousel
                  hide-delimiters
                  height="300px"
                  class="border"
                  show-arrows="hover"
                  hide-delimiter-background
                  :key="carousel2"
                  v-model="carouselIdx2"
                >
                  <v-carousel-item
                    v-for="(item, i) in fileList2.src"
                    :key="i"
                    :src="item"
                    width="584"
                  />
                </v-carousel>
              </v-sheet>
              <v-sheet class="h-auto ml-2">
                <RealGrid
                  ref="grdSub"
                  class="border"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys"
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                  @onCellClicked="onCellClicked2"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>

        <div
          v-show="searchParams.TEMP_YN !== 'Y' && isAdmin && !isNewData"
          class="pt-6"
        >
          <IGridTitle
            :title="$t('안전 리스크 공모전 관리')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick"
          />
          <v-divider :thickness="3" class="border-opacity-75" color="primary" />
          <v-sheet class="h-auto searchArea">
            <div class="d-flex justify-space-between">
              <v-sheet class="flex-column" width="47%">
                <div class="d-flex">
                  <i-select
                    topLabel
                    :label="$t('우수 제보 선정')"
                    width="48%"
                    v-model="searchParams.EXCELLENT"
                    :items="sysCodeList.HHIJJA05"
                    item-value="COD"
                    item-title="TXT"
                  />
                  <i-input
                    topLabel
                    :label="$t('공모전 번호')"
                    width="48%"
                    v-model="searchParams.TASK_NO_3"
                    readonly
                  />
                </div>
                <div class="d-flex mt-2">
                  <i-textarea
                    :label="$t('비고(의견)')"
                    topLabel
                    width="100%"
                    :row="4"
                    v-model="searchParams.EXCELLENT_REMARK"
                  />
                </div>
              </v-sheet>

              <v-sheet class="flex-column" width="47%">
                <div class="d-flex">
                  <i-input
                    :label="$t('안전지침 / 표준개정')"
                    width="60%"
                    topLabel
                    append-inner-icon="mdi-magnify"
                    v-model="searchParams.NOTICE_TITLE"
                    :readonly="!isAdmin"
                    @click:appendInner="openSearchSafetyInstruct"
                  />
                  <i-input
                    v-model="searchParams.STATUS_NM"
                    topLabel
                    width="36%"
                    readonly
                  />
                </div>
                <div class="d-flex mt-2">
                  <i-select
                    topLabel
                    :label="$t('난이도')"
                    width="48%"
                    v-model="searchParams.CONTEST_DIFFICULTY"
                    :items="sysCodeList.HHIJJC03"
                    item-value="COD"
                    item-title="TXT"
                  />
                </div>
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- </v-dialog> -->

  <DeptPopup ref="deptPopup" @selected="onDeptSelected($event, 'dept')" />
  <DeptPopup
    ref="deptPopupAdmin"
    @selected="onDeptSelected($event, 'deptPopupAdmin')"
  />
  <!-- 관리자 부서 -->
  <DeptPopup ref="deptD_Popup" @selected="onDeptSelected($event, 'IMP')" :autoDisabled="false" />
  <!-- 개선담당부서 -->
  <DeptPopup ref="deptU_Popup" @selected="onDeptSelected($event, 'REL')" :autoDisabled="false" />
  <!-- 개선유관부서 -->
  <DeptPopup ref="deptLisk" @selected="onDeptSelected($event, 'deptLisk')" :autoDisabled="false" />
  <DeptPopup ref="deptLisk2" @selected="onDeptSelected($event, 'deptLisk2')" :autoDisabled="false" />
  <!-- 리스크검토 현황 -->
  <SearchRiskPopup ref="searchRiskPopup" @selected="onDupSelected" />
  <EmpPopup ref="empPopup" @selected="selectedEmpData" />
  <EmpPopup ref="adminEmpPopup" @selected="selectedEmpData2($event, 'imp')" />
  <EmpPopup ref="adminEmpPopup2" @selected="selectedEmpData2($event, 'rel')" />
  <WorkPopup ref="workPopup" @selected="selectedWork" />
  <WorkPopup ref="workPopup2" @selected="selectedWork2" />
  <LocationPopup ref="locationPopup" @selected="selectedLocation" />
  <SRMFA0010 ref="sRMFA0010"  editor-id="sRMAA0030popup01"/>
  <!-- 위험등급 설명 -->
  <DiscriptRiskLevel ref="discriptRiskLevel" />
  <SRMAA0030Popup01_pop01
    ref="sRMAA0030Popup01_pop01"
    @close="emit('close', false)"
  />
  <SRMAA0030Popup01_pop02
    ref="sRMAA0030Popup01_pop02"
    @close="emit('close', false)"
  />

  <!-- 안전지침 -->
  <SearchSafetyInstructPopup
    ref="searchSafetyInstructPopup"
    @selected="onSafetyInstructPopup"
  />

  <YardMapPopup ref="yardMapPopup" @selectPoint="selectPoint" />

  <OZReport :showPop="showOz" :reportName="ozName" :params="ozParams" @close="showOz = $event" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 123px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

::v-deep(.v-autocomplete__selection) {
  flex: none;
}

.select {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}

.unselect:hover {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}

.v-autocomplete__selection {
  flex-wrap: nowrap;
}
::v-deep(.v-field__input) {
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  // color: #000 !important;
  overflow: hidden !important;
}
::v-deep(.rg-head-cell) {
  background-color: #e4e4e4 !important;
}
::v-deep(.rg-header .rg-table tr td) {
  background-color: #e4e4e4 !important;
}

.editorStyle {
  max-width: 912px;
}

// 캐러셀 가운데 정렬
div.v-window-item.v-window-item--active.v-carousel-item {
  align-self: center;
}
</style>

<route lang="yaml">
meta: { noAuth: true }
</route>
