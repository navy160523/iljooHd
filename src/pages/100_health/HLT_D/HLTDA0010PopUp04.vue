<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : MSDS 추가(수정/저장)   -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, registerRuntimeCompiler } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import RealGrid from "@/components/RealGrid.vue"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import _ from "lodash"
import Compressor from "compressorjs"
// import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import HLTDA0010VNDPOP from '@/pages/100_health/HLT_D/HLTDA0010PopupVnd.vue'
import HLTDA0010CASPOP from '@/pages/100_health/HLT_D/HLTDA0010PopupCas.vue'

const props = defineProps({
  autoQuery: {
    type: Boolean,
    required: false,
    default: false,
  },
  maxFileSize: {
    type: Number,
    required: false,
    default: 20, // MB
  },
  gridTitle: {
    //그리드 제목
    type: String,
    default: "파일첨부",
  },
  buttonList: {
    //버튼리스트
    type: Array,
    default() {
      return ['btnUpdate', "btnFileUpload", "btnDownLoad", "btnDelete", "btnClose"]
    },
  },
  fileInputText: {
    //파일인풋 메세지
    type: String,
    default: "여기에 파일을 끌어놓으세요.",
  },
  isVisibled: {
    //파일인풋 visible
    type: Boolean,
    default: true,
  },
  showSearchMessage: {
    //'조회되었습니다.' 메세지 출력여부
    type: Boolean,
    default: true,
  },
  guid2: {
    type: String,
    default: "",
  },
  imgOnly: {
    type: Boolean,
    default() {
      return false
    },
  },
  autoUpload: {
    //자동업로드 props
    type: Boolean,
    default: true,
  },
  //단건파일 업로드 props
  fileDan: {
    type: Boolean,
    defulat: false,
  },
})

