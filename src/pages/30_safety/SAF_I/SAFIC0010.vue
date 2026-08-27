<!-- 
  * Vue 내 용 : 협력사 안전관리자 역량평가 등록 전체
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/10
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/10 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import SAFIC0010Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIC0010Popup01.vue"
import SAFIC0020Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIC0020Popup01.vue"
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import { isEmpty } from 'lodash-es'
import Message from "@hiway/utils/notify"
import _ from 'lodash'

defineOptions({
  name:'30_safety-SAF_I-SAFIC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const codeList = reactive({})

const grdMain = ref(null)
const menuTitle = ref(null)
const confirmButtons = ref(null)
const sAFIC0010Popup01 = ref(null)
const sAFIC0020Popup01 = ref(null)
const MailPopup = ref(null)

const isCharger = ref(false)  //담당자확인
const isGeneralManager = ref(false)  //총괄담당자확인

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HALF: '',
  BSNS_CD: '', // 전체
  STATUS:'',
  CHRG_GRP: '',
  RANK_GBN: 'A',
  USER_ID: userStore.userId,
})

//조회조건
const ParamsImPort= reactive({
  CMPNY_DIV: '',
  YEAR: dayjs().get("year"),
  HALF: '',
  BSNS_CD: '', // 전체
  USER_ID: '',
})

/* 조회 구분 */
const dtHalf = reactive([
  { COD: "1", TXT: "상반기" },
  { COD: "2", TXT: "하반기" },
])

const dtBusiness = reactive([
  { COD: "", TXT: "전체" },
  { COD: "AC00", TXT: "조선사업부" },
  { COD: "AE00", TXT: "특수선사업부" },
  { COD: "AQ00", TXT: "해양에너지사업본부" },
  { COD: "AK00", TXT: "엔진기계사업부" },
])

const dtCharger = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "조선" },
  { COD: "G", TXT: "군산" },
])

/* 조회 구분 */
const dtRank = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "사업부" },
])

