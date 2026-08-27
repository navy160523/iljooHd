<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : 작업 공정별 관리 요령   -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, registerRuntimeCompiler } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useLogsStore } from "@hiway/stores/logs";
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import RealGrid from "@/components/RealGrid.vue"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import _ from "lodash"
import Compressor from "compressorjs"
// import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

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
      return ['btnSearch', "btnFileUpload", "btnDownLoad", "btnDelete", "btnClose"]
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
const isVisible = ref(props.isVisibled);
const emit = defineEmits(["uploaded", "deleted"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const route = useRoute()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const isAdmin = ref(false)
const grdMain = ref(null)
const files = ref(null)
const guid = ref(null)
const uploadFiles = ref([])
const commonStore = useCommonStore()
const dialog = ref(null)
const statusLabel = ["미전송", "업로드 완료", "다운로드 완료", "전송중", "전송오류"," "]
const statusValue = ["N", "U", "D", "W", "E", "P"]
const fileTypes = props.imgOnly
  ? "jpg,gif,bmp,doc,xls,ppt,docx,xlsx,pptx,hwp,avi,mov,dvd,mp4,jpeg"
  : "pdf"

const codeList = reactive({
  PROCESS_TYPE:[],
  LANGUAGE:[]
})

//조회조건
let searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: "",
  PROCESS_TYPE:'001',
  LANGUAGE:'001'
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
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

grdMainProps.columns = grdMainProps.fields

const clearGrid = () => {
  grdMain.value.getDataProvider().setRows(null)
  files.value = null
  uploadFiles.value = []
}

const setGuid = (val) => {
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

//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    if (props.showSearchMessage === false) {
      new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
    } else {
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData)
        .showMessage(false)
        .setAfter(afterSearch)
        .run()
    }
  } else if (btn.id === "btnDelete") {
    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    let data = []
    new deleteFlowHelper(vm, t)
      .setBefore(() => {
        let result = true
        if (chekedRow.length === 0) {
          Message.err(t("선택된 데이터가 없습니다."))
          result = false
        }
        return result
      })
      .setQuery(() => {
        chekedRow.forEach((val) => {
          data.push(grdMain.value.getDataProvider().getJsonRow(val))
        })
        return commonExecuteApi({ queryId : 'HLTDA0010_DELETE_01', list: data }), commonDeletFilesApi(data)
      })
      .setAfter(() => {
        clearGridChk()
        onButtonsClick({ id: "btnSearch" })
        emit("uploaded", { fileId: props.guid2 ? props.guid2 : guid.value })
        emit("deleted", { fileId: props.guid2 ? props.guid2 : guid.value })
      })
      .run()
  } else if (btn.id === "btnFileUpload2") {
    // 공정 관리 저장 THLTDA0010W01
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  } else if (btn.id === "btnFileUpload") {
    // 순수 파일 저장 TZA1030C01
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

      // 진행 퍼센트바 초기화
      // resultElement.textContent = ''

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
            }
          })
          .catch((e) => {
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
      downloadFile(val)
    })
  } else if (btn.id === 'btnClose'){
    closePopup()
  }
}

const downloadFile = (idx) => {
  const currRow = grdMain.value.getDataProvider().getJsonRow(idx)
  commonDownloadFilesApi(currRow)
    .then((res) => {
      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //const file = res.contentDisposition.split('fileName=')
      // const file = res.contentDisposition.split('fileName="')
      // const blob = new Blob([res])
      // const link = document.createElement("a")

      // link.href = URL.createObjectURL(blob)

      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const blobUrl = URL.createObjectURL(blob)

      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.

      // link.download = decodeURI(file[1].replace('";', ""))
      // link.click()
      // URL.revokeObjectURL(link.href)
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
  return commonSearchApi({ queryId: "HLTDA0010_SEARCH_05", param: searchParams })
}

const setSearchData = (data) => {
  const result = []
  data.forEach((item) => {
    item.STATUS = "P"
    result.push(item)
    item.INSERT_DATE = item.INSERT_DATE.substr(0,10)
  })
  return result
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(setSearchData(res.ORESULT_CUR))
}

const beforeSave = () => {
  //필수값 품명,모델명,납품업체,합격번호,자재번호,단가
  if (!searchParams.PROCESS_TYPE) {
    Message.warn(t('작업공정 종류는 필수값 입니다.'))
    return false
  } else if (!searchParams.LANGUAGE) {
    Message.warn(t('작업공정 언어는 필수값 입니다.'))
    return false
  } 
  return true
}
const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    FILE_ID: searchParams.FILE_ID,
    PROCESS_TYPE: searchParams.PROCESS_TYPE,
    LANGUAGE: searchParams.LANGUAGE,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'HLTDA0010_SAVE_01',
    list: saveParam,
  })
}

const selectFile = (e) => {
  if (props.fileDan === true) {
    let data = grdMain.value.getDataProvider().getJsonRows()

    if (data.length >= 1) {
      Message.err("1개 파일만 저장 가능합니다.")
      files.value = ""
      return false
    }
  }
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

const openPopup = (fileId) => {
  // console.log('isAdmin.value : ' , isAdmin.value)  
  // console.log('isVisible.value 1 : ' , isVisible.value)
  // console.log(useLogsStore().isMenuAdmin)
  // console.log(userStore.authGrpCd.includes('HLTD001'))
  // console.log(userStore.authGrpCd.includes('GRP00372'))
  if ( useLogsStore().isMenuAdmin === "Y" || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes("GRP00372") ) {
    isAdmin.value = true;
  }
  
  if (isAdmin.value === false) {
    menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
    isVisible.value = false
    // console.log('isVisible.value 2 : ' , isVisible.value)
  }
  // console.log('isVisible.value 3 : ' , isVisible.value)
  Promise.all([
    // 상하반기
    getCodeList('HHIIT'), 
    getCodeList('HHIIL')
  ]).then((res) => {
    codeList.PROCESS_TYPE = res[0].ORESULT_CUR
    codeList.LANGUAGE = res[1].ORESULT_CUR
  })
  //팝업열때 fileId를 같이 넘겨주면 파일아이디에 해당하는 파일이 조회되고, 업로드가능
  dialog.value = true
  onButtonsClick({ id: "btnSearch" })
}

const closePopup = () => {
  dialog.value = false
  // emit("closed")
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

const processChange = async e => {
  onButtonsClick({ id: "btnSearch" })
}

const languageChange = async e => {
  onButtonsClick({ id: "btnSearch" })
}

</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="800"
    class="draggable-dialog"
  >
    <div class="title-bar">
      <span> 작업 공정별 관리 요령 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :button-list="props.buttonList"
          @click-button="onButtonsClick"
         />
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex my-2">
                <i-select
                v-model="searchParams.PROCESS_TYPE"
                :label="$t('종류')"
                label-width="50px"
                :items="codeList.PROCESS_TYPE"
                item-value="COD"
                item-title="TXT" 
                width="200px"
                @update:modelValue="processChange"
              />
              <i-select
                v-model="searchParams.LANGUAGE"
                :label="$t('언어')"
                label-width="50px"
                :items="codeList.LANGUAGE"
                item-value="COD"
                item-title="TXT" 
                width="200px"
                @update:modelValue="languageChange"
              />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <div class="d-flex flex-column fill-height">
          <v-sheet v-if="isVisible" class="d-flex">
            <v-file-input
              v-model="files"
              :label="$t(props.fileInputText)"
              clearable
              @click:clear="clearGrid"
              multiple
              @update:modelValue="selectFile"
            />
          </v-sheet>
          <v-sheet height="250px" class="mt-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