const emit = defineEmits(["uploaded", "deleted"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const route = useRoute()
const t = useI18n().t //다국어
const deptPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const files = ref(null)
const guid = ref(null)
const vndPopup = ref(null)
const casPopup = ref(null)
const uploadFiles = ref([])
const commonStore = useCommonStore()
const dialog = ref(null)
const statusLabel = ["미전송", "업로드 완료", "다운로드 완료", "전송중", "전송오류"," "]
const statusValue = ["N", "U", "D", "W", "E", "P"]
const SubsaveParams = ref([])
const fileTypes = props.imgOnly
  ? "jpg,gif,bmp,doc,xls,ppt,docx,xlsx,pptx,hwp,avi,mov,dvd,mp4,jpeg"
  : "pdf"
const codeList = reactive({
  PROCESS_TYPE:[],
  LANGUAGE:[]
})

//조회조건
const searchParams = reactive({
  controlYN: "",
  USER_ID: userStore.userId,
  BSNS_CD: userStore.bsnsCd,
  CMPNY_DIV: userStore.cmpnyDiv,
  SAUPBU: "",
  TYPE_ID: "",
  REVNO: "",
  DIVISION: "",
  MSDS_FILEID: "",
  MSDS_NM: "",
  REMARK: "",
  CONTENT_DT: "",
  GRVTY: "",
  MATNO: "",
  MATDSC: "",
  VNDCOD: "",
  VNDNME: "",
  FILE_ID: "",
  GRP_DIV: "",
  PROD_VNDCOD: "",
  REVNO_DT: "",
  reviewYN: "N",
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  fields: [
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("CMPNY_DIV") },
      visible: false,
    },
    {
      fieldName: "FILE_ID",
      dataType: "text",
      header: { text: t("파일ID") },
      visible: false,
    },
    {
      fieldName: "FILE_NO",
      dataType: "text",
      header: { text: t("파일번호") },
      visible: false,
    },
    {
      fieldName: "FILE_PATH",
      dataType: "text",
      header: { text: t("파일경로") },
      visible: false,
    },
    {
      fieldName: "FILE_NAME",
      dataType: "text",
      header: { text: t("파일명") },
      visible: false,
    },
    {
      fieldName: "FILE_TITLE",
      dataType: "text",
      header: { text: t("제목") },
      styleName: "left-column",
      editable: false,
      visible: false,
    },
    {
      fieldName: "FILE_NAME_ORIGINAL",
      dataType: "text",
      header: { text: t("파일명") },
      styleName: "left-column",
      editable: false,
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      header: { text: t("등록 일자") },
      styleName: "center-column",
      editable: false,
    },
    {
      fieldName: "FILE_SIZE",
      dataType: "text",
      header: { text: t("크기(KB)") },
      styleName: "right-column",
      editable: false,
      displayCallback: function (grd, idx, val) {
        return Number(val).toLocaleString()
      },
    },
    {
      fieldName: "PROGRESS",
      dataType: "number",
      header: { text: t("진행률") },
      editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let result = ""

          if (cell && cell.value) {
            result = `<div style="padding: 0 6px;">
              <div style="background: linear-gradient(to right, lime ${cell.value}%, transparent ${
              100 - cell.value
            }%);">
                ${cell.value}%
              </div>
            </div>`
          }
          return result
        },
      },
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      header: { text: t("전송상태") },
      editable: false,
      lookupDisplay: true,
      editButtonVisibility: "always",
      values: statusValue,
      labels: statusLabel,
      editor: {
        type: "dropdown",
      },
    },
    {
      fieldName: "CHKBTN",
      dataType: "text",
      header: { text: t("파일") },
      editable: false,
      visible: false,
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  fields : [ 
    { fieldName: 'CASNO', dataType: 'text', header: { text: t('CAS번호') }, lookupDisplay: true, button : 'action',},
    { fieldName: 'FROM_IGDTRATE', dataType: 'number', numberFormat: '#,###.##', header: { text: t('~에서') }, editor: { type: 'number'}},
    { fieldName: 'TO_IGDTRATE', dataType: 'number', numberFormat: '#,###.##', header: { text: t('~까지') }, editor: { type: 'number'}},
    { fieldName: 'IGDTRATE', dataType: 'number',  numberFormat: '#,###.##', header: { text: t('평균') }, editable: false},
    { fieldName: 'KOR_NME', dataType: 'text', header: { text: t('국문표기') }, editable: false,},
    { fieldName: 'ENG_NME', dataType: 'text', header: { text: t('영문표기') }, editable: false,},
    { fieldName: 'EXTINFO',
      dataType: 'text',
      header: { text: t('규제정보') },
      editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell) {
          const value = cell.value || "";
          const colorMap = {
            금지: "#FF0000",
            사고: "#800080",
            제한: "#800080",
            유독: "#800080",
            특별: "#800080",
            허용: "#DAA520",
            관리: "#DAA520",
          };
          const htmlParts = value.split(",").map(item => {
            const char = item.trim();
            const color = colorMap[char] || "black";
            return `<span style="color:${color}; font-weight:bold;">${char}</span>`;
          });
          return htmlParts.join(" ");
        }
      }
    }
  ],
  columnLayout: [
    'CASNO',
    {
      name: '구성비(%)',
      direction: 'horizontal',
      items: [ 'FROM_IGDTRATE', 'TO_IGDTRATE', 'IGDTRATE' ],
      header: { text: t('구성비(%)') },
    },
    'KOR_NME',
    'ENG_NME',
    'EXTINFO'
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields


const getCasNo = () => {
  new queryFlowHelper(vm, t)
    .setQuery(casNoOSearchData)
    .setAfter(casNoOAfterSearch)
    .run()
}

const casNoOSearchData = () => {
  // console.log(casnosearchParams)
  return commonSearchApi({ queryId: 'HLTDA0070_SEARCH_03', param: casnosearchParams })
}

const casNoOAfterSearch = (res) => {
  // console.log('res')
  // console.log(res.ORESULT_CUR)
  // console.log(res.ORESULT_CUR[0].EXTINFO)
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'KOR_NME',  res.ORESULT_CUR[0].CASNM_KOR)
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'ENG_NME',  res.ORESULT_CUR[0].CASNM_ENG)
  //장필구
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'EXTINFO',  res.ORESULT_CUR[0].EXTINFO)
  grdSub.value.getGridView().checkItem(popupParams.ROW_IDX, true)

}


const casnosearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  CASNO:'',
})
const onEditCommit = (grid, index, oldValue, newValue) => {

  if(index.fieldName == 'CASNO') {
    popupParams.ROW_IDX = index.itemIndex
    casnosearchParams.CASNO = newValue
    // console.log('index')
    // console.log(index.itemIndex)
    // console.log('newValue : ' + newValue)
    getCasNo()
  }


  let from = grid.getValue(index.dataRow, 'FROM_IGDTRATE') || 0
  let to = grid.getValue(index.dataRow, 'TO_IGDTRATE') || 0
  let avg = 0
  if(index.fieldName == 'FROM_IGDTRATE' || index.fieldName == 'TO_IGDTRATE' ) {
    if (index.fieldName == 'FROM_IGDTRATE') {
      from = parseFloat(newValue)
      if (isNaN(from)) from = 0
    } else if (index.fieldName == 'TO_IGDTRATE') {
      to = parseFloat(newValue)
      if (isNaN(to)) to = 0
    }
    avg = parseFloat(((from + to) / 2).toFixed(2)); 
    grid.setValue(index.dataRow, 'IGDTRATE', avg);
  }
  
}

