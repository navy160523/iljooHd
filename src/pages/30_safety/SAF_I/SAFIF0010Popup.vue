
<!--
  화면명 : SAFIF0010Popup
  화면개요 : 회의록작성 팝업
  작성자 : 조영문
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly } from "vue"
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
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from "dayjs"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUpload from "@/components/IUpload.vue"
import Message from "@hiway/utils/notify"
import OZReport from "@/components/OZReport.vue"            // 오즈 리포트
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import SubEmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업
// import VendPopup from '@/components/popup/VendPopup.vue'
import VendPopup from "./SAFIF0010VendPopup.vue"


import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js"

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed","upDataRow"])
const userStore = useUserStore()

const menuTitle = ref(null)
const refOpiButton = ref(null)

const fileUpload = ref(null)
const subEmpPopup = ref(null)
const vendPopup = ref(null)
const deptPopup = ref(null)

let path = useLogsStore().path.split('/')
let menuId = path[path.length -1] 
let rendererState = true
let vendList = reactive([]) 

const dialog = ref(null)
const vendPopupParams = ref({})
const approvalPopup = ref(null) // 결재
const readonlyYn = ref(true) // 회의 등록 후 세부 내용 비활성화
const popupHeight = ref('') // 회의 등록 여부 높이 조절

// 리포트
const showOz = ref(false)
const reportName = ref('')
const params = ref([])

const empName = ref(null)

let attendMembers = reactive({
  EMP_NM: [],
  EMP_NO: []
  }
)

let applyData= []

const popupParams = ref({
  value:{
    MEET_DATE: '',
    MEET_TIME: '',
    MEETING_PLACE: '',
    MEET_ORG_NM: '',
    MEET_ORG: '',
    MEET_FILEID: '',
    UPDATE_USER_ID: '',
    UPDATE_DATE: '',
    MEET_CONT: '',
    MEET_NO: null,
    APPROVAL_STATUS: '',
    BSNS_CD: '',
    BSNS_NM: '',
    SECTOR_CD: '',
    SECTOR_NM: '',
    PART_CD: '',
    PART_NM: '',
  }
})
//코드리스트 선언부 시작
const codeList = reactive({
  OPINION_DIV: [
    {COD: '', TXT: '선택'},
    {COD: 'A', TXT: '설비·기계'},
    {COD: 'B', TXT: '휴대용 기계기구, 수공구, 치공구/지그류'},
    {COD: 'C', TXT: '줄걸이 용구'},
    {COD: 'D', TXT: '자재/부재, 부품, 부속물 및 재료'},
    {COD: 'E', TXT: '비계(발판), 작업대, 구조물, 통로'},
    {COD: 'F', TXT: '운반·보관 요구,용기 및 기구'},
    {COD: 'G', TXT: '소방·피난시설'},
    {COD: 'H', TXT: '화학물질 및 화학제품'},
    {COD: 'I', TXT: '교통수단'},
    {COD: 'J', TXT: '사람, 동·식물'},
    {COD: 'K', TXT: '작업환경, 대기여건 등 자연현상'},
    {COD: 'L', TXT: '보호구'},
    {COD: 'Z', TXT: '기타'},
  ], // 사업부 목록
  OPINION_DETAIL: [
    [
    {COD: '', TXT: '선택'},
    {COD: 'A1',TXT: '제조 및 가공설비·기계'},
    {COD: 'A2',TXT: '운반, 인양 설비·기계'},
    {COD: 'A3',TXT: '건설 기계'},
    {COD: 'A4',TXT: '전기 설비'},
    {COD: 'A5',TXT: '가스 설비'},
    {COD: 'A6',TXT: '환기 설비'},
    {COD: 'A7',TXT: '기타 설비·기계'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'B1',TXT: '휴대용 공구'},
    {COD: 'B2',TXT: '산업용 로봇'},
    {COD: 'B3',TXT: '수공구, 치공구/지그류'},
    {COD: 'B4',TXT: '기타 휴대용 기계기구, 수공구, 치공구/지그류'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'C1',TXT: '줄걸이 용구'},
    {COD: 'C2',TXT: '자재/부재'},
    {COD: 'C3',TXT: '조각,파편,쓰레기'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'D1',TXT: '설비·기계기구 부품 및 부속물'},
    {COD: 'D2',TXT: '서포트'},
    {COD: 'D3',TXT: '기타 자재/부재, 부품, 부속물 및 재료'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'E1',TXT: '비계(발판) 및 작업발판'},
    {COD: 'E2',TXT: '임시통로'},
    {COD: 'E3',TXT: '계단, 사다리, 작업대'},
    {COD: 'E4',TXT: '단부 및 개구부'},
    {COD: 'E5',TXT: '통로, 바닥 및 표면 등'},
    {COD: 'E6',TXT: '동력문'},
    {COD: 'E7',TXT: '기타 건물·구조물 등'},
    {COD: 'E8',TXT: '기타 비계(발판), 작업대, 구조물, 통로'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'F1',TXT: '운반 용구 및 기구'},
    {COD: 'F2',TXT: '툴박스'},
    {COD: 'F3',TXT: '보일러, 압력용기'},
    {COD: 'F4',TXT: '기타 운반·보관 요구, 용기 및 기구'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'G1',TXT: '소방시설'},
    {COD: 'G2',TXT: '피난시설'},
    {COD: 'G3',TXT: '기타 소방·피난시설'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'H1',TXT: '산류'},
    {COD: 'H2',TXT: '알카리류'},
    {COD: 'H3',TXT: '방향족 및 지방족 탄화수소'},
    {COD: 'H4',TXT: '할로겐 및 할로겐화합물'},
    {COD: 'H5',TXT: '그 밖의 화학물질'},
    {COD: 'H6',TXT: '금속미립자, 미량원소, 분진, 흄'},
    {COD: 'H7',TXT: '화학제품'},
    {COD: 'H8',TXT: '기타 화학물질 및 화학제품'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'I1',TXT: '육상교통수단'},
    {COD: 'I2',TXT: '항공, 수상교통수단'},
    {COD: 'I3',TXT: '기타 교통수단'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'J1',TXT: '사람, 동·식물'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'K1',TXT: '작업환경, 대기여건 등 자연현상'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'L1',TXT: '보호구'},
    ],
    [
    {COD: '', TXT: '선택'},
    {COD: 'Z1',TXT: '기타'},
    ],

  
  ], // 부문
})
//코드리스트 선언부 끝

