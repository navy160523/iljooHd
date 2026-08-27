<!--
  화면명 : 단기공사 적격성평가 팝업
  화면개요 : 단기공사 적격성평가 처리 팝업
  최종수정일자: 2024-05-27
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { commonSearchApi, commonExecuteApi, commonSendSMS, commonSendApi } from '@hiway/api/commonApi'

import SAFJA0030Popup02 from "@/pages/30_safety/SAF_J/SAFJA0030Popup02.vue"

onMounted(() => {
});

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t; //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const isEval1 = ref(true)
const isEval2 = ref(true)
const codeList = reactive({
  dataList1: []
})

const dataList1 = ref([])

//pdf 파일 뷰어 팝업
const SAFJA0030Pop02 = ref(null)

const mailParams = reactive({
  EMAIL: [],
  SUBJECT: '',
  CONTENT: ''
})
const sendSMSParams = reactive({})

const EVAL_VAL_STATUS = ref(false)
const EVAL_VAL_STATUS2 = ref(false)

// v-model 
const setData = reactive({
  CMPNY_DIV: '',
  VND_NAME: '',
  BIZ_REG_NO: '',
  REV: '',
  BIZ_REG_NM: '',
  REG_DATE: dayjs(new Date()).format('YYYY-MM-DD'), //기간 시작,

  EVAL_CMPNY_DIV: '',
  EVAL_BSNS_CD: '',
  EVAL_DEPT_CD: '',
  EVAL_BSNS_NM: '',   //1차 평가자 사업부 명
  EVAL_DEPT_NM: '',   //1차 평가자 부서 명

  EVAL_CMPNY_DIV2: '',
  EVAL_BSNS_CD2: '',
  EVAL_DEPT_CD2: '',
  EVAL_BSNS_NM2: '',  //2차 평가자 사업부 명
  EVAL_DEPT_NM2: '',  //2차 평가자 부서 명

  EVAL_USER_ID: '',
  EVAL_USER_NM:'',    //1차 평가자명
  EVAL_USER_ID2:'',
  EVAL_USER_NM2:'',   //2차 평가자명
  EVAL_TELNO2: '',
  EVAL_PHN2: '',
  EVAL_EMAIL2: '',
  CNT: '',
  BIZ_KIND: '',
  SAFE_REVIEW: '',
  OPER_REVIEW: '',
  SYS_LCD: '',
  SYS_MCD: '',
  SYS_SCD: '',
  WORKER_CNT: 0,
})