// 그리드 콤보박스
const PRIZEList = ref(
  [
    { COD: 'Y' , TXT: '포상' },
    { COD: 'N' , TXT: ' ' },
  ],
)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    checkBar: { visible: true },
    footers: {
      visible: true,
      items:[
        {},
        { height: 30,styleName:"text-primary" },
        { height: 30,styleName:"text-primary" },
      ],
    },
  },
  keys : ['CMPNY_DIV','COMP_CD','BSNS_CD','DEPT_CD', 'ASGN_CD', 'PART_CD', 'EMP_NO'],
  fields : [
    { 
      fieldName: 'RANKING', 
      dataType: 'text', 
      width: '50',
      header: { text: t('순위') },
    },
    { 
      fieldName: 'BSNS_NM', 
      dataType: 'text', 
      width: '120',
      header: { text: t('사업부') },
      editable: false,
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'PART_NM', 
      dataType: 'text', 
      width: '150',
      editable: false,
      header: { text: t('부문') },
      mergeRule: { "criteria": "value" },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'DEPT_NM', 
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서') },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'COMP_NM', 
      dataType: 'text', 
      width: '150',
      editable: false,
      styleName: "left-column",
      header: { text: t('협력사') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'EMP_NO', 
      dataType: 'text', 
      width: '120',
      editable: false,
      header: { text: t('사번') },
    },
    { 
      fieldName: 'KOR_NM', 
      dataType: 'text', 
      width: '75',
      editable: false,
      header: { text: t('성명') },
      footers:[
        {},
        {
          text:"평점",
          visible:"true",
          align:"center",
        },
        {
          text:"최대점수",
          visible:"true",
          align:"center",
        },
      ],
    },
    { 
      fieldName: 'EVAL1', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '70',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'column-right',
      header: { text: t('재해지표 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL2', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('업무역량  (15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL3', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('점검활동 (15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL4', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('현장관리 (10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL5', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('직무능력 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL6',
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      styleName: "editable_column-right",
      header: { text: t('협력사평가 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL7', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('개선활동 (가점/5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL8', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('신규자격증획득 (가점/5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SUM_VAL', 
      dataType: 'number', 
      numberFormat: "#,###.#",
      width: '60',
      editable: false,
      styleName: "right-column",
      header: { text: t('합계 (100점) + α') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
      valueExpression: "values['EVAL1'] +values['EVAL2'] +values['EVAL3'] +values['EVAL4'] +values['EVAL5'] + values['EVAL6'] + values['EVAL7'] + values['EVAL8']",
    },
    { 
      fieldName: 'EVAL_RESULT', dataType: 'text', 
      width: '70',
      editable: false,
      header: { text: t('평가결과 (가점포함)') },
    },
    { 
      fieldName: 'AWARD_HIS', dataType: 'text', 
      width: '70',
      header: { text: t('포상여부') },
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        if(isGeneralManager.value) {
          ret.editable = true
          ret.styleName = "editable_column"
        }
        else {
          ret.editable = false
          ret.styleName = "center-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      width: '200',
      editable: true,
      styleName: "editable_column-left",
      header: { text: t('비고') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'SELF_EVAL_STATUS_NM', dataType: 'text',
      width: '180',
      editable: false,
      styleName: "left-column",
      header: { text: t('업체자체 평가상태') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        let targetData = grid.getValue(dataCell.index.itemIndex, "SELF_EVAL_STATUS")

        if(targetData == 'C'){
          ret.styleName = "button-blue"
        }
        else if (targetData == 'Y') {
          ret.styleName = "button-grey"
        }
        else if (targetData == 'F') {
          ret.styleName = "button-green"
        }
        else {
          ret.styleName = "button-white"
        }

        ret.renderer = {
          type:'button',
        }

        return ret
      },
    },
    { 
      fieldName: 'STATUS', dataType: 'text', 
      width: '150',
      editable: false,
      header: { text: t('최종 확정상태') },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'COMP_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
    { fieldName: 'SELF_EVAL_STATUS', dataType: 'text' , visible: false },
    { fieldName: 'EMAIL', dataType: 'text' , visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'GM_CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'AWARD_HIS_YEAR', dataType: 'text' , visible: false },
    { fieldName: 'IMPORT_CHK', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 7,
    })
    searchParams.HALF = getHalf(dayjs().format('MM'))
    initPage()
    setBindCombo()
  })  
})

const setBindCombo = () => {
  grdMain.value.setBindingColumn(
    'AWARD_HIS',
    PRIZEList.value,
    'COD',
    'TXT',
  )
}

const initPage = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    ASGN_CD: userStore.asgnCd,
    EMP_NO: userStore.userId,
  }

  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIB0010_SEARCH_EMP', param }) , 
  ]).then(res => {
    if(res[0].ORESULT_CUR.length === 0) {
      searchParams.BSNS_CD = userStore.bsnsCd
      setDisableBtns('Y')
      isCharger.value = false
      isGeneralManager.value = false
    }
    else {
      res[0].ORESULT_CUR.forEach( value => {
        console.log('[initPage] value : ', value.PS_GUBUN)
        
        //총괄 담당자 및 각 사업 담당자는 모두 저장, 삭제, 불러오기, 엑셀 업로드 버튼 활성화
        if(value.PS_GUBUN === 'PS00' || value.PS_GUBUN === 'PS10' ||
        value.PS_GUBUN === 'PS20' || value.PS_GUBUN === 'PS30' ||
        value.PS_GUBUN === 'PS40' || value.PS_GUBUN === 'PS50') {
          setDisableBtns('N')
          isCharger.value = true

          if(value.PS_GUBUN === 'PS00') {
            isGeneralManager.value = true
            checkConfirmButton('Y')
          } else {
            isCharger.value = true
            checkConfirmButton('N')
          }
        }
        else {
          setDisableBtns('Y')
          isCharger.value = false
          isGeneralManager.value = false
        }

        if(value.PS_GUBUN === 'PS00') { //총괄담당자
          codeList.BSNS_CD = dtBusiness
          searchParams.BSNS_CD = ''
        }
        else if(value.PS_GUBUN === 'PS10') {  //조선담당자
          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )
          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'S',
          )

          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'A'
        }
        else if(value.PS_GUBUN === 'PS20') {  //군산담당자
          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )

          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'G',
          )
          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'G'
        }
        else if(value.PS_GUBUN === 'PS30') {  //해양담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AQ00',
          )
          searchParams.BSNS_CD = 'AQ00'
        }
        else if(value.PS_GUBUN === 'PS40') {  //엔진기계담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AK00',
          )
          searchParams.BSNS_CD = 'AK00'
        }
        else if(value.PS_GUBUN === 'PS50') {  //특수선담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AE00',
          )
          searchParams.BSNS_CD = 'AE00'
        }
      })
    }
  })
}

const setDisableBtns = disabled => {

  console.log('[setDisableBtns] disabled = ', disabled)

  if(disabled === 'Y') {
    menuTitle.value.disableBtn("btnSelectEvalTarget", true)
    menuTitle.value.disableBtn("btnUpdate", true)
    menuTitle.value.disableBtn("btnDelete", true)
    confirmButtons.value.disableBtn("btnChargerConfirm", true)
    confirmButtons.value.disableBtn("btnCancelConfirm", true)
  }
  else {
    menuTitle.value.disableBtn("btnSelectEvalTarget", false)
    menuTitle.value.disableBtn("btnUpdate", false)
    menuTitle.value.disableBtn("btnDelete", false)
    confirmButtons.value.disableBtn("btnChargerConfirm", false)
    confirmButtons.value.disableBtn("btnCancelConfirm", false)
  }
}

const checkConfirmButton = disabled => {
  if(disabled === 'Y') {
    confirmButtons.value.disableBtn("btnChargerConfirm", true)
    confirmButtons.value.disableBtn("btnCancelConfirm", true)
    confirmButtons.value.disableBtn("btnGeneralManagerConfirm", false)
    confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", false)
  }
  else {
    confirmButtons.value.disableBtn("btnChargerConfirm", false)
    confirmButtons.value.disableBtn("btnCancelConfirm", false)
    confirmButtons.value.disableBtn("btnGeneralManagerConfirm", true)
    confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", true)
  }
}

const onButtonsClick = btn => {
  if (btn.id === 'btnSelectEvalTarget') {
    selectEvalTarget()
  } else if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnDataImport') {
    //재해지표 테스트
     new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchEval1Data)
      .setAfter(setEval1Import)
      .run()
    //Message.error(t('개발중입니다.'))
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])  
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("데이터가 없습니다.")
    }

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else if (btn.id === 'btnSampleDown') {
    let params = {
      FILE_PATH: 'SAFI',
      FILE_NAME: '첨부1. 협력사 안전관리자 역량평가 점수 업로드 파일(양식).xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnSendMail') {
    transMail()
  } 
}


