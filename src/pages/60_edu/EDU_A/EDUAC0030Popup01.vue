
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonSendApi , commonSendSMS } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { update, value } from 'lodash-es'

import Message from '@hiway/utils/notify'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['upDataRow'])
const dialog = ref(false)
const grdMain = ref(null)
const grdDetail =ref(null)
const menuTitle = ref(null)

const empPopup =ref(null)
const noBsnsCd =ref(true)
const Apply = ref(false)
const MailPopup = ref(null)


let rowData = reactive({})
//  인원검색
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  USER_DIV: [
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
  ],
  accdntType: [],
  proc: [],
})

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    USER_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: "A",
    BSNS_CD: "",
    DEPT_CD: "",
    EMP_NM: "",
    EMP_NO: "",
    FLAG: "N", //퇴직자 포함 여부 플래그값
  },
  multi: false,
})

const detailData = reactive({
    CMPNY_DIV:'',
    APPLY_DATE:'',
    SEQ:''
})

//  진행상태 검색
const PopDataProp = reactive({
  STATE:'10',
  EMPLO:'',
  EMP_NM:'',
  REJECT_REASON:'',
})

const initCodeList = async () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" } }), // 사업부
 
    getCodeList("HHIS060"),
    getCodeList("HHIS070"),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.STATE = res[2].ORESULT_CUR
    codeList.EXCEPT_REASON = res[3].ORESULT_CUR
    grdDetail.value.setBindingColumn("EXCEPT_REASON", res[3].ORESULT_CUR, "COD", "TXT")
  })
}

const openPopup = async popupParam =>
{
  
  //   초기화

  detailData.CMPNY_DIV=''
  detailData.APPLY_DATE=''
  detailData.SEQ=''
  PopDataProp.EMPLO = ''
  PopDataProp.EMP_NM = ''
  PopDataProp.STATE = '10'
  detailData.APPLY_EMP = ''
  detailData.APPLY_EMP_NM = ''
  detailData.EMAIL = ''
  detailData.HNDPHN = ''
  detailData.APPROVE_EMP_NM = ''
  detailData.ASGN_NM = ''
  detailData.APPR_USER_DIV = ''
  PopDataProp.REJECT_REASON = ''

  if(grdDetail.value.getDataProvider().rowCount > 0){ grdDetail.value.getDataProvider().clearRows() }

  if(popupParam){
    detailData.CMPNY_DIV = popupParam.CMPNY_DIV
    detailData.APPLY_DATE = popupParam.APPLY_DATE
    detailData.SEQ = popupParam.SEQ
    detailData.APPLY_EMP = popupParam.APPLY_EMP
    detailData.APPLY_EMP_NM = popupParam.APPLY_EMP_NM
    detailData.EMAIL = popupParam.EMAIL
    detailData.HNDPHN = popupParam.HNDPHN
    detailData.APPROVE_EMP_NM = popupParam.APPROVE_EMP_NM
    detailData.ASGN_NM = popupParam.ASGN_NM
    detailData.APPR_USER_DIV = popupParam.APPR_USER_DIV
    PopDataProp.EMPLO = popupParam.APPROVE_EMP
    PopDataProp.EMP_NM = popupParam.APPROVE_EMP_NM
    PopDataProp.STATE = popupParam.STATE    
    PopDataProp.REJECT_REASON = popupParam.REJECT_REASON
    detailData.HNDPHN = popupParam.HNDPHN
    await searchDetail()
  }
  menuTitle.value.setBtnProperty('btnReqApply', 'visible', detailData.APPLY_DATE) 
  menuTitle.value.setBtnProperty('btnDelete', 'visible', detailData.APPLY_DATE) 

  Apply.value = false
  await initCodeList()
  await initBsnsData()
  await initDeptData()
  await onButtonsClick({ id: "btnSearch" })
  
  dialog.value = true 
}

