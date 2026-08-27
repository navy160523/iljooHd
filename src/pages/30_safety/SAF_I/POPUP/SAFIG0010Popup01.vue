
<!--
  화면명 : SAFIG0010Popup01
  화면개요 : 점검 등록 팝업
  작성자 : 김홍규
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly, nextTick } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeleteAllFilesApi, commonSampleDownFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUpload from "@/components/IUpload.vue"
import Message from "@hiway/utils/notify"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import IUploadPopup2 from '@/pages/30_safety/SAF_I/POPUP/SAFIG0010Popup02.vue'
import OZReport from "@/components/OZReport.vue"            // 오즈 리포트
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import EmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업
import LocationPopup from "@/components/popup/LocationPopup.vue"; // 장소 선택 팝업
import { chkEmpty } from '@/utils/common'
import _ from 'lodash'

import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed","upDataRow"])
const userStore = useUserStore()
const logsStore = useLogsStore()

const menuTitle = ref(null)
const gridButton = ref(null)
const gridSubButton = ref(null)

// 리포트
const showOz = ref(false)
const reportName = ref('')
const params = ref([])

const fileUpload = ref(null)
let path = useLogsStore().path.split('/')
let menuId = path[path.length -1] 
let rendererState = true
let vendList = reactive([]) 
let CURRENT_ROW = false
let detail = {}
let APPROVAL_YN = false
const isReadOnly = ref(false);
const dialog = ref(null)
const approvalPopup = ref(null) // 결재
// 파일 업로드 팝업
const fileUploadPopup = ref(null)
const fileUploadPopup2 = ref(null)
const fileUploadPopup3 = ref(null)
const empPopup = ref(null)
const locationPopup = ref(null);
const fileReadOnly = ref(false)

const disableYN = ref(true)
const halfData = ref([])

let now_row = ''
let now_col = ''

let empState = ''
let empData_CD = ''
let empData_DEPT = ''
let empData_BSNS = ''
const title = reactive({
  subTitle : ''
})
/* 팝업 데이터 */
let popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  // 사업부
  BSNS_CD: '',
  BSNS_NM: '',
  // 부서
  DEPT_CD: '',
  DEPT_NM: '',
  // 협력사
  COMP_CD: '',
  COMP_NM: '',
  // 점검 일자
  INSPECTION_DATE: '',
  // 점검 장소
  INSPECTION_PLACE: '',
  // 해당 부서장
  DEPT_OWNER: '',
  DEPT_OWNER_CD: '',
  DEPT_OWNER_DEPT: '',
  DEPT_OWNER_BSNS: '',
  // 해당 부서 근로자 1인
  DEPT_EMP: '',
  DEPT_EMP_CD: '',
  // 협력사 대표
  COMP_OWNER: '',
  COMP_OWNER_CD: '',
  COMP_OWNER_DEPT: '',
  COMP_OWNER_BSNS: '',
  // 협력사 근로자 1인
  COMP_EMP: '',
  COMP_EMP_CD: '',
  //건의 및 특이사항
  SUGGESTION: '',
  // 점검 일자 범위
  MAX_DATE: '',
  MIN_DATE: '',
  EDIT_STATE: '',
  DEPT_HEAD_NM:'', // 부서장

  PDF_CNT: 0,
  PDF_KEY: '',
})
/* 코드 리스트 */
const codeList = reactive({
  APPROVAL_STATUS: []
})

// 결재상신 그리드
const grdMain = ref(null)
// 점검등록 목록 그리드
const grdSub = ref(null)
//메인그리드 속성셋팅 
// 줄바꿈 멀티라인 - multiline
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    { fieldName: 'FILE_NAME', dataType: 'text', width: '100' , header: { text: t('사진') }, editable: false, styleName: 'editable_column',
    renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
          let str = ''
          // console.log('cell val',cell.value)
          if(cell.value !== null){
            str =  
            `<div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
            <p>${cell.value}</p>
            </div>`
          }else{
            str = 
            `<div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
              <button class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;">
                사진 추가
              </button>
            </div>`
          }
          return str;
        },
      }, 
    }, // 사진
    { fieldName: 'IMAGE_FILE', dataType: 'text', header: {text: t('사진')}, width: '250',
      // renderer: {
      //   width: '250',
      //   type: 'image',
      //   imageField: 'IMAGE_FILE',
      //   imageHeight: 130,
      // },
      styleCallback: function(grid, dataCell){
        var ret = {}
        var isFile = grid.getValue(dataCell.index.itemIndex, "FILE_NAME");
        // console.log('isFile',isFile)
        
        if(isFile !== null && isFile !== ''){
          ret.renderer = {
            width: '250',
            type: 'image',
            imageField: 'IMAGE_FILE',
            imageHeight: 130,
          }
        } else { 
          ret.renderer = {
            type: "html",
              callback: function (grid, cell, w, h) {
                var str = 
                `<div style="display: flex; justify-content: center;
                padding-left: 10px; padding-right: 10px">
                  <button id="imgUpload" class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px;">
                    이미지 첨부
                  </button>
                </div>`
                return str;
              },
            }
        }
        return ret
      },
      styles: {
        contentFit: 'auto'
      },
      editable: false,
    },
    { fieldName: 'WORK', dataType: 'text', width: '100', header: { text: t('작업명') }, styleName: 'editable_column',
      name: 'WORK',  },// 내용
    { fieldName: 'CONTENT', dataType: 'text', width: '100', header: { text: t('점검 내용') }, styleName: 'editable_column',
      name: 'CONTENT',},
    { fieldName: 'FIX_FILE_NAME', dataType: 'text', width: '100', header: { text: t('사진') }, editable: false, styleName: 'editable_column',
    renderer: {
      type: "html",
        callback: function (grid, cell, w, h) {
          let str = ''
          // console.log('cell val',cell.value)
          if(cell.value !== null){
            str =  
            `<div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
            <p>${cell.value}</p>
            </div>`
          }else{
            str = 
            `<div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
              <button class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;">
                사진 추가
              </button>
            </div>`
          }
          return str;
        },
      }, 
    },
    { fieldName: 'FIX_IMAGE_FILE', dataType: 'text', header: {text: t('사진')}, width: '250',
      styleCallback: function(grid, dataCell){
        var ret = {}
        var isFile = grid.getValue(dataCell.index.itemIndex, "FIX_FILE_NAME");
      
        if(isFile !== null && isFile !== ''){
          ret.renderer = {
            width: '250',
            type: 'image',
            imageField: 'FIX_IMAGE_FILE',
            imageHeight: 130,
          }
        } else { 
          ret.renderer = {
            type: "html",
              callback: function (grid, cell, w, h) {
                var str = 
                `<div style="display: flex; justify-content: center;
                padding-left: 10px; padding-right: 10px">
                  <button id="imgUpload" class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px;">
                    이미지 첨부
                  </button>
                </div>`
                return str;
              },
            }
        }
        return ret
      },
      styles: {
        contentFit: 'auto'
      },
      editable: false,
    },
    { fieldName: 'FIX_WORK', dataType: 'text', width: '100', header: { text: t('내용') }, visible: false},
    { fieldName: 'FIX_DESC', dataType: 'text', width: '100', header: { text: t('조치 내용') }, styleName: 'editable_column',
      name: 'FIX_DESC', },// 내용
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'COMP_CD', dataType: 'text', visible: false },
    { fieldName: 'YEAR_DATE', dataType: 'text', visible: false },
    { fieldName: 'MONTH_DATE', dataType: 'text', visible: false },
    { fieldName: 'HALF_YEAR', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'ORG_SEQ', dataType: 'text', visible: false },
    { fieldName: 'FILE_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'FIX_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'FILE', dataType: 'text', visible: false },
    { fieldName: 'FIX_FILE', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
    { fieldName: 'TEMP', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    {
      name: "점검 사항",
      direction: "horizontal",
      items: [
        'WORK','CONTENT','IMAGE_FILE'
      ],
      header: {
        text: t("점검 사항"),
      },
    },
    {
      name: "조치 결과",
      direction: "horizontal",
      items: [
         'FIX_DESC','FIX_IMAGE_FILE'
      ],
      header: {
        text: t("조치 결과"),
      },
    },
  ],
})
grdMainProps.columns = grdMainProps.fields


