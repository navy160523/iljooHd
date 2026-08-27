<!-- 
  화명명 : SAFIF0010 협력사 협의회 회의록 등록/현황 
  작성자 : 조영문
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { stubTrue } from "lodash-es"
import SAFIF0010Popup from "./SAFIF0010Popup.vue"
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from "@hiway/api/commonApi"
import FileUpload from "@/components/popup/IUploadPopup.vue"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import VendPopup from '@/components/popup/VendPopup.vue'
import { commonDeleteAllFilesApi } from "@hiway/api/commonFileApi"

defineOptions({
  name: "30_safety-SAF_I-SAFIF0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const fileUpload = ref(null)  // 파일 업로드


let startState = true
let type = ''
let saveState = ''
let addState = false
let path = useLogsStore().path.split('/')
let menuId = path[path.length -1] 

const currentGrdData = ref({})   // 그리드에서 선택한 행의 데이터
const currentFocusedData = ref({})

const grdMain = ref(null)
const grdSub = ref(null)
const sAFIF0010Popup = ref(null)
const refEmpPopup = ref(null)
const addEmpPopup = ref(null)
const vendPopup = ref(null)

/* 좌측 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', // 사업부 코드
  SECTOR_CD: '', // 부문 코드
  PART_CD: '', // 담당 코드
  VEND_CD: '', // 협력사 코드
  DATE_FROM: dayjs().startOf('month').format("YYYY-MM-DD"),  
  DATE_TO: dayjs(new Date()).format("YYYY-MM-DD"), 
})



/* 코드 리스트 */
const codeList = reactive({
  BSNS_CD: [], // 사업부 목록
  SECTOR_CD: [], // 부문
  PART_CD: [], // 담당
  VEND_CD: [], // 협력사 목록
  APPROVAL_STATUS: [], // 문서 상태
})
//메인그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false },},
  keys: [],
  fields: [
    {
      fieldName: "MEET_DATE",
      dataType: "text",
      header: { text: t("회의일자")},
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      width: '120'
    },
    { 
      fieldName: 'MEET_TIME', 
      dataType: 'text',
      header: { text: t('회의시간')}, 
      /* 시(H)는 앞자리 0 ~ 2, 뒷자리 0 ~ 9까지 입력가능, @onGetEditValue 함수를 사용하여 23을 초과할 때 알림발생
       * 분(M)은 앞자리 0 ~ 5, 뒷자리 0 ~ 9까지 입력가능 
       */
      editor: {
        mask: {
          definitions: {
              "b": "[0-2]",
              "c": "[0-9]",
              "d": "[0-5]",
              "e": "[0-9]"
          },
          editMask: "bc:de",
          includedFormat: true,                
          overWrite: true, 
          allowEmpty: true
        }
      },
      "textFormat": "([0-9]{2})([0-9]{2});$1:$2",
      width: '65',
    },
    { fieldName: 'BSNS_NM',width:'120', dataType: 'text', header: { text:'사업부' }, editable: false },
    { fieldName: 'SECTOR_NM',width:'120', dataType: 'text', header: { text:'부문' }, editable: false },
    { fieldName: 'PART_NM',width:'120', dataType: 'text', header: { text:'담당' }, editable: false },
   
    // {
    //   fieldName: "MEET_PLACE",
    //   dataType: "text",
    //   header: { text: t("회의장소"), styleName: "header_validit" },
    //   width: '100'
    //   ,visible: false
    // },
    {
      fieldName: "MEET_ORG_NM",
      dataType: "text",
      header: { text: t("회의 주재자")},
      width: '80',
      // styleName: "left-column custom_renderer",
      // renderer: "rendererMain", //registerCustomRenderer로 렌더러
    },
    {
      fieldName: "REGISTER",
      dataType: "text",
      editable: false,
      header: { text: t("회의록 작성") },
      width: '80',
      renderer: {
      type: "html",
        callback: function (grid, cell, w, h) {
          let str = ''
            str = `
            <div style="display: flex; justify-content: center;
              padding-left: 10px; padding-right: 10px">
                <button id="pdfUpload" class="v-btn" 
                style="color: #fff; background: #1a40c7; padding: 4px;">
                작성    
              </button>
            </div>
            `
          return str
        },
      },
    },
    { fieldName: 'APPROVAL_STATUS', dataType: 'text', width: '100' , header: { text: t('회의록\n등록 여부'), styleName:'multiline-editor' }, editable: false, lookupDisplay: true },// 사진 

    // {
    //   fieldName: "APPROVAL_STATUS",
    //   dataType: "text",
    //   editable: false,
    //   header: { text: t("회의록 등록 여부") },
    //   width: '120',
    //   renderer: {
    //   type: "html",
    //     callback: function (grid, cell, w, h) {
    //       let str = ''
    //       if(cell.value === 'Y'){
    //         str = `
    //         <div style="display: flex; justify-content: center;
    //           padding-left: 10px; padding-right: 10px">
    //             <p>완료</p>
    //         </div>
    //         `
    //       }else {
    //         str = `
    //         <div style="display: flex; justify-content: center;
    //           padding-left: 10px; padding-right: 10px">
    //             <p>미완료</p>
    //         </div>
    //         `
    //       }
    //       return str
    //     },
    //   },
    // },
    {
      fieldName: "INSERT_USER_NM",
      dataType: "text",
      editable: false,
      header: { text: t("등록자") },
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      header: { text: t("등록일자") },
      editable: false, 
      width: '120',
    },
    
    {
      fieldName: "UPDATE_USER_NM",
      dataType: "text",
      editable: false,
      header: { text: t("수정자") },
    },
    {
      fieldName: "UPDATE_DATE",
      dataType: "text",
      header: { text: t("수정일자") },
      editable: false, 
      width: '120',
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'SECTOR_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'VEND_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', visible: false },
    { fieldName: 'MEET_PLACE', dataType: 'text', visible: false },
    { fieldName: 'MEET_DIV', dataType: 'text', visible: false },
    { fieldName: 'MEET_CONT', dataType: 'text', visible: false },
    { fieldName: 'MEET_ORG', dataType: 'text', visible: false },
    { fieldName: 'MEET_QRCODE', dataType: 'text', visible: false },
    { fieldName: 'MEET_FILEID', dataType: 'text', visible: false },
    { fieldName: 'MEETING_PLACE', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    // { fieldName: 'INSERT_DATE', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    // { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false },
    { fieldName: 'MEET_NO', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },

  ],
  columns: [],
}

)
grdMainProps.columns = grdMainProps.fields
//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: {  checkBar: { visible: true } },
  keys: ["MEET_NO", "MEET_SEQ"],
  fields: [
    {
      fieldName: "VEND_NM",
      dataType: "text",
      header: { text: t("소속") },
      width: '80'
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      lookupDisplay: true,
      header: { text: t("사번") },
      styleName: "left-column custom_renderer",
      renderer: "rendererSub", //registerCustomRenderer로 렌더러
      editable : false,
      visible: false,
      width: '50'
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      header: { text: t("참석자") },
      styleName: "left-column custom_renderer",
      renderer: "rendererSub", //registerCustomRenderer로 렌더러
      editable : false,
      width: '50'
    },
    {
      fieldName: "EMP_EMAIL",
      dataType: "text",
      header: { text: t("EMAIL") },
      // displayCallback: function (grid, index, value) {
      //   // 이메일 형식 유효성 체크
      //   // value = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
        
      //   const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      //   if(emailRegex.test(value)){
      //     return value
      //   }
      //   else{
      //     Message.err('유효한 이메일 주소를 입력하세요.')
      //   }
      // },
      width: '100'
    },
    {
      fieldName: "ATTEND_YN",
      dataType: "text",
      header: { text: t("참석여부") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      width: '50'
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'MEET_DIV', dataType: 'text', visible: false },
    { fieldName: 'MEET_NO', dataType: 'text', visible: false },
    { fieldName: 'MEET_SEQ', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false },
    
  ],
  columns: [
    
  ],
})

grdSubProps.columns = grdSubProps.fields

// 셀 아이콘 클릭 이벤트
const onCellItemClicked = async (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  // 수정버튼클릭 시
  if(col.target.className === 'v-btn' && col.column === 'REGISTER'){
    sAFIF0010Popup.value.openPopup(data) 
  }
  // if(col.target.className === 'v-btn' && col.column === 'APPROVAL_STATUS'){

  //   let subData = grdSub.value.getDataProvider().getJsonRows()


  //   // console.log('subData', subData)
  //   subData.forEach((e)=>{
  //     if(typeof e.INSERT_USER_ID === 'undefined' || e.INSERT_USER_ID === null){  
  //       Message.warn('저장되지 않은 참석자가 있습니다.')
  //     }
  //   })

  //   if(!(subData.length > 0)){
  //     Message.warn('참석자를 추가해주세요.')
  //     return false 
  //   }


  //   let ck = await vm.$swal({ 
  //   title: t('회의록을 등록 하시겠습니까?'), 
  //   showCancelButton: true,
  //   })
  //   if(!ck.isConfirmed){
  //     Message.warn('취소되었습니다.')
  //     return false 
  //   } 

  //   commonExecuteApi
  //   ({ 
  //       queryId : 'SAFIF0010_SAVE04'
  //     , list: [{MEET_NO: data.MEET_NO, APPROVAL_STATUS: 'B'}]
  //   }).then(res=>{
  //     onButtonsClick({id: 'btnSearch'})
  //   })

  // }

}
const subIndex = ref(null)
// 서브 셀 아이콘 클릭 이벤트
const onCellButtonClicked = (grid, index, col) => {
  // console.log('index.dataRow',index.dataRow)
  subIndex.value = index.dataRow
  let data = grdSub.value.getDataProvider().getJsonRow(index.dataRow)

  refEmpPopup.value.openPopup({ MULTI: false })
  type = 'emp' //참가자 클릭 이벤트
  
}

// 인원조회
const onEmpSelected = val =>{
  const rowKey = currentFocusedData.value.FOCUSED_ROW_IDX

  if(type === "emp"){
    grdSub.value.getDataProvider().setValue(rowKey, 'EMP_NO', val.EMP_NO )
    grdSub.value.getDataProvider().setValue(rowKey, 'VEND_NM', val.ASGN_SHRT_NM )
    grdSub.value.getDataProvider().setValue(rowKey, 'ASGN_CD', val.ASGN_CD )
    grdSub.value.getDataProvider().setValue(rowKey, 'EMP_NM', val.EMP_NM )
    grdSub.value.getDataProvider().setValue(rowKey, 'EMP_EMAIL', val.EMAIL )
    grdSub.value.getGridView().checkItem(rowKey)
  } 
}
// 참석자 추가 시 팝업
const onAddEmpSelected = val =>{
  console.log('val',val)
  const subGridData = grdSub.value.getDataProvider().getJsonRows()
  let messageYN = false
  val.forEach((e)=>{
    let includeYN = false
    subGridData.forEach((t)=>{
      if(e.EMP_NO === t.EMP_NO){
        includeYN = true
        messageYN = true
      }
    })

    if(!includeYN){
      grdSub.value.addRow({
      CMPNY_DIV: currentGrdData.value.CMPNY_DIV,
      MEET_DIV: currentGrdData.value.MEET_DIV,
      MEET_NO: currentGrdData.value.MEET_NO,
      ATTEND_YN: 'N',
      EMP_NO: e.EMP_NO,
      ASGN_CD: e.ASGN_CD,
      VEND_NM: e.ASGN_SHRT_NM,
      EMP_NM: e.EMP_NM,
      EMP_EMAIL: e.EMAIL,
    })
    }
    
  })
  if(messageYN){
    Message.err('중복 인원은 생략됩니다.')
  }
}

// 협력사 조회
// const onVendSelected = val =>{
//   console.log('selected Vend', val)
// }

// 그리드 셀 클릭(포커스) 이벤트
const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
  // 초기화
  currentGrdData.value = {}

  // 선택한 행의 데이터
  currentGrdData.value = grdMain.value.getDataProvider().getJsonRow(newIdx)
  // console.log('currentGrdData.value',currentGrdData.value)

  // API 호출
  Promise.all([
    commonSearchApi({
      queryId: 'SAFIF0010_SEARCH02', 
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        MEET_NO: currentGrdData.value.MEET_NO,
        ATTEND_YN: ''
      }
    })
  ]).then(res => {
    grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)    
    // console.log('search02 res ::: ', res[0].ORESULT_CUR)
  }) 
}
//로우 더블클릭시 상세정보 팝업 출력
const onCellDblClicked = (grid, clickData) => {

  // if(clickData.fieldName !== "MEET_ORG"){
  //   let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //   // console.log('clickdata',data)
  //   sAFIF0010Popup.value.openPopup(data) 
  // }
}