const clearGrid = () => {
  grdMain.value.getDataProvider().setRows(null)
  grdSub.value.getDataProvider().setRows(null)
  files.value = null
  uploadFiles.value = []
  //console.log("클리어그리드")
}

const setGuid = (val) => {
  // console.log("setGuid")
  if (val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }
  searchParams.FILE_ID = guid.value
}

const create_UUID = () => {
  let dt = new Date().getTime()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const onButtonsClickgrdSub = async (btn) => {
  // console.log(searchParams.controlYN)
  if (btn.id === 'btnCreate') {
    // console.log(searchParams.controlYN )
    if(searchParams.controlYN === 'N'){
      Message.warn(t('기본 정보를 먼저 저장 하십시요.'))
      return false
    }
    grdSub.value.addRow({
      CASNO:'',
      FROM_IGDTRATE:'',
      TO_IGDTRATE:'',
      IGDTRATE:'',
      KOR_NME:'',
      ENG_NME:''
    },false)
  } else if (btn.id === 'btnUpdate') {
    // console.log('자재성분 저장')
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setBefore(SubbeforeSave)
      .setQuery(SubsaveData)
      .setAfter(() => {
        grdSub.value.getDataProvider().setRows([])
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    // console.log('자재성분 삭제')
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(SubdeleteData)
      .setAfter((res) => {
        // console.log('res : ', res)
        // console.log('111')
        grdSub.value.getDataProvider().setRows([])
        // console.log('222')
        searchParams.REVNO = Number(searchParams.REVNO) + 1
        // console.log(searchParams.REVNO)
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  }
}

const SubbeforeSave = () => {
  let chekedRow = ref([])
  chekedRow = grdSub.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } else if (!searchParams.SAUPBU) {
    Message.warn(t('사업부는 필수값 입니다.'))
    return false
  } else if (!searchParams.VNDCOD) {
    Message.warn(t('협력사는 필수값 입니다.'))
    return false
  } else if (!searchParams.MATNO) {
    Message.warn(t('자재번호는 필수값 입니다.'))
    return false
  } 
  SubsaveParams.value = []

  searchParams.REVNO = Number(searchParams.REVNO) + 1
  const gridView = grdSub.value.getGridView()
  const dataProvider = grdSub.value.getDataProvider()
  const rowCount = gridView.getItemCount()  // 전체 행 개수 가져오기

  if (rowCount === 0) {
    Message.warn(t('데이터가 없습니다.'))
    return false
  }

  for (let i = 0; i < rowCount; i++) {
    let row = dataProvider.getJsonRow(i)
    row = Object.assign({}, row, searchParams)
    SubsaveParams.value.push(row)
  }

  // let data = ref([])

  // chekedRow.forEach(val => {
  //   data = grdSub.value.getDataProvider().getJsonRow(val)
  //   data = Object.assign({}, data, searchParams); 
  //   SubsaveParams.value.push(data)
  // })
  // console.log("저장 파라메트", SubsaveParams.value)
  return true
}
const SubsaveData = () => {
  
  // console.log('SubsaveData : ' , SubsaveParams.value)
  // console.log(SubsaveParams.value)

  return commonExecuteApi({
    queryId: 'HLTDA0010_SAVE_03',
    list: SubsaveParams.value,
  })
}

const SubdeleteData = () => { 
  let saveParams = []
  let data = ref([])
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data = Object.assign({}, data, searchParams); 
    saveParams.push(data) 
  }
  // console.log('saveParams')
  // console.log(saveParams)
  // console.log('saveParams')  
  return commonExecuteApi({ queryId : 'HLTDA0010_DELETE_03', list: saveParams })
} 

//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    // console.log(searchParams.REVNO)
    if (props.showSearchMessage === false) {
      // console.log("저장 33")
      new queryFlowHelper(vm, t)
        .setGridList([grdMain],[grdSub])
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
    } else {
      // console.log("저장 44")
      new queryFlowHelper(vm, t)
        .setGridList([grdMain],[grdSub])
        .setQuery(searchData)
        .showMessage(false)
        .setAfter(afterSearch)
        .run()
    }
  } else if (btn.id === "btnDelete") {
    // console.log('MSDS 삭제')

    new deleteFlowHelper(vm, t)
      .setBefore(() => {
        return true
      })
      .setQuery(() => {
        let saveParam = []
        let saveData = {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          VNDCOD: searchParams.VNDCOD,
          SAUPBU: searchParams.SAUPBU,
          MATNO: searchParams.MATNO,
          TYPE_ID: searchParams.TYPE_ID,
        }
        saveParam.push(saveData)
        return commonExecuteApi({ queryId : 'HLTDA0010_DELETE_02', list: saveParam })
      })
      .setAfter(() => {
        closePopup()
      })
      .run() 

  } else if (btn.id === "btnFileUpload") {
    // 순수 파일 저장 TZA1030C01
    // console.log('순수 파일 저장')
    let checkedRow = grdMain.value.getGridView().getCheckedRows()
    if (checkedRow.length === 0) {
      Message.err(t("선택된 데이터가 없습니다."))
      return
    }
    let checkedData = []
    for (let rowNum of checkedRow) {
      checkedData.push(grdMain.value.getDataProvider().getJsonRow(rowNum))
      grdMain.value.getDataProvider().setValue(rowNum, "STATUS", "N")
    }
    // 파일을 하나씩 처리
    let hasErr = false
    for (let i = 0; i < checkedData.length; i++) {
      // FILE_NO이 있으면 이미 업로드 된 항목이므로 건너뜀
      if (checkedData[i].FILE_NO) {
        continue
      }
      const fileTemp = _.find(uploadFiles.value, {
        fileName: checkedData[i].FILE_TITLE,
      })
      if (!fileTemp) {
        continue
      }
      const file = _.find(uploadFiles.value, {
        fileName: checkedData[i].FILE_TITLE,
      }).file

      // 자르는 사이즈
      const chunkSize = 1024 * 1024 // 1MB
      // total size 계산
      const totalChunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0

      const sendNextFile = async () => {
        // chunk size 만큼 데이터 분할
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)
        // form data 형식으로 전송
        const formData = new FormData()
        setGuid()
        const param = {
          CMPNY_DIV: userStore.cmpnyDiv,
          FILE_ID: props.guid2 ? props.guid2 : guid.value,
          FILE_NO: "",
          FILE_TITLE: file.name,
          FILE_NAME_ORIGINAL: file.name,
          FILE_NAME: file.name,
          FILE_PATH: `${commonStore.systemCode}${route.path}/`,
          FILE_TYPE: file.name.split(".").pop(),
          FILE_SIZE: Math.round(file.size / 1024.0),
          USER_ID: userStore.userId,
          CHUNK_NUMBER: currentChunk,
          TOTAL_CHUNKS: totalChunks,
        }
        formData.append("file", chunk, file.name)
        formData.append("param", new Blob([JSON.stringify(param)], { type: "application/json" }))

        await commonBigUploadFilesApi(formData)
          .then(async (res) => {
            // 전송 결과가 207이면 다음 파일 조각 전송
            if (res.result.status === "207") {
              // 진행률 표시
              // resultElement.textContent = Math.round(currentChunk / totalChunks * 100) + "%"
              grdMain.value
                .getDataProvider()
                .setValue(checkedRow[i], "PROGRESS", Math.round((currentChunk / totalChunks) * 100))
              currentChunk++
              grdMain.value.getDataProvider().setValue(checkedRow[i], "STATUS", "W")
              if (currentChunk < totalChunks) {
                await sendNextFile()
              }
            } else if (res.result.status === "200") {

              // console.log('commonBigUploadFilesApi res', res)

              // 마지막 파일까지 전송 되면
              // resultElement.textContent = '업로드 되었습니다'
              grdMain.value.getDataProvider().setValue(checkedRow[i], "STATUS", "U")
              grdMain.value.getDataProvider().setValue(checkedRow[i], "PROGRESS", 100)
              grdMain.value.getDataProvider().setValue(checkedRow[i], "CMPNY_DIV", res.CMPNY_DIV)
              grdMain.value.getDataProvider().setValue(checkedRow[i], "FILE_ID", res.FILE_ID)
              grdMain.value.getDataProvider().setValue(checkedRow[i], "FILE_NO", res.RES_FILE_NO)
              grdMain.value.getDataProvider().setValue(checkedRow[i], "FILE_PATH", res.FILE_PATH)
              grdMain.value.getDataProvider().setValue(checkedRow[i], "FILE_NAME", res.FILE_NAME)
              grdMain.value.getGridView().checkRow(checkedRow[i], false)
              onButtonsClick({ id: "btnFileUpload2" })
              
              // Message.success(t("업로드 되었습니다."))
            }
          })
          .catch((e) => {
            // console.log('e', e)
            hasErr = true
            grdMain.value.getDataProvider().setValue(checkedRow[i], "STATUS", "E")
          })
      }
      await sendNextFile()
    }

    if (!hasErr) {
      clearGridChk()
      onButtonsClick({ id: "btnSearch" })
      emit("uploaded", { fileId: props.guid2 ? props.guid2 : guid.value })
    }
  } else if (btn.id === "btnFileUpload2") {
    // 파일정보 저장
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(FilesaveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  } else if (btn.id === "btnDownLoad") {
    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    if (chekedRow.length === 0) {
      Message.err(t("선택된 데이터가 없습니다."))
      return
    }
    chekedRow.forEach((val) => {
      grdMain.value.getDataProvider().setValue(val, "STATUS", "N")
    })
    chekedRow.forEach((val) => {
      // console.log('val', val)
      downloadFile(val)
    })
  } else if (btn.id === "btnUpdate") {
    // console.log("저장 11")
    searchParams.controlYN = 'Y'
    searchParams.reviewYN = 'Y'
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        // onButtonsClick({ id: "btnFileUpload2" })
        onButtonsClick({ id: "btnSearch" }) 
        emit("save")
      })
      .run()
      
  }  else {
    closePopup()
  }
}