//재해지표 데이터 바인딩
const setEval1Import = (res) => {
  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  //수정 한 데이터는 수정불가능하게 컬럼 속성 변경
  //재해지표 값 데이터
  if(res.ORESULT_CUR1.length > 0) {
    for (let i = 0; i < res.ORESULT_CUR1.length; i++) {
      let eval1 = res.ORESULT_CUR1[i].DSST_AVG

      //그리드 데이터 비교 후 업체가 일치하면 재해지표 변경
      for(let j=0; j <grdMainData.length;j++){
        //let val = grdMainData[j]
        if(grdMainData[j].COMP_CD === res.ORESULT_CUR1[i].COMP_CD) {
          grdMain.value.getDataProvider().setValue(j, 'EVAL1', eval1 )
          grdMain.value.getGridView().checkItem(j, true)
          //grdMain.value.setColumnProperty('EVAL1', 'editable', false)
          //cellStyle(grdMainData[j])
        }
      }
    }


    if(res.ORESULT_CUR2.length > 0){
      for (let i = 0; i < res.ORESULT_CUR2.length; i++) {
        let total = res.ORESULT_CUR2[i].TOTAL

        //그리드 데이터 비교 후 업체가 일치하면 협력사 점수 변경
        for(let j=0; j <grdMainData.length;j++){
          //let val = grdMainData[j]
          if(grdMainData[j].COMP_CD === res.ORESULT_CUR2[i].COMP_CD) {
            grdMain.value.getDataProvider().setValue(j, 'EVAL6', total )
            //grdMain.value.setColumnProperty('EVAL1', 'editable', false)
            grdMain.value.getGridView().checkItem(j, true)
            grdMain.value.getDataProvider().setValue(j, 'IMPORT_CHK', 'Y' )
            //cellStyle(grdMainData[j])
          }
        }
      }

    }


    //업체자체 평가상태 가져오기
    //getCompanyEvaluationStatus()

    cellStyle()

  }

}