const grdSubProps = reactive({
  gridViewOption: {  checkBar: { visible: true } },
  fields: [     
    { fieldName: 'INSPECTION_DATE', dataType: 'text', width: '100' , header: { text: t('점검 일자') }, editable: false },
    // { fieldName: 'INSERT_DATE', dataType: 'text', width: '100' , header: { text: t('등록 일자') }, editable: false },// 사진
    { fieldName: 'USER_NM', dataType: 'text', width: '100', header: { text: t('등록자') }, editable: false },
    { fieldName: 'APPROVAL_YN', dataType: 'text', width: '100' , header: { text: t('결재 상태') }, editable: false, lookupDisplay: true },// 사진 
    { fieldName: 'APPROVAL_DT', dataType: 'text', width: '100' , header: { text: t('결재 일자') }, editable: false },// 사진
    // { fieldName: 'APPROVAL_NM', dataType: 'text', width: '100', header: { text: t('결재자') }, editable: false },
    { fieldName: 'APPROVAL_HEAD_NM', dataType: 'text', width: '100', header: { text: t('결재자') }, editable: false },//부서장으로 등록된 인원
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'COMP_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'COMP_NM', dataType: 'text', visible: false },
    { fieldName: 'APPROVAL_USER', dataType: 'text', visible: false },
    { fieldName: 'APPROVAL_YN_COD', dataType: 'text', visible: false },
    { fieldName: 'YEAR_DATE', dataType: 'text', visible: false },
    { fieldName: 'MONTH_DATE', dataType: 'text', visible: false },
    { fieldName: 'HALF_YEAR', dataType: 'text', visible: false },
    // { fieldName: 'INSPECTION_DATE', dataType: 'text', visible: false },
    { fieldName: 'INSPECTION_PLACE', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER', dataType: 'text', visible: false },
    { fieldName: 'COMP_EMP', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER', dataType: 'text', visible: false },
    { fieldName: 'DEPT_EMP', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER_CD', dataType: 'text', visible: false },
    { fieldName: 'COMP_EMP_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_EMP_CD', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER_QR', dataType: 'text', visible: false },
    { fieldName: 'COMP_EMP_QR', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER_QR', dataType: 'text', visible: false },
    { fieldName: 'DEPT_EMP_QR', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER_WEB', dataType: 'text', visible: false },
    { fieldName: 'COMP_EMP_WEB', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER_WEB', dataType: 'text', visible: false },
    { fieldName: 'DEPT_EMP_WEB', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER_DEPT', dataType: 'text', visible: false },
    { fieldName: 'COMP_OWNER_BSNS', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER_DEPT', dataType: 'text', visible: false },
    { fieldName: 'DEPT_OWNER_BSNS', dataType: 'text', visible: false },
    { fieldName: 'SUGGESTION', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'FILE_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'FILE_ATTACH_KEY2', dataType: 'text', visible: false },
    { fieldName: 'DEPT_HEAD_NM', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INSPECTION_DATE_ORG', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdSubProps.columns = grdSubProps.fields

//로우더블클릭시 실행되는 함수
const openPopup = (searchParams) => {
  console.log('userStore.authGrpCd', userStore.authGrpCd)
  dialog.value = true

  nextTick(() => {
    halfData.value = []
    // console.log('searchParams', searchParams)
    // console.log('userStore', userStore)
    popupParams.CMPNY_DIV = searchParams.CMPNY_DIV
    popupParams.BSNS_CD = searchParams.BSNS_CD
    popupParams.BSNS_NM = searchParams.BSNS_NM
    popupParams.DEPT_CD = searchParams.DEPT_CD
    popupParams.DEPT_NM = searchParams.DEPT_NM
    popupParams.COMP_CD = searchParams.COMP_CD
    popupParams.COMP_NM = searchParams.COMP_NM
    popupParams.HALF_YEAR = searchParams.HALF_YEAR
    popupParams.YEAR_DATE = searchParams.YEAR_DATE
    popupParams.MONTH_DATE = searchParams.MONTH_DATE
    popupParams.DEPT_HEAD_NM = searchParams.DEPT_HEAD_NM
    setDisableYN()
    onSubButtonsClick({id:'btnSearch'})
    if(searchParams.MONTH_DATE === '12') {
      popupParams.MAX_DATE = `${searchParams.YEAR_DATE * 1 - 1}-12-31`
      popupParams.MIN_DATE = `${searchParams.YEAR_DATE * 1 - 1}-12-01`
    } else {
      popupParams.MAX_DATE = `${searchParams.YEAR_DATE}-${searchParams.MONTH_DATE}-${new Date(searchParams.YEAR_DATE, searchParams.MONTH_DATE, 0).getDate()}`
      popupParams.MIN_DATE = `${searchParams.YEAR_DATE}-${searchParams.MONTH_DATE}-01`
    }
    // if(searchParams.HALF_YEAR === 'A'){
    //   popupParams.MAX_DATE = searchParams.YEAR_DATE + '-05-31'
    //   popupParams.MIN_DATE = (parseInt(searchParams.YEAR_DATE)-1).toString() + '-12-01'
    // }else{
    //   popupParams.MAX_DATE = searchParams.YEAR_DATE + '-11-30'
    //   popupParams.MIN_DATE = searchParams.YEAR_DATE + '-06-01'
    // }
    // dialog.value = true
    
    getCodeList('HHIZ030').then((res)=>{
      // console.log('res',res)
      codeList.APPROVAL_STATUS = res.ORESULT_CUR
      grdSub.value.setBindingColumn('APPROVAL_YN',codeList.APPROVAL_STATUS,'COD','TXT')

    })

    popupParams.PDF_KEY = searchParams.PDF_KEY
    popupParams.PDF_CNT = searchParams.PDF_CNT
    
    // console.log('popupParams', popupParams)
  })
}

const searchHalfData = () => {
  commonSearchApi({ queryId : 'SAFIG0010_SEARCH_06', param: popupParams }).then(res => {
    halfData.value = res.ORESULT_CUR
    console.log('halfData.value', halfData.value)
  })
}

const setDisableYN = () => {
  // console.log('logsStore.isMenuAdmin', logsStore.isMenuAdmin)

  if(logsStore.isMenuAdmin === 'Y') {
    disableYN.value = false
  } else {
    if(userStore.userDiv === 'A') {
      if(userStore.deptCd === popupParams.DEPT_CD) {
        disableYN.value = false
      } else {
        disableYN.value = true
      }
    } else if(userStore.userDiv === 'B') {
      if(userStore.asgnCd === popupParams.COMP_CD) {
        disableYN.value = false
      } else {
        disableYN.value = true
      }
    } else {
      disableYN.value = true
    }
  }

  // console.log('logsStore.isMenuAdmin', logsStore.isMenuAdmin)
  // console.log('userStore.userDiv', userStore.userDiv)
  // console.log('userStore.deptCd', userStore.deptCd)
  // console.log('popupParams.DEPT_CD', popupParams.DEPT_CD)
  // console.log('disableYN.value', disableYN.value)
}

//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  popupParams.EDIT_STATE = ''
  clear()
  CURRENT_ROW = false
  emit('closed')
  dialog.value = false
}

const clear = () => {
  popupParams.INSPECTION_DATE = ''
  popupParams.INSPECTION_DATE_ORG = ''
  popupParams.INSPECTION_PLACE = ''
  popupParams.SUGGESTION = ''
  popupParams.DEPT_OWNER = ''
  popupParams.DEPT_OWNER_CD = ''
  popupParams.DEPT_OWNER_QR = ''
  popupParams.DEPT_OWNER_WEB = ''
  popupParams.DEPT_EMP = ''
  popupParams.DEPT_EMP_CD = ''
  popupParams.DEPT_EMP_QR = ''
  popupParams.DEPT_EMP_WEB = ''
  popupParams.COMP_OWNER = ''
  popupParams.COMP_OWNER_CD = ''
  popupParams.COMP_OWNER_QR = ''
  popupParams.COMP_OWNER_WEB = ''
  popupParams.COMP_EMP = ''
  popupParams.COMP_EMP_CD = ''
  popupParams.COMP_EMP_QR = ''
  popupParams.COMP_EMP_WEB = ''
  // CURRENT_ROW = false
}

// 팝업 버튼
const onButtonsClick =async (btn) => {

  if (btn.id === "btnUpdate" && CURRENT_ROW) {
    console.log('추가 버튼 작동')
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(save)
    .setAfter(() => {
      // console.log('adgasdhasdh')
      onGridButtonsClick({ id :'btnUpdate' })
      // onCellClicked(null,{dataRow: grdSub.value.getDataProvider().getCurrent().dataRow})
      // onSubButtonsClick({id:'btnSearch', type:'update'})
      console.log('저장 이후 조회')
    })
    .run()

  } else if (btn.id === "btnReqApply" && CURRENT_ROW) {
    reqApply()
  } else if (btn.id === "btnClose") {
    // 팝업 종료
    closePopup()
  } else if (btn.id === "btnPrint") {
    const isData= grdMain.value.getDataProvider().getRowCount()
    console.log('Print Row:', popupParams)
    if(isData>0){
      reportName.value = "/manage/hse/SAFIG0010.ozr"
      params.value = [
      "IN_CMPNY_DIV="+popupParams.CMPNY_DIV, // 소속부서
      "IN_BSNS_CD="+popupParams.BSNS_CD, // 작성자
      "IN_DEPT_CD="+popupParams.DEPT_CD, // 작성일
      "IN_COMP_CD="+popupParams.COMP_CD,
      "IN_YEAR_DATE="+popupParams.YEAR_DATE,
      "IN_MONTH_DATE="+popupParams.MONTH_DATE,
      "IN_HALF_YEAR="+popupParams.HALF_YEAR,
      "IN_ORG_SEQ="+popupParams.SEQ,
      "IN_SEQ="+popupParams.SEQ, 
      ]
      
    showOz.value = true 
    }else {
      Message.warn(t('점검현황을 추가해주세요.'))
    }
   
  }
}

const reqApply = () => {
  const applyData = grdSub.value.getGridView().getCurrent()

  if(applyData.dataRow > -1) {
    const applyParams = [grdSub.value.getDataProvider().getJsonRow(applyData.dataRow)]

    commonExecuteApi({ queryId: 'SAFIG0010_CHK_APPROVAL', list: applyParams, }).then(async chkRes => {
      // console.log('chkRes', chkRes)

      popupParams.APPROVAL_ID = popupParams.YEAR_DATE + popupParams.MONTH_DATE + popupParams.DEPT_CD +
      popupParams.COMP_CD + popupParams.HALF_YEAR + popupParams.SEQ

      setFile()

      await vm.$swal({
        title: t('결재 순서는 <br/> 1. 안전 담당과장, 2. 부서장 <br/>순서대로 기입을 해 주시기 바랍니다.'),
      })

      const params = {
        CMPNY_DIV: popupParams.CMPNY_DIV,
        YEAR_DATE: popupParams.YEAR_DATE,
        MONTH_DATE: popupParams.MONTH_DATE,
        HALF_YEAR: popupParams.HALF_YEAR,
        BSNS_CD: popupParams.BSNS_CD,
        DEPT_CD: popupParams.DEPT_CD,
        COMP_CD: popupParams.COMP_CD,
        SEQ: popupParams.SEQ,
      }
      
      commonSearchApi({ queryId : 'SAFIG0010_SEARCH_04', param: params }).then(dataRes => {
        afterSearchApply(dataRes)
      })
    })
  }

  // const isData= grdMain.value.getDataProvider().getRowCount()
  // const checkDatas = _.filter(grdMain.value.getDataProvider().getJsonRows(), row => !chkEmpty(row.SEQ))

  // popupParams.APPROVAL_ID = popupParams.YEAR_DATE + popupParams.MONTH_DATE + popupParams.DEPT_CD +
  // popupParams.COMP_CD + popupParams.HALF_YEAR + popupParams.SEQ 
  // // console.log('popupParams',popupParams)
  // if(checkDatas.length > 0){
  //   setFile()
  //   console.log('Detail', detail)

  //   let confirmYn = await vm.$swal({
  //     title: t('결재 순서는 <br/> 1. 안전 담당과장, 2. 부서장 <br/>순서대로 기입을 해 주시기 바랍니다.'),
  //   })
    
  //   await new queryFlowHelper(vm, t)
  //     .setBefore(beforeApply)
  //     .setQuery(searchApplyData)
  //     .setAfter(afterSearchApply)
  //     .run()
  //   // Promise.all([ 
  //   //   // 메인 데이터 조회 (하단 그리드)
  //   //   commonSearchApi({ 
  //   //     queryId : 'SAFIG0010_SEARCH_04',
  //   //     param: popupParams }),
  //   // ]).then(res => {
  //   // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
  //   // console.log('세부내용',grdMain.value.getDataProvider().getJsonRows()) 
  //   // })
  // }else {
  //   Message.warn(t('점검 현황 추가 후 저장해주세요.'))
  // }
}

const setFile = () =>{
  detail = grdMain.value.getDataProvider().getJsonRows()
  detail.forEach((e , idx)=> {
  if(e.FILE_ATTACH_KEY){
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: e.FILE_ATTACH_KEY
    }
    commonSearchApi({ queryId: 'searchFile', param: param }).then(res2 => {
      // console.log('file search',res2.ORESULT_CUR[0])
      if(res2.ORESULT_CUR[0]!==undefined){
        let contentDisposition = null
        let fileName = null
        let blob = null
        let imageURL = null
        let file = null
        let fileType = null
        detail[idx].FILE = res2.ORESULT_CUR[0].FILE_URL
        commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(file => {
          // console.log('org flie type', typeof file)
          contentDisposition = file.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]
          fileType = fileName.split('.')
          if(fileType[1] === 'gif'){
            blob = new Blob([file],{type: 'image/gif'})
          }else if(fileType[1] === 'jpeg' || fileType[1] === 'jpg'){
            blob = new Blob([file],{type: 'image/jpeg'})
          }else if(fileType[1] === 'png'){
            blob = new Blob([file],{type: 'image/png'})
          }else if(fileType[1] === 'pdf'){
            blob = new Blob([file],{type: 'application/pdf'})
          }
          const reader = new FileReader()
          // reader.readAsDataURL(blob)
          // reader.onloadend = () => {
          //   const base64data = reader.result;
          //   // console.log('base64data',base64data);
          //   detail[idx].FILE = base64data
          // }
          const imageURL = URL.createObjectURL(file)
          // console.log('imageURL setFile',imageURL)
          //detail[idx].FILE = imageURL
        }).catch(err => {
          console.log(err)
        })
      }
    })
  }
  if(e.FIX_ATTACH_KEY){
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: e.FIX_ATTACH_KEY
    }
    commonSearchApi({ queryId: 'searchFile', param: param }).then(res2 => {
      // console.log('file search',res2.ORESULT_CUR[0])
      if(res2.ORESULT_CUR[0]!==undefined){
        let contentDisposition = null
        let fileName = null
        let blob = null
        let imageURL = null
        let file = null
        let fileType = null
        detail[idx].FIX_FILE = res2.ORESULT_CUR[0].FILE_URL
        
        commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(file => {
          // console.log('org flie', file)
          contentDisposition = file.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]
          fileType = fileName.split('.')
          if(fileType[1] === 'gif'){
            blob = new Blob([file],{type: 'image/gif'})
          }else if(fileType[1] === 'jpeg' || fileType[1] === 'jpg'){
            blob = new Blob([file],{type: 'image/jpeg'})
          }else if(fileType[1] === 'png'){
            blob = new Blob([file],{type: 'image/png'})
          }else if(fileType[1] === 'pdf'){
            blob = new Blob([file],{type: 'application/pdf'})
          }
          const reader = new FileReader()
          // reader.readAsDataURL(blob)
          // reader.onloadend = () => {
          //   const base64data = reader.result;
          //   // console.log('base64data',base64data);
          //   detail[idx].FIX_FILE = base64data
          // }
          const imageURL = URL.createObjectURL(file)
          // console.log('imageURL setFile',imageURL)
          //detail[idx].FIX_FILE = imageURL
          
        }).catch(err => {
          console.log(err)
        })
      }    
    })
  }
})
}
 
// 팝업 버튼
const onSubButtonsClick = (btn) => {
  if (btn.id === "btnCreate") {
    const saveParams = []
    saveParams.push({
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: popupParams.BSNS_CD,
        DEPT_CD: popupParams.DEPT_CD,
        COMP_CD: popupParams.COMP_CD,
        YEAR_DATE: popupParams.YEAR_DATE,
        MONTH_DATE: popupParams.MONTH_DATE,
        HALF_YEAR: popupParams.HALF_YEAR,
        USER_ID: userStore.userId,
      })
      // 그리드 날짜 범위 지정
    
    new saveFlowHelper(vm, t)
        .setQuery(addSubData,saveParams)
        .setAfter(() => {
          onSubButtonsClick({ id :'btnSearch' ,type: 'create'})
          
        })
        .showMessage(false)
        .run()

  } else if (btn.id === "btnSearch") {
    // console.log('popupParams',popupParams)
    popupParams.USER_ID = userStore.userId
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SAFIG0010_SEARCH_01',
        param: popupParams }),
    ]).then(res => {
    // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
    // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR.length)
      const updateIdx = grdSub.value.getGridView().getCurrent().dataRow
      grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      if(res[0].ORESULT_CUR.length>0){
        popupParams.EDIT_STATE = true
        // console.log('popupParams.EDIT_STATE',popupParams.EDIT_STATE)
        if(btn.type === 'create'){
          const idx = grdSub.value.getDataProvider().getRowCount()-1
          console.log('idx',idx)
          onCellClicked({},{dataRow: idx})
          grdSub.value.getGridView().setCurrent({dataRow: idx})
        }else if(btn.type === 'update'){
          onCellClicked({},{dataRow: updateIdx})
          grdSub.value.getGridView().setCurrent({dataRow: updateIdx})
        }else{
          onCellClicked({},{dataRow: 0})
          grdMain.value.getGridView().setFocus(0)
          grdSub.value.getGridView().setCurrent({dataRow: 0})
        }
      } else{
        grdMain.value.getDataProvider().clearRows()
        popupParams.EDIT_STATE = false
        // console.log('popupParams.EDIT_STATE',popupParams.EDIT_STATE)
        clear()
        searchHalfData()
      }
        
    })
  } else if (btn.id === "btnDelete") {
    if(delSubCheck()) {
      vm.$swal({
        title: t('삭제 하시겠습니까?'),
        showCancelButton: true,
      }).then(async (swalRes) => {
        if(swalRes.isConfirmed ) {
          const delFiles = []
          const delParams = []
          const delCheck = grdSub.value.getGridView().getCheckedRows()
          delCheck.forEach(element => {
            const data = grdSub.value.getRowData(element)
            delParams.push(data)
          })

          for(let i = 0; i < delParams.length; i++) {
            await commonSearchApi({ queryId: 'SAFIG0010_SEARCH_05', param: delParams[i] }).then(res => {
              const files = res.ORESULT_CUR

              for(let j = 0; j < files.length; j++) {
                delFiles.push({
                  CMPNY_DIV: files[j].CMPNY_DIV,
                  FILE_ID: files[j].FILE_ATTACH_KEY,
                })
              }
            })
          }

          commonExecuteApi({ queryId: "SAFIG0010_DELETE_01", list: delParams, }).then(async res => {
            await commonDeleteAllFilesApi(delFiles) 
            onSubButtonsClick({ id: "btnSearch" })
            Message.success('삭제 되었습니다.')
          })
        } 
      })
    }
    

    // new deleteFlowHelper(vm, t)
    //   .setBefore(delSubCheck)
    //   .setQuery(delSubData)
    //   .setAfter(async () => {
    //     const delFiles = []
    //     const delParams = []
    //     const delCheck = grdSub.value.getGridView().getCheckedRows()
    //     delCheck.forEach(element => {
    //       const data = grdSub.value.getRowData(element)
    //       delParams.push(data)
    //     })
    //     for(let i = 0; i < delParams.length; i++) {
    //       await commonSearchApi({ queryId: 'SAFIG0010_SEARCH_05', param: delParams[i] }).then(res => {
    //         const files = res.ORESULT_CUR

    //         for(let j = 0; j < files.length; j++) {
    //           delFiles.push({
    //             CMPNY_DIV: files[j].CMPNY_DIV,
    //             FILE_ID: files[j].FILE_ATTACH_KEY,
    //           })
    //         }
    //       })
    //     }
  
    //     await commonDeleteAllFilesApi(delFiles) 
    //     onSubButtonsClick({ id: "btnSearch" })
    //   })
    //   .run();
  }
}


const addSubData = (saveParams) => {
  return commonExecuteApi
  (
    { 
      queryId : 'SAFIG0010_SAVE_01'
    , list: saveParams 
    }
  )
}

//  그리드 버튼
const onGridButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    // console.log('popupParams',popupParams)
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SAFIG0010_SEARCH_02',
        param: popupParams }),
    ]).then(res => {
      // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      setFile()
      outThumbnail()
    })
  } else if (btn.id === "btnUpdate"&& CURRENT_ROW ) {
    // console.log('save active')
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(saveCheck)
      .setQuery(saveData)
      .setAfter((res) =>{ 
        // console.log('saveData res',res)
        // onGridButtonsClick({ id: "btnSearch" })
        onSubButtonsClick({id:'btnSearch', type:'update'})
      })
      .showMessage(false)
      .run();
  } else if (btn.id === "btnCreate" && CURRENT_ROW) {
    addData()
  } else if (btn.id === "btnDelete" && CURRENT_ROW) {
    if(delCheck()) {
      vm.$swal({
        title: t('삭제 하시겠습니까?'),
        showCancelButton: true,
      }).then((swalRes) => {
        if(swalRes.isConfirmed ) {
          const delParams = []
          const delFiles = []
          const delCheck = grdMain.value.getGridView().getCheckedRows()

          delCheck.forEach(element => {
            const data = grdMain.value.getRowData(element)
            delParams.push(data)
          })

          delCheck.forEach(element => {
            const data = grdMain.value.getRowData(element)
            delFiles.push({
              CMPNY_DIV: data.CMPNY_DIV,
              FILE_ID: data.FILE_ATTACH_KEY
            })
            delFiles.push({
              CMPNY_DIV: data.CMPNY_DIV,
              FILE_ID: data.FIX_ATTACH_KEY
            })
          });

          commonExecuteApi({ queryId: "SAFIG0010_DELETE_02", list: delParams, }).then(async res => {
            await commonDeleteAllFilesApi(delFiles)
            onGridButtonsClick({ id: "btnSearch" })
            clear()
            Message.success('삭제 되었습니다.')
          })
        }
      })
    }
    // new deleteFlowHelper(vm, t)
    //   .setBefore(delCheck)
    //   .setQuery(delData)
    //   .setAfter(async () => {
    //     let delFiles = []
    //     let delCheck = grdMain.value.getGridView().getCheckedRows()
        
    //     delCheck.forEach(element => {
    //       const data = grdMain.value.getRowData(element)
    //       delFiles.push({
    //         CMPNY_DIV: data.CMPNY_DIV,
    //         FILE_ID: data.FILE_ATTACH_KEY
    //       })
    //       delFiles.push({
    //         CMPNY_DIV: data.CMPNY_DIV,
    //         FILE_ID: data.FIX_ATTACH_KEY
    //       })
    //     });
        
        
    //     await commonDeleteAllFilesApi(delFiles)
    //     onGridButtonsClick({ id: "btnSearch" })
    //     clear()
    //   })
    //   .run();
  }
}
/* -------------- 조회 -------------- */
const searchDetail = () => {
  Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SAFIG0010_SEARCH_03',
        param: popupParams }),
    ]).then(res => {
      const data = res[0].ORESULT_CUR[0]
      popupParams.DEPT_EMP = data.DEPT_EMP
      popupParams.DEPT_OWNER = data.DEPT_OWNER
      popupParams.COMP_EMP = data.COMP_EMP
      popupParams.COMP_OWNER = data.COMP_OWNER
      popupParams.INSPECTION_DATE = data.INSPECTION_DATE
      popupParams.INSPECTION_PLACE = data.INSPECTION_PLACE
      popupParams.SUGGESTION = data.SUGGESTION
      
    })
}