const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: false },footer: { visible:true } },
  keys : [],
  fields: [
    { fieldName: "CODE_DESC1", dataType: "text", header: { text: t("대구분") },editable: false ,width:60, mergeRule: { "criteria": "value" } },
    { fieldName: "SYS_CDNM", dataType: "text", header: { text: t("중구분") },editable: false,width:60 },
    {
      fieldName: "CODE_DESC2", dataType: "text", styleName: 'left-column', header: { text: t("평가 기준") }, editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          // console.log('cell',cell)
          // console.log('grid',grid)
          let data = ""
          if (cell.value) {
            data = cell.value
          }
          var str = `<div style="display: flex; justify-content: space-between;">
        <p style="width: calc(100% - 18px); text-overflow: ellipsis; overflow: hidden;">${data}</p>
        <button id="cellButton"><span class="mdi mdi-paperclip" style="font-size: 21px color:#666"></span></button>
        </div>`
          return str
        },
      },
    },
    { fieldName: "STR1", dataType: "number", header: { text: t("배점") }, editable: false, width: 30,
      footer: {expression: 'sum', styleName: 'footer-font center-column'},numberFormat: "#,##0"},

    { fieldName: "EVAL_NUM2", dataType: "number", editor: { type:"line", ignoreCharacters:"ㄱ-힣A-Za-z"}, header: { text: t("1차평가(현업)") },
      editable: false,width:30,footer: {expression: 'sum', styleName: 'footer-font center-column'},numberFormat: "#,##0", 
      'styleCallback': function(grid, dataCell){
        var data = grid.getValue(dataCell.index.itemIndex, 'EVAL_NUM2')
        if(grid.getValue(dataCell.index.itemIndex, 'STR2') < data) {
          Message.err(t('평가점수는 우수보다 높을 수 없습니다.'))
          grid.setValue(dataCell.index.itemIndex, 'EVAL_NUM2', '')
        } else if(grid.getValue(dataCell.index.itemIndex, 'STR4') > data) {
          Message.err(t('평가점수는 미흡보다 낮을 수 없습니다.'))
          grid.setValue(dataCell.index.itemIndex, 'EVAL_NUM2', '')
        }
        return
      }
    },
    { fieldName: "EVAL_NUM3", dataType: "number", editor: { type:"line", ignoreCharacters:"ㄱ-힣A-Za-z"}, header: { text: t("2차평가(현업)") }, 
      editable: false,width:30,footer: {expression: 'sum', styleName: 'footer-font center-column' },numberFormat: "#,##0",
      'styleCallback': function(grid, dataCell){
        var data = grid.getValue(dataCell.index.itemIndex, 'EVAL_NUM3')
        if(grid.getValue(dataCell.index.itemIndex, 'STR2') < data) {
          Message.err(t('평가점수는 우수보다 높을 수 없습니다.'))
          grid.setValue(dataCell.index.itemIndex, 'EVAL_NUM3', '')
        } else if(grid.getValue(dataCell.index.itemIndex, 'STR4') > data) {
          Message.err(t('평가점수는 미흡보다 낮을 수 없습니다.'))
          grid.setValue(dataCell.index.itemIndex, 'EVAL_NUM3', '')
        }
        return
      }
    },
    
    { fieldName: "STR2", dataType: "number", header: { text: t("우수") },editable: false,width:30,
      footer: {expression: 'sum', styleName: 'footer-font center-column'},numberFormat: "#,##0" },
    { fieldName: "STR3", dataType: "number", header: { text: t("보통") },editable: false,width:30,numberFormat: "#,##0" },
    { fieldName: "STR4", dataType: "number", header: { text: t("미흡") }, editable: false, width: 30 ,numberFormat: "#,##0"},
    
    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("CMPNY_DIV") }, editable: false, visible: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("BIZ_REG_NO") }, editable: false, visible: false },
    { fieldName: "REV", dataType: "text", header: { text: t("REV") }, editable: false, visible: false },
    { fieldName: "SYS_LCD", dataType: "text", header: { text: t("SYS_LCD") }, editable: false, visible: false },
    { fieldName: "SYS_MCD", dataType: "text", header: { text: t("SYS_MCD") }, editable: false, visible: false },
    { fieldName: "SYS_SCD", dataType: "text", header: { text: t("SYS_SCD") }, editable: false, visible: false },
    { fieldName: "FILES", dataType: "text", header: { text: t("FILE_ID") }, editable: false, visible: false },
  
  ],
  columns: [],
  columnLayout: [
    "CODE_DESC1","SYS_CDNM","STR1", "CODE_DESC2","EVAL_NUM2","EVAL_NUM3",
    {
      name: "bandHeader1",
      direction: "horizontal",
      hideChildHeaders: false,
      items: ["STR2", "STR3","STR4"],
      header: { text: t("종합") },
    },
    
  ],
});

grdProps1.columns = grdProps1.fields;


const itemProps = (item) => {
  console.log('item ', item)
  return {
    title: item.KOR_NM,
    // subtitle: item.BSNS_NM item.DEPT_NM,
    subtitle: `${item.BSNS_NM} - ${item.DEPT_NM}`,
  }
}