onMounted(()=>{
  // console.log('userStore.empNO',userStore.empNo)
  
  vm.$nextTick(() => {
    commonSearchApi({ queryId : 'SAFIF0010_SEARCH07'
  , param: {CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: userStore.empNo} })
    .then(res => 
    {
      // console.log('searchParams 1', searchParams)
      // console.log('res', res.ORESULT_CUR[0])
      const searchData = res.ORESULT_CUR[0]
      // console.log('searchData', searchData)
      
      searchParams.BSNS_CD = searchData.BSNS_CD
      searchParams.SECTOR_CD = searchData.SECTOR_CD
      searchParams.PART_CD = searchData.PART_CD
      comboChange('company')
      comboChange('bsns')
      comboChange('sector')
      comboChange('part')

      searchParams.BSNS_CD = searchData.BSNS_CD
      searchParams.SECTOR_CD = searchData.SECTOR_CD
      searchParams.PART_CD = searchData.PART_CD

      
      onButtonsClick({id: 'btnSearch'})
      // console.log('searchParams',searchParams)
      
      customRenderer()
    })
    getCodeList('HHIZ030').then((res)=>{
      // console.log('res',res)
      codeList.APPROVAL_STATUS = res.ORESULT_CUR
      codeList.APPROVAL_STATUS.push({COD: 'F', TXT: '미완료'})
      grdMain.value.setBindingColumn('APPROVAL_STATUS',codeList.APPROVAL_STATUS,'COD','TXT')
    })
  })
  

})

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      // .isGridChanged(false)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnAnnounceMail") {
    SendMail()
  } else if (btn.id === "btnCreateMeetingPaper") {
    // 회의록 작성 팝업
    if(!currentGrdData.value){
      Message.err('작성할 회의록을 정해주세요.')
      return false
    }
    if(!currentGrdData.value.INSERT_USER_ID){
      currentGrdData.value.INSERT_USER_ID = userStore.userId
      currentGrdData.value.UPDATE_USER_ID = userStore.userId
    }

    // if(!currentGrdData.value.MEET_PLACE){
    //   Message.warn('회의장소를 먼저 입력해주세요.')
    //   return false
    // }
    sAFIF0010Popup.value.openPopup(currentGrdData.value)
  }
}
//조회관련 로직시작
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFIF0010_SEARCH01",
    param: searchParams,
  })
}