let attMem = reactive([])

const upDataRow = () => {
  emit("upDataRow", "upDataRow");
};

const grdMain = ref(null)
//메인그리드 속성셋팅 
// 줄바꿈 멀티라인 - multiline
const grdMainProps = reactive({
  gridViewOption: {  checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "MEET_DATE",
      dataType: "text",
      header: { text: t("회의일자"), styleName: "header_validit" },
      editButtonVisibility: "always",
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM-dd",
          includedFormat: true,
        },
      },
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      width: '80'
    },
    {
      fieldName: "OPINION_CMPNY",
      dataType: "text",
      width: '100',
      header: { text: t("업체명"),styleName: "header_validit" },
      styleName: "left-column",
      renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
        let data = ''
        if(cell.value){
          data = cell.value
        }
        var str = 
        `<div style="display: flex; justify-content: space-between;">
        <p style="width: 150px; overflow-x: auto;">${data}</p>
        <button id="cellButton"><span class="mdi mdi-magnify text-light-blue-darken-1" style="font-size: 21px;"></span></button>
        </div>`
        return str;
      },
    },
    },
    {
      fieldName: "MANAGE_DEPT_NM",
      dataType: "text",
      width: '100',
      header: { text: t("관리부서")},
      styleName: "left-column",
      renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
        let data = ''
        if(cell.value){
          data = cell.value
        }
        var str = 
        `<div style="display: flex; justify-content: space-between;">
        <p style="width: 150px; overflow-x: auto;">${data}</p>
        <button id="cellButton"><span class="mdi mdi-magnify text-light-blue-darken-1" style="font-size: 21px;"></span></button>
        </div>`
        return str;
      },
    },
    },
    // { fieldName: 'OPINION_DIV', dataType: 'text'
    // , header: { text: t('대구분') }
    // , styleName: 'editable_column', lookupDisplay: true, 
    //   editor: { type: 'dropdown', textReadOnly: true
    //   , dropDownCount: 5, partialMatch: true
    //   , domainOnly: true, dropDownWhenClick: true } 
    // },
    {
      fieldName: "OPINION_DIV", header: { text: t('대구분') },
      styleName: 'editable_column',
      lookupDisplay: true,
      //1단계의 경우 바로 values, labels에 설정
      values: ["A","B","C","D","E","F","G","H","I","J","K","L","Z"],
      labels: ["설비·기계","휴대용 기계기구, 수공구, 치공구/지그류","줄걸이 용구","자재/부재, 부품, 부속물 및 재료"
        ,"비계(발판), 작업대, 구조물, 통로","운반·보관 요구,용기 및 기구","소방·피난시설","화학물질 및 화학제품"
        ,"교통수단","사람, 동·식물","작업환경, 대기여건 등 자연현상","보호구","기타"],
      editor:{
        type: "dropdown"
      }
    },
    
    {
      fieldName: "OPINION_DETAIL", header: { text: t('소구분') }
      , styleName: 'editable_column',
      editor:{
          type:"dropdown"
      },
      lookupDisplay: true,
      //위의 setLookups에서 설정한 id 지정
      lookupSourceId: "type1",
      lookupKeyFields: [
          "OPINION_DIV",
          "OPINION_DETAIL"
      ]
    },
    {
      fieldName: "OPINION_CONT",
      dataType: "text",
      width: '300',
      header: { text: t("내용"), styleName: "header_validit"},
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      },  
      styleName: 'editable_column multiline-editor left-column',
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'MEET_DIV', dataType: 'text', visible: false },
    { fieldName: 'MEET_NO', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'MANAGE_DEPT', dataType: 'text', visible: false },
    { fieldName: 'MANAGE_BSNS', dataType: 'text', visible: false },
    { fieldName: 'MANAGE_CMPNY', dataType: 'text', visible: false },
    { fieldName: 'OPINION_SEQ', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false },
    
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields

const customRenderer =  async() => {
  
  grdMain.value.getGridView().registerCustomRenderer("rendererMain", {
    initContent(parent) {
     
      var span = this._span = document.createElement("span")
      span.className = "custom_render_span"
      parent.append(span)
      parent.appendChild(this._button1 = document.createElement("button"))
      // this._button1.appendChild(this._icon = document.createElement("svg-icon"))
      this._button1.insertAdjacentHTML(
        "afterbegin",
        `<span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span>`
      )
      // <svg-icon name="mainSearch" class="mR-3 cursor-pointer" @click="onSearch" />

    },  
    canClick() {
        return true;
    },
    // clearContent : function(parent) {
    //   parent.innerHTML = "";
    // },
    render(grid, model, width, height, info) {
      info = info || {};
      var span = this._span;
      span.textContent = model.value
      this._value = model.value 
      this._button1.className = "custom_user_search"
    },
    click : function(event) {
      if(event.srcElement.classList[0]==="mdi"){ 
        vendPopup.value.openPopup({ MULTI: false })
        // subIndex.value = 
      }
    }
  })
}
onMounted(()=>{
})
//초기 코드값 세팅로직 시작
const initCodeList = () => {
  // API 호출
  Promise.all([
      commonSearchApi({
        queryId: 'SAFIF0010_SEARCH02', 
        param: {
          CMPNY_DIV: popupParams.value.CMPNY_DIV,
          MEET_NO: popupParams.value.MEET_NO,
          ATTEND_YN: 'Y'
        }
      }),
      commonSearchApi({
        queryId: 'SAFIF0010_SEARCH03', 
        param: {
          CMPNY_DIV: popupParams.value.CMPNY_DIV,
          MEET_NO: popupParams.value.MEET_NO
        }
      }),
    ]).then(res => { 
        attendMembers.EMP_NM = []
        attendMembers.EMP_NO = []
      res[0].ORESULT_CUR.forEach(element => {
        attendMembers.EMP_NM.push(element.EMP_NM)
        attendMembers.EMP_NO.push(element.EMP_NO)
      })
      grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR)   
      applyData = res[1].ORESULT_CUR
      // grdMain.value.setBindingColumn("OPINION_DIV", codeList.OPINION_DIV, "COD", "TXT") // 진행상태
      // grdMain.value.setBindingColumn("OPINION_DETAIL", codeList.OPINION_DETAIL[0], "COD", "TXT") // 난이도 
      setLookups()
      })
}
//초기 코드값 세팅로직 끝



const addParam = reactive({
})
//변수선언부 끝

//로우더블클릭시 실행되는 함수
const openPopup = (rowData) => {  
  if(rowData){
    popupParams.value = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      MEET_DATE: rowData.MEET_DATE,
      MEET_TIME: rowData.MEET_TIME,
      MEETING_PLACE: rowData.MEETING_PLACE,
      MEET_ORG_NM: rowData.MEET_ORG_NM,
      MEET_ORG: rowData.MEET_ORG,
      MEET_FILEID: rowData.MEET_FILEID,
      UPDATE_USER_NM: rowData.UPDATE_USER_NM,
      UPDATE_USER_ID: rowData.UPDATE_USER_ID,
      UPDATE_DATE: rowData.UPDATE_DATE,
      INSERT_USER_NM: rowData.INSERT_USER_NM,
      INSERT_USER_ID: rowData.INSERT_USER_ID,
      INSERT_DATE: rowData.INSERT_DATE,
      MEET_CONT: rowData.MEET_CONT,
      MEET_NO: rowData.MEET_NO,
      APPROVAL_STATUS: rowData.APPROVAL_STATUS,
      BSNS_CD: rowData.BSNS_CD,
      BSNS_NM: rowData.BSNS_NM,
      SECTOR_CD: rowData.SECTOR_CD,
      SECTOR_NM: rowData.SECTOR_NM,
      PART_CD: rowData.PART_CD,
      PART_NM: rowData.PART_NM,
      DEPT_CD: rowData.DEPT_CD,
      OFFI_RES_CD: rowData.OFFI_RES_CD,
      OFFI_RES_NM: rowData.OFFI_RES_NM,
    }
    empName.value = rowData.INSERT_USER_NM
    setTimeout(() => {
      setFile(rowData.MEET_FILEID)
    },1000)
    initCodeList()
    if(popupParams.APPROVAL_STATUS === 'Y'){
      readonlyYn.value = false
    }
    if(rowData.APPROVAL_STATUS == 'Y' || rowData.APPROVAL_STATUS == 'B') {
      menuTitle.value.disableBtn('btnReqApply',true)
    } else {
      menuTitle.value.disableBtn('btnReqApply',false)
    }
    menuTitle.value.disableBtn('btnPrint',false)
  }else{
    popupParams.value = { 
      CMPNY_DIV: userStore.cmpnyDiv,
      MEET_DIV: menuId,
      MEET_DATE: dayjs(new Date()).format("YYYY-MM-DD"),
      MEET_TIME: dayjs(new Date()).format("HH:mm"),
      MEETING_PLACE: '',
      MEET_ORG: '',
      MEET_ORG_NM: '',
      MEET_FILEID: '',
      INSERT_USER_ID: userStore.userId,
      INSERT_DATE: dayjs(new Date()).format("YYYY-MM-DD"),
      MEET_CONT: '',
      MEET_NO: null,
      APPROVAL_STATUS: ''
    }
    empName.value = userStore.userName

    menuTitle.value.disableBtn('btnReqApply',true)
    menuTitle.value.disableBtn('btnPrint',true)

    popupHeight.value = '475'
    readonlyYn.value = true
  }
  
  // grdMain.value.setBindingColumn("OPINION_DIV", codeList.OPINION_DIV, "COD", "TXT") // 진행상태
  // grdMain.value.setBindingColumn("OPINION_DETAIL", codeList.OPINION_DETAIL[0], "COD", "TXT") // 난이도
  dialog.value = true
}
const setFile = (file) => {
  if (file === null) {
    fileUpload.value.setGuid()
    popupParams.value.MEET_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    fileUpload.value.setGuid(file)
    popupParams.value.MEET_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}
//  시간 유효성검사
const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/;
  if (!timePattern.test(inputTime)) {
    return "";
  }

  const hours = inputTime.substring(0, 2);
  const minutes = inputTime.substring(2);
  return `${hours}:${minutes}`;
};
const formatAndDisplayTime = () => {
  popupParams.value.MEET_TIME = formatTimeFromInput(
    popupParams.value.MEET_TIME
  );
}