//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnUpdate') {

    const getData = grd1.value.getDataProvider().getJsonRows(0, -1)

    for (let i = 0; i < getData.length; i++){
      getData[i].REG_DATE = setData.REG_DATE.replaceAll('-','')
      getData[i].OPER_REVIEW = setData.OPER_REVIEW
      getData[i].SAFE_REVIEW = setData.SAFE_REVIEW

      getData[i].EVAL_USER_ID = setData.EVAL_USER_ID
      getData[i].EVAL_CMPNY_DIV = setData.EVAL_CMPNY_DIV
      getData[i].EVAL_BSNS_CD   = setData.EVAL_BSNS_CD
      getData[i].EVAL_DEPT_CD   = setData.EVAL_DEPT_CD

      getData[i].EVAL_USER_ID2 = setData.EVAL_USER_ID2
      getData[i].EVAL_CMPNY_DIV2 = setData.EVAL_CMPNY_DIV2
      getData[i].EVAL_BSNS_CD2   = setData.EVAL_BSNS_CD2
      getData[i].EVAL_DEPT_CD2  = setData.EVAL_DEPT_CD2

      getData[i].USER_ID = userStore.userId

    }



    console.log('getData:  ', getData )
    

    if (getData.length > 0) {
      commonExecuteApi({ queryId : 'SAFJA0030_INSERT_01', list: getData }).then(() => {
        Message.success('저장 되었습니다.')
      })
    }

  } else if (btn.id === 'btnShortFileViewer') {
    // const getData = {
    //   CMPNY_DIV: userStore.cmpnyDiv,
    //   BIZ_REG_NO: setData.BIZ_REG_NO,
    // }

    // //파일 뷰어 팝업 호출
    // SAFJA0030Pop02.value.openPopup(getData);

  } else if (btn.id === 'btnClose') {


    onClose()
  } else if (btn.id === 'btnFirstComplete') {
    vm.$swal({
      title:'1차 완료하시겠습니까?',
      showCancelButton: true,
    }).then(res => {
      if(res.isConfirmed) {
        firstComplete()
      }
    })
  } else if (btn.id === 'btnSecondComplete') {
    vm.$swal({
      title:'2차 완료하시겠습니까?',
      showCancelButton: true,
    }).then(res => {
      if(res.isConfirmed) {
        SecondComplete()
      }
    })
  }





}

// 안전평가자 요청
const firstComplete = () => {

  const getData = grd1.value.getDataProvider().getJsonRows(0, -1)
  let sum_EVAL_NUM2 = 0  // 1차평가 점수 합
  for (let i = 0; i < getData.length; i++){
    sum_EVAL_NUM2 = sum_EVAL_NUM2 + ( (getData[i].EVAL_NUM2 === null ) ? 0 : getData[i].EVAL_NUM2 )
  }
  
  setData.EVAL_VAL_STATUS1 =  ( (sum_EVAL_NUM2 >= 60 )? '10': '20')



  if(isNullCheck(setData.EVAL_DEPT_CD2)) {
    return Message.err(t('안전평가자를 확인해주십시오.'))
  } else if(isNullCheck(setData.OPER_REVIEW)) {
    return Message.err(t('현업(발주)부서 검토의견을 확인해주십시오.'))
  }

  let rows = grd1.value.getDataProvider().getRowCount()
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    if(isNullCheck(data.EVAL_NUM2)) {
      return Message.err(t('1차 평가(현업)을 모두 완료하셔야 합니다.'))
    }
  }

  console.log("1차평가: ", setData)
  commonExecuteApi({ queryId : 'SAFJA0030_UPDATE_02', list: [setData] }).then(() => {

    Message.success('1차 완료 처리 하였습니다.')

    // 메일과 문자 송신
    mailParams.EMAIL = [setData.EVAL_EMAIL2]
    mailParams.SUBJECT = `${setData.VND_NAME}(Rev. ${setData.REV})의 적격성평가 2차평가(안전) 담당자로 지정되었습니다.`
    mailParams.CONTENT = `
      <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>적격성평가 2차평가(안전) 담당자로 지정되었습니다. <br>
          업체명: ${setData.VND_NAME} <br>
          Rev.: ${setData.REV} <br>
          사업자등록번호: ${setData.BIZ_REG_NO} <br>
          1차(현업) 담당자: ${setData.EVAL_USER_NM} <br>
          1차(현업) 담당자 사업부: ${setData.EVAL_BSNS_NM} <br>
          1차(현업) 담당자 부서: ${setData.EVAL_DEPT_NM} <br>
        </body>
      </html>`         
    commonSendApi(mailParams).then(async () => {
      sendSMSParams.SYSCODE = '156'
      sendSMSParams.FROM_P_NO =  '0522022114'//setData.vendTelno.replace(/-/g, '') //vendTelno
      sendSMSParams.TO_P_NO = setData.EVAL_PHN2.replace(/-/g, '') //mngHndPhn
      sendSMSParams.TITLE = `${setData.VND_NAME}(Rev. ${setData.REV})의 적격성평가 2차평가(안전) 담당자로 지정되었습니다.`
      sendSMSParams.GUBUN = '0'
      
      commonSendSMS(sendSMSParams).then((res) => {
        Message.success(t('완료되었습니다.'))
        onClose()
      })
    })

  })
}