//사업부 입력
const initBsnsData = async () =>{  
  options.values.BSNS_CD = userStore.bsnsCd
} 
//부서 입력
const initDeptData = async () =>{  
  // 2024.08.19 박용훈 userStore.orgnDiv 가 아닌 userStore.userDiv 임
  //options.values.DEPT_CD = (userStore.orgnDiv === 'A' ? userStore.deptCd : userStore.asgnCd)
  options.values.DEPT_CD = (userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd)
} 
//  사업부 바뀌면
watch(() => options.values.BSNS_CD, newValue => {
  codeList.deptCd = []
  options.values.DEPT_CD = ''
  commonSearchApi({ queryId: "searchDept3",param: { CMPNY_DIV: options.values.CMPNY_DIV,BSNS_CD: newValue }})
  .then((res)=>{
  
    if(newValue ==''){
     options.values.DEPT_CD = ''

     return noBsnsCd.value = true
    }else{
      options.values.DEPT_CD = dialog.value ? options.values.DEPT_CD : ''

      codeList.deptCd = res.ORESULT_CUR
      noBsnsCd.value = false
    }
  }) 
})

const onButtonsClick = async btn => {
 
  if (btn.id === "btnSearch") {
   new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
  else if(btn.id ==='btnUpdate'){
    Apply.value = false

    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(saveGrdData)
      .run()
  }
  else if(btn.id ==='btnDelete'){
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(()=>{ onButtonsClick({ id: "btnClose" })} )
      .run()
  }
  else if(btn.id ==='btnReqApply'){

    if(!PopDataProp.EMPLO){
      return  Message.warn(t('내부승인자가 지정되어 있지 않습니다.'))
    }
    
    Apply.value = true
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(saveGrdData)
      .setAfter(()=>{ onButtonsClick({ id: "btnClose" })})
      .run()
  }
  else if (btn.id == 'btnClose'){
    await upDataRow()
    dialog.value = false
  }
}

const rowChanged = (grid, oldRow, newRow) => {
    if(newRow === -1){
      return
    }
    rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
}


//  조회
const searchData01 = (idx) => {
  if(options.values.BSNS_CD == ''){
    return Message.warn(t('사업부는 필수 입력입니다.'))
  }
  else if(options.values.DEPT_CD == ''){
    return Message.warn(t('부서는 필수 입력입니다.'))
  }
  return commonSearchApi({ queryId: "EDUAC0030_POP01_SEARCH_01", param: options.values })
}

const afterSearch01 = (res) => {
  console.log("메인 조회 :::: >>>> ",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchDetail = async () => {
  console.log("제외 신청 리스트 조회 :::: >>>> ",detailData)
  await commonSearchApi({ queryId: "EDUAC0030_POP01_SEARCH_02", param: detailData })
  .then(async (res)=>{
    grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
  })

}


// 저장


const mainCheck = async() =>{
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0 || grdDetail.value.getGridView().getJsonRows().length === 0 ){
    if(PopDataProp.EMPLO !==''){
      if(grdDetail.value.getGridView().getJsonRows().length === 0 ){
        Message.warn(t('선택한 데이터가 없습니다.'))

        return false
      }
      else
        grdDetail.value.getGridView().checkAll()
    }
    else{
      Message.warn(t('선택한 데이터가 없습니다.'))
      Apply.value = false
      return false
    }
  }

  for(let i of checkedRows){
    let data = grdDetail.value.getDataProvider().getJsonRow(i)
    if(!data.EXCEPT_DATE_FR){
       Message.warn(t('제외기간 시작일은  필수 입력입니다.'))
       Apply.value = false
      return false
    }
    if(!data.EXCEPT_DATE_FR){
       Message.warn(t('제외기간  종료일은  필수 입력입니다.'))
       Apply.value = false
       return false
    }
    if(!data.EXCEPT_REASON){
       Message.warn(t('제외사유는 필수 입력입니다.'))
       Apply.value = false
       return false
    }
  }

  return true
}

const saveGrdData = ()=>{

  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  let saveParamMain = []
  let saveParamDetail = []
  
  let pushDataMain = {
      CMPNY_DIV  : userStore.cmpnyDiv,
      APPLY_DATE :detailData.APPLY_DATE,
      SEQ :detailData.SEQ,
      BSNS_CD:userStore.bsnsCd,
      DEPT_CD:userStore.deptCd,
      ASGN_CD:userStore.asgnCd,
      APPROVE_EMP :PopDataProp.EMPLO,
      STATE:PopDataProp.STATE,
      USER_ID:userStore.userId
    }
    
  saveParamMain.push(pushDataMain)

  checkedRows.forEach( val => {
    let data = grdDetail.value.getDataProvider().getJsonRow(val)
   
    let pushSub ={
      CMPNY_DIV  : data.CMPNY_DIV,
      APPLY_DATE : data.APPLY_DATE,
      SEQ : detailData.SEQ == '' ?  null : detailData.SEQ , 
      EXCEPT_BSNS_CD:data.EXCEPT_BSNS_CD,
      EXCEPT_DEPT_CD:data.EXCEPT_DEPT_CD,
      EXCEPT_ASGN_CD:data.EXCEPT_ASGN_CD,
      EXCEPT_EMP :data.EXCEPT_EMP,
      EXCEPT_DATE_FR  :data.EXCEPT_DATE_FR,
      EXCEPT_DATE_TO:data.EXCEPT_DATE_FR,
      EXCEPT_REASON:data.EXCEPT_REASON,
      EXCEPT_REASON_DESC :data.EXCEPT_REASON_DESC,
      USER_ID:userStore.userId
    }
    
    saveParamDetail.push(pushSub)
  })

  if(!saveParamMain){
    return
  }

  if(!saveParamDetail){
    return
  }
  console.log("세이브 파람 메인 :::: >>>> ",saveParamMain)
  console.log("세이브 파람 디테일 :::: >>>> ",saveParamDetail)
  console.log("어플라이 밸류 :::: >>>> ",Apply.value)
  if(Apply.value === false){
    return commonExecuteApi({ queryId : 'EDUAC0030_POP01_SAVE_01', list: saveParamMain })
          .then((res1)=>{
            commonExecuteApi({ queryId : 'EDUAC0030_POP01_SAVE_02', list: saveParamDetail }).then(res2 => {
              console.log("디테일 저장후 레스 확인",res2)
              if(res2.list.length > 0){
                menuTitle.value.setBtnProperty('btnReqApply', 'visible', res2.list[0].APPLY_DATE) 
                menuTitle.value.setBtnProperty('btnDelete', 'visible', res2.list[0].APPLY_DATE) 

                let detailParams = {
                  CMPNY_DIV : res2.list[0].CMPNY_DIV,
                  APPLY_DATE : res2.list[0].APPLY_DATE,
                  SEQ : res1.list[0].OUT_RES_SEQ
                }
                commonSearchApi({ queryId: "EDUAC0030_POP01_SEARCH_02", param: detailParams }).then(res3 => {
                  console.log("레스3 확인 :::: >>>> ",res3)
                  if(res3.ORESULT_CUR.length > 0){
                    grdDetail.value.getDataProvider().setRows(res3.ORESULT_CUR)
                    detailData.CMPNY_DIV=res3.ORESULT_CUR[0].CMPNY_DIV
                    detailData.APPLY_DATE=res3.ORESULT_CUR[0].APPLY_DATE
                    detailData.SEQ=res3.ORESULT_CUR[0].SEQ
                  }
                })
              }
            })
          })
  }
  else {
    let APPROVE_ID = detailData.APPLY_DATE + detailData.SEQ
    let ApplyParam = [{
      CMPNY_DIV  : userStore.cmpnyDiv,
      APPLY_DATE :detailData.APPLY_DATE,
      SEQ :detailData.SEQ,
      APPROVE_EMP: PopDataProp.EMPLO,
      STATE:'20',
      USER_ID:userStore.userId,
      APPROVE_ID : APPROVE_ID
    }]
    return commonExecuteApi({ queryId : 'EDUAC0030_POP01_SAVE_01', list: saveParamMain })
      .then((res)=>{
        commonExecuteApi({ queryId : 'EDUAC0030_POP01_SAVE_02', list: saveParamDetail })
        .then((res)=>{
          commonExecuteApi({ queryId : 'EDUAC0030_POP01_SAVE_03', list:   ApplyParam })
            .then((res)=>{
              if(detailData.APPR_USER_DIV == 'A'){

                // 메일삽입구간
                let Nm = !detailData.APPLY_EMP_NM ? userStore.userName : detailData.APPLY_EMP_NM
                let ASGNNM = !detailData.ASGN_NM ? userStore.bsnsNm + '-' + userStore.deptNm +'-' + userStore.asgnNm : detailData.ASGN_NM

                let mailParams ={
                  EMAIL : [!detailData.EMAIL ? userStore.email : detailData.EMAIL],
                  SUBJECT : '아카데미 참석 제외요청 결재 승인 요청건',
                  CONTENT:`   
                      <!doctype html>
                      <html>
                      <head>
                      <meta charset='utf-8'>
                      <title></title>
                      <style>
                          html { font-family: '돋움'; }
                          table{border:1px solid #bbb; width: 1024px;}
                          th, td {border:1px solid #bbb; border-collapse: collapse; border-spacing: 2px; padding: 5px 10px;}
                          .text{display: block!important; color: #3c3c3c; font-family: '돋움'; font-size: 15px; }
                      </style>
                      </head>
                      <body>
                      <p style='line-height: 30px;'><span class='text'>수신 부서의 아카데미 참석 제외요청이 등록되었습니다. 내용 검토 후 승인을 진행해 주시기 바랍니다.<br/> 
                        승인은 [HiSEs]->[교육/문화/포상]->[교육관리]->[아카데미 입소대상 관리]->[아카데미 참석 제외 신청] 메뉴에서 진행 바랍니다.<br/><br/> 
                        신청자 : ${ASGNNM} ${Nm} 
                        </span></p>
                      <br/>                    
                      <table>
                          <tr>
                              <th rowspan = '2' width='33px' bgcolor='#D3D3D3'>&nbsp;</th>
                              <th rowspan = '2' width='200px' bgcolor='#D3D3D3'>소속</th>
                              <th rowspan = '2' width='71px' bgcolor='#D3D3D3'>이름</th>
                              <th rowspan = '1' colspan = '2' width='160px' bgcolor='#D3D3D3'>제외기간</th>
                              <th rowspan = '2' width='80px' bgcolor='#D3D3D3'>제외사유</th>
                              <th rowspan = '2' width='150px' bgcolor='#D3D3D3'>제외세부사유</th>
                          </tr>
                          <tr>
                              <th rowspan = '1' width='80px' bgcolor='#D3D3D3'>시작월</th>
                              <th rowspan = '1' width='80px' bgcolor='#D3D3D3'>종료월</th>
                          </tr>`
                }
                let cnt = 0

                for(let i of checkedRows){
                  let data = grdDetail.value.getDataProvider().getJsonRow(i)

                  cnt ++
                  let filterREASON = codeList.EXCEPT_REASON.filter(x => x.COD === data.EXCEPT_REASON)

                  let ASGN_SHRT_NM  = data.ASGN_SHRT_NM
                  let EMP_NM = data.EMP_NM
                  let EXCEPT_DATE_FR = dayjs(data.EXCEPT_DATE_FR).format('YYYY-MM')
                  let EXCEPT_DATE_TO = dayjs(data.EXCEPT_DATE_TO).format('YYYY-MM')
                  let EXCEPT_REASON = filterREASON[0].TXT
                  let EXCEPT_REASON_DESC = data.EXCEPT_REASON_DESC


                  mailParams.CONTENT += `    <tr>`
                  mailParams.CONTENT += `        <td width='33px' align='center'>${cnt}</td>`, 
                  mailParams.CONTENT += `        <td width='200px' align='left'>${ASGN_SHRT_NM}</td>`, 
                  mailParams.CONTENT += `        <td width='40px' align='center'>${EMP_NM}</td>`, 
                  mailParams.CONTENT += `        <td width='76px' align='center'>${EXCEPT_DATE_FR}</td>`, 
                  mailParams.CONTENT += `        <td width='60px' align='center'>${EXCEPT_DATE_TO}</td>`, 
                  mailParams.CONTENT += `        <td width='71px' align='center'>${EXCEPT_REASON}</td>`, 
                  mailParams.CONTENT += `        <td width='59px' align='left'>${EXCEPT_REASON_DESC}</td>`, 
                  mailParams.CONTENT += `    </tr>`
                }
                mailParams.CONTENT += "</table>"
                mailParams.CONTENT += "</body>"
                mailParams.CONTENT += "</html>"

                commonSendApi(mailParams)

                //MailPopup.value.openPopup(mailParams,'EDUAC0030Popup01')

              }

              else {
                let sendSMSParams = {
                  EMPNO_FROM  : userStore.empNo,
                  SYSCODE: '156',
                  EMPNO_TO:PopDataProp.EMPLO,
                  FROM_P_NO:detailData.HNDPHN,
                  TITLE:'[Hi-SEs] 아카데미 참석 제외요청 등록 \r\n 내용 검토 후 승인 진행 바랍니다.',
                }
                
                commonSendSMS(sendSMSParams).finally( () => {
                  Message.success('SMS 발송완료')
                })
              }
            }).finally(() => {
              if(detailData.APPLY_DATE){
                let approvalParams = {
                  CMPNY_DIV : userStore.cmpnyDiv,
                  APPROVE_ID : APPROVE_ID,
                  APPROVE_GBN : 'I',
                  FORM_ID : 'EDUAC0030',
                  APP_REQ_DATE : dayjs(new Date()).format('YYYY-MM-DD'),
                  APP_EMP_NO : PopDataProp.EMPLO,
                  APP_REQ_EMP_NO : userStore.empNo,
                  PATH : '/60_edu/EDU_A/EDUAC0030',
                  USER_ID : userStore.userId,
                }
                console.log("상신될 데이터",approvalParams)
                commonExecuteApi({ queryId : 'OPRAB0010_SAVE_01', list: [approvalParams] })
              }

              upDataRow()
            })
        })
      })
  }
}

//  삭제 
const deleteData = () =>{
  if(detailData.CMPNY_DIV == ''){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  if(PopDataProp.STATE != 10){
    return Message.warn(t('작성중 상태만 삭제 가능합니다..'))
  }

  let delParam = []
  delParam.push(detailData)
  console.log("삭제할 데이터 확인",delParam)
  return commonExecuteApi({ queryId : 'EDUAC0030_POP01_DELETE_01', list: delParam })
}


// 인원검색 
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
    
  },
  
  keys: ["CMPNY_DIV"],
  field: [
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "90",
      header: { text: t("소속구분") },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV },
    },
    { fieldName: "ASGN_SHRT_NM", dataType: "text", width: "150", styleName: "left-column", header: { text: t("소속") } },
    { fieldName: "EMP_NO", dataType: "text", width: "90", header: { text: t("사번") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", width: "90", header: { text: t("직급") } },
    { fieldName: "EMP_NM", dataType: "text", width: "90", header: { text: t("성명") } },
 
    // 출력 안함
    { fieldName: "HND_PHN", dataType: "text", width: "150", header: { text: t("사내번호") } , visible: false },
    { fieldName: "HLD_OFFI_GBN", dataType: "text", header: { text: t("재직여부") } , visible: false},
    { fieldName: "BIRTH_DAY", dataType: "text", width: "100", header: { text: t("생년월일") }, visible: false },
    { fieldName: "ADDR", dataType: "text", visible: false },
    { fieldName: "ADDR1", dataType: "text", visible: false },
    { fieldName: "AGE", dataType: "text", visible: false },
    { fieldName: "AGE_KOR", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_NM", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "BSNS_NM", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "COMPANY", dataType: "text", visible: false },
    { fieldName: "COM_ENT_DATE", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_NM", dataType: "text", visible: false },
    { fieldName: "EMAIL", dataType: "text", visible: false },
    { fieldName: "ENG_NM", dataType: "text", visible: false },
    { fieldName: "GRD_CD", dataType: "text", visible: false },
    { fieldName: "GRD_NM", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_NM", dataType: "text", visible: false },
    { fieldName: "JOB_GRP_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_NM", dataType: "text", visible: false },
    { fieldName: "JOB_TIT_CD", dataType: "text", visible: false },
    { fieldName: "MARR_YN", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_CD", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_NM", dataType: "text", visible: false },
    { fieldName: "RESM_DATE", dataType: "text", visible: false },
    { fieldName: "RETI_TMP_DATE", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "TEL_NO", dataType: "text", visible: false },
    { fieldName: "TMP_RST_DATE", dataType: "text", visible: false },
    { fieldName: "TMP_RST_RSN", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_NM", dataType: "text", visible: false },
   
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field




// 인원추가 
const grdDetailProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: ["CMPNY_DIV"],
  field: [
    { fieldName: "ASGN_SHRT_NM", dataType: "text", width: "200",  styleName: "left-column", header: { text: t("제외자 소속") },editable: false},
    { fieldName: "EXCEPT_EMP", dataType: "text", width: "100",   header: { text: t("제외자 사번") } ,editable: false },
    { fieldName: "EMP_NM", dataType: "text", width: "80",  header: { text: t("제외자") },editable: false },  
    { fieldName: 'EXCEPT_DATE_FR',header: { text: t('시작월') },dataType:'text', width: "80",'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },
    { fieldName: 'EXCEPT_DATE_TO',header: { text: t('종료월') },dataType:'text', width: "80",'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },
    { 
      fieldName: "EXCEPT_REASON"
      ,dataType: "text"
      , width: "80"  
      ,header: { text: t("제외사유") }
      ,styleName: 'editable_column' 
      ,lookupDisplay: true
      ,editor: {
        type: "dropdown",
      }
    },
    { fieldName: "EXCEPT_REASON_DESC", dataType: "text", width: "200",  header: { text: t("제외 세부사유") },styleName: "left-column editable_column"  },
    { fieldName: "EXCEPT_ASGN_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 소속") }  ,visible:false},
    { fieldName: "EXCEPT_DEPT_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 부서") }  ,visible:false},
    { fieldName: "CMPNY_DIV", dataType: "text", width: "300", styleName: "left-column", header: { text: t("회사") }  ,visible:false},
    { fieldName: "APPROVE_EMP", dataType: "text", width: "300", styleName: "left-column", header: { text: t("내부승인자 사번") }  ,visible:false},
    { fieldName: "EXCEPT_BSNS_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 사업부") }  ,visible:false},
    { fieldName: "APPLY_DATE", dataType: "text", width: "300",  header: { text: t("신청일자") } ,visible:false },
    { fieldName: "SEQ", dataType: "text", width: "300",  header: { text: t("신청순번") } ,visible:false },
    { fieldName: "ORGNDIV", dataType: "text", visible: false },
  ],
  columns: [],

  columnLayout: [
    'ASGN_SHRT_NM',
    'EXCEPT_EMP',
    'EMP_NM',
    {
      name: '제외기간',
      direction: 'horizontal',
      items: [ 'EXCEPT_DATE_FR', 'EXCEPT_DATE_TO' ],
      header: { text: t('제외기간') },
    },
    'EXCEPT_REASON',
    'EXCEPT_REASON_DESC',    
  ],
})

grdDetailProps.columns = grdDetailProps.field

const AddData = ()=>{
  let param = {}
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let arr = grdDetail.value.getDataProvider().getJsonRows()
  if(checkedRows.length == 0){
    return Message.warn(t('선택된 행이없습니다.')) 
  }
  for(let i  of checkedRows)
  {
    param = grdMain.value.getDataProvider().getJsonRow(i)
    let checkItem = arr.some(row => row.EXCEPT_EMP === param.EMP_NO)
    
    if(!checkItem){
      grdDetail.value.addRow({
        ASGN_SHRT_NM:param.ASGN_NM,
        EXCEPT_EMP:param.EMP_NO,
        EMP_NM:param.EMP_NM,
        APPLY_DATE: detailData.APPLY_DATE === '' ? dayjs().format('YYYYMMDD') : detailData.APPLY_DATE,
        SEQ:'',
        EXCEPT_DATE_FR:dayjs().format('YYYY-MM'),
        EXCEPT_DATE_TO:dayjs().format('YYYY-MM'),
        EXCEPT_REASON:'',
        EXCEPT_REASON_DESC:'',
        EXCEPT_ASGN_CD:param.ASGN_CD,
        EXCEPT_DEPT_CD:param.DEPT_CD,
        EXCEPT_BSNS_CD:param.BSNS_CD,
        CMPNY_DIV:param.CMPNY_DIV,
      })
    }
  }
}


const RemoveData =()=>{
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  if(checkedRows.length == 0){
    return Message.warn(t('선택된 행이없습니다.')) 
  }
 grdDetail.value.getDataProvider().removeRows(checkedRows)
}

const removeData = rowIdx =>{
 grdDetail.value.getDataProvider().removeRows(rowIdx)
}

// 팝업존
const empPopupOpen =()=>{

  empPopup.value.openPopup(PopDataProp)
}

const selected =(row)=>{
  if(row){
    PopDataProp.EMPLO = row.EMP_NO
    PopDataProp.EMP_NM = row.EMP_NM
    detailData.APPR_USER_DIV = row.USER_DIV
    detailData.HND_PHN = row.HND_PHN
    }

}
const upDataRow = async () => {
  emit('upDataRow')
}

defineExpose({
  openPopup
})

</script>

<template>
    
  <v-dialog 
    v-model="dialog"  
    eager
    persistent 
    width="1800"   
    class="p-absolute user-select-none" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>아카데미 참석 제외신청 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch','btnUpdate','btnDelete','btnReqApply','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex">
          <v-sheet width="38%">
            <div class="searchArea d-flex">
              <i-select 
                :label="$t('사업부')" 
                v-model="options.values.BSNS_CD" 
                labelWidth="39px"
                width="200px"
                :items="codeList.bsnsCd" 
                item-value="BSNS_CD" 
                item-title="BSNS_NM" 
              />
              <i-select 
                :label="$t('부서')" 
                :readonly="noBsnsCd" 
                v-model="options.values.DEPT_CD"
                labelWidth="26px"
                width="200px" 
                :items="codeList.deptCd" 
                item-value="DEPT_CD" 
                item-title="DEPT_NM" 
              />
              <VRadioGroup v-model="options.values.USER_DIV" inline>
                <VRadio 
                  v-for="item in codeList.USER_DIV" 
                  class="mt-1"
                  :key="item" 
                  :value="item.COD" 
                  :label="item.TXT" 
                  :disabled="item.DISABLE" 
                />
              </VRadioGroup>
            </div>
            <div class="h-auto">
              <IGridTitle :title="$t('□ 인원 리스트')"/>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :gridViewOption="grdMainProps.gridViewOption"
                :fields="grdMainProps.field"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="rowChanged"
              /> 
            </div>

          </v-sheet>
          <v-sheet class="flexcolumn" width="5%" style="justify-content: center; align-items: center;">
            <div>
              <v-btn @click="AddData" append-icon="mdi-chevron-right" class="mb-6" width="70">
                등록
              </v-btn>
            </div>
            <div>
              <v-btn @click="RemoveData" append-icon="mdi-chevron-left" width="70">
                취소
              </v-btn>
            </div>
          </v-sheet>
          <v-sheet width="57%" class="flex-column">
            <div class="d-flex searchArea">
              <i-select 
                :label="$t('진행상태')"
                menu-icon=""
                readonly
                v-model="PopDataProp.STATE" 
                labelWidth="70px"
                width="250px"
                :items="codeList.STATE" 
                item-value="COD" 
                item-title="TXT" 
              />
              <i-input 
                :label="$t('내부승인자')"
                labelWidth="70px"
                width="200px"
                @keypress.enter ="empPopupOpen"  
                @click:appendInner="empPopupOpen" 
                append-inner-icon="mdi-magnify" 
                v-model="PopDataProp.EMP_NM" 
                class="mx-2"/>
              <i-input 
                readonly   
                width="150px"
                v-model="PopDataProp.EMPLO"
              />
              <i-input 
                readonly   
                width="310px"
                v-model="PopDataProp.REJECT_REASON"
              />
            </div>
            <div class="h-auto">
              <IGridTitle :title="$t('□ 제외 신청 리스트')"/>
              <RealGrid
                ref="grdDetail"
                class="mt-2"
                :gridViewOption="grdDetailProps.gridViewOption"
                :fields="grdDetailProps.field"
                :columns="grdDetailProps.columns"
                :column-layout="grdDetailProps.columnLayout"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected ="selected" />
    <SendMailPopup ref="MailPopup"/>
  </v-dialog>
</template>

<style scoped lang="scss">
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>