/* -------------- 행 추가 -------------- */
// 행 추가
const addData = () => {
  // console.log('데이터 추가')
const cnt = grdMain.value.getDataProvider().getRowCount()
if(cnt < 5){
  const saveParams = []
  // grdMain.value.addRow({})
  // saveParams.push({
  //     CMPNY_DIV: popupParams.CMPNY_DIV,
  //     BSNS_CD: popupParams.BSNS_CD,
  //     DEPT_CD: popupParams.DEPT_CD,
  //     COMP_CD: popupParams.COMP_CD,
  //     YEAR_DATE: popupParams.YEAR_DATE,
  //     HALF_YEAR: popupParams.HALF_YEAR,
  //     ORG_SEQ: popupParams.SEQ,
  //     USER_ID: userStore.userId,
  //   })
  grdMain.value.addRow({
    CMPNY_DIV: popupParams.CMPNY_DIV,
      BSNS_CD: popupParams.BSNS_CD,
      DEPT_CD: popupParams.DEPT_CD,
      COMP_CD: popupParams.COMP_CD,
      YEAR_DATE: popupParams.YEAR_DATE,
      MONTH_DATE: popupParams.MONTH_DATE,
      HALF_YEAR: popupParams.HALF_YEAR,
      ORG_SEQ: popupParams.SEQ,
      SEQ: '',
      USER_ID: userStore.userId,   
      TEMP: cnt,    
  })
      // console.log('세부내용',grdMain.value.getDataProvider().getJsonRows()) 


  // new saveFlowHelper(vm, t)
  //   .setQuery(afterAdd,saveParams)
  //   .setAfter(() => onGridButtonsClick({ id :'btnSearch' }))
  //   .showMessage(false)
  //   .run()
}else{
  return Message.warn(t('5개까지 추가 가능합니다.'))
}
}