// 2차 평가 완료 요청
const SecondComplete = () => {




  const getData = grd1.value.getDataProvider().getJsonRows(0, -1)
  let sum_EVAL_NUM3 = 0  // 1차평가 점수 합
  for (let i = 0; i < getData.length; i++){
    sum_EVAL_NUM3 = sum_EVAL_NUM3 + ( (getData[i].EVAL_NUM2 === null ) ? 0 : getData[i].EVAL_NUM2 )
  }

  let param = {}
  param.CMPNY_DIV = setData.CMPNY_DIV       
  param.BIZ_REG_NO  = setData.BIZ_REG_NO     
  param.USER_ID     = userStore.userId
  param.EVAL_VAL_STATUS2 =  ( (sum_EVAL_NUM3 >= 60 )? '10': '20')


  if(isNullCheck(setData.SAFE_REVIEW)) {
    return Message.err(t('안전 부서 검토의견을 기입해주십시오.'))
    }

  let rows = grd1.value.getDataProvider().getRowCount()
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    if(isNullCheck(data.EVAL_NUM3)) {
      return Message.err(t('2차 평가를 모두 완료하셔야 합니다.'))
    }
  }



console.log("2차평가: ", param)

commonExecuteApi({ queryId : 'SAFJA0030_UPDATE_03', list: [param] }).then(() => {

  Message.success('2차 완료 처리 하였습니다.')

})
}









//컨트롤 초기화
const clearField = () => {
  
  // options.values.BSNS_CD = ""
  // options.values.ASGN_NM = ""
}

//팝업닫기
const onClose = () => {
  clearField()
  dialog.value = false
} 