const afterCreate = (res)=>{
  new queryFlowHelper(vm, t)
      // .isGridChanged(false)
      .setGridList([grdSub])
      .setQuery(recentData)
      .setAfter()
      .run()
}


const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows([])
}
// 메일 발송
const SendMail = async () => {
  console.log('currentGrdData',currentGrdData)
  // console.log('sendmail@@')
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  if(checkedRows.length === 0){
    Message.err('메일 보낼 참석자를 선택해주세요.')
    return false
  }

  let ck = await vm.$swal({ 
    title: t('메일 전송하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')
    return false 
  } 
  let empList = ''
  checkedRows.forEach((e,idx)=>{
    let data = grdSub.value.getDataProvider().getJsonRow(e)
    if(idx !== 0){
      empList += ',' + data.EMP_NM
    }else{
      empList +=  data.EMP_NM
    }

  })
  // console.log('empList', empList)

  if(!currentGrdData.value.MEETING_PLACE){
    currentGrdData.value.MEETING_PLACE = ''
  }
  
  if(!currentGrdData.value.MEET_CONT){
    currentGrdData.value.MEET_CONT = ''
  }
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    // 이메일 담아서 보내?
    // currentGrdData = 현재 메인 데이터
    if(!data.EMP_EMAIL){
      return false
    }
    // console.log('data', data)
    let mailParam = {
      EMAIL: [data.EMP_EMAIL], //받는사람 이메일주소
      // SUBJECT: `안녕하세요. ${data.EMP_NM}님 '${currentGrdData.value.MEET_ORG_NM}'의 회의 참석 요청.`, //메일제목
      SUBJECT: `협력사 협의회 회의 참석 요청.`, //메일제목
      CONTENT: `회의 주재자 : ${currentGrdData.value.MEET_ORG_NM}
                <br>회의 일시 : ${currentGrdData.value.MEET_DATE} ${currentGrdData.value.MEET_TIME}
                <br>회의 장소 : ${currentGrdData.value.MEETING_PLACE}
                <br>회의 참가 인원 : ${empList}
                <br>회의 내용 : ${currentGrdData.value.MEET_CONT}
                <br><br><br>위와 같이 협력사 안전보건협의회 회의를 개최하고자  하오니 참석을 부탁드립니다.
                <br><br><br>작성자 : ${currentGrdData.value.INSERT_USER_NM} 
                <br>작성일시 : ${currentGrdData.value.INSERT_DATE} 
                ` //메일내용
    }
    // console.log('mailParam >>> ',mailParam)
    
    commonSendApi(mailParam) 
      .then(res => {
        if(res.result.status === "200"){
          Message.success('메일을 발송하였습니다.')
        }else{
          Message.err('메일 발송에 실패했습니다.')
        }
      }) //메일전송
  }
}
// 
const customRenderer =  () => {
  
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
      // console.log('parent',parent)
      // <svg-icon name="mainSearch" class="mR-3 cursor-pointer" @click="onSearch" />

    },  
    canClick() {
        return true;
    },
    // clearContent : function(parent) {
    //   console.log("DISPOSED......");
    //   parent.innerHTML = "";
    // },
    render(grid, model, width, height, info) {
      info = info || {};
      var span = this._span;
      span.textContent = model.value
      this._value = model.value 
      this._button1.className = "custom_user_search"
      // console.log('_icon',this._icon)
    },
    click : function(event) {
      
      
      currentFocusedData.value =  grdMain.value.getFocusedRowData()
      
      // console.log('focusData',currentFocusedData.value)
      if(event.srcElement.classList[0]==="mdi"){ 
        refEmpPopup.value.openPopup({ MULTI: false})
        type = "org"
        // subIndex.value = 
      }
    }
  })

  grdSub.value.getGridView().registerCustomRenderer("rendererSub", {
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
      // console.log('parent',parent)
      // <svg-icon name="mainSearch" class="mR-3 cursor-pointer" @click="onSearch" />

    },  
    canClick() {
        return true;
    },
    // clearContent : function(parent) {
    //   console.log("DISPOSED......");
    //   parent.innerHTML = "";
    // },
    render(grid, model, width, height, info) {
      info = info || {};
      var span = this._span;
      span.textContent = model.value
      this._value = model.value 
      this._button1.className = "custom_user_search"
      // console.log('_icon',this._icon)
    },
    click : function(event) {
      
      
      currentFocusedData.value =  grdSub.value.getFocusedRowData()
      
      // console.log('focusData',currentFocusedData.value)
      if(event.srcElement.classList[0]==="mdi"){ 
        refEmpPopup.value.openPopup({ MULTI: false})
        type = "emp"
        // subIndex.value = 
      }
    }
  })
}