/* -------------- 저장 -------------- */
const save = () => {
  let saveParams = []
  saveParams.push(popupParams)
  // console.log('saveParams',saveParams)
  return commonExecuteApi({
    queryId: "SAFIG0010_SAVE_05",
    list: saveParams,
  });
}
// 메인데이터 저장 전
const beforeSave = () => {
  const date = dayjs(popupParams.INSPECTION_DATE)
  const maxDate = dayjs(popupParams.MAX_DATE)
  const minDate = dayjs(popupParams.MIN_DATE)
  if(minDate>date || date>maxDate){
    Message.err(`점검일자 범위를 벗어났습니다.(${popupParams.MIN_DATE} ~ ${popupParams.MAX_DATE})`)
    return false
  } 

  return true
}



//  그리드 데이터 저장 전
const saveCheck = async () => {
  let saveCheck = grdMain.value.getGridView().getCheckedRows()

  // if(!saveCheck.length>0){
  //   Message.warn("저장할 데이터를 선택해주세요.")
  //   return false;
  // }
  
  // console.log(delCheck, "delCheck");
  return true
};


// 그리드 데이터 저장 
const saveData = async () => {
  let saveParams = []
  let saveCheck = grdMain.value.getGridView().getCheckedRows()

  console.log('saveCheck',saveCheck)
  saveCheck.forEach(element => {
    const data = grdMain.value.getRowData(element)
    saveParams.push(data)
  })
  console.log('saveParams',saveParams)
  // console.log('저장 파라미터 ::: ', saveParams)
  return commonExecuteApi({
    queryId: "SAFIG0010_SAVE_04",
    list: saveParams,
  })
}

/* -------------- 삭제 -------------- */

const delSubCheck = () => {
  let delCheck = grdSub.value.getGridView().getCheckedRows()
  console.log(grdMain.value.getGridView().getJsonRows())
  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck");
  return true
}


const delSubData = async () => {
  const delParams = []
  const delCheck = grdSub.value.getGridView().getCheckedRows()
  delCheck.forEach(element => {
    const data = grdSub.value.getRowData(element)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFIG0010_DELETE_01",
    list: delParams,
  })
}
//  그리드 데이터 삭제 전
const delCheck = () => {
  let delCheck = grdMain.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck");
  return true
}


//  그리드 데이터 삭제 
const delData = async () => {
  let delParams = []
  let delCheck = grdMain.value.getGridView().getCheckedRows()

  delCheck.forEach(element => {
    const data = grdMain.value.getRowData(element)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFIG0010_DELETE_02",
    list: delParams,
  })
}

const afterAdd = (saveParams) => {
  return commonExecuteApi
  (
    { 
      queryId : 'SAFIG0010_SAVE_03'
    , list: saveParams 
    }
  )
}
 
// 이미지 추가 시 새로고침
const uploaded = (val) =>{
  // console.log(val)
  if(val.STATUS === 'update'){
    
    if(now_col === 'IMAGE_FILE'){
      grdMain.value.getDataProvider().setValue(now_row, 'FILE_NAME', val.fileId)
      grdMain.value.getGridView().commit()
      outThumbnail()
    } else if(now_col === 'FIX_IMAGE_FILE'){
      grdMain.value.getDataProvider().setValue(now_row, 'FIX_FILE_NAME', val.fileId)
      grdMain.value.getGridView().commit()
      outThumbnail()
    }
  }else if(val.STATUS === 'delete'){
    if(now_col === 'IMAGE_FILE'){
      grdMain.value.getDataProvider().setValue(now_row, 'IMAGE_FILE', '')
      grdMain.value.getDataProvider().setValue(now_row, 'FILE_NAME', '')
      grdMain.value.getGridView().commit()
    } else if(now_col === 'FIX_IMAGE_FILE'){
      grdMain.value.getDataProvider().setValue(now_row, 'FIX_FILE_NAME', '')
      grdMain.value.getDataProvider().setValue(now_row, 'FIX_IMAGE_FILE', '')
      grdMain.value.getGridView().commit()
    }
  }    
}


// 사진 업로드
const onCellDblClicked = (grid, clickData) =>{
  console.log('clickData',clickData)
  const selectRow = grdMain.value.getRowData(clickData.dataRow)
  let fileID = ''
  now_col = clickData.fieldName
  now_row = clickData.dataRow
  if(selectRow.SEQ){
    if(clickData.fieldName === 'IMAGE_FILE'){ 
      fileID = selectRow.FILE_ATTACH_KEY
      fileUploadPopup.value.setGuid()
      fileUploadPopup.value.openPopup(fileID)
    } else if(clickData.fieldName === 'FIX_IMAGE_FILE'){
      fileID = selectRow.FIX_ATTACH_KEY
      fileUploadPopup.value.setGuid()
      fileUploadPopup.value.openPopup(fileID)
    }
  }else{
    if(clickData.fieldName === 'IMAGE_FILE' || clickData.fieldName === 'FIX_IMAGE_FILE'){
      return Message.warn(t('새로 추가한 점검 현황 목록은 저장 후에 이미지 추가가 가능합니다.'))
    }
    
  }
}

const onCellItemClicked = (grid, index, clickData) =>{

  let fileID = ''
  const selectRow = grdMain.value.getRowData(clickData.dataRow)
  // console.log('clickData',clickData)
  if(clickData.target){
    if(clickData.target.id === 'imgUpload'){
      now_col = clickData.fieldName
      now_row = clickData.dataRow
      if(clickData.fieldName === 'IMAGE_FILE'){ 
        fileID = selectRow.FILE_ATTACH_KEY
        fileUploadPopup.value.setGuid()
        fileUploadPopup.value.openPopup(fileID)
      } else if(clickData.fieldName === 'FIX_IMAGE_FILE'){
        fileID = selectRow.FIX_ATTACH_KEY
        fileUploadPopup.value.setGuid()
        fileUploadPopup.value.openPopup(fileID)
      
      }
    }
  }
}

// 사진 업로드
const onCellClicked = async (grid, clickData) =>{
  if(clickData.cellType !== 'gridEmpty' && clickData.cellType !== 'head'
    && clickData.cellType !== 'check') {
    const selectRow = grdSub.value.getRowData(clickData.dataRow)
    
    CURRENT_ROW = true
    console.log('selectRow',selectRow)  
    popupParams.CMPNY_DIV = selectRow.CMPNY_DIV
    popupParams.DEPT_EMP = selectRow.DEPT_EMP
    popupParams.DEPT_OWNER = selectRow.DEPT_OWNER
    popupParams.COMP_EMP = selectRow.COMP_EMP
    popupParams.COMP_OWNER = selectRow.COMP_OWNER

    popupParams.DEPT_EMP_CD = selectRow.DEPT_EMP_CD
    popupParams.DEPT_OWNER_CD = selectRow.DEPT_OWNER_CD
    popupParams.COMP_EMP_CD = selectRow.COMP_EMP_CD
    popupParams.COMP_OWNER_CD = selectRow.COMP_OWNER_CD

    popupParams.DEPT_EMP_QR = selectRow.DEPT_EMP_QR
    popupParams.DEPT_OWNER_QR = selectRow.DEPT_OWNER_QR
    popupParams.COMP_EMP_QR = selectRow.COMP_EMP_QR
    popupParams.COMP_OWNER_QR = selectRow.COMP_OWNER_QR

    popupParams.DEPT_EMP_WEB = selectRow.DEPT_EMP_WEB
    popupParams.DEPT_OWNER_WEB = selectRow.DEPT_OWNER_WEB
    popupParams.COMP_EMP_WEB = selectRow.COMP_EMP_WEB
    popupParams.COMP_OWNER_WEB = selectRow.COMP_OWNER_WEB
    
    popupParams.COMP_OWNER_DEPT = selectRow.COMP_OWNER_DEPT
    popupParams.COMP_OWNER_BSNS = selectRow.COMP_OWNER_BSNS
    popupParams.DEPT_OWNER_DEPT = selectRow.DEPT_OWNER_DEPT
    popupParams.DEPT_OWNER_BSNS = selectRow.DEPT_OWNER_BSNS
    popupParams.INSPECTION_DATE = selectRow.INSPECTION_DATE
    popupParams.INSPECTION_DATE_ORG = selectRow.INSPECTION_DATE_ORG
    popupParams.INSPECTION_PLACE = selectRow.INSPECTION_PLACE
    popupParams.SUGGESTION = selectRow.SUGGESTION
    popupParams.SEQ = selectRow.SEQ

    popupParams.FILE_ATTACH_KEY2 = selectRow.FILE_ATTACH_KEY2
    // console.log('popupParams',popupParams)
    
    onGridButtonsClick({ id :'btnSearch' })  
    // console.log('selectRow.APPROVAL_YN_COD',selectRow.APPROVAL_YN)

    // console.log('popupParams.EDIT_STATE',popupParams.EDIT_STATE)

    // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    nextTick(() => {
      // setDisableYN()
      
      if(disableYN.value) {
        // console.log('aaa')
        menuTitle.value.disableBtn('btnUpdate', true)  
        menuTitle.value.disableBtn('btnReqApply', true)
        gridButton.value.disableBtn('btnCreate', true) 
        gridButton.value.disableBtn('btnUpdate', true)   
        gridButton.value.disableBtn('btnDelete', true)
        gridSubButton.value.disableBtn('btnCreate', true)
        gridSubButton.value.disableBtn('btnDelete', true)
        fileReadOnly.value = true
      } else {
        // console.log('bbb')
        gridSubButton.value.disableBtn('btnCreate', false)
        gridSubButton.value.disableBtn('btnDelete', false)

        // if(selectRow.APPROVAL_YN === 'B' || selectRow.APPROVAL_YN === 'C' || selectRow.APPROVAL_YN === 'Y' || selectRow.APPROVAL_YN === 'Z' || !popupParams.EDIT_STATE){
        if(selectRow.APPROVAL_YN === 'B' || selectRow.APPROVAL_YN === 'Y' || !popupParams.EDIT_STATE){
          // console.log('활성화')
          // console.log('ccc')
          menuTitle.value.disableBtn('btnUpdate', true)  
          menuTitle.value.disableBtn('btnReqApply', true)
          gridButton.value.disableBtn('btnCreate', true) 
          gridButton.value.disableBtn('btnUpdate', true)   
          gridButton.value.disableBtn('btnDelete', true) 
          fileReadOnly.value = true
        }else {
          // console.log('비활성화')
          // console.log('ddd')
          menuTitle.value.disableBtn('btnUpdate', false)   
          menuTitle.value.disableBtn('btnReqApply', false)  
          gridButton.value.disableBtn('btnCreate', false) 
          gridButton.value.disableBtn('btnUpdate', false)   
          gridButton.value.disableBtn('btnDelete', false)   
          fileReadOnly.value = false
        }
      }
      // console.log('eee')
      grdMain.value.getGridView().columnByName('WORK').editable     = !disableYN.value && !fileReadOnly.value
      grdMain.value.getGridView().columnByName('CONTENT').editable  = !disableYN.value && !fileReadOnly.value
      grdMain.value.getGridView().columnByName('FIX_DESC').editable = !disableYN.value && !fileReadOnly.value
      grdMain.value.getGridView().columnByName('WORK').styleName     = disableYN.value || fileReadOnly.value ? '' : 'editable_column'
      grdMain.value.getGridView().columnByName('CONTENT').styleName  = disableYN.value || fileReadOnly.value ? '' : 'editable_column'
      grdMain.value.getGridView().columnByName('FIX_DESC').styleName = disableYN.value || fileReadOnly.value ? '' : 'editable_column'
    })

    searchHalfData()
  }
}