const openPopup = async (popupParam) => {

  console.log("openPopup:", popupParam)

  EVAL_VAL_STATUS.value = popupParam.EVAL_VAL_STATUS1 === '10' ? true : false
  EVAL_VAL_STATUS2.value = popupParam.EVAL_VAL_STATUS2 === '10' ? true : false


  // 로그인자가  1, 2차 평가자인지 조회 -> 대상자 아닌 경우 평가완료 버튼 숨기기
  isEval1.value = popupParam.EVAL_USER_ID === userStore.userId ? true : false
  isEval2.value = popupParam.EVAL_USER_ID2 === userStore.userId ? true : false

  menuTitle.value.visibleBtn('btnFirstComplete' , false) 
  menuTitle.value.visibleBtn('btnSecondComplete', false) 

  if (isEval1.value){
    menuTitle.value.visibleBtn('btnFirstComplete' , true) 
  }
  if (isEval2.value){
    menuTitle.value.visibleBtn('btnSecondComplete', true) 
  }


   // 1차평가 완료일 때 btnFirstComplete 비활성화 
  if (EVAL_VAL_STATUS.value){ 
    menuTitle.value.disableBtn('btnFirstComplete', true) 
    if (isEval1.value){ menuTitle.value.disableBtn('btnUpdate', true) }
  }

   // 2차평가 완료일 때 btnSecondComplete 비활성화 
   if (EVAL_VAL_STATUS2.value){ 
    menuTitle.value.disableBtn('btnSecondComplete', true)
    if (isEval2.value){ menuTitle.value.disableBtn('btnUpdate', true) } 
  }





  //2차 평가자 조회
  commonSearchApi({ queryId: "SAFJA0030_SEARCH_04", param: popupParam  }).then(async res => {

    console.log('SAFJA0030_SEARCH_04 ', res)

    if (res.ORESULT_CUR.length > 0) {

      console.log('res.ORESULT_CUR ', res.ORESULT_CUR)
      codeList.dataList1 = res.ORESULT_CUR
      
    }
    
  })

  commonSearchApi({ queryId: "SAFJA0030_SEARCH_02", param: popupParam }).then(async res => {
    console.log('SAFJA0030_SEARCH_02 ', res)
    if (res.ORESULT_CUR.length > 0) {
      dialog.value = true 

      const rowData = res.ORESULT_CUR
      grd1.value.getDataProvider().setRows(res.ORESULT_CUR);
      setData.VND_NAME = res.ORESULT_CUR[0].VND_NAME
      setData.BIZ_REG_NO = res.ORESULT_CUR[0].BIZ_REG_NO
      setData.REV = res.ORESULT_CUR[0].REV
      setData.BIZ_REG_NM = res.ORESULT_CUR[0].BIZ_REG_NM
      setData.REG_DATE = res.ORESULT_CUR[0].REG_DATE === null ? dayjs(new Date()).format('YYYY-MM-DD') : res.ORESULT_CUR[0].REG_DATE

      setData.EVAL_CMPNY_DIV = res.ORESULT_CUR[0].EVAL_CMPNY_DIV
      setData.EVAL_BSNS_CD = res.ORESULT_CUR[0].EVAL_BSNS_CD
      setData.EVAL_BSNS_NM = res.ORESULT_CUR[0].EVAL_BSNS_NM
      setData.EVAL_DEPT_CD = res.ORESULT_CUR[0].EVAL_DEPT_CD
      setData.EVAL_DEPT_NM = res.ORESULT_CUR[0].EVAL_DEPT_NM
      setData.EVAL_USER_ID = res.ORESULT_CUR[0].EVAL_USER_ID
      setData.EVAL_USER_NM = res.ORESULT_CUR[0].EVAL_USER_NM

      setData.EVAL_CMPNY_DIV2 = res.ORESULT_CUR[0].EVAL_CMPNY_DIV2
      setData.EVAL_BSNS_CD2 = res.ORESULT_CUR[0].EVAL_BSNS_CD2
      setData.EVAL_BSNS_NM2 = res.ORESULT_CUR[0].EVAL_BSNS_NM2
      setData.EVAL_DEPT_CD2 = res.ORESULT_CUR[0].EVAL_DEPT_CD2
      setData.EVAL_DEPT_NM2 = res.ORESULT_CUR[0].EVAL_DEPT_NM2
      setData.EVAL_USER_ID2 = res.ORESULT_CUR[0].EVAL_USER_ID2
      setData.EVAL_USER_NM2 = res.ORESULT_CUR[0].EVAL_USER_NM2


      setData.CNT = res.ORESULT_CUR[0].CNT
      setData.BIZ_KIND = res.ORESULT_CUR[0].BIZ_KIND
      setData.SAFE_REVIEW = res.ORESULT_CUR[0].SAFE_REVIEW
      setData.OPER_REVIEW = res.ORESULT_CUR[0].OPER_REVIEW
      setData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
      setData.SYS_LCD = res.ORESULT_CUR[0].SYS_LCD
      setData.SYS_MCD = res.ORESULT_CUR[0].SYS_MCD
      setData.SYS_SCD = res.ORESULT_CUR[0].SYS_SCD

      setData.WORKER_CNT = res.ORESULT_CUR[0].WORKER_CNT

      console.log('setData ',setData)

      cellStyle(popupParam)
    }
  })

  /**************** popupParam Object로 넘겨주기 *****************/
  if (!popupParam) {
    dialog.value = true
    return
  }
}