const downloadFile = (idx) => {
  const currRow = grdMain.value.getDataProvider().getJsonRow(idx)
  commonDownloadFilesApi(currRow)
    .then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const blobUrl = URL.createObjectURL(blob)
      const decodedFileName = decodeURI(file[1].replace('";', ''))
      window.open(blobUrl, '_blank')
      URL.revokeObjectURL(blobUrl)
      grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 100)
      grdMain.value.getDataProvider().setValue(idx, "STATUS", "D")
    })
    .catch((e) => {
      grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 0)
      grdMain.value.getDataProvider().setValue(idx, "STATUS", "E")
    })
}

const clearGridChk = () => {
  grdMain.value.getDataProvider().clearRowStates(true, false)
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  return true
}

// 조회로직
const searchData = () => {
  files.value = []
  uploadFiles.value = []
  // console.log('searchParams : ', searchParams)
  return Promise.all([
    commonSearchApi({ queryId: "HLTDA0010_SEARCH_06", param: searchParams }),
    commonSearchApi({ queryId: "HLTDA0010_SEARCH_02", param: searchParams })
  ])
}

const setSearchData = (data) => {
  const result = []
  data.forEach((item) => {
    item.STATUS = "P"
    result.push(item)
    item.INSERT_DATE = item.INSERT_DATE.substr(0,10)
  })
  // console.log('result',result)
  return result
}