/*-------------------- 사원 검색 팝업 --------------------*/
const openEmpPopup1 = () => {
  empPopup.value.openPopup({ 
    BSNS_CD: popupParams.BSNS_CD
    ,DEPT_CD: popupParams.DEPT_CD
    ,EMP_NM:  popupParams.DEPT_OWNER
    ,USER_DIV: 'A'})
  empState = 'DEPT_OWNER'
  empData_CD = 'DEPT_OWNER_CD'
  empData_BSNS = 'DEPT_OWNER_BSNS'
  empData_DEPT = 'DEPT_OWNER_DEPT'
}
const openEmpPopup2 = () => {
  console.log('popupParams',popupParams)
  empPopup.value.openPopup({ 
    BSNS_CD: popupParams.BSNS_CD
    ,DEPT_CD: popupParams.DEPT_CD 
    ,EMP_NM:  popupParams.DEPT_EMP
    ,USER_DIV: 'A'})
  empState = 'DEPT_EMP'
  empData_CD = 'DEPT_EMP_CD'
  empData_BSNS = 'DEPT_EMP_BSNS'
  empData_DEPT = 'DEPT_EMP_DEPT'
}
const openEmpPopup3 = () => {
  empPopup.value.openPopup({ 
    BSNS_CD: popupParams.BSNS_CD
    ,DEPT_CD: popupParams.DEPT_CD 
    ,EMP_NM:  popupParams.COMP_OWNER
    ,USER_DIV: 'B'})
  empState = 'COMP_OWNER'
  empData_CD = 'COMP_OWNER_CD'
  empData_BSNS = 'COMP_OWNER_BSNS'
  empData_DEPT = 'COMP_OWNER_DEPT'
}
const openEmpPopup4 = () => {
  console.log('popupParams',popupParams)
  empPopup.value.openPopup({ 
    BSNS_CD: popupParams.BSNS_CD
    ,DEPT_CD: popupParams.DEPT_CD 
    ,EMP_NM:  popupParams.COMP_EMP
    ,USER_DIV: 'B'})
  empState = 'COMP_EMP'
  empData_CD = 'COMP_EMP_CD'
  empData_BSNS = 'COMP_EMP_BSNS'
  empData_DEPT = 'COMP_EMP_DEPT'
}

const onEmpSelected = val => {
  console.log('select val',val)
  popupParams[empState] = val.EMP_NM
  popupParams[empData_CD] = val.EMP_NO
  popupParams[empData_BSNS] = val.BSNS_CD
  popupParams[empData_DEPT] = val.DEPT_CD
  
  console.log('popupParams', popupParams)
  // console.log('select type',popupParams[empState])
}


// 그리드 이미지 출력
const outThumbnail = async val  => {
  let rows = await grdMain.value.getDataProvider().getJsonRows()
  rows.forEach(async (e , idx)=> {
    // console.log('조치전 이미지 파일', e)
    if(e.FILE_NAME){
      // console.log('매칭 파일이 존재')
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: e.FILE_ATTACH_KEY
      }
      await commonSearchApi({ queryId: 'searchFile', param: param }).then(res2 => {
        // console.log('file data', res2.ORESULT_CUR[0])
        commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(file => {
          // console.log('commonDownloadFilesApi res', file)
          const blob = new Blob([file])
          const imageURL = URL.createObjectURL(blob)
          // console.log('imageURL',imageURL)
          grdMain.value.getDataProvider().setValue(idx, 'FILE_NAME', res2.ORESULT_CUR[0].FILE_TITLE)
          // grdMain.value.getGridView().commit()
          grdMain.value.getDataProvider().setValue(idx, 'IMAGE_FILE', imageURL)
          
          const selectRow = grdMain.value.getRowData(idx)
            // console.log('selectRow', selectRow)
        }).catch(err => {
          console.log(err)
        })
      })
    } 
  })
  rows.forEach(async (e , idx)=> {
    if(e.FIX_FILE_NAME){
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: e.FIX_ATTACH_KEY
      }
      await commonSearchApi({ queryId: 'searchFile', param: param }).then(res2 => {
        commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(file => {
          // console.log('fix file data', res2.ORESULT_CUR[0])
          const blob = new Blob([file])
          const imageURL = URL.createObjectURL(blob)
          grdMain.value.getDataProvider().setValue(idx, 'FIX_FILE_NAME', res2.ORESULT_CUR[0].FILE_TITLE)
          // grdMain.value.getGridView().commit()
          grdMain.value.getDataProvider().setValue(idx, 'FIX_IMAGE_FILE', imageURL)
          
          const selectRow = grdMain.value.getRowData(idx)
          // grdMain.value.getGridView().setColumnProperty('FIX_IMAGE_FILE' , 'renderer', {
          //   width: '250',
          //   type: 'image',
          //   imageField: 'FIX_IMAGE_FILE',
          //   imageHeight: 130,
          // })
          // grdMain.value.getGridView().commit()
          // grdMain.value.getDataProvider().setValue(idx, 'FIX_IMAGE_FILE', imageURL)
        }).catch(err => {
          console.log(err)
        })
      })
    } 
  })
}


// 장소 팝업
const locationPopupOpen = () => {
  locationPopup.value.openPopup(userStore.cmpnyDiv);
};
// 장소선택
const selectedLocation = (row) => {
  if(row[1].UP_COD === 'J'){
    popupParams.INSPECTION_PLACE = row[1].TXT
  } else{
    popupParams.INSPECTION_PLACE = row[2].TXT
  }
};
/*---------------결재 상신----------------*/

/* ------------- 클릭 이벤트 ------------- */
/* ------------- 결재 상신 전 필수 데이터 ------------- */
const beforeApply = async () => {
  
  const checkDate= popupParams.INSPECTION_DATE
  const checkPlace = popupParams.INSPECTION_PLACE
  let tempDate = ''
  let tempPlace = ''
  // if(checkDate === null || checkPlace === null){
  //   return Message.err("점검일자와 점검장소를 입력해주세요.")
  // }
  if(chkEmpty(checkDate) || chkEmpty(checkPlace)){
    return Message.err("점검일자와 점검장소를 입력해주세요.")
  } else{
    tempDate = checkDate.replace(/\s+/g, '')
    tempPlace = checkPlace.replace(/\s+/g, '')
    if(tempDate === '' || tempPlace === ''){
      return Message.err("점검일자와 점검장소를 입력해주세요.")
    }
  }
  if(!(grdMain.value.getDataProvider().getRowCount()>0)){
    return Message.err("점검사항이 없습니다.")
  }
  const date = dayjs(popupParams.INSPECTION_DATE)
  const maxDate = dayjs(popupParams.MAX_DATE)
  const minDate = dayjs(popupParams.MIN_DATE)
  if(minDate>date || date>maxDate){
    return Message.err("날짜 범위를 벗어났습니다.  "+popupParams.MIN_DATE+"~"+popupParams.MAX_DATE)
  }
  
  return true
}

const searchApplyData = () => {
  const params = {
    CMPNY_DIV: popupParams.CMPNY_DIV,
    YEAR_DATE: popupParams.YEAR_DATE,
    MONTH_DATE: popupParams.MONTH_DATE,
    HALF_YEAR: popupParams.HALF_YEAR,
    BSNS_CD: popupParams.BSNS_CD,
    DEPT_CD: popupParams.DEPT_CD,
    COMP_CD: popupParams.COMP_CD,
    SEQ: popupParams.SEQ,
  }
console.log('SAFIG0010_SEARCH_04',params)
  return commonSearchApi({ queryId : 'SAFIG0010_SEARCH_04', param: params })
}

