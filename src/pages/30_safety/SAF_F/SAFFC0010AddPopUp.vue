
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'

import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi , commonSendSMS } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['upDataRow'])
const dialog = ref(false)
const grdMain = ref(null)
const grdDetail =ref(null)

const empPopup =ref(null)
const noBsnsCd =ref(true)
const Apply = ref(false)
const MailPopup = ref(null)
const menuTitle = ref(null)


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



//  인원검색

//  진행상태 검색
const PopDataProp = reactive({
  STATE:'10',
})





const initCodeList = () => {
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

const openPopup = popupParam =>
{


  //   초기화

    detailData.CMPNY_DIV=''
    detailData.APPLY_DATE=''
    detailData.SEQ=''
    PopDataProp.EMPLO = ''
    PopDataProp.EMP_NM = ''
  
    detailData.APPLY_EMP = ''
    detailData.APPLY_EMP_NM = ''
    detailData.EMAIL = ''
    detailData.HNDPHN = ''
    detailData.APPROVE_EMP_NM = ''
    detailData.ASGN_NM = ''
    detailData.APPR_USER_DIV = ''
    PopDataProp.EMPLO = ''
    PopDataProp.EMP_NM = ''

    if(popupParam){
    console.log(popupParam,'popupParam')

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
    detailData.HNDPHN = popupParam.HNDPHN
    searchDetail()
  }
  Apply.value = false
  initCodeList()
  dialog.value = true

  vm.$nextTick(() => {
    if(detailData.SEQ !== '' && detailData.APPLY_EMP !== userStore.userId) {
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnDelete', true)
      menuTitle.value.disableBtn('btnReqApply', true)
    } else {
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnDelete', false)
      menuTitle.value.disableBtn('btnReqApply', false)
    }
  })
}


//  사업부 바뀌면
watch(() => options.values.BSNS_CD, newValue => {

  commonSearchApi({ queryId: "searchDept3",param: { CMPNY_DIV: options.values.CMPNY_DIV,BSNS_CD: newValue }})
  .then((res)=>{
  
    if(newValue ==''){
     return noBsnsCd.value = true
    }
    options.values.DEPT_CD = ''
    codeList.deptCd = res.ORESULT_CUR
    noBsnsCd.value = false
  }) 
    })





const onButtonsClick = btn => {
 
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
      .setAfter(async res => { 
        // console.log('after res', res)
        // res?.list[0]?.RES_SEQ
        // onButtonsClick({id :'btnClose' })
        // upDataRow()

        if(detailData.SEQ === '') {
          const temp = {
            APPLY_DATE_FR: dayjs().format('YYYY-MM-DD'),
            APPLY_DATE_TO: dayjs().format('YYYY-MM-DD'),
            APPROVE_YN: 'N',
            BSNS_CD: '',
            CMPNY_DIV: userStore.cmpnyDiv,
            DEPT_CD: '',
            STATE: '',
          }

          await commonSearchApi({ queryId: "SPPBC0010_SEARCH01", param: temp }).then(res2 => {
            const newSeq = res?.list[0]?.RES_SEQ
            const data = res2.ORESULT_CUR

            // console.log('data', data)

            for(let i = 0; i < data.length; i++) {
              if(data[i].SEQ == newSeq) {
                detailData.CMPNY_DIV = data[i].CMPNY_DIV
                detailData.APPLY_DATE = data[i].APPLY_DATE
                detailData.SEQ = data[i].SEQ
                detailData.APPLY_EMP = data[i].APPLY_EMP
                detailData.APPLY_EMP_NM = data[i].APPLY_EMP_NM
                detailData.EMAIL = data[i].EMAIL
                detailData.HNDPHN = data[i].HNDPHN
                detailData.APPROVE_EMP_NM = data[i].APPROVE_EMP_NM
                detailData.ASGN_NM = data[i].ASGN_NM
                detailData.APPR_USER_DIV = data[i].APPR_USER_DIV
                PopDataProp.EMPLO = data[i].APPROVE_EMP
                PopDataProp.EMP_NM = data[i].APPROVE_EMP_NM
                PopDataProp.STATE = data[i].STATE
                detailData.HNDPHN = data[i].HNDPHN
                searchDetail()
                break
              }
            }
          })
        } else {
          searchDetail()
        }
       })
      .run()
  }

  else if(btn.id ==='btnDelete'){
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { 
        onButtonsClick({id :'btnClose'})
        upDataRow()
       })
      .run()
  }

  else if(btn.id ==='btnReqApply'){

    if(!PopDataProp.EMPLO){
      return   Message.warn(t('내부승인자가 지정되어 있지 않습니다.'))
    }
    
    Apply.value = true
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(saveGrdData)
      .setAfter(res => { 
        // console.log('res1', res)

        onButtonsClick({id :'btnClose' })
        upDataRow()

        if(res != null) {
          MailPopup.value.openPopup(res.param,'SAFFC0010')
        }

        // console.log('res2', res)
       })
      .run()
  }
  





  else if (btn.id == 'btnClose'){
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
  return commonSearchApi({ queryId: "SAFFC0010_PopUp_SEARCH_01", param: options.values })
}