//업체자체 평가상태 가져오기
const getCompanyEvaluationStatus = () => {
  

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()
  
  for (let i = 0; i < grdMainData.length; i++) {
    //let Params = []
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    

    ParamsImPort.CMPNY_DIV = data.CMPNY_DIV
    ParamsImPort.YEAR = data.REG_DATE.substr(0, 4)
    ParamsImPort.HALF = data.REG_DATE.substr(4)
    ParamsImPort.BSNS_CD = data.BSNS_CD
    ParamsImPort.USER_ID = data.EMP_NO

    commonSearchApi({
      queryId: 'SAFIC0030_SEARCH_01',
      param: ParamsImPort ,
    }).then((res) => {

      //검토완료 , 완료 상태 일때만 넣어주기
      if(res.ORESULT_CUR[0].SELF_EVAL_STATUS === 'Y' || res.ORESULT_CUR[0].SELF_EVAL_STATUS === 'F'){
        res.ORESULT_CUR[0]?.TASK && grdMain.value.getDataProvider().setValue(i, 'EVAL3', res.ORESULT_CUR[0].TASK);
        res.ORESULT_CUR[0]?.IMPR_ACTV && grdMain.value.getDataProvider().setValue(i, 'EVAL7', res.ORESULT_CUR[0].IMPR_ACTV);
        res.ORESULT_CUR[0]?.LICENSE && grdMain.value.getDataProvider().setValue(i, 'EVAL8', res.ORESULT_CUR[0].LICENSE);
      }
    })
  }
}

const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function(grid, dataCell) {
    let ret = {}

    // if (dataCell.dataColumn.fieldName === 'EVAL3' || dataCell.dataColumn.fieldName === 'EVAL7' || dataCell.dataColumn.fieldName === 'EVAL8') {
     if (dataCell.dataColumn.fieldName === 'EVAL6') { 
        // 숨겨진 IMPORT_CHK 컬럼 값 가져오기
        if (dataCell.index.dataRow !== undefined && dataCell.index.dataRow!== null) {
          const confirm = grid.getDataSource().getValue(dataCell.index.dataRow, 'IMPORT_CHK');

          // IMPORT_CHK 값이 'Y'인 경우
          if (confirm === 'Y') {
              ret.editable = false; // 입력 불가
              // ret.style = { background: "#6799FF" }; // 파란 배경
              ret.style = { background: "#FFFFFF" }; // 기본 배경
          } else {
              ret.editable = true; // 입력 가능
              ret.style = { styleName: "editable_column-right", }; // 기본 배경
          }
          return ret
        }       
    }
    return ret
  })
}