const setHtml = async data => {
  let signList = []
  
  await commonSearchApi({
    queryId: "searchFile02",
    param: {
      CMPNY_DIV: popupParams.CMPNY_DIV,
      FILE_ID: popupParams.FILE_ATTACH_KEY2,
    } }).then(res => {
      signList = res.ORESULT_CUR
    })

  const mainData = _.cloneDeep(data)
  // console.log('mainData', mainData)
  Object.keys(mainData).forEach(key => {
    // console.log('mainData key', key)
    if(chkEmpty(mainData[key])) {
      mainData[key] = ''
    }
  })

  let html = ''

  html += `<table style="border-collapse: collapse; border: 1px solid #555555; word-break: break-all;">`
  html += `  <colgroup>`
  html += `    <col style="width: 125px;" />`
  html += `    <col style="width: 95px;" />`
  html += `    <col style="width: 92px;" />`
  html += `    <col style="width: 93px;" />`
  html += `    <col style="width: 32px;" />`
  html += `    <col style="width: 95px;" />`
  html += `    <col style="width: 61px;" />`
  html += `    <col style="width: 157px;" />`
  html += `  </colgroup>`
  html += `  <tbody>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 24px; font-weight: bold; background-color: #f0f0f0;" rowspan="3" colspan="4">합동안전보건점검 결과</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" rowspan="3">결<br/>재</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">안전확인</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">승인</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.APPROVAL_SAFE_NM}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.APPROVAL_HEAD_NM}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.APPROVAL_SAFE_DT}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.APPROVAL_HEAD_DT}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">작성자</td>`
  html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="7">${mainData.INSERT_USER_NM}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">점검일자</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.INSPECTION_DATE}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">점검장소</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="3">${mainData.INSPECTION_PLACE}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" rowspan="4">점검자</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">부서</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">대표 1인</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.DEPT_OWNER}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.DEPT_OWNER_QR}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.DEPT_NM}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">근로자 1인</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.DEPT_EMP}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.DEPT_EMP_QR}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">협력사</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">대표 1인</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.COMP_OWNER}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.COMP_OWNER_QR}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.COMP_NM}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="2">근로자 1인</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${mainData.COMP_EMP}</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;">${mainData.COMP_EMP_QR}</td>`
  html += `    </tr>`
  html += `    <tr style="height: 36px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">순</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="4">점검사항</td>`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;" colspan="3">조치결과</td>`
  html += `    </tr>`
  
  for(let i = 0; i < detail.length; i++) {
    html += `    <tr style="height: 36px;">`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" rowspan="3">${detail[i].SEQ}</td>`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">작업명</td>`
    html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="6">${detail[i].WORK}</td>`
    html += `    </tr>`
    html += `    <tr style="height: 134px;">`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="4">`
    html += `        <img alt=" " src=${detail[i].FILE} style="width: 100%; height: 100%;">`
    html += `      </td>`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="3">`
    html += `        <img alt=" " src=${detail[i].FIX_FILE} style="width: 100%; height: 100%;">`
    html += `      </td>`
    html += `    </tr>`
    html += `    <tr style="height: 36px;">`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">점검내용</td>`
    html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="3">${detail[i].CONTENT}</td>`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">조치내용</td>`
    html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="2">${detail[i].FIX_DESC}</td>`
    html += `    </tr>`
  }

  html += `    <tr style="height: 59px;">`
  html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">건의 및<br/>특이사항</td>`
  html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="7">${mainData.SUGGESTION}</td>`
  html += `    </tr>`

  if(signList.length > 0) {
    let signs = ''
    const basePath = 'https://hises.hd.com/HiSEsFiles/HSE/XX08/30_safety/SAF_I/SAFIG0010/'

    for(let i = 0; i < signList.length; i++) {
      signs += `<div><span style="color: #222222;">${(i + 1) + '. '}</span><a href="${basePath}${signList[i].FILE_NAME}" target="_blank" style="color: blue;">${signList[i].FILE_NAME_ORIGINAL}</a></div>`
    }

    html += `    <tr>`
    html += `      <td style="text-align: center; border: 1px solid #555555; padding: 0 6px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">서명지<br/>첨부</td>`
    html += `      <td style="text-align: left; border: 1px solid #555555; padding: 0 6px; font-size: 14px;" colspan="7">${signs}</td>`
    html += `    </tr>`
  }

  html += `  </tbody>`
  html += `</table>`

  return html
}

const afterSearchApply = async res => {
  const mainData = res.ORESULT_CUR[0]
  // console.log('mainData',mainData)
  codeList.APPROVAL_STATUS.forEach((e)=>{
    if(e.COD === mainData.APPROVAL_SAFE_YN){
      mainData.APPROVAL_SAFE_YN = e.TXT
    }
    if(e.COD === mainData.APPROVAL_HEAD_YN){
      mainData.APPROVAL_HEAD_YN = e.TXT
    }
    if(e.COD === mainData.APPROVAL_YN_COD){
      mainData.APPROVAL_YN = e.TXT
    }
  })
  
  // if(mainData.APPROVAL_YN_COD === 'Y'){
  //   mainData.APPROVAL_YN = '결재완료'
  // }
  if(res.length === 0){ 
      Message.warn('결재할 데이터가 없습니다.')
      return 
    }
    let d = `<html xmlns:v="urn:schemas-microsoft-com:vml"
              xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
              <head>
                <meta http-equiv=Content-Type content="text/html; charset=ks_c_5601-1987">
              <style >
              <!--table
                {mso-displayed-decimal-separator:"\.";
                mso-displayed-thousand-separator:"\,";}
              @page
                {margin:.75in .7in .75in .7in;
                mso-header-margin:.3in;
                mso-footer-margin:.3in;}
                tr
                  {mso-height-source:auto;
                  mso-ruby-visibility:none;}
                col
                  {mso-width-source:auto;
                  mso-ruby-visibility:none;}
                br
                  {mso-data-placement:same-cell;}
                ruby
                  {ruby-align:left;}
                .style0
                  {mso-number-format:General;
                  text-align:general;
                  vertical-align:middle;
                  white-space:nowrap;
                  mso-rotate:0;
                  mso-background-source:auto;
                  mso-pattern:auto;
                  color:black;
                  font-size:10.0pt;
                  font-weight:400;
                  font-style:normal;
                  text-decoration:none;
                  font-family:Arial, sans-serif;
                  mso-font-charset:0;
                  border:none;
                  mso-protection:locked visible;
                  mso-style-name:표준;
                  mso-style-id:0;}
                td
                  {mso-style-parent:style0;
                  padding-top:1px;
                  padding-right:1px;
                  padding-left:1px;
                  mso-ignore:padding;
                  color:black;
                  font-size:10.0pt;
                  font-weight:400;
                  font-style:normal;
                  text-decoration:none;
                  font-family:Arial, sans-serif;
                  mso-font-charset:0;
                  mso-number-format:General;
                  text-align:general;
                  vertical-align:middle;
                  border:none;
                  mso-background-source:auto;
                  mso-pattern:auto;
                  mso-protection:locked visible;
                  white-space:nowrap;
                  mso-rotate:0;}
                .xl65
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:1.0pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:1.0pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl66
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:1.0pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl67
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:1.0pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl68
                  {mso-style-parent:style0;
                  color:black;
                  font-size:12.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:1.0pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl69
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:1.0pt solid black;
                  border-right:1.0pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl70
                  {mso-style-parent:style0;
                  color:black;
                  font-size:12.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:1.0pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl71
                  {mso-style-parent:style0;
                  color:black;
                  font-size:12.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl72
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl73
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:1.0pt solid black;
                  border-left:1.0pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl74
                  {mso-style-parent:style0;
                  color:black;
                  font-size:18.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl75
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl76
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:1.0pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl77
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:1.0pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl78
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:1.0pt solid black;
                  border-bottom:1.0pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl79
                  {mso-style-parent:style0;
                  color:black;
                  font-family:굴림, monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  background:white;
                  mso-pattern:black none;}
                .xl80
                  {mso-style-parent:style0;
                  color:black;
                  font-size:12.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:1.0pt solid black;
                  border-bottom:none;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl81
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:none;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl82
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:none;
                  border-right:1.0pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl83
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:none;
                  border-bottom:.5pt solid black;
                  border-left:1.0pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl84
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-weight:700;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:none;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;}
                .xl85
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:.5pt solid black;
                  border-bottom:none;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl86
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:.5pt solid black;
                  border-right:none;
                  border-bottom:none;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl87
                  {mso-style-parent:style0;
                  color:black;
                  font-size:11.0pt;
                  font-family:"맑은 고딕", monospace;
                  mso-font-charset:129;
                  mso-number-format:"\@";
                  text-align:center;
                  border-top:none;
                  border-right:.5pt solid black;
                  border-bottom:.5pt solid black;
                  border-left:.5pt solid black;
                  background:white;
                  mso-pattern:black none;
                  white-space:normal;}
                .xl88
                  {mso-style-parent:style0;
                  text-align:center;
                  border:.5pt solid windowtext;}
                .xl89
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:.5pt solid windowtext;
                  border-right:none;
                  border-bottom:none;
                  border-left:none;}
                .xl90
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:.5pt solid windowtext;
                  border-right:1.0pt solid windowtext;
                  border-bottom:none;
                  border-left:none;}
                .xl91
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:.5pt solid windowtext;
                  border-right:none;
                  border-bottom:.5pt solid windowtext;
                  border-left:.5pt solid windowtext;}
                .xl92
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:none;
                  border-right:none;
                  border-bottom:.5pt solid windowtext;
                  border-left:.5pt solid windowtext;}
                .xl93
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:none;
                  border-right:none;
                  border-bottom:.5pt solid windowtext;
                  border-left:none;}
                .xl94
                  {mso-style-parent:style0;
                  text-align:center;
                  border-top:none;
                  border-right:1.0pt solid windowtext;
                  border-bottom:.5pt solid windowtext;
                  border-left:none;}
                .xl95
                  {mso-style-parent:style0;
                  font-family:돋움, monospace;
                  mso-font-charset:129;
                  text-align:center;
                  border:.5pt solid windowtext;}
                .xl96
                  {mso-style-parent:style0;
                  font-family:돋움, monospace;
                  mso-font-charset:129;
                  text-align:center;
                  border-top:.5pt solid windowtext;
                  border-right:none;
                  border-bottom:none;
                  border-left:.5pt solid windowtext;}
              -->
             
              </style>
              </head>       
            <body>
              

              
              <table border=0 cellpadding=0 cellspacing=0 width=777 style='border-collapse:
              collapse;table-layout:fixed;width:585pt'>
              <col width=64 style='mso-width-source:userset;mso-width-alt:2340;width:48pt'>
              <col width=89 span=8 style='mso-width-source:userset;mso-width-alt:3254;
              width:67pt'>
              <col width=1 style='mso-width-source:userset;mso-width-alt:36;width:1pt'>
              <tr height=26 style='mso-height-source:userset;height:20.1pt'>
                <td height=26 width=64 style='height:20.1pt;width:48pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=89 style='width:67pt'></td>
                <td width=1 style='width:1pt'></td>
              </tr>
              <tr height=72 style='mso-height-source:userset;height:54.6pt'>
                <td colspan=9 height=72 class=xl74 style='height:54.6pt'>합동안전보건점검 결과</td>
                <td></td>
              </tr>
              <tr height=52 style='mso-height-source:userset;height:39.2pt'>
                <td height=52 class=xl65 width=64 style='height:39.2pt;width:48pt'>작성자</td>
                <td class=xl66 style='border-left:none'>${mainData.INSERT_USER_NM}</td>
                <td class=xl67 width=89 style='border-left:none;width:67pt'>안전<br>
                  담당과장</td>
                <td class=xl66 style='border-left:none'>${mainData.APPROVAL_SAFE_NM}</td>
                <td class=xl68 style='border-left:none'>부서장</td>
                <td class=xl66 style='border-left:none'>${mainData.APPROVAL_HEAD_NM}</td>
                <td class=xl66 style='border-left:none'>결재중</td>
                <td class=xl68 style='border-left:none'>결재일자</td>
                <td class=xl69 width=89 style='border-left:none;width:67pt'>${mainData.APPROVAL_DT}</td>
                <td></td>
              </tr>
              <tr height=25 style='mso-height-source:userset;height:19.35pt'>
                <td rowspan=4 height=102 class=xl70 style='height:78.5pt;border-top:none'>점검자</td>
                <td rowspan=2 class=xl71 style='border-top:none'>부서</td>
                <td rowspan=2 class=xl71 style='border-top:none'>부서명</td>
                <td colspan=2 rowspan=2 class=xl75 width=178 style='width:134pt'>${mainData.DEPT_NM}</td>
                <td class=xl71 style='border-top:none;border-left:none'>대표 1인</td>
                <td class=xl72 style='border-top:none;border-left:none'>${mainData.DEPT_OWNER}</td>
                <td rowspan=2 class=xl71 style='border-top:none'>점검장소</td>
                <td rowspan=2 class=xl76 width=89 style='border-top:none;width:67pt'>${mainData.INSPECTION_PLACE}</td>
                <td></td>
              </tr>
              <tr height=26 style='mso-height-source:userset;height:19.9pt'>
                <td height=26 class=xl71 style='height:19.9pt;border-top:none;border-left:
                none'>근로자 1인</td>
                <td class=xl72 style='border-top:none;border-left:none'>${mainData.DEPT_EMP}</td>
                <td></td>
              </tr>
              <tr height=25 style='mso-height-source:userset;height:19.35pt'>
                <td rowspan=2 height=51 class=xl71 style='height:39.25pt;border-top:none'>협력사</td>
                <td rowspan=2 class=xl71 style='border-top:none'>협력사명</td>
                <td colspan=2 rowspan=2 class=xl75 width=178 style='width:134pt'>${mainData.COMP_NM}</td>
                <td class=xl71 style='border-top:none;border-left:none'>대표 1인</td>
                <td class=xl72 style='border-top:none;border-left:none'>${mainData.COMP_OWNER}</td>
                <td rowspan=2 class=xl71 style='border-top:none'>점검일</td>
                <td rowspan=2 class=xl76 width=89 style='border-top:none;width:67pt'>${mainData.INSPECTION_DATE}</td>
                <td></td>
              </tr>
              <tr height=26 style='mso-height-source:userset;height:19.9pt'>
                <td height=26 class=xl71 style='height:19.9pt;border-top:none;border-left:
                none'>근로자 1인</td>
                <td class=xl72 style='border-top:none;border-left:none'>${mainData.COMP_EMP}</td>
                <td></td>
              </tr>
              <tr height=25 style='mso-height-source:userset;height:19.15pt'>
                <td height=25 class=xl70 style='height:19.15pt;border-top:none'>순</td>
                <td colspan=4 class=xl71 style='border-left:none'>점검 사항</td>
                <td colspan=4 class=xl80 style='border-left:none'>조치 결과</td>
                <td></td>
              </tr>