// 회의 관리 그리드 버튼
const onMainButtonsClick = (btn) => {
  if (btn.id === "btnCreate") {
    // A일때 회의록 세부정보 입력 활성화
    sAFIF0010Popup.value.openPopup() 
    
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setBefore(DelMainCheck)
      .setConfirmMessage(grdSub.value.getDataProvider().getRowCount() ? '참석자 데이터가 존재합니다. 삭제하시겠습니까?' : '삭제하시겠습니까?')
      .setQuery(MainDelData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run();
  }
}
//
const closed = () => {
  onButtonsClick({ id: "btnSearch" });
}
// 회의 저장 전
const beforeSave = () => {
  currentFocusedData.value =  grdMain.value.getFocusedRowData()

    if (!currentFocusedData.value.MEET_DATE) {
      return Message.warn(t('회의일자를 입력해주세요.'))
    } else if (!currentFocusedData.value.MEET_TIME) {
      return Message.warn(t('회의시간을 입력해주세요.'))
    } else if (!currentFocusedData.value.MEET_ORG) {
      return Message.warn(t('회의 주재자를 입력해주세요.'))
    } 
  return true
}
// 회의 저장
const saveData = () => {
  let saveParams = []
  
  let data = {
    MEET_NO: currentFocusedData.value.MEET_NO,
    MEET_DATE: currentFocusedData.value.MEET_DATE.replace(/-/g, ''),
    MEET_TIME: currentFocusedData.value.MEET_TIME,
    // MEET_PLACE: currentFocusedData.value.MEET_PLACE,
    MEET_ORG: currentFocusedData.value.MEET_ORG,
    MEET_CONT: currentFocusedData.value.MEET_CONT,
    MEET_FILEID: currentFocusedData.value.MEET_FILEID,
    APPROVAL_STATUS: currentFocusedData.value.APPROVAL_STATUS,
    STATUS:currentFocusedData.value.STATUS,
    USER_ID: userStore.userId,
  }

  saveParams.push(data)
  
  // console.log('저장 파라미터 ::: ', saveParams)
  addState = false
  return commonExecuteApi({ queryId : 'SAFIF0010_SAVE01', list: saveParams })
}

// 회의 삭제 전
const DelMainCheck = async () => {
  let delCheck = grdSub.value.getDataProvider().getRowCount()

  if(!currentGrdData.value){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false;
  }
  
  // console.log(delCheck, "delCheck");
  return true;
};
// 회의 삭제
const MainDelData = async () => {
  let delParams = []


  delParams.push(currentGrdData.value)


  console.log('삭제 파라미터 ::: ', delParams)
  console.log
  commonDeleteAllFilesApi([{
    CMPNY_DIV: delParams[0].CMPNY_DIV,
    FILE_ID: delParams[0].MEET_FILEID,  
  }])
  return commonExecuteApi({
    queryId: "SAFIF0010_DELETE01",
    list: delParams,
  });
};

//  참석자 그리드 버튼
const onSubButtonsClick = (btn) => {
  if (btn.id === "btnCreate") {
    const rowCount = grdMain.value.getDataProvider().getRowCount()
    if(rowCount>0){
      addEmpPopup.value.openPopup({ MULTI: true })
    }else{
      Message.warn("참석자를 추가할 회의 목록이 없습니다.")
    }

    
    // addData("sub")
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(DelSubChek)
      .setQuery(SubDelData)
      .setAfter(AfterDelData)
      .run();
  }


}
// 참석자 저장 전
const beforeSubSave = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
     
    if (!data.EMP_NM) {
      return Message.warn(t('참석자을 입력해주세요.'))
    } 
    // else if (!data.EMP_EMAIL) {
    //   return Message.warn(t('메일을 입력해주세요.'))
    // } 
  }

  return true
}
// 참석자  저장
const saveSubData = () => {
  let saveParams = []

  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    data.USER_ID = userStore.userId // USER_ID
    saveParams.push(data)
  }
  addState = false
  // console.log('저장 파라미터222 ::: ', saveParams)
  return commonExecuteApi({ queryId : 'SAFIF0010_SAVE02', list: saveParams })
}
// 행 추가
const addData = (gbn) => {
  if (gbn === "main") {
    
    const year = new Date().getFullYear()
    const month = ("0" + (new Date().getMonth() + 1)).slice(-2)
    const day = ("0" + new Date().getDate()).slice(-2)
    const hours = new Date().getHours()
    const minutes = new Date().getMinutes()

    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      MEET_DIV: menuId,
      MEET_DATE: year + "-" + month + "-" + day,
      MEET_TIME: hours + ":" + minutes,
      INSERT_USER_ID: userStore.userName,
      APPROVAL_STATUS: '',
      STATUS: 1,
    })
    addState = true

  } else if (gbn === "sub") {
    if(!currentGrdData.value.MEET_NO){
      Message.err('회의를 먼저 저장해주세요.')
    }
    grdSub.value.addRow({
      CMPNY_DIV: currentGrdData.value.CMPNY_DIV,
      MEET_DIV: currentGrdData.value.MEET_DIV,
      MEET_NO: currentGrdData.value.MEET_NO,
      ATTEND_YN: 'N'
    })
    // console.log('currentGrdData.value >>> ',currentGrdData.value)
  }
}
// 참석자 삭제 전
const DelSubChek = async () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  let allData = grdSub.value.getDataProvider().getJsonRows()
  
  if(checkedRows.length === 0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  // else if(checkedRows.length === allData.length 
  // && currentGrdData._rawValue.APPROVAL_STATUS === 'B'){
  //   Message.warn("등록된 회의록의 참석자는 모두 삭제할 수 없습니다.")
  //   return false
  // }
  return true;
};
// 참석자 삭제
const SubDelData = async () => {
  let delParams = []

  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    delParams.push(data)
  }

  
  // console.log('삭제 파라미터22 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SAFIF0010_DELETE02",
    list: delParams,
  });
};