const onStatusButtonsClick = btn => {
  if (btn.id === 'btnChargerConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeConfirm)
      .setQuery(confirmData)
      .setConfirmMessage('최종확정 하시겠습니까?')
      .setResultMessage('확정되었습니다.')
      .setAfter(() => {
        // vm.$swal({ 
        //   title: t('담당자 확정 후 수정불가하며, 수정을 위해서는 안전경영부 담당자에게 문의 후 조치바랍니다.'), 
        //   showCancelButton: false,
        // })
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
  else if (btn.id === 'btnCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancel)
      .setQuery(cancelConfirmData)
      .setConfirmMessage('확정 취소 하시겠습니까?')
      .setResultMessage('확정 취소되었습니다.')
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnGeneralManagerConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeGeneralManagerConfirm)
      .setQuery(GeneralManagerconfirmData)
      .setConfirmMessage('총괄 담당자 확정 하시겠습니까?')
      .setResultMessage('확정되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
  else if (btn.id === 'btnGeneralManagerCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeGeneralManagerCancelConfirm)
      .setQuery(GeneralManagerCancelconfirmData)
      .setConfirmMessage('총괄 담당자 확정취소 하시겠습니까?')
      .setResultMessage('확정취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {
  let grdMainData = grdMain.value.getDataProvider().getJsonRows()
  
  var mappedData = excelData.map(item => {
    return {
      EMP_NO: item.사번,
      COMP_NM: item.협력사명,
      KOR_NM: item.성명,
      EVAL2: item.업무역량,
      EVAL4: item.현장관리,
      EVAL5: item.직무능력,
    }
  })

  if(mappedData.length > 0){
    mappedData.forEach(item => {

      for(let i=0; i <grdMainData.length;i++)
      {
        let val = grdMainData[i]
        if(val.EMP_NO === item.EMP_NO) {
          grdMain.value.getDataProvider().setValue(i, 'EVAL2', item.EVAL2 )
          grdMain.value.getDataProvider().setValue(i, 'EVAL4', item.EVAL4 )
          grdMain.value.getDataProvider().setValue(i, 'EVAL5', item.EVAL5 )
        }
      }
    })
  }

  Message.success(t('엑셀 업로드 되었습니다.'))
}

const selectEvalTarget = () => {
  const strBSNS_NM = _.find(dtBusiness, { COD: searchParams.BSNS_CD })

  sAFIC0010Popup01.value.openPopup(searchParams.BSNS_CD, strBSNS_NM.TXT, searchParams.CHRG_GRP)
}

// 조회
const searchData = () =>{
  return commonSearchApi({ queryId : 'SAFIC0010_SEARCH_01', param: searchParams })
}

const searchEval1Data = () =>{
  return commonSearchApi({ queryId : 'SAFIC0010_SEARCH_IMPORT', param: searchParams })
  //return commonSearchApi({ queryId : 'SAFIC0010_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  // grdMain.value.getDataProvider().clearRows();

  console.log('afterSearchGrdMain : ', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  searchParams.STATUS = res.ORESULT_CUR[0].STATUS
  customGridCellStyle()

  
} 

const beforeDelete = () => {
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.SELF_EVAL_STATUS === 'F') {
      return Message.warn(t('검토완료된 평가는 삭제 할 수 없습니다.'))
    }

    if(data.CONFIRM_YN === 'Y') {
      return Message.warn("최종 확정된 평가는 삭제 할 수 없습니다.")
    }

    if(data.GM_CONFIRM_YN === 'Y') {
      return Message.warn("총괄 담당자 확정된 평가는 삭제 할 수 없습니다.")
    }
  }

  return true
}

//삭제
const deleteData = () => {
  let deleteParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  console.log('deleteParams = ', deleteParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_DELETE_01', list: deleteParams })
}

const beforeSave = () => {
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    //저장 시 검토완료된 평가 수정조건 제외(엄정준책임요청)
    // if(data.SELF_EVAL_STATUS === 'F') {
    //   return Message.warn(t('검토완료된 평가는 수정 할 수 없습니다.'))
    // }

    if(data.CONFIRM_YN === 'Y') {
      return Message.warn("최종 확정된 평가는 수정 할 수 없습니다.")
    }

    if(data.GM_CONFIRM_YN === 'Y') {
      return Message.warn("총괄 담당자 확정된 평가는 수정 할 수 없습니다.")
    }
  }

  return true
}

//저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    saveParams.push(data)
  }

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_01', list: saveParams })
}

// 메일 전송
const transMail = () => {
  let mailForm = {
    TO_EMP_NO: [],
    TO_EMP_NM: [],
  }

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }
  
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.EMAIL)) {
      Message.warn(data.COMP_NM + '은(는) 이메일이 없습니다.')
    }
    else {
      mailForm.TO_EMP_NO.push(data.EMAIL)
      mailForm.TO_EMP_NM.push(data.COMP_NM)
    }
  }
  
  if (mailForm.TO_EMP_NO.length > 0) {
    MailPopup.value.openPopup(mailForm)
  }
}

const beforeConfirm = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  if (!isCharger.value) {
    return Message.err("담당자가 아닙니다.")
  }


  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.CONFIRM_YN === 'Y') {
      return Message.err("이미 담당자 확정 대상은 확정할 수 없습니다.")
    }

    if(data.SELF_EVAL_STATUS !== 'F') {
      return Message.err("검토 미완료 대상은 확정할 수 없습니다.")
    }

    if(data.GM_CONFIRM_YN === 'Y') {
      return Message.err("총괄 담당자 확정 대상은 확정할 수 없습니다.")
    }
  }

  return true
}

//담당자 확정
const confirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,   
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        COMP_CD : data.COMP_CD,  
        REG_DATE : data.REG_DATE,
        EMP_NO : data.EMP_NO,
        CONFIRM_YN : 'Y',
        USER_ID : userStore.userId,
      },
    )
  }

  console.log('[confirmData] params : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_02', list: saveParams })
}