const afterSearch = (res) => {
  // console.log('res : ', res)
  grdMain.value.getDataProvider().setRows(setSearchData(res[0].ORESULT_CUR))
  grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR)
}
const beforeSave = () => {
  if (!searchParams.SAUPBU) {
    Message.warn(t('사업부는 필수값 입니다.'))
    return false
  } else if (!searchParams.VNDCOD) {
    Message.warn(t('협력사는 필수값 입니다.'))
    return false
  } else if (!searchParams.MATNO) {
    Message.warn(t('자재번호는 필수값 입니다.'))
    return false
  } 
  return true
}
const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    VNDCOD: searchParams.VNDCOD,
    SAUPBU: searchParams.SAUPBU,
    MATNO: searchParams.MATNO,
    TYPE_ID: searchParams.TYPE_ID,
    MATDSC: searchParams.MATDSC,
    REVNO: searchParams.REVNO,
    PROD_VNDCOD: searchParams.PROD_VNDCOD,
    DIVISION: searchParams.DIVISION,
    MSDS_FILEID: searchParams.MSDS_FILEID,
    GRP_DIV: searchParams.GRP_DIV,
    MSDS_NM: searchParams.MSDS_NM,
    REMARK: searchParams.REMARK,
    CONTENT_DT: searchParams.CONTENT_DT,
    GRVTY: searchParams.GRVTY,
    FILE_ID: searchParams.FILE_ID,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  // console.log('saveParam : ', saveParam)
  // console.log(saveParam)
  // console.log('saveParam')
  return commonExecuteApi({
    queryId: 'HLTDA0010_SAVE_02',
    list: saveParam,
  })
}

const FilesaveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    VNDCOD: searchParams.VNDCOD,
    SAUPBU: searchParams.SAUPBU,
    MATNO: searchParams.MATNO,
    TYPE_ID: searchParams.TYPE_ID,
    MATDSC: searchParams.MATDSC,
    REVNO: searchParams.REVNO,
    PROD_VNDCOD: searchParams.PROD_VNDCOD,
    DIVISION: searchParams.DIVISION,
    MSDS_FILEID: searchParams.FILE_ID,
    GRP_DIV: searchParams.GRP_DIV,
    MSDS_NM: searchParams.MSDS_NM,
    REMARK: searchParams.REMARK,
    CONTENT_DT: searchParams.CONTENT_DT,
    GRVTY: searchParams.GRVTY,
    FILE_ID: searchParams.FILE_ID,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  // console.log('saveParam')
  // console.log(saveParam)
  // console.log('saveParam')
  return commonExecuteApi({
    queryId: 'HLTDA0010_SAVE_04',
    list: saveParam,
  })
}


const selectFile = (e) => {
  // console.log('111')
  if(searchParams.controlYN === 'N'){
      // console.log(searchParams) 
      files.value = null
      uploadFiles.value = []
      Message.warn(t('기본 정보를 먼저 저장 하십시요.'))
      // console.log(searchParams)
      return false
  }
  if (props.fileDan === true) {
    let data = grdMain.value.getDataProvider().getJsonRows()

    if (data.length >= 1) {
      Message.err("1개 파일만 저장 가능합니다.")
      files.value = ""
      return false
    }
  }
  // console.log('selectFile e', e)

  for (let file of e) {
    const fType = file.name.split(".").pop().toUpperCase()

    const fUseType = fileTypes.split(",").map((item) => {
      return item.toUpperCase()
    })

    if (_.find(uploadFiles.value, { fileName: file.name })) {
      Message.err(t("이름이 중복되는 파일이 있습니다.") + "<br>" + file.name)

      return
    } else if (file.size >= props.maxFileSize * 1024 * 1024) {
      Message.err(props.maxFileSize + t("MB 이상 첨부파일은 등록 불가능 합니다.") + "<br>" + file.name)

      return
    } else if (!_.includes(fUseType, fType)) {
      const msg = props.imgOnly ? t("PDF만 업로드 가능합니다.") : t("사용할 수 없는 파일입니다.")

      Message.err(msg + "<br>" + file.name)

      return
    }
  }

  for (let file of e) {
    const fType = file.name.split(".").pop().toUpperCase()
    // 2024.01.08 박용훈 BMP, GIF 파일 추가
    //if(fType === 'PNG' || fType === 'JPG' || fType === 'JPEG') {
    if (fType === "PNG" || fType === "JPG" || fType === "JPEG" || fType === "BMP" || fType === "GIF") {
      new Compressor(file, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          // console.log('result', result)
          uploadFiles.value.push({
            fileName: result.name,
            file: result,
          })
          const data = {
            FILE_NAME: result.name,
            FILE_NAME_ORIGINAL: result.name,
            FILE_SIZE: Math.round(result.size / 1024.0),
            PROGRESS: 0,
            FILE_PATH: "",
            STATUS: "N",
            SEND_PATH: "",
            FILE_TITLE: result.name,
            FILE_TYPE: "",
          }
          grdMain.value.getDataProvider().insertRow(0, data)
          grdMain.value.getGridView().checkItem(0, true)
          grdMain.value.getGridView().commit()
          let grid = grdMain.value.getGridView().getCheckedRows()
          if (props.autoUpload) {
            if (e.length === grid.length) {
              onButtonsClick({ id: "btnFileUpload" })
            }
          }
        },
      })
    } else {
      uploadFiles.value.push({
        fileName: file.name,
        file: file,
      })

      const data = {
        FILE_NAME: file.name,
        FILE_NAME_ORIGINAL: file.name,
        FILE_SIZE: Math.round(file.size / 1024.0),
        PROGRESS: 0,
        FILE_PATH: "",
        STATUS: "N",
        SEND_PATH: "",
        FILE_TITLE: file.name,
        FILE_TYPE: "",
      }

      grdMain.value.getDataProvider().insertRow(0, data)
      grdMain.value.getGridView().checkItem(0, true)
      grdMain.value.getGridView().commit()
      let grid = grdMain.value.getGridView().getCheckedRows()
      if (props.autoUpload) {
        if (e.length === grid.length) {
          onButtonsClick({ id: "btnFileUpload" })
        }
      }
    }
  }
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "header") {
    downloadFile(clickData.itemIndex)
  } 
}