const cellStyle = val => {
  grd1.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if(dataCell.dataColumn.fieldName === 'EVAL_NUM3'){
      if(val.EVAL_STATUS1 === '30'){
        ret.styleName = 'editable_column'
        ret.editable = true
      }else {
        ret.styleName = ''
        ret.editable = false
      }
    }else if(dataCell.dataColumn.fieldName === 'EVAL_NUM2'){
      if(val.EVAL_STATUS1 === '30'){
        ret.styleName = ''
        ret.editable = false
      }else {
        ret.styleName = 'editable_column'
        ret.editable = true
      }
    }
    return ret
  })
}

//부서 조회
const comboList3 = () => {

  console.log('codeList.dataList1 ', codeList.dataList1)
  console.log('setData.EVAL_USER_ID2 ', setData.EVAL_USER_ID2)

  const data = codeList.dataList1.filter((data) => data.EMP_NO === setData.EVAL_USER_ID2)

  console.log('data ', data)

  setData.EVAL_CMPNY_DIV2 = data[0].CMPNY_DIV
  setData.EVAL_DEPT_CD2 = data[0].DEPT_CD
  setData.EVAL_DEPT_NM2 = data[0].DEPT_NM
  setData.EVAL_BSNS_CD2 = data[0].BSNS_CD
  setData.EVAL_BSNS_NM2 = data[0].BSNS_NM
  setData.EVAL_EMAIL2 = data[0].EMAIL
  setData.EVAL_PHN2 = data[0].HND_PHN
}

const onCellItemClicked = (grid, index, col) => {
  if(col.cellType === 'data') {
    if(col.fieldName === 'CODE_DESC2') {
      if(col.target.className.indexOf('paperclip') > -1) {
        const data = grd1.value.getDataProvider().getJsonRow(index.dataRow)

        SAFJA0030Pop02.value.openPopup({
          CMPNY_DIV: 'VENDER',
          BIZ_REG_NO: data.BIZ_REG_NO,
          FILE_ID: data.FILES,
        })
      }
    }
  }
}

const cellDbClick = (grid, data) => {
  if (data.cellType === 'header' || data.cellType === 'footer') {
    return
  }

  if (data.column === 'CODE_DESC2') {
    console.log('grid ', grid)
    console.log('data ', data)
    console.log('setData ', setData)

    const grdRow = grd1.value.getDataProvider().getJsonRow(data.dataRow)
    console.log('grdRow ', grdRow)
    const getData = {
      CMPNY_DIV: 'VENDER',
      BIZ_REG_NO: setData.BIZ_REG_NO,
      FILE_ID: grdRow.FILES
    }

    //파일 뷰어 팝업 호출
    SAFJA0030Pop02.value.openPopup(getData);
  }

  // if (data.column === 'FILE_ID')
  // {
  //   return
  // }
  
  // let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  // emit("selected", row)
  // dialog.value = false
}

//grid 값 변경 이벤트
const grdEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {

  let getRowData = ''
  let num1 = 0
  if (field === 5 || field === 6) {
    getRowData = grd1.value.getDataProvider().getJsonRow(itemIndex, false)

    if (field === 5) {

      if (getRowData.EVAL_NUM3 === null) {
          num1 = newValue/2
      } else {
          num1 = (Number(newValue) + Number(getRowData.EVAL_NUM3))/2
      }
       
    } else {

      if (getRowData.EVAL_NUM2 === null) {
          num1 = newValue/2
      } else {
          num1 = ( Number(newValue) + Number(getRowData.EVAL_NUM2))/2
      }
    }
    grid.commit()
    grd1.value.getDataProvider().setValue(itemIndex, 'EVAL_NUM1', num1)
  }
}