const beforeCancel = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isCharger.value) {
    return Message.err("담당자가 아닙니다.")
  }

  return true
}

//확정
const cancelConfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,   
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        COMP_CD : data.COMP_CD,  
        REG_DATE : data.REG_DATE,
        EMP_NO : data.EMP_NO,
        CONFIRM_YN : 'N',
        USER_ID : userStore.userId,
      },
    )
  }

  console.log('saveData4 : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_02', list: saveParams })
}

const beforeGeneralManagerConfirm = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isGeneralManager.value) {
    return Message.err("총괄 담당자가 아닙니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let value = data.AWARD_HIS_YEAR

    if(value > 0) {
      return Message.err("1년 이내 포상이력이 있는 관리자가 있습니다. 확인 바랍니다.(" + data.KOR_NM + ")")
    }

    if(data.CONFIRM_YN !== 'Y') {
      return Message.err("담당자 확정 미완료된 대상이 있습니다.")
    }

    if(data.SELF_EVAL_STATUS !== 'F') {
      return Message.err("검토 미완료 대상은 확정할 수 없습니다.")
    }
  }

  return true
}

//총괄 담당자 확정
const GeneralManagerconfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let halfName = searchParams.HALF == '1' ? '상반기' : '하반기'
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,   
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        COMP_CD : data.COMP_CD,  
        REG_DATE : data.REG_DATE,
        EMP_NO : data.EMP_NO,
        AWARD_HIS : 'Y',
        GM_CONFIRM_YN : 'Y',
        USER_ID : userStore.userId,

        YEAR: searchParams.YEAR,
        HALF: searchParams.HALF,
        REWARD_DESCR: searchParams.YEAR + '년 ' + halfName + '우수 안전관리자',
        STATUS: 'C'
      },
    )
  }

  console.log('[confirmData] params : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_03', list: saveParams })
}

const beforeGeneralManagerCancelConfirm = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isGeneralManager.value) {
    return Message.err("총괄 담당자가 아닙니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.GM_CONFIRM_YN === 'N') {
      return Message.err("총괄 담당자 확정 미완료된 대상이 있습니다.")
    }
  }

  return true
}

//총괄 담당자 확정취소
const GeneralManagerCancelconfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,   
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        COMP_CD : data.COMP_CD,  
        REG_DATE : data.REG_DATE,
        EMP_NO : data.EMP_NO,
        AWARD_HIS : 'N',
        GM_CONFIRM_YN : 'N',
        USER_ID : userStore.userId,

        YEAR: searchParams.YEAR,
        HALF: searchParams.HALF,
        STATUS: 'D'
      },
    )
  }

  console.log('[confirmData] params : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_03', list: saveParams })
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

  console.log('[onCellItemClicked] = ', col.field)
  if(col.field === 19) {
    switch(data.SELF_EVAL_STATUS) {
    case "C":
    case "Y":
    case "F":
      // vm.$swal({
      //   title: t('데이터 불러오기를 저장하지 않은경우 저장해주세요.'),
      //   showCancelButton: true,
      // }).then((ck) => {
      //   if (ck.isConfirmed === true) {
      //     sAFIC0020Popup01.value.openPopup(data, isCharger.value)
      //   }
      // })
      sAFIC0020Popup01.value.openPopup(data, isCharger.value)
      break
    case "N":
      Message.err("자체평가를 하지 않은 데이터 입니다.")
      break
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    searchParams.STATUS = row.STATUS

    // if(isCharger.value) {
    //   // 담당자 확정 후 버튼 비활성화
    //   if(row.CONFIRM_YN === 'Y') {
    //     setDisableBtns2('Y')
    //   }
    //   else {
    //     setDisableBtns2('N')
    //   }
    // }
  }
}

// 최대 최소 값 입력 방지
const onEditRowChanged  = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)

  switch(fieldName) {
  case 'EVAL1' :
  case 'EVAL5':
    if(newValue > 20) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'EVAL2':
  case 'EVAL3':
    if(newValue > 15) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'EVAL4':
    if(newValue > 10) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'EVAL6':
    if(newValue > 20) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'EVAL7':
  case 'EVAL8':
    if(newValue > 5) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break 
  }
}