const onButtonsClickgrdMan = async (btn) => {
if (btn.id === 'btnDelete') {
    // console.log('파일 삭제')
    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    let data = []
    new deleteFlowHelper(vm, t)
      .setBefore(() => {
        // console.log('setBefore')
        let result = true
        if (chekedRow.length === 0) {
          Message.err(t("선택된 데이터가 없습니다."))
          result = false
        }
        return result
      })
      .setQuery(() => {
        // console.log('setQuery')

        let saveParam = []
        let saveData = {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          VNDCOD: searchParams.VNDCOD,
          SAUPBU: searchParams.SAUPBU,
          MATNO: searchParams.MATNO,
          TYPE_ID: searchParams.TYPE_ID,
          USER_ID: userStore.userId,
        }
        saveParam.push(saveData)

        chekedRow.forEach((val) => {
          data.push(grdMain.value.getDataProvider().getJsonRow(val))
        })
        // console.log(saveParam)
        // console.log(data)

        return commonExecuteApi({ queryId : 'HLTDA0010_DELETE_04', list: saveParam }), commonDeletFilesApi(data)
      })
      .setAfter(() => {
        clearGridChk()
        onButtonsClick({ id: "btnSearch" })
        emit("uploaded", { fileId: props.guid2 ? props.guid2 : guid.value })
        emit("deleted", { fileId: props.guid2 ? props.guid2 : guid.value })
      })
      .run()    
  }
}

const openPopup = (param) => {
  // console.log('param' , param)
  if (param.MATNO === '' || param.MATNO === undefined) {
    searchParams.controlYN = 'N'
  } else {
    searchParams.controlYN = 'Y'
  }
  searchParams.VNDCOD = param.VNDCOD
  searchParams.SAUPBU = param.SAUPBU
  searchParams.MATNO = param.MATNO
  searchParams.TYPE_ID = param.TYPE_ID ?? 1
  searchParams.MATDSC = param.MATDSC
  searchParams.REVNO = param.REVNO ?? 1
  searchParams.PROD_VNDCOD = param.PROD_VNDCOD
  searchParams.DIVISION = param.DIVISION ?? 'B'
  searchParams.MSDS_FILEID = param.MSDS_FILEID
  searchParams.GRP_DIV = param.GRP_DIV
  searchParams.MSDS_NM = param.MSDS_NM
  searchParams.REMARK = param.REMARK
  searchParams.CONTENT_DT = param.CONTENT_DT
  searchParams.GRVTY = param.GRVTY
  searchParams.VNDNME = param.VNDNME
  searchParams.FILE_ID = param.MSDS_FILEID
  searchParams.REVNO_DT = param.REVNO_DT
  // console.log('searchParams' , searchParams)
  Promise.all([
    // 회사구분
    getCodeList('HHIZ000'),
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), // 부서
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
  })

  //팝업열때 fileId를 같이 넘겨주면 파일아이디에 해당하는 파일이 조회되고, 업로드가능
  dialog.value = true
  // setGuid(fileId)
  onButtonsClick({ id: "btnSearch" })
}

const closePopup = () => {
  dialog.value = false
  // console.log('searchParams.reviewYN : ' , searchParams.reviewYN)
  if (searchParams.reviewYN === 'Y') {
    emit("closed")
  }
  clearGrid()
}

//파일업로드 버튼 비활성화 함수
//2024-02-19 김현재 추가
const diableFileUploadButton = (btn) => {
  for (let i = 0; i < btn.length; i++) {
    menuTitle.value.disableBtn(btn[i], true)
  }
}
//파일업로드 버튼 활성화 함수
//2024-02-19 김현재 추가
const enableFileUploadButton = (btn) => {
  for (let i = 0; i < btn.length; i++) {
    menuTitle.value.disableBtn(btn[i], false)
  }
}

watch(
  () => props.buttonList,
  () => {
    vm.$nextTick(() => {
      if (props.autoUpload && !props.gridOnly) {
        if (_.find(menuTitle.value.getButtonItems(), { id: "btnFileUpload" })) {
          menuTitle.value.setBtnProperty("btnFileUpload", "visible", false)
        }
      }
    })
  },
  { immediate: true }
)

defineExpose({
  onButtonsClick,
  guid,
  setGuid,
  clearGridChk,
  clearGrid,
  openPopup,
  diableFileUploadButton,
  enableFileUploadButton,
})

const openVnd = () => {
  vndPopup.value.openPopup({VNDNME:searchParams.VNDNME})
}