const copy = async () => {
  grd1.value.getGridView().commit()

  let rows = await grd1.value.getDataProvider().getJsonRows()

  rows.forEach((e, idx) => {
    grd1.value.getDataProvider().setValue(idx, "EVAL_NUM3", e.EVAL_NUM2)
  })
}

// null값인지 아닌지 확인
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

// 안전 평가자 확인
const clickCheckManager = async() => {
  // validate check
  if(isNullCheck(setData.EVAL_USER_NM2)) {
    return Message.err(t('평가자 이름을 입력해주십시오.'))
  } else if(isNullCheck(setData.EVAL_TELNO2)) {
    return Message.err(t('휴대폰 번호 끝 4자리를 입력해주십시오.'))
  }

  let manageParam = {
    CMPNY_DIV: 'HHI',
    EMPNM: setData.EVAL_USER_NM2,
    TELNO: setData.EVAL_TELNO2,
  }

  await commonSearchApi({
    queryId: "OUTBA0020_SEARCH_04",
    param: manageParam,
  }).then(async res => {
    
    if (res.ORESULT_CUR.length <= 0) {
      return Message.err(t('해당 평가자가 존재하지 않습니다.'))
    }

    setData.EVAL_USER_ID2 = res.ORESULT_CUR[0].EMP_NO
    setData.EVAL_DEPT_CD2 = res.ORESULT_CUR[0].DEPT_CD
    setData.EVAL_BSNS_CD2 = res.ORESULT_CUR[0].BSNS_CD
    setData.EVAL_EMAIL2 = res.ORESULT_CUR[0].EMAIL
    setData.EVAL_PHN2 = res.ORESULT_CUR[0].HND_PHN
  })
}