const getHalf  = month => {
  let half = '1'
  
  switch(month) {
  case "01":
  case "02":
  case "03":
  case "04":
  case "05":
  case "06":
    half = '1'
    break
  case "07":
  case "08":
  case "09":
  case "10":
  case "11":
  case "12":
    half = '2'
    break
  }

  return half
}

const customGridCellStyle = () => {

  grdMain.value.getGridView().setCellStyleCallback(function(grid, dataCell) {
    let ret = {}

    if(dataCell.dataColumn.fieldName === 'KOR_NM') {
      let confirm = grid.getValue(dataCell.index.itemIndex, 'CONFIRM_YN')

      if(confirm === 'Y') {
        ret.style = { background: "#6799FF" } 
      }
      else{
        ret.style = { background: "#FFFFFF" } 
      }
    }

    //검토완료(점검활동, 개선활동, 신규자격증)상태는 입력 불가
    if(dataCell.dataColumn.fieldName === 'EVAL3' || dataCell.dataColumn.fieldName === 'EVAL6' || dataCell.dataColumn.fieldName === 'EVAL7' || dataCell.dataColumn.fieldName === 'EVAL8') {
      let confirm1 = grid.getValue(dataCell.index.itemIndex, 'SELF_EVAL_STATUS')

      if(confirm1 === 'F'){
        ret.editable = false; // 입력 불가
        ret.style = { background: "#FFFFFF" }; // 기본 배경
      }else{
        ret.style = { background: "#EFF8FD" }
      }
    }

    return ret
  })
}

const popupClosed = () => {
  onButtonsClick({ id :'btnSearch' }) 
}

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :use-permission="false"
        :button-list="['btnSelectEvalTarget', 'btnSearch', 'btnDataImport', 'btnUpdate', 'btnDelete' , 'btnExcelUpload', 'btnSampleDown', 'btnSendMail']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex justify-space-between align-center mb-3">
            <div>
              <i-select
                v-model="searchParams.BSNS_CD"
                :label="$t('사업부')"
                label-width="60px"
                append-inner-icon="mdi-magnify"
                :items="codeList.BSNS_CD"
                item-title="TXT"
                item-value="COD"
                width="250px"
              />
              <div>
                <v-radio-group
                  v-model="searchParams.CHRG_GRP"
                  inline
                >
                  <v-radio 
                    v-for="(item, i) in codeList.CHRG_GRP" 
                    :key="i" 
                    class="radio-box mx-2"
                    :value="item.COD" 
                    :label="item.TXT"
                  />
                </v-radio-group>
              </div>
            </div>
            
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="60px"
              type="Number"
              width="150px"
            />
            <i-select
              v-model="searchParams.HALF"
              :label="$t('반기')"
              label-width="60px"
              append-inner-icon="mdi-magnify"
              :items="dtHalf"
              item-title="TXT"
              item-value="COD"
              width="230px"
            />
            <i-select
              v-model="searchParams.RANK_GBN"
              :label="$t('순위')"
              label-width="60px"
              append-inner-icon="mdi-magnify"
              :items="dtRank"
              item-title="TXT"
              item-value="COD"
              width="230px"
            />
            <i-input
              v-model="searchParams.STATUS"
              :label="$t('진행상태')"
              label-width="50px"
              width="250px"
              readonly
            />
            <IGridTitle
              ref="confirmButtons"
              class="ma-2"
              :use-permission="false"
              :button-list="['btnChargerConfirm', 'btnCancelConfirm', 'btnGeneralManagerConfirm', 'btnGeneralManagerCancelConfirm']"
              @click-button="onStatusButtonsClick"
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            class="pa-0 h-auto"
          >
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @on-cell-item-clicked="onCellItemClicked"
              @on-cell-clicked="onCellClicked"
              @on-edit-row-changed="onEditRowChanged"
            />
          </v-sheet>
        </div>
      </div>
      <!-- 평가 대상 선정 팝업 -->
      <SAFIC0010Popup01
        ref="sAFIC0010Popup01"
        @closed="popupClosed"
      />
      <SAFIC0020Popup01
        ref="sAFIC0020Popup01"
        @closed="popupClosed"
      />
      <SendMailPopup ref="MailPopup" />
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
    min-height: 700px;
  }
}
.radio-box{
    width: 60px;
}
</style>