`

    // console.log('detail FILE',detail[0].FILE)
    // console.log('detail FILE',typeof detail[0].FILE)
    for (let i=0;i<detail.length;i++){
      // console.log('detail[i].FILE',detail[i].FILE)
      const seq = i+1
      // console.log('detail[', i ,'].FIX_FILE',detail[i].FIX_FILE)// blob 형태
      d+=`
      <tr height=22 style='mso-height-source:userset;height:16.5pt'>
        <td rowspan=3 height=197 class=xl77 style='height:148.75pt;border-top:none'>${seq}</td>
        <td class=xl84 style='border-top:none;border-left:none'>작업명</td>
        <td colspan=3 class=xl85 width=267 style='border-left:none;width:201pt'>${detail[i].WORK}</td>
        <td colspan=4 rowspan=2 class=xl96 style='border-right:1.0pt solid black;
        border-bottom:.5pt solid black'><img alt=" " src=${detail[i].FIX_FILE} style="width: 100%;height: 100%;"></td></td>
        <td></td>
      </tr>
      <tr height=132 style='mso-height-source:userset;height:99.4pt'>
        <td colspan=4 height=132 class=xl95 style='height:99.4pt;border-left:none'><img alt=" " src=${detail[i].FILE} style="width: 100%;height: 100%;"> </td>
        <td></td>
      </tr>
      <tr height=43 style='mso-height-source:userset;height:32.85pt'>
        <td height=43 class=xl81 width=89 style='height:32.85pt;border-left:none;
        width:67pt'>점검<br>
          내용</td>
        <td colspan=3 class=xl87 width=267 style='border-left:none;width:201pt'>${detail[i].CONTENT}</td>
        <td class=xl81 width=89 style='border-left:none;width:67pt'>조치<br>
          내용</td>
        <td colspan=3 class=xl82 width=267 style='border-left:none;width:201pt'>${detail[i].FIX_DESC}</td>
        <td></td>
      </tr>
      `
    }
    d+=`
    <tr height=89 style='mso-height-source:userset;height:66.95pt'>
      <td height=89 class=xl73 width=64 style='height:66.95pt;border-top:none;
      width:48pt'>건의 및<br>
        특이사항</td>
      <td colspan=8 class=xl78 width=712 style='border-left:none;width:536pt'>${mainData.SUGGESTION}</td>
      <td></td>
    </tr>
    <tr height=461 style='mso-height-source:userset;height:346.15pt'>
      <td height=461 colspan=10 style='height:346.15pt;mso-ignore:colspan'></td>
    </tr>
    <tr height=26 style='mso-height-source:userset;height:19.9pt'>
      <td colspan=10 height=26 class=xl79 style='height:19.9pt'>1/1</td>
    </tr>
    <![if supportMisalignedColumns]>
    <tr height=0 style='display:none'>
      <td width=64 style='width:48pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=89 style='width:67pt'></td>
      <td width=1 style='width:1pt'></td>
    </tr>
    <![endif]>
    </table>

    </body>
 
    </html>`

  const reportHtml = await setHtml(mainData)
  await approvalPopup.value.openPopup({
    CLSS_ID: logsStore.vueId,
    TITLE: '합동안전보건점검 관리',
    CMPNY_DIV : userStore.cmpnyDiv,
    DATA_KEY : userStore.cmpnyDiv + ';' + userStore.bsnsCd + ';' + userStore.deptCd + ';'+ userStore.asgnCd + ';' + new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
    // DATA_KEY : 'HHI;AX00;X0Q0;X0Q0;2023',
    REPORT : reportHtml,//d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE : 'CLR_15', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

/* ------------ 결재 후 결재라인 가져오기 저장 ------------ */
const approvalClrLine = val => {
  console.log('approvalClrLine',val)
  console.log('val.appKey',val.appKey)
  const clrLine = val.clrLine.split(';')
  console.log('clrLine',clrLine)
  popupParams.USER_SAFE_ID = clrLine[0]
  popupParams.USER_HEAD_ID = clrLine[1]
  popupParams.APPROVE_ID = val.APPROVAL_ID
  let temp={
    CMPNY_DIV: popupParams.CMPNY_DIV,
    BSNS_CD: popupParams.BSNS_CD,
    DEPT_CD: popupParams.DEPT_CD,
    COMP_CD: popupParams.COMP_CD,
    YEAR_DATE: popupParams.YEAR_DATE,
    MONTH_DATE: popupParams.MONTH_DATE,
    HALF_YEAR: popupParams.HALF_YEAR,
    SEQ: popupParams.SEQ,
    USER_ID: userStore.userId,
    USER_SAFE_ID: clrLine[0],
    USER_HEAD_ID: clrLine[1],
    APPROVE_ID: val.appkey,   
  }
  let saveParam = []
  saveParam.push(temp)
  console.log('saveParam',saveParam)
  commonExecuteApi({ queryId : 'SAFIG0010_SAVE_06', list: saveParam })
}

const openPdf = () => {
  fileUploadPopup2.value.openPopup(popupParams.FILE_ATTACH_KEY2)
}

watch(
  () => popupParams.EDIT_STATE,
  (newValue, oldValue) => {
    // console.log('newValue',newValue)
    // console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
    // console.log('disableYN.value2', disableYN.value)
    if(disableYN.value) {
      // console.log('aaa2')
      title.subTitle = (popupParams.MONTH_DATE * 1) + '월 등록 리스트'
      // isReadOnly.value = true
      menuTitle.value.disableBtn('btnUpdate', true)  
      menuTitle.value.disableBtn('btnReqApply', true)
      gridButton.value.disableBtn('btnCreate', true)
      gridButton.value.disableBtn('btnUpdate', true)
      gridButton.value.disableBtn('btnDelete', true)
      gridSubButton.value.disableBtn('btnCreate', true)
      gridSubButton.value.disableBtn('btnDelete', true)
      fileReadOnly.value = true
    } else {
      // console.log('bbb2')
      gridSubButton.value.disableBtn('btnCreate', false)
      gridSubButton.value.disableBtn('btnDelete', false)

      if(!newValue) {
        // console.log('ccc2')
        title.subTitle = (popupParams.MONTH_DATE * 1) + '월 등록 리스트 (리스트를 먼저 추가해주세요)'
        // isReadOnly.value = true
        menuTitle.value.disableBtn('btnUpdate', true)  
        menuTitle.value.disableBtn('btnReqApply', true)
        gridButton.value.disableBtn('btnCreate', true)
        gridButton.value.disableBtn('btnUpdate', true)
        gridButton.value.disableBtn('btnDelete', true)
        fileReadOnly.value = true
      } else {
        // console.log('ddd2')
        title.subTitle = (popupParams.MONTH_DATE * 1) + '월 등록 리스트'
        // isReadOnly.value = false
        menuTitle.value.disableBtn('btnUpdate', false)   
        menuTitle.value.disableBtn('btnReqApply', false)  
        gridButton.value.disableBtn('btnCreate', false) 
        gridButton.value.disableBtn('btnUpdate', false)   
        gridButton.value.disableBtn('btnDelete', false)   
        fileReadOnly.value = false
      }
    }
  }
)

const attendChk = gbn => {
  vm.$swal({
    title: t('참석 처리를 하시면 활동 점검반 구성원 수정이 불가능합니다.<br/>참석 처리 하시겠습니까?'),
    showCancelButton: true,
  }).then(async (swalRes) => {
    if(swalRes.isConfirmed ) {
      const attendParam = [
        {
          CMPNY_DIV: popupParams.CMPNY_DIV,
          BSNS_CD: popupParams.BSNS_CD,
          DEPT_CD: popupParams.DEPT_CD,
          COMP_CD: popupParams.COMP_CD,
          YEAR_DATE: popupParams.YEAR_DATE,
          MONTH_DATE: popupParams.MONTH_DATE,
          HALF_YEAR: popupParams.HALF_YEAR,
          SEQ: popupParams.SEQ,
          GBN: gbn
        }
      ]

      commonExecuteApi({ queryId: 'SAFIG0010_SAVE_08', list: attendParam, }).then(async res => {
        onSubButtonsClick({ id: 'btnSearch', type: 'update' })
        Message.success('참석처리 되었습니다.')
      })
    }
  })
}

const clearAttend = gbn => {
  popupParams[`${gbn}`] = ''
  popupParams[`${gbn}_CD`] = ''
  popupParams[`${gbn}_BSNS`] = ''
  popupParams[`${gbn}_DEPT`] = ''
}

const sampleDown = () => {
  const sampleParam = {
    FILE_PATH: 'SAFI',
    FILE_NAME: '합동안전보건점검 서명지 양식.xlsx',
  }

  commonSampleDownFilesApi(sampleParam)
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1400"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">합동 안전보건점검 결과 등록</div>
    <VContainer style="background-color: white;">
      <v-card class="pa-1 fill-height">
        <v-card-title class="pa-0" style="position: relative;">
          <v-btn
            style="position: absolute; bottom: 10px; left: 0;"
            @click.stop="fileUploadPopup3.openPopup(popupParams.PDF_KEY)"
            :disabled="popupParams.PDF_CNT * 1 < 1"
          >
            기존 PDF보기
          </v-btn>
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                style="position: absolute; bottom: 10px; left: 110px; cursor: pointer;"
              >
                mdi-help-circle-outline
              </v-icon>
            </template>
            <span>등록된 파일이 있는 경우 활성화됩니다.</span>
          </v-tooltip>
          <IGridTitle
            ref="menuTitle"
            :title="$t('')"
            :button-list="['btnUpdate','btnPrint' ,'btnReqApply','btnClose']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <v-card-text class="pa-2 pt-0 content-area">
          <div class="fill-height" style="display: flex;">
          <v-sheet width="45%" class="fill-height" style="padding-right: 8px;">
            <IGridTitle
              ref="gridSubButton"
              :title="$t(title.subTitle)"
              :button-list="['btnCreate','btnDelete']"
              @click-button="onSubButtonsClick"
            />
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCellClicked="onCellClicked"
              style="min-height: 150px;"
            />
            <IGridTitle
              class="ma-0 mt-2 pa-0"
              :title="`월별 등록현황(${popupParams.YEAR_DATE}년 ${popupParams.HALF_YEAR === 'A' ? '상' : '하'}반기)`"
            />
            <table class="table-main">
              <colgroup>
                <col style="width: 25%;" />
                <col style="width: 25%;" />
                <col style="width: 25%;" />
                <col style="width: 25%;" />
              </colgroup>
              <tbody>
                <tr>
                  <th>년 - 월</th>
                  <th>점검 일지<br/>등록 여부</th>
                  <th>결재 상태</th>
                  <th>비고</th>
                </tr>
                <tr v-for="(item, idx) in halfData" :key="`halfdata_${idx}`">
                  <td class="text-center">
                    {{ `${item.YEAR_DATE_REAL}년 ${item.MONTH_DATE}월` }}
                  </td>
                  <td class="text-center">
                    {{ item.REG_YN }}
                  </td>
                  <td class="text-center">
                    {{ item.APPROVAL_YN }}
                  </td>
                  <td class="text-center">

                  </td>
                </tr>
              </tbody>
            </table>
          </v-sheet>
          <v-sheet width="55%" class="fill-height">
          <!-- 기본 정보 -->
            <v-sheet class="searchArea flex-column pa-0">
              <div class="d-flex px-3 mt-3">
                <i-input
                  :label="$t('사업부')"
                  v-model="popupParams.BSNS_NM"
                  width="200px"
                  :disabled="true"
                />
                <i-input
                  :label="$t('부서')"
                  v-model="popupParams.DEPT_NM"
                  width="225px"
                  :disabled="true"
                />
                <i-input
                  :label="$t('협력사')"
                  v-model="popupParams.COMP_NM"
                  width="250px"
                  margin="0"
                  :disabled="true"
                />
              </div>
              <div class="d-flex px-3 mt-2 mb-3">
                <i-input
                  :label="$t('점검일자')"
                  v-model="popupParams.INSPECTION_DATE"
                  type="date"
                  :min="popupParams.MIN_DATE" 
                  :max="popupParams.MAX_DATE" 
                  :disabled="disableYN"
                  width="340px"
                  required
                />
                <i-input
                  :label="$t('점검장소')"
                  v-model="popupParams.INSPECTION_PLACE"
                  @click:appendInner="locationPopupOpen"
                  append-inner-icon="mdi-magnify"
                  margin="0"
                  :disabled="disableYN"
                  width="355px"
                  required
                />
              </div>
            </v-sheet>
          <!-- 활동 점검반 -->
            <v-sheet class="searchArea flex-column">
              <IGridTitle title="활동점검반" style="position: relative;">
                <template #editors>
                  <div style="position: absolute; top: 0; right: 0;">
                    <v-btn @click.stop="sampleDown">
                      서명지 다운로드
                    </v-btn>
                    <v-tooltip>
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" @click.stop="openPdf">
                          서명지 첨부
                        </v-btn>
                      </template>
                      <span>QR코드 등록 불가시 인원 지정 및 참석 버튼을 클릭하고 서명지 첨부 해주세요.</span>
                    </v-tooltip>
                  </div>
                </template>
              </IGridTitle>
              <table class="table-main">
                <colgroup>
                  <col style="width: 12%;" />
                  <col style="width: 13%;" />
                  <col style="width: 25%;" />
                  <col style="width: 12%;" />
                  <col style="width: 13%;" />
                  <col style="width: 38%;" />
                </colgroup>
                <tbody>
                  <tr>
                    <th rowspan="3">
                      부서 대표자
                    </th>
                    <td colspan="2">
                      <div class="d-flex align-center">
                        <VTextField
                          v-model="popupParams.DEPT_OWNER"
                          append-inner-icon="mdi-magnify"
                          @click:appendInner="openEmpPopup1()"
                          @click:clear="clearAttend('DEPT_OWNER')"
                          @keydown.enter="openEmpPopup1()"
                          clearable
                          persistent-clear
                          :disabled="disableYN||!chkEmpty(popupParams.DEPT_OWNER_QR)||!chkEmpty(popupParams.DEPT_OWNER_WEB)"
                        />
                        <v-btn :disabled="disableYN||!chkEmpty(popupParams.DEPT_OWNER_QR)||!chkEmpty(popupParams.DEPT_OWNER_WEB)||chkEmpty(popupParams.DEPT_OWNER)" @click.stop="attendChk('DEPT_OWNER')">
                          참석
                        </v-btn>
                      </div>
                    </td>
                    <th rowspan="3">
                      해당 부서<br/>근로자 1인
                    </th>
                    <td colspan="2">
                      <div class="d-flex align-center">
                        <VTextField
                          v-model="popupParams.DEPT_EMP"
                          append-inner-icon="mdi-magnify"
                          @click:appendInner="openEmpPopup2()"
                          @click:clear="clearAttend('DEPT_EMP')"
                          @keydown.enter="openEmpPopup2()"
                          clearable
                          persistent-clear
                          :disabled="disableYN||!chkEmpty(popupParams.DEPT_EMP_QR)||!chkEmpty(popupParams.DEPT_EMP_WEB)"
                        />
                        <v-btn :disabled="disableYN||!chkEmpty(popupParams.DEPT_EMP_QR)||!chkEmpty(popupParams.DEPT_EMP_WEB)||chkEmpty(popupParams.DEPT_EMP)" @click.stop="attendChk('DEPT_EMP')">
                          참석
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      참석여부
                    </th>
                    <td>
                      {{ !chkEmpty(popupParams.DEPT_OWNER_QR) || !chkEmpty(popupParams.DEPT_OWNER_WEB) ? '참석' : '미참석' }}
                    </td>
                    <th>
                      참석여부
                    </th>
                    <td>
                      {{ !chkEmpty(popupParams.DEPT_EMP_QR) || !chkEmpty(popupParams.DEPT_EMP_WEB) ? '참석' : '미참석' }}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      QR체크일시
                    </th>
                    <td>
                      {{ chkEmpty(popupParams.DEPT_OWNER_WEB) ? (chkEmpty(popupParams.DEPT_OWNER_QR) ? '-' : popupParams.DEPT_OWNER_QR) : '수기 참석 등록' }}
                    </td>
                    <th>
                      QR체크일시
                    </th>
                    <td>
                      {{ chkEmpty(popupParams.DEPT_EMP_WEB) ? (chkEmpty(popupParams.DEPT_EMP_QR) ? '-' : popupParams.DEPT_EMP_QR) : '수기 참석 등록' }}
                    </td>
                  </tr>
                  <tr>
                    <th rowspan="3">
                      협력사 대표
                    </th>
                    <td colspan="2">
                      <div class="d-flex align-center">
                        <VTextField
                          v-model="popupParams.COMP_OWNER"
                          append-inner-icon="mdi-magnify"
                          @click:appendInner="openEmpPopup3()"
                          @click:clear="clearAttend('COMP_OWNER')"
                          @keydown.enter="openEmpPopup3()"
                          clearable
                          persistent-clear
                          :disabled="disableYN||!chkEmpty(popupParams.COMP_OWNER_QR)||!chkEmpty(popupParams.COMP_OWNER_WEB)"
                        />
                        <v-btn :disabled="disableYN||!chkEmpty(popupParams.COMP_OWNER_QR)||!chkEmpty(popupParams.COMP_OWNER_WEB)||chkEmpty(popupParams.COMP_OWNER)" @click.stop="attendChk('COMP_OWNER')">
                          참석
                        </v-btn>
                      </div>
                    </td>
                    <th rowspan="3">
                      협력사<br/>근로자 1인
                    </th>
                    <td colspan="2">
                      <div class="d-flex align-center">
                        <VTextField
                          v-model="popupParams.COMP_EMP"
                          append-inner-icon="mdi-magnify"
                          @click:appendInner="openEmpPopup4()"
                          @click:clear="clearAttend('COMP_EMP')"
                          @keydown.enter="openEmpPopup4()"
                          clearable
                          persistent-clear
                          :disabled="disableYN||!chkEmpty(popupParams.COMP_EMP_QR)||!chkEmpty(popupParams.COMP_EMP_WEB)"
                        />
                        <v-btn :disabled="disableYN||!chkEmpty(popupParams.COMP_EMP_QR)||!chkEmpty(popupParams.COMP_EMP_WEB)||chkEmpty(popupParams.COMP_EMP)" @click.stop="attendChk('COMP_EMP')">
                          참석
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      참석여부
                    </th>
                    <td>
                      {{ !chkEmpty(popupParams.COMP_OWNER_QR) || !chkEmpty(popupParams.COMP_OWNER_WEB) ? '참석' : '미참석' }}
                    </td>
                    <th>
                      참석여부
                    </th>
                    <td>
                      {{ !chkEmpty(popupParams.COMP_EMP_QR) || !chkEmpty(popupParams.COMP_EMP_WEB) ? '참석' : '미참석' }}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      QR체크일시
                    </th>
                    <td>
                      {{ chkEmpty(popupParams.COMP_OWNER_WEB) ? (chkEmpty(popupParams.COMP_OWNER_QR) ? '-' : popupParams.COMP_OWNER_QR) : '수기 참석 등록' }}
                    </td>
                    <th>
                      QR체크일시
                    </th>
                    <td>
                      {{ chkEmpty(popupParams.COMP_EMP_WEB) ? (chkEmpty(popupParams.COMP_EMP_QR) ? '-' : popupParams.COMP_EMP_QR) : '수기 참석 등록' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-sheet>
            <div class="h-grow">
              <v-sheet class="h-auto">
                <IGridTitle
                  ref="gridButton"
                  :button-list="['btnCreate','btnDelete']"
                  :title="$t('점검 현황')"
                  @click-button="onGridButtonsClick"
                />
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  :column-layout="grdMainProps.columnLayout"
                  @onCellDblClicked="onCellDblClicked"
                  @onCellItemClicked="onCellItemClicked"
                /> 
                <div class="mt-2">
                <div style="font-size: 16px; color: #000000; font-weight: 700;">건의 및 특이사항</div>
                  <div>
                    <VTextarea
                      v-model="popupParams.SUGGESTION"
                      :readonly="disableYN"
                      class="formTextArea"
                      rows="2"
                      bg-color="#EFF8FD"
                      dense
                      outlined
                      style="height: 70px;"
                    />
                  </div>
                </div>
              </v-sheet>
            </div>
          </v-sheet>
          </div>
        </v-card-text>
      </v-card>    
      </VContainer>
      <!-- 리포트 -->
      <ApprovalPopup ref="approvalPopup" 
      @approvalClrLine="approvalClrLine"/>    
  </VDialog>
  <IUploadPopup
    ref="fileUploadPopup"
    @uploaded="uploaded"
    :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
    :autoUpload="true"
    :fileDan="true"
    :img-only="true"
    :read-only="fileReadOnly"
  />
  <IUploadPopup2
    ref="fileUploadPopup2"
    :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
    :autoUpload="true"
    :img-only=true
    :read-only="fileReadOnly"
  />
  <IUploadPopup2
    ref="fileUploadPopup3"
    :buttonList="['btnDownLoad', 'btnClose']"
    :img-only=true
    read-only
  />
  <EmpPopup
    ref="empPopup"
    @selected="onEmpSelected"
  ></EmpPopup>
  <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" />
  <!-- 리포트 -->
  <OZReport
        :showPop="showOz"
        :reportName="reportName"
        :params="params"
        @close="showOz = $event"
      />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 170px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.table-main {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #cccccc;

  th, td {
    border: 1px solid #cccccc;
    color: #000000de;
    padding: 4px;
  }

  th {
    background-color: #e0e0e0;
  }
  
  tr:nth-child(1), tr:nth-child(4) {
    th {
      background-color: #deeaf6;
    }
  }
}
</style>
