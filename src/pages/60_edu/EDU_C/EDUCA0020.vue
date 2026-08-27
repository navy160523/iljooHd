<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import IUpload from "@/components/IUpload.vue"
import { commonDeleteAllFilesApi,commonDeletFilesApi } from '@hiway/api/commonFileApi'



// 계획 등록 팝업
import PlanRegPopup from '@/pages/60_edu/EDU_C/EDUCA0020Popup01.vue'

// 시행결과 등록 팝업
import ResultRegPopup from '@/pages/60_edu/EDU_C/EDUCA0020Popup02.vue'

// 안전 의견 등록 팝업
import OpiRegPopup from '@/pages/60_edu/EDU_C/EDUCA0020Popup03.vue'
import { plant } from "lodash-es"

const planRegPopup = ref(null)
const resultRegPopup = ref(null)
const opiRegPopup = ref(null)
const deptPopup = ref(null)
const iUploadPopup = ref(null)
const fileUpload = ref(null)

const ANALYSIS_RESULT = ref('')
const IMPROVEMENT_ACTIVITY = ref('')


defineOptions({
  name: "60_edu-EDU_C-EDUCA0020",
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore() 
const emit = defineEmits(["closed"])
const OLD_YN = ref('N') //구버전 데이터 여부

const grd1 = ref(null)// 안전의식 상관관계에 따른 개선 방향 목록
const grd2 = ref(null)// 계선 계획 등록 목록
const grd3 = ref(null)// 개선계획 등록 안전 의견 리스트
const grd4 = ref(null)// 시행결과 등록 목록
const grd5 = ref(null)// 시행결과 등록 안전 의견 리스트


const props = defineProps({
  buttonList: {
    Type: Array,
    default: ['btnSearch'],
  },
  readonly: {
    Type: Boolean,
    default: false,
  },
})

/* 조회 조건 */
const searchParams = reactive({
  YEAR: dayjs(new Date()).format('YYYY'),
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  WORK_YR: '',
  JOB_TIT: '',
  SEARCH_COLOR: '', //조회 조건 색상 
  TOT_COLOR: '',
  PLAN_FILEID: '',

})




/* 코드 리스트 */
const codeList = reactive({
  EVA_DIV: [
  {COD: 'A', TXT: '정성' }
  ,{COD: 'B', TXT: '정량' }
  ],
  PERIOD: [
  {COD: 'A', TXT: '월별' }
  ,{COD: 'B', TXT: '발생시' }
  ,{COD: 'C', TXT: '주별' }
  ,{COD: 'D', TXT: '1회(년)' }
  ,{COD: 'E', TXT: '2회(년)' }
    
  ],
  STATUS: [
  {COD: 'A', TXT: '확인완료'}
  ,{COD: 'B', TXT: '재수립요망'}
    
  ]
})



const grd1Props = reactive({
  gridViewOption : {edit: { editable: false }},
  fields: [
  { fieldName: "CATEGORY_NM", width: "60",dataType: "text", header: { text: t("영역") } }
  ,{ fieldName: "GUIDE_DETAIL", dataType: "text", header: { text: t("안내용 문구") } }
  // ,{ fieldName: "CONTENT", dataType: "text", header: { text: t("상관관계") } }

  // 숨김
  ,{ fieldName: "DEPT_CD", dataType: "text", visible: false }
  ,{ fieldName: "CATEGORY", dataType: "text", visible: false }
  ,{ fieldName: "YEAR", dataType: "text", visible: false }
  ],
  columns: [],
})


grd1Props.columns = grd1Props.fields

const grd2Props = reactive({
  gridViewOption : {rowIndicator: {visible: false },edit: { editable: false }},
  fields: [
  { fieldName: "PLAN_TITLE", dataType: "text", header: { text: t("세부추진 사항") } }
  ,{ fieldName: "PLAN_CONTENT", styleName: "left-column",dataType: "text", width: "380", header: { text: t("세부 실행 방안") } }
  ,{ fieldName: "PERIOD",lookupDisplay: true, dataType: "text", header: { text: t("이행주기") } }
  ,{ fieldName: "PLAN_STANDARD", styleName: "left-column",dataType: "text", width: "380", header: { text: t("평가지표 및 실적 측정 기준") } }
  ,{ fieldName: "EVA_DIV",lookupDisplay: true, dataType: "text", header: { text: t("평가구분") } }
  ,{ fieldName: "M1", dataType: "text", width: "30",header: { text: t("1") } 
    , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      },
   }
  ,{ fieldName: "M2", dataType: "text", width: "30", header: { text: t("2") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M3", dataType: "text", width: "30", header: { text: t("3") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M4", dataType: "text", width: "30", header: { text: t("4") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M5", dataType: "text", width: "30", header: { text: t("5") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M6", dataType: "text", width: "30", header: { text: t("6") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M7", dataType: "text", width: "30", header: { text: t("7") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M8", dataType: "text", width: "30", header: { text: t("8") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M9", dataType: "text", width: "30", header: { text: t("9") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M10", dataType: "text", width: "30", header: { text: t("10") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M11", dataType: "text", width: "30", header: { text: t("11") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``

          if(cell.value === 'Y'){
            render =  
              `
              <div>
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              </div>
              `
          }

          return render
        },
      }, }
  ,{ fieldName: "M12", dataType: "text", width: "30", header: { text: t("12") }
  , renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
          let render = ``
 
          if(cell.value === 'Y'){
            render =  
              `
                <div style="height:14px; width: 100%; background-color: #0000ff;">
                </div>
              `
          }else if(cell.value === 'end'){
            render =
            `
            <div>
              <span class='mdi mdi-arrow-right-bold text-light-blue-darken-1 text-h6'></span>
            </div>
            `
            
          }

          return render
        },
      }, }


  // 숨김
  ,{ fieldName: "PLAN_ID", dataType: "text", visible: false }
  ,{ fieldName: "DEPT_CD", dataType: "text", visible: false }
  ,{ fieldName: "YEAR", dataType: "text", visible: false }
  ],
  columns: [],
})


grd2Props.columns = grd2Props.fields


const grd3Props = reactive({
  gridViewOption : {edit: { editable: false }},
  fields: [
  { fieldName: "CONTENT", styleName: "left-column",dataType: "text", width: "1300", header: { text: t("내용") } }
  ,{ fieldName: "STATUS",lookupDisplay: true, dataType: "text", header: { text: t("진행상태") } }
  ,{ fieldName: "INSERT_DATE", dataType: "text", header: { text: t("등록일") } }

  // 숨김
  ,{ fieldName: "OPINION_ID", dataType: "text", visible: false }
  ,{ fieldName: "OPINION_TYPE", dataType: "text", visible: false }
  ,{ fieldName: "DEPT_CD", dataType: "text", visible: false }
  ,{ fieldName: "YEAR", dataType: "text", visible: false }
  ,{ fieldName: "CMPNY_DIV", dataType: "text", visible: false }
  ],
  columns: [],
})

grd3Props.columns = grd3Props.fields

const grd4Props = reactive({
  gridViewOption : {checkBar: { visible: true },edit: { editable: false }},
  fields: [
  { fieldName: "RESULT_CONTENT",styleName: "left-column" ,dataType: "text", width: "1300", header: { text: t("시행결과 내용") } }
  ,{ fieldName: "ATTACH_FILE_KEY", dataType: "text", header: { text: t("첨부파일") },isFile: { value: true, showAlways: true }, }
  ,{ fieldName: "INSERT_DATE", dataType: "text", header: { text: t("등록일") } }

  // 숨김
  ,{ fieldName: "RESULT_ID", dataType: "text", visible: false }
  ,{ fieldName: "DEPT_CD", dataType: "text", visible: false }
  ,{ fieldName: "YEAR", dataType: "text", visible: false }
  ,{ fieldName: "CMPNY_DIV", dataType: "text", visible: false }
  ,{ fieldName: "FILE_NO", dataType: "text", visible: false }
  ],
  columns: [],
})

grd4Props.columns = grd4Props.fields

const grd5Props = reactive({
  gridViewOption : {edit: { editable: false }},
  fields: [
  { fieldName: "CONTENT", styleName: "left-column", dataType: "text", width: "1300", header: { text: t("내용") } }
  ,{ fieldName: "STATUS",lookupDisplay: true, dataType: "text", header: { text: t("진행상태") } }
  ,{ fieldName: "INSERT_DATE", dataType: "text", header: { text: t("등록일") } }

  // 숨김
  ,{ fieldName: "OPINION_ID", dataType: "text", visible: false }
  ,{ fieldName: "OPINION_TYPE", dataType: "text", visible: false }
  ,{ fieldName: "DEPT_CD", dataType: "text", visible: false }
  ,{ fieldName: "YEAR", dataType: "text", visible: false }
  ,{ fieldName: "CMPNY_DIV", dataType: "text", visible: false }
  ],
  columns: [],
})

grd5Props.columns = grd5Props.fields


onMounted(() => {
  // console.log(userStore)
  grd2.value.setBindingColumn('PERIOD', codeList.PERIOD, 'COD', 'TXT')
  grd2.value.setBindingColumn('EVA_DIV', codeList.EVA_DIV, 'COD', 'TXT')
  grd3.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
  grd5.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')

  
})

const onButtonsClick = async btn =>{
  if(searchParams.DEPT_CD !== ''){
    if(btn.id === 'btnSearch'){ // 조회 버튼
      Promise.all([       
        commonSearchApi({  
          queryId : 'EDUCA0020_SEARCH_01',
          param: searchParams }),
        commonSearchApi({  
          queryId : 'EDUCA0020_SEARCH_02',
          param: searchParams }),
        commonSearchApi({  // 시행계획 의견 조회
          queryId : 'EDUCA0020_SEARCH_04',
          param: {
            CMPNY_DIV: searchParams.CMPNY_DIV,
            DEPT_CD: searchParams.DEPT_CD,
            YEAR: searchParams.YEAR,
            OPINION_TYPE: 'A',
          } }),
        commonSearchApi({  // 시행 결과 조회
          queryId : 'EDUCA0020_SEARCH_05',
          param: {
            CMPNY_DIV: searchParams.CMPNY_DIV,
            DEPT_CD: searchParams.DEPT_CD,
            YEAR: searchParams.YEAR,
          } }),  
        commonSearchApi({  // 시행 결과 의견 조회
          queryId : 'EDUCA0020_SEARCH_04', 
          param: {
            CMPNY_DIV: searchParams.CMPNY_DIV,
            DEPT_CD: searchParams.DEPT_CD,
            YEAR: searchParams.YEAR,
            OPINION_TYPE: 'B',
          } }),  
        commonSearchApi({  // 시행계획 과거 파일 조회
          queryId : 'EDUCA0020_SEARCH_06', 
          param: {
            DEPT_CD: searchParams.DEPT_CD,
            YEAR: searchParams.YEAR,
          } }),
      ]).then(res => {
        // console.log('1 번 데이터', res[0].ORESULT_CUR)
        // console.log('2 번 데이터', res[1].ORESULT_CUR)
        // console.log('3 번 데이터', res[2])
        // console.log('4 번 데이터', res[3].ORESULT_CUR)
        // console.log('5 번 데이터', res[4].ORESULT_CUR)
        if(res[0].ORESULT_CUR[0]){
          const grd1Data = res[0].ORESULT_CUR[0]
          const grd1List = [
            {CATEGORY_NM: grd1Data.DISADVANTAGE_1, GUIDE_DETAIL: grd1Data.GUIDE_DETAIL_1 ,CATEGORY: grd1Data.DISADVANTAGE_1_COD, YEAR: grd1Data.YEAR, DEPT_CD: grd1Data.DEPT_CD}
            ,{CATEGORY_NM: grd1Data.DISADVANTAGE_2, GUIDE_DETAIL: grd1Data.GUIDE_DETAIL_2, CATEGORY: grd1Data.DISADVANTAGE_2_COD, YEAR: grd1Data.YEAR, DEPT_CD: grd1Data.DEPT_CD}
            ,{CATEGORY_NM: grd1Data.DISADVANTAGE_3, GUIDE_DETAIL: grd1Data.GUIDE_DETAIL_3, CATEGORY: grd1Data.DISADVANTAGE_3_COD, YEAR: grd1Data.YEAR, DEPT_CD: grd1Data.DEPT_CD}
          ]
          grd1.value.getDataProvider().setRows(grd1List)
          detailSearch(grd1Data.DISADVANTAGE_1_COD)

        }
        
        // grd1.value.getGridView().displayOptions.syncGridHeight = 'always'

        //개선 계획 등록 목록
        if(res[1].ORESULT_CUR){

          const grd2Data = res[1].ORESULT_CUR
          grd2Data.forEach(element => {
            let init = true
            const start = parseInt(element.FROM_MONTH)
            const end = parseInt(element.TO_MONTH)
            for(let i = start;i <= end;i++){
              let key = 'M'+i.toString()
              element[key] = 'Y'
              // console.log('month period',element[key])
              // console.log('i',i)
              // console.log('end',end)
              // if(i === end){
              //   element[key] = 'end'  
              // }
            }
          })
          console.log('grd2Data',grd2Data)
          grd2.value.getDataProvider().setRows(grd2Data)
        } 
        //개선 계획 의견 목록
        if(res[2].ORESULT_CUR){

        const grd3Data = res[2].ORESULT_CUR
        grd3.value.getDataProvider().setRows(grd3Data)
        }
        //시행 결과 목록
        if(res[3].ORESULT_CUR){

        const grd4Data = res[3].ORESULT_CUR
        grd4.value.getDataProvider().setRows(grd4Data)
        }
        if(res[4].ORESULT_CUR){

        //시행 결과 의견 목록
        const grd5Data = res[4].ORESULT_CUR
        grd5.value.getDataProvider().setRows(grd5Data)
        }
        console.log('res',res)
        //시행 계획 과거 파일 조회
        if(res[5].ORESULT_CUR[0]){
          OLD_YN.value = 'Y'
          const PLAN_FILEID = res[5].ORESULT_CUR[0].PLAN_FILEID
          searchParams.PLAN_FILEID = PLAN_FILEID
          fileUpload.value.setGuid(searchParams.PLAN_FILEID)
          fileUpload.value.onButtonsClick({id:'btnSearch'})
        }else{
          OLD_YN.value = 'N'
        }
      })
      } else if (btn.id === 'btnPlanPopup'){// 개선계획 등록
        console.log('searchParams',searchParams)
        planRegPopup.value.openPopup(searchParams, 'reg')
      } else if (btn.id === 'btnOpiPopup'){ // 개선계획 등록 의견
        opiRegPopup.value.openPopup(searchParams, 'reg','A')
      } else if (btn.id === 'btnResultPopup'){ // 시행결과 등록
        resultRegPopup.value.openPopup(searchParams, 'reg')
      } else if (btn.id === 'btnResultDelete'){ //시행결과 등록 목록 삭제
        new deleteFlowHelper(vm, t)
          .setGridList([grd4])
          .setBefore(deleteCheck)
          .setQuery(deleteData)
          .setAfter(() => { 
            onButtonsClick({id:'btnSearch'})
          })
          .run()
      } else if (btn.id === 'btnResultOpiPopup'){ // 시행 결과 의견
        opiRegPopup.value.openPopup(searchParams, 'reg','B')
      } 
  } else{
    Message.warn(t('부서를 선택해주세요.'))
  }
 
  
  if(btn.id === 'btnClose'){
    close()
  } 
}

// 조회1 년도 변경 감지
watch(
  () => searchParams.YEAR,
  (newValue) => {
    
  }
)

const onCellClicked = (grid, clickData) => {
  let selectData = grd1.value.getDataProvider().getJsonRow(clickData.dataRow)
  console.log('selectData',selectData)
  detailSearch(selectData.CATEGORY)
}


//개선 계획 등록 목록 클릭 이벤트
const onCellDblClicked2 = (grd, data) => {
  if (data.cellType === "data") { // 계획등록 수정 팝업창 호출
    console.log('개선 계획 등록 목록 클릭 이벤트 props.readonly',props.readonly)
    let row = grd2.value.getDataProvider().getJsonRow(data.dataRow)
    planRegPopup.value.openPopup(row, 'update',props.readonly)
  }

}


//개선 계획 등록 안전 의견 리스트 클릭 이벤트
const onCellDblClicked3 = (grd, data) => {
  if (data.cellType === "data") { // 안전의견등록 수정 팝업창 호출
    let row = grd3.value.getDataProvider().getJsonRow(data.dataRow)
    opiRegPopup.value.openPopup(row,'update','A')
  }

}

//시행결과 등록 목록
const onCellDblClicked4 = (grd, data) => {
  console.log('dbl click data',data)
  let row = grd4.value.getDataProvider().getJsonRow(data.dataRow)
  
  if (data.cellType === "data" && data.fieldName !== 'ATTACH_FILE_KEY') { 
    if(row.RESULT_ID === 'N'){
          Message.warn(t('구 데이터는 첨부파일 수정만 가능합니다.'))
    }else{
      resultRegPopup.value.openPopup(row,'update',props.readonly)
    }
  } else if(data.fieldName === 'ATTACH_FILE_KEY') {
    console.log(row.ATTACH_FILE_KEY)
    iUploadPopup.value.openPopup(row.ATTACH_FILE_KEY)
  } 
}
  
 


//시행결과 등록 안전 의견 리스트
const onCellDblClicked5 = (grd, data) => {
  
  if (data.cellType === "data") {
    let row = grd5.value.getDataProvider().getJsonRow(data.dataRow)
    opiRegPopup.value.openPopup(row,'update','A')
  }
}

//데이터 삭제 로직
const deleteCheck = () => {
  const checkRow = grd4.value.getGridView().getCheckedRows()
  
  if(checkRow.length < 1){    
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  return true
}

const deleteData = () =>{

let delParam = []
let checkedRow =  grd4.value.getGridView().getCheckedRows()
for(let i of checkedRow){
  let data =  grd4.value.getDataProvider().getJsonRow(i)
  delParam.push(data)
}
console.log(delParam)

delParam.forEach((e)=>{
  console.log('',e)
  if(e.RESULT_ID !== 'N'){
    commonDeleteAllFilesApi(
      [{
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: e.ATTACH_FILE_KEY,
      }]
    )  
  }else if(e.RESULT_ID === 'N')
    commonDeletFilesApi(
        [{
          CMPNY_DIV: userStore.cmpnyDiv,
          FILE_ID: e.ATTACH_FILE_KEY,
          FILE_NO: e.FILE_NO,
        }]
      )
})

return commonExecuteApi({ queryId : 'EDUCA0020_DELETE_01', list: delParam })

}

// 부서 검색 팝업 -------------------------------------------------
const deptPopupOpen = () => {
  deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: searchParams.DEPT_NM,
    })
}

const onDeptSelected = val =>{
  console.log('select Dept',val)
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  onButtonsClick({id: 'btnSearch'})
}


//영역별 분석결과, 개선활동 조회
const detailSearch = (val) => {

  const param = {
    CMPNY_DIV: userStore.cmpnyDiv
    , YEAR: searchParams.YEAR
    , CATEGORY: val // 영역
  }
  commonSearchApi({ queryId : 'EDUCA0020_SEARCH_03', param: param }).then((res)=>{
    console.log('detailSearch',res)
    IMPROVEMENT_ACTIVITY.value = res.ORESULT_CUR[0].IMPROVEMENT_ACTIVITY
    ANALYSIS_RESULT.value = res.ORESULT_CUR[0].ANALYSIS_RESULT
  })
}

const resetPage = () =>{
  searchParams.DEPT_CD= ''
  IMPROVEMENT_ACTIVITY.value = ''
  ANALYSIS_RESULT.value = ''
  grd1.value.getDataProvider().setRows([])
  grd2.value.getDataProvider().setRows([])
  grd3.value.getDataProvider().setRows([])
  grd4.value.getDataProvider().setRows([])
  grd5.value.getDataProvider().setRows([])
}

const closePopup = () => {
  console.log('팝업 닫음')
  onButtonsClick({id:'btnSearch'})
}


const openPopup = val =>{
  console.log('opinionRegister openpopup',val)
  searchParams.DEPT_NM = val.DEPT_NM
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.YEAR = val.YEAR

  onButtonsClick({id: 'btnSearch'})
}

//팝업닫을때 팝업내부 변수 초기화
const close = () => {
  console.log('close 버튼 작동')
  emit("closed")
  resetPage()
  
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="props.buttonList"
        @click-button="onButtonsClick"
      />
    </v-card-title>
      <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column">
      <!-- 첫번째 조회 조건 -->
        <v-sheet class="searchArea d-flex" style="align-items: center;">
          <i-select
            :label="$t('년도')"
            label-width="30px"
            width="150px"
            v-model="searchParams.YEAR"
            type="YEAR"
            style="margin-left:16px;"
            :readonly="props.readonly"
          />
          <!-- <i-select
            :label="$t('부서')"
            label-width="50px"
            width="250px"
            v-model="searchParams.WORK_YR"
            :items="codeList.WORK_YR"
            item-value="COD"
            item-title="TXT"
          /> -->
          <i-input
            required
            :label="$t('부서')"
            width="300px"
            v-model="searchParams.DEPT_NM"
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => { deptPopupOpen() }"
            @click:appendInner="deptPopupOpen()"
            @update:modelValue="resetPage()"
            :readonly="props.readonly"
          />
          <i-input
            width="150px"
            v-model="searchParams.DEPT_CD"
            :readonly="true"
          />
        </v-sheet>
      </div>
        <div style="display: flex;">
          <v-sheet class="pr-2" style="width: 30%; ">
            <IGridTitle 
              title="안전의식 상관관계에 따른 개성 방향 목록"
              class="mb-0"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grd1"
              class="mt-2"
              :grid-view-option="grd1Props.gridViewOption"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              :column-layout="grd1Props.columnLayout"
              @onCellClicked="onCellClicked"
            />
            </v-sheet>
            <v-sheet style="width: 70%;">
              <IGridTitle 
                  title="안전의식 상관관계에 따른 개선 방향 상세"
                  class="mb-0"
                >
                <template #editors />
              </IGridTitle>
              <v-sheet class="flex-column h-auto fill-height mt-2">
                <table>
                  <tr style="height: 40px;">
                    <td style="width: 20%; font-size: 25px;">
                    분석 결과
                    </td>
                    <td>
                      <i-textarea 
                        width="100%"
                        height="100%"
                        :readonly="true"
                        :row="3"
                        topLabel
                        v-model="ANALYSIS_RESULT"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 20%; font-size: 25px;">개선 활동</td>
                    <td>
                      <i-textarea 
                        width="100%"
                        height="100%"
                        :readonly="true"
                        :row="3"
                        topLabel
                        v-model="IMPROVEMENT_ACTIVITY"
                      />
                    </td>
                  </tr>
          </table>
              </v-sheet>
            </v-sheet>
          </div>
        <div style="display: flex; height: 30%; margin-top: 8px;">
          <v-sheet class="pr-2 mt-1 h-auto fill-height" style="width: 100%; ">
            
            <div class="d-flex" style="justify-content: space-between;">
              <IGridTitle 
              title="개선 계획 등록 목록"
                class="mb-0"
              />
              <v-btn v-if="!props.readonly" @click="onButtonsClick({ id : 'btnPlanPopup'})">계획 등록</v-btn>
            </div>
            <RealGrid
              ref="grd2"
              class="mt-2"
              :grid-view-option="grd2Props.gridViewOption"
              :fields="grd2Props.fields"
              :columns="grd2Props.columns"
              :column-layout="grd2Props.columnLayout"
              @onCellDblClicked = "onCellDblClicked2"
            /> 
            
          </v-sheet>
        </div>
        <IUpload
              v-if="OLD_YN === 'Y'"
              style="height: 30%; margin-top: 8px;"
              ref="fileUpload"
              :is-visibled="true"
              :grid-title="'개선 계획 등록 목록(구 데이터)'"
            />
        <div style="display: flex; height: 20%; ">
          <v-sheet class="pr-2 mt-1 h-auto fill-height" style="width: 100%; ">
            <div class="d-flex" style="justify-content: space-between;">
              <IGridTitle 
              title="개선계획 등록 안전 의견 목록"
                class="mb-0"
              />
              <v-btn @click="onButtonsClick({ id : 'btnOpiPopup'})">의견 등록</v-btn>
            </div>
            <RealGrid
              ref="grd3"
              class="mt-2"
              :grid-view-option="grd3Props.gridViewOption"
              :fields="grd3Props.fields"
              :columns="grd3Props.columns"
              :column-layout="grd3Props.columnLayout"
              @onCellDblClicked = "onCellDblClicked3"
            />
            
          </v-sheet>
        </div>
        <div style="display: flex; height: 30%; ">
          <v-sheet class="pr-2 mt-1 h-auto fill-height" style="width: 100%; ">
            <div class="d-flex" style="justify-content: space-between;">
              <IGridTitle 
              title="시행결과 등록 목록"
                class="mb-0"
              />
              <div class="d-flex">
                <v-btn v-if="!props.readonly" @click="onButtonsClick({ id : 'btnResultPopup'})">시행결과 등록</v-btn>
                <v-btn v-if="!props.readonly" @click="onButtonsClick({ id : 'btnResultDelete'})">삭제</v-btn>
              </div>
            </div>
            <RealGrid
              ref="grd4"
              class="mt-2"
              :grid-view-option="grd4Props.gridViewOption"
              :fields="grd4Props.fields"
              :columns="grd4Props.columns"
              :column-layout="grd4Props.columnLayout"
              @onCellDblClicked = "onCellDblClicked4"
            />
          </v-sheet>
        </div>
        <div style="display: flex; height: 20%; ">
          <v-sheet class="pr-2 mt-1 h-auto fill-height" style="width: 100%; ">
            <div class="d-flex" style="justify-content: space-between;">
              <IGridTitle 
                title="시행결과 등록 안전 의견 목록"
                class="mb-0"
              />
              <v-btn @click="onButtonsClick({ id : 'btnResultOpiPopup'})">의견 등록</v-btn>
            </div>
            <RealGrid
              ref="grd5"
              class="mt-2"
              :grid-view-option="grd5Props.gridViewOption"
              :fields="grd5Props.fields"
              :columns="grd5Props.columns"
              :column-layout="grd5Props.columnLayout"
              @onCellDblClicked = "onCellDblClicked5"
            />
          </v-sheet>
        </div>
    </v-card-text>
  </v-card>
  <!-- 개선계획 등록 팝업 -->
  <PlanRegPopup ref="planRegPopup" @closed="closePopup" />
  <ResultRegPopup ref="resultRegPopup" @closed="closePopup"/>
  <OpiRegPopup ref="opiRegPopup" @closed="closePopup"/>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  <IUploadPopup
          ref="iUploadPopup"
          @uploaded="onButtonsClick({ id : 'btnSearch'})"
          :button-list="props.readonly ? [ 'btnDownLoad', 'btnClose'] : ['btnDownLoad', 'btnDelete', 'btnClose']"
          :is-visibled="!props.readonly"
        />
</template>

<style scoped lang="scss">
.v-navigation-drawer__scrim {
    display: none;
  }
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 190px);
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 580px;
  // }
}
// table{ border-collapse : collapse; }  /*이중선 제거*/
td{
      // width: 100px;
      // height: 50px;
      text-align: center;
      border: 1px solid #000;
      
    }
.dot {
  justify-content: normal !important;
  align-items: normal !important;
}
</style>