// 참석자 삭제
const AfterDelData = async () => {
  let delParams = []

  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach((e)=> {
    grdSub.value.getDataProvider().removeRow(e)
  })

}

// 사업부, 부문, 담당, 협력사 
const comboChange = gbn => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD, 
    SECTOR_CD: searchParams.SECTOR_CD,
    PART_CD: searchParams.PART_CD,
    USE_DIV: 'Y'
  }
  if(gbn === 'company'){
    
    /* 사업부,부문,담당,부서 초기화 */
    
    Promise.all([commonSearchApi({ queryId : 'searchBSNS', param:param })]).then(res => {
      codeList.BSNS_CD = res[0].ORESULT_CUR
      codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }else if(gbn === 'bsns'){ // 사업부 내부 부문 조회
    /* 부문,담당,부서 초기화 */
    Promise.all([commonSearchApi({ queryId : 'SECTOR_COMBO', param:param })]).then(res => {
      codeList.SECTOR_CD = res[0].ORESULT_CUR
      codeList.SECTOR_CD.unshift({ SECTOR_NM: '전체', SECTOR_CD: '' })
      if(!startState){
        searchParams.PART_CD = ''
        searchParams.VEND_CD = ''
        searchParams.SECTOR_CD = ''
      }
      console.log('codeList.SECTOR_CD',codeList.SECTOR_CD)
    })
  }else if(gbn === 'sector'){ // 부문 내부 담당 조회
    /* 담당,부서 초기화 */
    Promise.all([commonSearchApi({ queryId : 'PART_COMBO', param })]).then(res => {
      codeList.PART_CD = res[0].ORESULT_CUR
      codeList.PART_CD.unshift({ PART_NM: '전체', PART_CD: '' })
      if(!startState){
        searchParams.VEND_CD = ''
        searchParams.PART_CD = ''
      }   
    })
  }else if(gbn === 'part'){ // 담당 내부 협력사 조회
    /* 부서 초기화 */
    Promise.all([commonSearchApi({ queryId : 'SAFIF0010_SEARCH06', param })]).then(res => {
      codeList.VEND_CD = res[0].ORESULT_CUR
      codeList.VEND_CD.unshift({ VEND_NM: '전체', VEND_CD: '' })
      if(!startState){
        searchParams.VEND_CD = ''
      }      
    startState = false
    })
    
  }
}

// const vendOpenPopup = () => {
//   // console.log('작동')
//   vendPopup.value.openPopup({ MULTI: false })
// }

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnAnnounceMail']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea" style="display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center;">              
            <i-input
              v-model="searchParams.DATE_FROM"
              type="date"
              :label="$t('회의 일자')"
              margin="10px"
              width="201px"
            />
            <i-input
              v-model="searchParams.DATE_TO"
              width="160px"
              :label="$t('~')"
              type="date"
            />
            <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="200px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="comboChange('bsns')"
            />
            <i-select
              :label="$t('부문')"
              label-width="40px"
              width="200px"
              v-model="searchParams.SECTOR_CD"
              :items="codeList.SECTOR_CD"
              item-value="SECTOR_CD"
              item-title="SECTOR_NM"
              marginBetween="0px"
              @update:modelValue="comboChange('sector')"
            />
            <i-select
              :label="$t('담당')"
              label-width="40px"
              width="200px"
              v-model="searchParams.PART_CD"
              :items="codeList.PART_CD"
              item-value="PART_CD"
              item-title="PART_NM"
              marginBetween="0px"
              @update:modelValue="comboChange('part')"

            />
            <!-- <i-select
              :label="$t('협력사')"
              label-width="40px"
              width="200px"
              v-model="searchParams.VEND_CD"
              :items="codeList.VEND_CD"
              item-value="VEND_CD"
              item-title="VEND_NM"
            /> --> 
            <!-- <i-input
              v-model="searchParams.VEND_CD"
              :label="$t('참석자 소속 협력사')"
              type="text"
              label-width="110px"
              width="310px"
              append-inner-icon="mdi-magnify"
              @keydown.enter="vendOpenPopup"
              @click:appendInner="vendOpenPopup"
            /> -->
        </div>
      </v-sheet>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow">
          <v-sheet width="60%" class="pa-0 h-auto mr-3">
            <IGridTitle
              :title="$t('협력사 안전보건협의회 회의 관리')"
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onMainButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <!-- 메인그리드 -->
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellItemClicked="onCellItemClicked"
              @onCurrentRowChanged="onCurrentRowChanged"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
          <v-sheet width="40%" class="pa-0 h-auto">
            <IGridTitle
              :title="$t('참석자')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onSubButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <!-- 서브그리드 -->
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCellButtonClicked="onCellButtonClicked"
            />
            <!-- @onCellClicked="" -->
          </v-sheet>
        </div>
      </div>
    </v-card-text>
    <!-- 파일 업로드 -->
    <FileUpload 
      ref="fileUpload"
      :auto-upload="true"
    />
    <SAFIF0010Popup @closed="closed" ref="sAFIF0010Popup"/>
    <EmpPopup ref="refEmpPopup" @selected="onEmpSelected"/>
    <EmpPopup ref="addEmpPopup" @selected="onAddEmpSelected"/>
    <!-- <VendPopup ref="vendPopup" @selected="onVendSelected"/> -->
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 240px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}



</style>