defineExpose({
  openPopup,
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1600"
    height="900"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      
    >
      <span>공사 적격성 평가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnFirstComplete','btnSecondComplete','btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet >
            <IGridTitle
              title="1.개요"
              />
            <div class="d-flex pb-2">
              <i-input
                :label="$t('업체명')"
                label-width="90px" 
                width="295px"
                v-model="setData.VND_NAME"
                readonly
                />
              <i-input
                :label="$t('사업자등록번호')"
                label-width="90px" 
                width="233px"
                v-model="setData.BIZ_REG_NM"
                readonly
                />
              <i-input
                :label="$t('Rev.')"
                label-width="30px" 
                width="100px"
                v-model="setData.REV"
                readonly
              />
              <i-input
                :label="$t('작성 일자')" 
                type="date"
                label-width="55px"
                width="225px"
                v-model="setData.REG_DATE"
                readonly
                />
              
                <i-input
                :label="$t('근로자수')"
                label-width="50px" 
                width="150px" 
                v-model="setData.WORKER_CNT"
                readonly
                />
              <i-input
                :label="$t('공종')" 
                label-width="25px"
                width="195px"
                v-model="setData.BIZ_KIND"
                readonly
                />
            </div>
            <div class="d-flex pb-2">
              <i-input
                :label="$t('1차 소속/평가자')"
                class="mr-1"
                label-width="90px" 
                width="240px" 
                v-model="setData.EVAL_BSNS_NM"
                readonly
                />
              <i-input
                :label="$t('')"
                class="mr-1"
                label-width="0px" 
                width="150px" 
                v-model="setData.EVAL_DEPT_NM"
                readonly
                />
              <i-input
                :label="$t('')"
                label-width="0px" 
                width="150px" 
                v-model="setData.EVAL_USER_NM"
                readonly
                />
                <i-input 
                width="245px" 
                label-width="95px" 
                v-model="setData.EVAL_BSNS_NM2" 
                :label="$t('2차(안전)평가자')" 
                class="mr-1"
              />
              <i-input 
                width="150px" 
                label-width="0px" 
                v-model="setData.EVAL_DEPT_NM2" 
                :label="$t('')" 
                class="mr-1"
              />
              <i-select
              :label="$t('')" 
              :items="codeList.dataList1"
              v-model="setData.EVAL_USER_ID2"
              :item-props="itemProps"
              item-value="EMP_NO"
              labelWidth="0px"
              width="150px"
              @update:model-value="comboList3()"
              />
              <!-- item-title="KOR_NM" -->

              <!-- <v-btn
                :color="'btnPrimary'"
                @click="clickCheckManager"
              >
                평가자확인
              </v-btn> -->
              <div class="ml-2 align-center complete-manager" v-if="setData.EVAL_DEPT_CD2">
                확인완료
              </div>
            </div>

          </v-sheet>
          <v-sheet class=" h-auto ">
            <div class="h-full">
              <div class="d-flex justify-space-between">
                <IGridTitle

                  title="2.평가"
                  class="mb-0"
                />
                <div class="d-flex" v-if="EVAL_VAL_STATUS">
                  <v-btn class="mr-2" @click="copy()" v-if="isEval2">
                    1차 점수 복사
                  </v-btn>
                  <div class="align-self-center pa-1 pl-2 pr-2 bg-blue h-full">
                    적격
                  </div>
                </div>
                <div class="d-flex"  v-if="!EVAL_VAL_STATUS">
                  <v-btn class="mr-2" @click="copy()" v-if="isEval2">
                    1차 점수 복사
                  </v-btn>
                  <div class="align-self-center pt-1 pl-2 pr-2 bg-red h-full">
                    <span>
                      부적격
                    </span>
                  </div>
                </div>
              </div>
              <RealGrid
                ref="grd1"
                class="mt-2 mb-2"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                style="height: 334px;"
                @onEditRowChanged="grdEditRowChanged"
                @onCellItemClicked="onCellItemClicked"
                />
                <!-- @onCellDblClicked="cellDbClick" -->
              <!-- <span class="setFontStyle">※ 현업(발주)부서에서는 1차 평가를 실시 후 안전보건지원부에 2차 평가 의뢰</span><br> -->
              <span class="setFontStyle">※ 1년 미만 신규업체는 산업재해 발생현황 미적용(기본점수 20점 적용)</span><br>
              <span class="setFontStyle">※ 평점 60점 이상 “적합“ (단, 평가 미흡 사항에 대해서는 추후 보완 조치)</span>
            </div>
          </v-sheet>
          <v-sheet class=" h-auto mt-2">
            <div class="h-full">
              <IGridTitle
                title="3.검토의견"
                />
              <div class="d-flex">
                <v-sheet width="50%" class="pr-4">
                  <div class="formLabelText">현업(발주)부서 검토의견</div>
                  <v-textarea
                    class="mt-2"
                    rows="4"
                    v-model="setData.OPER_REVIEW"
                  />
                </v-sheet>
                <v-sheet width="50%">
                  <div class="formLabelText">안전 부서 검토 의견</div>
                  <v-textarea
                    class="mt-2"
                    rows="4"
                    v-model="setData.SAFE_REVIEW"
                  />
                </v-sheet>
              </div>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <SAFJA0030Popup02 ref="SAFJA0030Pop02" :buttonList="['btnClose']" />
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
    min-height: 650px;
    max-height: 650px;
    // overflow-y: auto;
  }

  .expanlDiv {
    // min-height: 650px;
    // max-height: 650px;
    overflow-y: auto;
  }
}

.expanTitle{
  background-color: #e3e3e3;
}

.expanText{
  margin: 15px;
}

.setFontStyle{
  font-size: 13px;
  color: #0d65ff;
}

.complete-manager {
  display: flex;
  color: blue;
}
</style>