//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  dialog.value = false
  emit("closed")
  attendMembers.EMP_NM =[]
  attendMembers.EMP_NO =[]
  popupParams.value = {}
}

// 팝업 버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    save1()

  } else if (btn.id === "btnPrint") {

    // reportName.value = "/manage/hse/SAFIF0010.ozr"

    reportName.value = "/manage/hse/SAFIF0010_TOT.ozr"


    showOz.value = true 

    params.value = [
      "IN_CMPNY_DIV="+ popupParams.value.CMPNY_DIV,
      "IN_MEET_NO=" + popupParams.value.MEET_NO
    ]
  } else if (btn.id === "btnReqApply") {
    ReqApply()
  } else {
    closePopup()
  }
}

const save1 = async () => {
  if (!popupParams.value.MEET_DATE) {
      return Message.warn(t('회의일자를 입력해주세요.'))
    } else if (!popupParams.value.MEET_TIME) {
      return Message.warn(t('회의시간을 입력해주세요.'))
    } else if (!popupParams.value.MEET_ORG) {
      return Message.warn(t('회의 주재자를 선택해주세요.'))
    }
  let result = await vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }else {
    
    let saveParams = []

    // 날짜 형식 수정
    popupParams.value.MEET_DATE = popupParams.value.MEET_DATE.replace(/-/g, '')
    popupParams.value.USER_ID = userStore.userId // USER_ID

    saveParams.push(popupParams.value)
    commonExecuteApi({ queryId : 'SAFIF0010_SAVE01', list: saveParams })
      .then(res => 
      {
      // popupParams.value.MEET_NO = res.list[0].MEET_NO
      Message.success('저장되었습니다.')

      if(popupParams.value.MEET_NO === null){
        closePopup()
      }else{
        
        const temp = {CMPNY_DIV: popupParams.value.CMPNY_DIV, MEET_NO: popupParams.value.MEET_NO}
        commonSearchApi({ queryId : 'SAFIF0010_SEARCH05'
        , param: temp}).
        then(res=>{
          popupParams.value = res.ORESULT_CUR[0]
        })
      }
      onOpiButtonsClick({id: 'btnUpdate'})
    })

  }
  
}

const empOpenPopup = () => {
  subEmpPopup.value.openPopup({ MULTI: false,EMP_NM: popupParams.value.MEET_ORG_NM})
}
const vendOpenPopup = () => {
  vendPopup.value.openPopup({ MULTI: false, BSNS_CD: popupParams.value.BSNS_CD,DEPT_CD: popupParams.value.DEPT_CD, })
}
// 부서 팝업
const deptPopupOpen = () => {
  deptPopup.value.openPopup(
    { 
      CMPNY_DIV: popupParams.value.CMPNY_DIV
    , BSNS_CD: popupParams.value.BSNS_CD
    ,HSE_ONLY : 'Y', pageGbn : 'MNG'})

}

const onCellItemClicked = (grid, index, col) => {
  if(col.target.classList[0]==="mdi"){ 
    if(col.fieldName === 'OPINION_CMPNY'){
      vendOpenPopup()
    } else if(col.fieldName === 'MANAGE_DEPT_NM'){
      deptPopupOpen()
    }
  }
}

//lookup설정
const setLookups = () => {
  grdMain.value.getGridView().setLookups([{
        id: "type1",
        levels: 2,
        //모든 경우의 수를 나열
        keys: [
            ["A", "A1"], ["A", "A2"], ["A", "A3"], ["A", "A4"], ["A", "A5"], ["A", "A7"],
            ["B", "B1"], ["B", "B2"], ["B", "B3"], ["B", "B4"],
            ["C", "C1"], ["C", "C2"], ["C", "C3"],
            ["D", "D1"], ["D", "D2"], ["D", "D3"],
            ["E", "M1"], ["E", "E1"], ["E", "E2"], ["E", "E3"], ["E", "E4"], ["E", "E5"],
            ["E", "E6"], ["E", "E7"], ["E", "E8"],
            ["F", "F1"], ["F", "F2"], ["F", "F3"], ["F", "F4"],
            ["G", "G1"], ["G", "G2"], ["G", "G3"],
            ["H", "H1"], ["H", "H2"], ["H", "H3"], ["H", "H4"], ["H", "H5"],
            ["H", "H6"], ["H", "H7"], ["H", "H8"],
            ["I", "I1"], ["I", "I2"], ["I", "I3"],
            ["J", "J1"],
            ["K", "K1"],
            ["L", "L1"],
            ["Z", "Z2"],
        ],
        //경우의 수에 따른 표시값 설정
        values: [
            ["제조 및 가공설비·기계"], ["운반, 인양 설비·기계"], ["건설 기계"], ["전기 설비"], ["가스 설비"], ["환기 설비"], ["기타 설비·기계"],
            ["휴대용 공구"],["산업용 로봇"],["수공구, 치공구/지그류"],["기타 휴대용 기계기구, 수공구, 치공구/지그류"],
            ["줄걸이 용구"], ["자재/부재"], ["조각,파편,쓰레기"], 
            ["설비·기계기구 부품 및 부속물"], ["서포트"], ["기타 자재/부재, 부품, 부속물 및 재료'"], 
            ["비계(발판) 및 작업발판"],  ["임시통로"],["계단, 사다리, 작업대"],["단부 및 개구부"],["통로, 바닥 및 표면 등"],["동력문"],["기타 건물·구조물 등"],["기타 비계(발판), 작업대, 구조물, 통로"],   //["M", "M1"],
            ["운반 용구 및 기구"],  ["툴박스"],["보일러, 압력용기"], ["기타 운반·보관 요구, 용기 및 기구"],
            ["소방시설"] , ["피난시설"],["기타 소방·피난시설"],
            ["산류"] , ["알카리류"], ["방향족 및 지방족 탄화수소"], ["할로겐 및 할로겐화합물"],["그 밖의 화학물질"],["금속미립자, 미량원소, 분진, 흄"],["화학제품"],["기타 화학물질 및 화학제품"],
            ["육상교통수단"], ["항공, 수상교통수단"], ["기타 교통수단"], 
            ["사람, 동·식물"] , ["작업환경, 대기여건 등 자연현상"],
            ["보호구"] , ["기타"],
        ]
    }])
}