const afterSearch01 = (res) => {
  console.log(res, "resMains")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}



const searchDetail = () => {
  commonSearchApi({ queryId: "SAFFC0010_PopUp_SEARCH_02", param: detailData })
  .then((res)=>{
    grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
  })

}


// 저장


const mainCheck = async() =>{
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  

  
  if(checkedRows.length === 0){
    if(PopDataProp.EMPLO !==''){
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

const saveGrdData = async ()=>{

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
      CMPNY_DIV             : data.CMPNY_DIV,
      APPLY_DATE            : data.APPLY_DATE  ?  data.APPLY_DATE.replace(/-/g, "") : '',
      SEQ                   : detailData.SEQ == '' ?  null : detailData.SEQ , 
      EXCEPT_BSNS_CD        : data.EXCEPT_BSNS_CD,
      EXCEPT_DEPT_CD        : data.EXCEPT_DEPT_CD,
      EXCEPT_ASGN_CD        : data.EXCEPT_ASGN_CD,
      EXCEPT_EMP            : data.EXCEPT_EMP,
      EXCEPT_DATE_FR        : data.EXCEPT_DATE_FR,
      EXCEPT_DATE_TO        : data.EXCEPT_DATE_TO,
      EXCEPT_REASON         : data.EXCEPT_REASON,
      EXCEPT_REASON_DESC    : data.EXCEPT_REASON_DESC,
      USER_ID               : userStore.userId
    }

    
    saveParamDetail.push(pushSub)
    })


    if(!saveParamMain){
      return
    }

    if(!saveParamDetail){
      return
    }

if(Apply.value === false){
   const result01 = await commonExecuteApi({ queryId : 'SAFFC0010_POPUP_SAVE_01', list: saveParamMain })
   await commonExecuteApi({ queryId : 'SAFFC0010_POPUP_SAVE_02', list: saveParamDetail })
   return result01
  }
  else {

    let ApplyParam = [{
      CMPNY_DIV  : userStore.cmpnyDiv,
      APPLY_DATE :detailData.APPLY_DATE,
      SEQ :detailData.SEQ,
      APPROVE_EMP: PopDataProp.EMPLO,
      STATE:'20',
      USER_ID:userStore.userId
    }]
    // console.log('aaa')
  let resParam = null
  await commonExecuteApi({ queryId : 'SAFFC0010_POPUP_SAVE_01', list: saveParamMain })
          .then(async (res1)=>{
            // console.log('bbb')
            await commonExecuteApi({ queryId : 'SAFFC0010_POPUP_SAVE_02', list: saveParamDetail })
            .then(async (res2)=>{
              // console.log('ccc')
              await commonExecuteApi({ queryId : 'SAFFC0010_POPUP_SAVE_03', list:   ApplyParam })
                        .then((res3)=>{
                          // console.log('ddd')
                            if(detailData.APPR_USER_DIV == 'A'){

                // 메일삽입구간
                    let Nm = !detailData.APPLY_EMP_NM ? userStore.userName : detailData.APPLY_EMP_NM
                    let ASGNNM = !detailData.ASGN_NM ? userStore.bsnsNm + '-' + userStore.deptNm +'-' + userStore.asgnNm : detailData.ASGN_NM


                      let mailParams ={
                        M_EMail : !detailData.EMAIL ? userStore.email : detailData.EMAIL,
                        M_TITLE : 'SLI 점수 집계 제외요청 결재 승인 요청건',
                        M_CONTENT:`   
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
                            <p style='line-height: 30px;'><span class='text'>수신 부서의 SLI 점수 집계 제외요청이 등록되었습니다. 내용 검토 후 승인을 진행해 주시기 바랍니다.<br/> 
                              승인은 [HiSEs]->[SLI]->[SLI 메인]->[SLI점수(안전교육) 집계 제외신청] 메뉴에서 ‘본인 승인자 지정 건 조회’ 체크 후 진행 바랍니다.<br/><br/> 
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


          mailParams.M_CONTENT += `    <tr>`
          mailParams.M_CONTENT += `        <td width='33px' align='center'>${cnt}</td>`, 
          mailParams.M_CONTENT += `        <td width='200px' align='left'>${ASGN_SHRT_NM}</td>`, 
          mailParams.M_CONTENT += `        <td width='40px' align='center'>${EMP_NM}</td>`, 
          mailParams.M_CONTENT += `        <td width='76px' align='center'>${EXCEPT_DATE_FR}</td>`, 
          mailParams.M_CONTENT += `        <td width='60px' align='center'>${EXCEPT_DATE_TO}</td>`, 
          mailParams.M_CONTENT += `        <td width='71px' align='center'>${EXCEPT_REASON}</td>`, 
          mailParams.M_CONTENT += `        <td width='59px' align='left'>${EXCEPT_REASON_DESC}</td>`, 
          mailParams.M_CONTENT += `    </tr>`
          }
          mailParams.M_CONTENT += "</table>"
          mailParams.M_CONTENT += "</body>"
          mailParams.M_CONTENT += "</html>"

          // MailPopup.value.openPopup(mailParams,'SAFFC0010')
          resParam = { param: mailParams }

          }

          else {
              let sendSMSParams = {
                    EMPNO_FROM  : userStore.empNo,
                    SYSCODE: '156',
                    EMPNO_TO:PopDataProp.EMPLO,
                    FROM_P_NO:detailData.HNDPHN,
                    TITLE:'[Hi-SEs] SLI 점수 집계 제외요청 등록 \r\n 내용 검토 후 승인 진행 바랍니다.',
                  }
              
                    commonSendSMS(sendSMSParams).finally( () => {
                    Message.success('SMS 발송완료')
                  })
                }
                // console.log('eee')
            })
          })
        })
        return resParam
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



  return commonExecuteApi({ queryId : 'SAFFC0010_POPUP_DELETE_01', list: delParam })
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
    { fieldName: "ASGN_NM", dataType: "text", width: "300", styleName: "left-column", header: { text: t("소속") } },
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
    { fieldName: "ASGN_SHRT_NM", dataType: "text", visible: false },
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
  { fieldName: "ASGN_SHRT_NM", dataType: "text",  styleName: "left-column", header: { text: t("제외자 소속") },editable: false},
  { fieldName: "EXCEPT_EMP", dataType: "text",   header: { text: t("제외자 사번") } ,editable: false },
  { fieldName: "EMP_NM", dataType: "text",  header: { text: t("제외자") },editable: false },
  
  { fieldName: 'EXCEPT_DATE_FR',header: { text: t('시작월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
  editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },

  { fieldName: 'EXCEPT_DATE_TO',header: { text: t('종료월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
  editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },



  { 
  fieldName: "EXCEPT_REASON"
   ,dataType: "text"  
   ,header: { text: t("제외사유") }
  ,styleName: 'editable_column' 
  ,lookupDisplay: true,
  editor: {
        type: "dropdown",
      }
    },

  { fieldName: "EXCEPT_REASON_DESC", dataType: "text",  header: { text: t("제외 세부사유") },styleName: "left-column editable_column"  },


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
  param =  grdMain.value.getDataProvider().getJsonRow(i)
  let  checkItem = arr.some(row => row.EXCEPT_EMP === param.EMP_NO)
   
if(!checkItem){
   grdDetail.value.addRow({
    ASGN_SHRT_NM:param.ASGN_NM,
    EXCEPT_EMP:param.EMP_NO,
    EMP_NM:param.EMP_NM,
    APPLY_DATE:dayjs().format('YYYYMMDD'),
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


// 팝업존
const empPopupOpen =()=>{

  empPopup.value.openPopup(PopDataProp)
}

const selected =(row)=>{
  console.log(row,'row')
  if(row){
      PopDataProp.EMPLO = row.EMP_NO
      PopDataProp.EMP_NM = row.EMP_NM
      detailData.APPR_USER_DIV = row.USER_DIV
      detailData.HND_PHN = row.HND_PHN
      }

    }


 const upDataRow = () => {
  emit('upDataRow','upDataRow')
}
defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="1640"   
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      집계 제외신청 팝업
    </div>
    
    
    <VContainer style="background-color: white;">
      <IMenuTitle
        ref="menuTitle"
            :button-list="['btnSearch','btnUpdate','btnDelete','btnReqApply','btnClose']"
            @click-button="onButtonsClick"
          />

          <v-row>
            <v-col class="d-flex"  cols="12">

              <!-- 인원검색 -->
              <v-col cols="6">
                <VRow>
                  <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>


              <VCol cols="12" md="4">
                <ILabel :label="$t('사업부')"  >
                  <template #editor="editorProps">
                    <VAutocomplete v-model="options.values.BSNS_CD" :items="codeList.bsnsCd" item-value="BSNS_CD" item-title="BSNS_NM" />
                  </template>
                </ILabel>
              </VCol>

              <VCol cols="12" md="4">
                <ILabel :label="$t('부서')"   >
                  <template #editor="editorProps">
                    <VAutocomplete :readonly="noBsnsCd" v-model="options.values.DEPT_CD" :items="codeList.deptCd" item-value="DEPT_CD" item-title="DEPT_NM" />
                  </template>
                </ILabel>
              </VCol>


              <VCol cols="12" md="4">
                <ILabel  label-loc="none" >
                  <template #editor="editorProps">
                    <VRadioGroup v-model="options.values.USER_DIV" inline>
                      <VRadio v-for="item in codeList.USER_DIV" :key="item" :value="item.COD" :label="item.TXT" :disabled="item.DISABLE" />
                    </VRadioGroup>
                  </template>
                </ILabel>
              </VCol>
        
        
       
   
            </VRow>
          </VForm>
        </VCol>
                </VRow>
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 500px"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.field"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="rowChanged"
          />
        </VCol>
      </VRow>

              </v-col>


              <!-- 인원검색 종료 -->


              <!--  등록 / 삭제 -->
              <v-col cols="1"  align-self="center" class="mx-2">
                  <v-btn @click="AddData" append-icon="mdi-chevron-right" class="mb-6" width="120">
                     등록
                  </v-btn>

                  <v-btn @click="RemoveData" append-icon="mdi-chevron-left" width="120">
                    삭제
                  </v-btn>
              </v-col>
          <!-- 등록/삭제 종료 -->


          <!-- 인원등록 -->
              <v-col cols="5">
                <VRow>
                  <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>
              <VCol cols="12" md="4">
                <ILabel :label="$t('진행상태')" >
                  <template #editor="editorProps">
                    <VAutocomplete 
                    menu-icon=""
                    readonly
                    v-model="PopDataProp.STATE" 
                    :items="codeList.STATE" 
                    item-value="COD" 
                    item-title="TXT" />
                  </template>
                </ILabel>
              </VCol>

              <VCol cols="12" md="8">
                <ILabel :label="$t('내부승인자')" >
                  <template #editor="editorProps">
                   <v-text-field 
                   @keypress.enter ="empPopupOpen"  
                   @click:appendInner="empPopupOpen" 
                   append-inner-icon="mdi-magnify" 
                   v-model="PopDataProp.EMP_NM" 
                   class="mx-2"/>
                   <v-text-field readonly   v-model="PopDataProp.EMPLO"/>
                  </template>
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
        </VCol>
                </VRow>
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdDetail"
            class="mt-2"
            style="height: 500px"
            :gridViewOption="grdDetailProps.gridViewOption"
            :fields="grdDetailProps.field"
            :columns="grdDetailProps.columns"
            :column-layout="grdDetailProps.columnLayout"
          />
        </VCol>
      </VRow>

              </v-col>








            </v-col>
          </v-row>
 
          <EmpPopup ref="empPopup" @selected ="selected" />
          <SendMailPopup ref="MailPopup"/>
      </VContainer>
    </VDialog>

</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>