const openVndSelected = val => {  
  searchParams.VNDCOD = val.VNDCODE
  searchParams.VNDNME = val.VNDNME
}

const popupParams = reactive({
  ROW_IDX : 0,
})

const popupOpen = (grid, clickInfo, column) => { 
  popupParams.ROW_IDX = clickInfo.itemIndex
  let row = grdSub.value.getRowData(clickInfo.itemIndex)

  if(clickInfo.fieldName === 'CASNO'){
    // console.log('cas 번호 팝업창')
    casPopup.value.openPopup({ CASNO : row.CASNO })
  }
}

const openCasSelected = val => {  
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'CASNO', val.CASNO)
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'KOR_NME', val.CASNM_KOR)
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'ENG_NME', val.CASNM_ENG)
  grdSub.value.getGridView().checkItem(popupParams.ROW_IDX, true)
}
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="850"
    height="990"
  >
      <!-- height="750" -->
    <div class="title-bar" >
      <span> MSDS 수정 / 저장 </span>
      <!-- {{ $t(props.gridTitle) }} -->
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle ref="menuTitle" :button-list="props.buttonList" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
        <IGridTitle
              :title="$t('MSDS 기본 정보')"
            />
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex my-2">
                <i-select
                v-model="searchParams.CMPNY_DIV"
                :label="$t('회사구분')"
                label-width="50px"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT" 
                width="200px"
              />
              <i-select
                v-model="searchParams.SAUPBU"
                :label="$t('사업부')"
                label-width="50px"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                width="200px"
              />
              </div>
              <div class="d-flex my-2">
                <i-input
                  :label="$t('자재번호')"
                  v-model="searchParams.MATNO" 
                  label-width="50px"
                  type="text"
                  width="200px"
                />
                <i-input
                  v-model="searchParams.MATDSC" 
                  label-width="50px"
                  type="text"
                  width="400px"
                />
              </div>
              <div class="d-flex my-2">
                <i-input
                  :label="$t('협력사')"
                  v-model="searchParams.VNDCOD" 
                  label-width="50px"
                  type="text"
                  width="200px"
                  :readonly="true"
                />
                <i-input
                  v-model="searchParams.VNDNME" 
                  label-width="50px"
                  type="text"
                  width="200px"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openVnd"
                  @keydown.enter="openVnd"
                />
              </div>
              <div class="d-flex my-2">
                <i-input
                  :label="$t('비중')"
                  v-model="searchParams.GRVTY" 
                  label-width="50px"
                  type="number"
                  width="200px"
                />
                <i-input
                  :label="$t('자재타입')"
                  v-model="searchParams.TYPE_ID" 
                  label-width="50px"
                  type="number"
                  width="200px"
                />
              </div>
              <div class="d-flex my-2">
                <i-input
                  :label="$t('비고')"
                  v-model="searchParams.REMARK" 
                  label-width="50px"
                  type="text"
                  width="450px"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <div class="d-flex flex-column">
          <IGridTitle
              :title="$t('MSDS 자료 첨부')"
              :button-list="['btnDelete']"
              @click-button="onButtonsClickgrdMan"
            />
          <v-sheet v-if="props.isVisibled" class="d-flex">
            <div class="d-flex my-2">
                <i-input
                  :label="$t('개정일자')"
                  v-model="searchParams.REVNO_DT" 
                  label-width="50px"
                  type="date"
                  width="200px"

                />
            </div>
          </v-sheet>
          <v-sheet v-if="props.isVisibled" class="d-flex">
            <v-file-input
              v-model="files"
              :label="$t(props.fileInputText)"
              clearable
              @click:clear="clearGrid"
              multiple
              @update:modelValue="selectFile"
            />
          </v-sheet>
          <v-sheet height="200px" class="mt-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
        <div class="d-flex flex-column">
          <v-sheet height="200px" class="mt-2">
            <IGridTitle
              :title="$t('자재 성분')"
              :button-list="['btnCreate','btnUpdate','btnDelete']"
              @click-button="onButtonsClickgrdSub"
            />
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
              @onEditCommit="onEditCommit"
              @onCellButtonClicked="popupOpen"
            />
          </v-sheet>
        </div>
        <!-- <DeptPopup ref="deptPopup" @selected="onDeptSelected"/> -->
        <HLTDA0010VNDPOP ref="vndPopup" @selectVnd="openVndSelected"/> 
        <HLTDA0010CASPOP ref="casPopup" @selectCas="openCasSelected"/>
        
      </v-card-text>
    </v-card>
  </VDialog>
</template>