// 대구분 변경 시 소구분 리스트 변경
const onEditRowChanged = async (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grdMain.value.getGridView().checkItem(dataRow,true)
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)
  if(fieldName === 'OPINION_DIV'){
    grid.commit()
    grdMain.value.getDataProvider().setValue(dataRow, "OPINION_DETAIL", '')

  }
}

const onEmpSelected = val =>{
  popupParams.value.MEET_ORG = val.EMP_NO
  popupParams.value.MEET_ORG_NM = val.EMP_NM
  commonSearchApi({ queryId : 'SAFIF0010_SEARCH07'
  , param: {CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: val.EMP_NO} })
    .then(res => 
    {
      const searchData = res.ORESULT_CUR[0]
      popupParams.value.BSNS_CD = searchData.BSNS_CD
      popupParams.value.BSNS_NM = searchData.BSNS_NM
      popupParams.value.SECTOR_CD = searchData.SECTOR_CD
      popupParams.value.SECTOR_NM = searchData.SECTOR_NM
      popupParams.value.PART_CD = searchData.PART_CD
      popupParams.value.PART_NM = searchData.PART_NM
      popupParams.value.DEPT_CD = searchData.DEPT_CD
      popupParams.value.DEPT_NM = searchData.DEPT_NM
      popupParams.value.OFFI_RES_CD = searchData.OFFI_RES_CD
      popupParams.value.OFFI_RES_NM = searchData.OFFI_RES_NM
    })
} 


const onDeptSelected = val => {
  const selectedRow = grdMain.value.getFocusedRowData().FOCUSED_ROW_IDX
  grdMain.value.getGridView().checkRow(selectedRow, true)
  // 부서 명
  grdMain.value.getDataProvider().setValue(selectedRow,'MANAGE_DEPT_NM',val.ASGN_SHRT_NM)
  // 부서 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'MANAGE_DEPT',val.ASGN_CD)
  // 부서 회사 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'MANAGE_CMPNY',val.CMPNY_DIV)
  // 부서 사업부 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'MANAGE_BSNS',val.BSNS_CD)
  
}

// 업체명 검색 팝업창 데이터 그리드에 배치
const onVendSelected = val =>{
  const selectedRow = grdMain.value.getFocusedRowData().FOCUSED_ROW_IDX
  grdMain.value.getGridView().checkRow(selectedRow, true)
  // 업체명 
  grdMain.value.getDataProvider().setValue(selectedRow,'OPINION_CMPNY',val.ASGN_NM)
  // 업체 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'ASGN_CD',val.ASGN_CD)
  // 사업부 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'BSNS_CD',val.BSNS_CD)
  // 부서 코드
  grdMain.value.getDataProvider().setValue(selectedRow,'DEPT_CD',val.DEPT_CD)
}
const ReqApply = async () => {
  let result = await vm.$swal({ 
    title: t('결재상신을 진행하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    approvalPopUp()
  }
}
// 결재 테스트
const approvalPopUp = () => {
  if(popupParams.value.MEETING_PLACE === null){
    popupParams.value.MEETING_PLACE = ''
  }
  if(popupParams.value.MEET_CONT === null){
    popupParams.value.MEET_CONT = ''
  }
  let d = 
  `
  <html xmlns:v="urn:schemas-microsoft-com:vml"
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
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border:.5pt solid black;
                background:#D6D4CA;
                mso-pattern:black none;}
              .xl66
                {mso-style-parent:style0;
                color:black;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border:.5pt solid black;
                background:white;
                mso-pattern:black none;}
              .xl67
                {mso-style-parent:style0;
                color:black;
                font-family:굴림, monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border:.5pt solid black;
                background:white;
                mso-pattern:black none;
                white-space:normal;}
              .xl68
                {mso-style-parent:style0;
                color:black;
                font-size:22.0pt;
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border:.5pt solid black;
                background:white;
                mso-pattern:black none;}
              .xl69
                {mso-style-parent:style0;
                color:black;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:left;
                vertical-align:top;
                border:.5pt solid black;
                background:white;
                mso-pattern:black none;
                white-space:normal;}
              .xl70
                {mso-style-parent:style0;
                color:black;
                font-size:20.0pt;
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border:.5pt solid black;
                background:white;
                mso-pattern:black none;}
              .xl71
                {mso-style-parent:style0;
                color:black;
                font-size:22.0pt;
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border-top:.5pt solid black;
                border-right:.5pt solid black;
                border-bottom:.5pt solid black;
                border-left:none;
                background:white;
                mso-pattern:black none;}
              .xl72
                {mso-style-parent:style0;
                color:black;
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border-top:none;
                border-right:.5pt solid black;
                border-bottom:.5pt solid black;
                border-left:.5pt solid black;
                background:#D6D4CA;
                mso-pattern:black none;}
              .xl73
                {mso-style-parent:style0;
                text-align:center;
                border:.5pt solid windowtext;}
              .xl74
                {mso-style-parent:style0;
                color:black;
                font-size:20.0pt;
                font-weight:700;
                font-family:"맑은 고딕", monospace;
                mso-font-charset:129;
                mso-number-format:"\@";
                text-align:center;
                border-top:.5pt solid black;
                border-right:.5pt solid black;
                border-bottom:.5pt solid black;
                border-left:none;
                background:white;
                mso-pattern:black none;}
              .xl75
                {mso-style-parent:style0;
                border:.5pt solid windowtext;}
      -->
      </style>
    </head>
    
<body link="#0563C1" vlink="#954F72">
<table border=0 cellpadding=0 cellspacing=0 width=703 style='border-collapse:
 collapse;table-layout:fixed;width:529pt'>
 <col width=193 style='mso-width-source:userset;mso-width-alt:7058;width:145pt'>
 <col width=160 style='mso-width-source:userset;mso-width-alt:5851;width:120pt'>
 <col width=10 style='mso-width-source:userset;mso-width-alt:365;width:8pt'>
 <col width=147 style='mso-width-source:userset;mso-width-alt:5376;width:110pt'>
 <col width=2 style='mso-width-source:userset;mso-width-alt:73;width:2pt'>
 <col width=21 style='mso-width-source:userset;mso-width-alt:768;width:16pt'>
 <col width=73 style='mso-width-source:userset;mso-width-alt:2669;width:55pt'>
 <col width=97 style='mso-width-source:userset;mso-width-alt:3547;width:73pt'>
 <tr height=26 style='mso-height-source:userset;height:20.1pt'>
  <td height=26 width=193 style='height:20.1pt;width:145pt'></td>
  <td width=160 style='width:120pt'></td>
  <td width=10 style='width:8pt'></td>
  <td width=147 style='width:110pt'></td>
  <td width=2 style='width:2pt'></td>
  <td width=21 style='width:16pt'></td>
  <td width=73 style='width:55pt'></td>
  <td width=97 style='width:73pt'></td>
 </tr>
 <tr height=37 style='mso-height-source:userset;height:28.35pt'>
  <td rowspan=2 height=74 class=xl73 style='height:56.7pt'>
    <img alt=" " src="http://10.25.17.133:5173/src/assets/images/ci/HHI_color_ko.png"
     style="width: 100%;height: 100%; object-fit: contain;"></td>
  <td colspan=3 rowspan=2 class=xl71>협력사 협의회 회의</td>
  <td colspan=3 class=xl65 style='border-left:none'>작성일자</td>
  <td class=xl66 style='border-left:none'>${popupParams.value.INSERT_DATE}</td>
 </tr>
 <tr height=37 style='mso-height-source:userset;height:28.35pt'>
  <td colspan=3 height=37 class=xl65 style='height:28.35pt;border-left:none'>작성자</td>
  <td class=xl66 style='border-top:none;border-left:none'>${popupParams.value.INSERT_USER_NM}</td>
 </tr>
 <tr height=37 style='mso-height-source:userset;height:28.35pt'>
  <td height=37 class=xl72 style='height:28.35pt'>회의 일자</td>
  <td colspan=2 class=xl66 style='border-left:none'>${popupParams.value.MEET_DATE}</td>
  <td colspan=3 class=xl65 style='border-left:none'>회의 시간</td>
  <td colspan=2 class=xl66 style='border-left:none'>${popupParams.value.MEET_TIME}</td>
 </tr>
 <tr height=37 style='mso-height-source:userset;height:28.35pt'>
  <td height=37 class=xl65 style='height:28.35pt;border-top:none'>회의 장소</td>
  <td colspan=2 class=xl66 style='border-left:none'>${popupParams.value.MEETING_PLACE}</td>
  <td colspan=3 class=xl65 style='border-left:none'>회의 주재</td>
  <td colspan=2 class=xl66 style='border-left:none'>${popupParams.value.MEET_ORG_NM}</td>
 </tr>
 <tr height=75 style='mso-height-source:userset;height:56.85pt'>
  <td height=75 class=xl65 style='height:56.85pt;border-top:none'>회의 참석자</td>
  <td colspan=7 class=xl69 width=510 style='border-left:none;width:384pt'>${attendMembers.EMP_NM}</td>
 </tr>
 <tr height=707 style='mso-height-source:userset;height:409.6pt'>
  <td height=707 class=xl65 style='height:409.6pt;border-top:none'>회의 내용</td>
  <td colspan=7 class=xl69 width=510 style='border-left:none;width:384pt'>${popupParams.value.MEET_CONT.replaceAll('\n','<br/>')}</td>
 </tr>
 <tr height=123 style='mso-height-source:userset;height:92.65pt'>
  <td height=123 colspan=8 style='height:92.65pt;mso-ignore:colspan'></td>
 </tr>
 <tr height=177 style='mso-height-source:userset;height:133.15pt'>
  <td height=177 colspan=8 style='height:133.15pt;mso-ignore:colspan'></td>
 </tr>
 <tr height=74 style='mso-height-source:userset;height:55.7pt'>
  <td height=74 class=xl75 style='height:55.7pt'>
    <img alt=" " src="http://10.25.17.133:5173/src/assets/images/ci/HHI_color_ko.png"
     style="width: 100%;height: 100%;object-fit: contain;">
     </td>
  <td colspan=7 class=xl74>협력사 협의회 회의 종사자 의견 청취 내역</td>
 </tr>
 <tr height=35 style='mso-height-source:userset;height:26.65pt'>
  <td height=35 class=xl72 style='height:26.65pt'>회의 일자</td>
  <td class=xl66 style='border-top:none;border-left:none'>${popupParams.value.MEET_DATE}</td>
  <td colspan=2 class=xl65 style='border-left:none'>회의 주재자</td>
  <td colspan=4 class=xl66 style='border-left:none'>${popupParams.value.MEET_ORG_NM}</td>
 </tr>
 <tr height=37 style='mso-height-source:userset;height:28.35pt'>
  <td height=37 class=xl65 style='height:28.35pt;border-top:none'>업체명(종사자)</td>
  <td colspan=7 class=xl65 style='border-left:none'>의견 내역</td>
 </tr>

  `
  // let index = 27
  // let top = 338
  for(let i = 0;i<applyData.length; i++ ){
    d+=`
      <tr height=124 style='mso-height-source:userset;height:93.2pt'>
        <td height=124 class=xl67 width=193 style='height:93.2pt;border-top:none;
        width:145pt'>${applyData[i].OPINION_CMPNY}</td>
        <td colspan=7 class=xl67 width=510 style='border-left:none;width:384pt'>${applyData[i].OPINION_CONT}</td>
      </tr>
      `
  }

  d+=` <![if supportMisalignedColumns]>
 <tr height=0 style='display:none'>
  <td width=193 style='width:145pt'></td>
  <td width=160 style='width:120pt'></td>
  <td width=10 style='width:8pt'></td>
  <td width=147 style='width:110pt'></td>
  <td width=2 style='width:2pt'></td>
  <td width=21 style='width:16pt'></td>
  <td width=73 style='width:55pt'></td>
  <td width=97 style='width:73pt'></td>
 </tr>
 <![endif]>
</table>

</body>
</html>`

  approvalPopup.value.openPopup({
      CLSS_ID: 'SAFIF0010',
      TITLE: `협력사 협의회 회의록 결재 [${popupParams.value.MEET_ORG}]`,
      CMPNY_DIV : userStore.cmpnyDiv,
      // DATA_KEY : userStore.cmpnyDiv+';'+searchParams.BSNS_CD+';'+searchParams.DEPT_CD+';'+searchParams.ASGN_CD+';'+searchParams.YEAR, // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      DATA_KEY : userStore.cmpnyDiv+';'+popupParams.value.MEET_DIV+';'+popupParams.value.MEET_NO+';'+popupParams.value.UPDATE_DATE, // '',
      REPORT : d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE : 'CLR_15', //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
}

/* ------------ 결재 후 결재라인 가져오기 저장 ------------ */
const approvalClrLine = val => {
  commonExecuteApi
    ({ 
        queryId : 'SAFIF0010_SAVE04'
      , list: [{MEET_NO: popupParams.value.MEET_NO, APPROVAL_STATUS: 'B', APPROVAL_KEY: val.appkey}]
    }).then(res=>{
    })
}

// 종사자 의견 청취 내역 버튼
const onOpiButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      // .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      // .setGridList([grdMain])
      .setBefore(beforeOpiSave)
      .setQuery(saveOpiData)
      .setAfter(initCodeList)
      .showMessage(false)
      .run() 
  } else if (btn.id === "btnCreate") {
    addData()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(DelMainCheck)
      .setQuery(MainDelData)
      .setAfter(initCodeList)
      .run();
  } else if (btn.id === "btnPrint") {
    // let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    // if (checkedRows.length === 0) {
    //   return Message.warn(t('출력할 데이터를 선택해 주세요.'))
    // } else if (checkedRows.length > 1) {
    //   return Message.warn(t('출력할 데이터는 하나만 선택해 주세요.'))
    // }
    reportName.value = "/manage/hse/SAFIF0010W3.ozr"

    showOz.value = true 

    params.value = [
      "IN_CMPNY_DIV="+ popupParams.value.CMPNY_DIV,
      "IN_MEET_NO=" + (!popupParams.value.MEET_NO ? '' : popupParams.value.MEET_NO),
    ]
  }
}
// 행 추가
const addData = () => {

  if(!popupParams.value.MEET_NO){
    Message.warn('회의를 먼저 저장해주세요.')
    return false
  }

  grdMain.value.addRow({
    CMPNY_DIV: userStore.cmpnyDiv,
    MEET_DIV: menuId,
    MEET_NO: popupParams.value.MEET_NO,
    MEET_DATE: popupParams.value.MEET_DATE,
    OPINION_SEQ: '',
    OPINION_CMPNY: '',
    MANAGE_DEPT_NM:'',
    MANAGE_DEPT:'',
    MANAGE_CMPNY:'',
    MANAGE_BSNS:'',
    OPINION_CONT: '',
    INSERT_USER_ID: userStore.userId,
  })
}

// 저장 전
const beforeOpiSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (!data.OPINION_CMPNY) {
      return Message.warn(t('업체명을 입력해주세요.'))
    } else if (!data.OPINION_CONT) {
      return Message.warn(t('내용을 입력해주세요.'))
    } 
  }

  return true
}
// 저장
const saveOpiData = () => {
  let saveParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.MEET_NO = popupParams.value.MEET_NO
    data.USER_ID = userStore.userId // USER_ID
    data.MEET_DATE = data.MEET_DATE.replace(/-/g, '')
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SAFIF0010_SAVE03', list: saveParams })
}
// 회의 삭제 전
const DelMainCheck = async () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length === 0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false;
  }
  return true;
};
// 회의 삭제
const MainDelData = async () => {
  let delParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    delParams.push(data)
  }
  return commonExecuteApi({
    queryId: "SAFIF0010_DELETE03",
    list: delParams,
  })
}




defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1210"
    :height="popupParams.MEET_NO === null ? '470' : ''"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">회의록 작성</div>
    <VContainer style="background-color: white; overflow-y: auto;">
      <v-card class="pa-1 fill-height">
        <v-card-title class="pa-0">
          <IMenuTitle 
            ref="menuTitle"
            :button-list="['btnUpdate', 'btnPrint', 'btnReqApply', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <v-card-text class="pa-2 pt-0 content-area">
          <div class="fill-height" style="display: flex; flex-direction: column;">
            <v-sheet class="searchArea flex-column" width="100%">
              <IMenuTitle
                :title="$t('회의록 세부 내용')">
              </IMenuTitle> 
              <div style="display: flex; padding-bottom: 8px;padding-left: 15px;">
                <i-input
                  v-model="popupParams.MEET_DATE"
                  :label="$t('회의 일시')" 
                  width="220px"
                  labelWidth="78px"
                  marginBetween="0px"
                  type="date"
                  required
                  :readonly="!readonlyYn"
                />
                <i-input
                  placeholder="HH:MM"
                  v-model="popupParams.MEET_TIME"
                  @change="formatAndDisplayTime"
                  :label="$t('')"
                  type="text"
                  width="80px"
                  :readonly="!readonlyYn"
                />
                <i-input
                  v-model="popupParams.MEETING_PLACE"
                  :label="$t('회의 장소')"
                  type="text"
                  width="284px"
                  :readonly="!readonlyYn"
                  style="padding-left: 39px;"
                />
                
              </div>
              <div style="display: flex; padding-bottom: 8px;">
                <i-input
                  v-model="popupParams.MEET_ORG_NM"
                  :label="$t('회의 주재자')"
                  type="text"
                  width="220px"
                  :readonly="!readonlyYn"
                  required
                  margin="0px"
                  :append-inner-icon="!readonlyYn ? '':'mdi-magnify'"
                  @keydown.enter="empOpenPopup"
                  @click:appendInner="empOpenPopup"
                  style="padding-left: 15px;"
                />
                <i-input
                  v-model="popupParams.OFFI_RES_NM"
                  :label="$t('직책')" 
                  width="150px"
                  label-width="37px"
                  type="text"
                  marginBetween="4px"
                  readonly
                  style="padding-left: 26px;"
                />
                <i-input
                  v-model="popupParams.BSNS_NM"
                  :label="$t('사업부')" 
                  width="235px"
                  label-width="40px"
                  type="text"
                  marginBetween="10px"
                  readonly
                  style="padding-left: 15px;"
                />
                <i-input
                  v-model="popupParams.SECTOR_NM"
                  :label="$t('부문')" 
                  width="220px"
                  label-width="60"
                  type="text"
                  marginBetween="10px"
                  readonly
                />
                <i-input
                  v-model="popupParams.PART_NM"
                  :label="$t('담당')" 
                  width="220px"
                  label-width="60"
                  type="text"
                  marginBetween="10px"
                  readonly
                />
              </div>
              <div style="display: flex; padding-bottom: 8px;">
                <i-input
                  v-model="popupParams.INSERT_DATE"
                  :label="$t('작성 일자')" 
                  width="220px"
                  labelWidth="78px"
                  marginBetween="0px"
                  type="date"
                  :readonly="true"
                  style="padding-left: 15px;"
                />
                <i-input
                  v-model="empName"
                  :label="$t('작성자')" 
                  width="130px"
                  label-width="37px"
                  type="text"
                  marginBetween="10px"
                  margin="0px"
                  readonly
                />
                <i-input
                  v-model="attendMembers.EMP_NM"
                  :label="$t('회의참석자')" 
                  width="735px"
                  label-width="62px"
                  type="text"
                  marginBetween="8px"
                  margin="0px"
                  readonly
                  style="padding-left: 15px;"
                />
              </div>
              <div>
                  <ILabel :label="$t('회의내용')" labelLoc="top">
                    <template #editor="editorProps">
                      <VTextarea
                        v-model="popupParams.MEET_CONT"
                        :readonly="!readonlyYn"
                      />
                    </template>
                  </ILabel>
              </div>
            </v-sheet>
            <v-sheet width="100%" class="h-auto mr-3" style="padding-bottom: 8px"
            v-if="popupParams.MEET_NO !== null">
              <IUpload
                ref="fileUpload"
                grid-title="첨부파일"
                auto-upload
                style="min-height: 300px"
              />
            </v-sheet>
            <v-sheet width="100%" class="h-auto mr-3"
            v-if="popupParams.MEET_NO !== null">
              <IGridTitle
                ref="refOpiButton"
                :title="$t('종사자 의견 청취 내역')"
                :button-list="['btnCreate', 'btnDelete', 'btnPrint']"
                @click-button="onOpiButtonsClick"
              >
                <template #editors />
              </IGridTitle>
              <!-- 메인그리드 -->
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                style="height: -webkit-fill-available;min-height:200px;"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellItemClicked="onCellItemClicked"
                @onEditRowChanged="onEditRowChanged"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </v-card>
      </VContainer>
      <!-- 리포트 -->
      <OZReport
        :showPop="showOz"
        :reportName="reportName"
        :params="params"
        @close="showOz = $event"
      />
      <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalClrLine"/>    
      <SubEmpPopup ref="subEmpPopup" @selected="onEmpSelected"/>
      <VendPopup ref="vendPopup" @selected="onVendSelected"/>
      <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  </VDialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 230px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}

</style>