<!-- 
  화면명 : 파일 업로드 팝업
  화면개요 : 첨부파일 업로드 
  최종수정일자: 2024-02-20
  작성자: 김우빈
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, registerRuntimeCompiler } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonSearchnoAuthApi } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IGridTitle from "@/components/IGridTitle.vue"

import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import _ from "lodash"
import Compressor from "compressorjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"


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
      return ["btnFileUpload",  "btnDelete", "btnClose"]
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
  fileNm: {
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
    default: false,
  },
  multipleFile: {
    type: Boolean,
    default: true,
  },
  insertUserId: {
    type: String,
    default: ""
  },
  cmpnyDiv: {
    type: String,
    default: "VENDER"
  }
})

const emit = defineEmits(["uploaded", "deleted"])

defineOptions({
  name: "IUpload",
})

const userStore2 = useUserStore() //유저정보

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const route = useRoute()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const files = ref(null)
const guid = ref(null)
const uploadFiles = ref([])
const commonStore = useCommonStore()
const dialog = ref(null)
const statusLabel = ["미전송", "업로드 완료", "다운로드 완료", "전송중", "전송오류"," "]
const statusValue = ["N", "U", "D", "W", "E","P"]

const fileTypes = props.imgOnly
  ? "jpg,gif,bmp,png,jpeg"
  : "jpg,gif,bmp,doc,xls,ppt,docx,xlsx,pptx,hwp,asv,htw,frm,txt,zip,alz,rar,pdf,png,z01,z02,z03,z04,z05,z06,z07,z08,z09,z10,001,002,003,004,005,006,007,008,009,010,avi,mov,dvd,mpeg,wmv,mp4,mkv,divx,xdiv,jpeg"

// watch(guid, () => {
//   searchParams.FILE_ID = guid.value
//   if(props.autoQuery) {
//     onButtonsClick( { id: 'btnSearch' } )
//   }
// })

//조회조건
let searchParams = reactive({
  CMPNY_DIV: props.cmpnyDiv,
  FILE_ID: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("CMPNY_DIV") }, visible: false },
    { fieldName: "FILE_ID", dataType: "text", header: { text: t("파일ID") }, visible: false },
    { fieldName: "FILE_NO", dataType: "text", header: { text: t("파일번호") }, visible: false },
    { fieldName: "FILE_PATH", dataType: "text", header: { text: t("파일경로") }, visible: false },
    { fieldName: "FILE_NAME", dataType: "text", header: { text: t("파일명") }, visible: false },
    {
      fieldName: "FILE_TITLE",
      dataType: "text",
      header: { text: t("제목") },
      styleName: "left-column",
      editable: false,
    },
    {
      fieldName: "FILE_NAME_ORIGINAL",
      dataType: "text",
      header: { text: t("파일명") },
      styleName: "left-column",
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
      visible: false,
      lookupDisplay: true,
      // editButtonVisibility: "always",

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
  //console.log("클리어그리드")
}

const setGuid = (val) => {
  if (val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }
  searchParams.FILE_ID = guid.value

}

const oldData = ref(null)

const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

onMounted(() => {})

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

        return commonDeletFilesApi(data)
      })
      .setAfter(() => {
        clearGridChk()
        onButtonsClick({ id: "btnSearch" })
        emit("uploaded", { fileId: props.guid2 ? props.guid2 : guid.value, cmpnyDiv: searchParams.CMPNY_DIV })
        emit("deleted", { fileId: props.guid2 ? props.guid2 : guid.value, cmpnyDiv: searchParams.CMPNY_DIV })
      })
      .run()
  } else if (btn.id === "btnFileUpload2") {
    // let checkedRow = grdMain.value.getGridView().getCheckedRows()
    // let checkedData = []
    // for(let rowNum of checkedRow) {
    //   checkedData.push(grdMain.value.getDataProvider().getJsonRow(rowNum))
    // }
    // let file = files._rawValue
    // let formData = new FormData()
    // const param = {
    //   CMPNY_DIV: userStore.cmpnyDiv,
    //   FILE_ID: '',
    //   FILE_NO: '',
    //   FILE_TITLE: '',
    //   FILE_NAME_ORIGINAL: '',
    //   FILE_NAME: '',
    //   FILE_PATH: '',
    //   FILE_TYPE: '',
    //   FILE_SIZE: '',
    //   USER_ID: userStore.userId,
    // }
    // for(let i = 0; i < file.length; i++){
    //   const fileType = file[i].name.split('.')
    //   formData.append('file' , file[i])
    //   param.FILE_TYPE = fileType[1]
    //   param.FILE_SIZE = file[i].size
    // }
    // formData.append('param', new Blob([ JSON.stringify(param) ], { type : "application/json" }))
    // commonUploadFilesApi( formData ).finally(()=>{
    //   Message.success(t('업로드 되었습니다.'))
    //   onButtonsClick( { id: 'btnSearch' } )
    // })
  } else if (btn.id === "btnFileUpload") {
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

    // // 파일
    // let file = []//files._rawValue

    // for(let i = 0; i < checkedData.length; i++) {
    //   if(_.find(uploadFiles.value, { fileName: checkedData[i].FILE_TITLE })) {
    //     file.push(_.find(uploadFiles.value, { fileName: checkedData[i].FILE_TITLE }).file)
    //   }
    // }

    // console.log('file', file)

    // 진행 퍼센트
    // const resultElement = document.getElementById("result")

    // 파일을 하나씩 처리
    let hasErr = false
    for (let i = 0; i < checkedData.length; i++) {
      // FILE_NO이 있으면 이미 업로드 된 항목이므로 건너뜀
      if (checkedData[i].FILE_NO) {
        continue
      }

      const fileTemp = _.find(uploadFiles.value, { fileName: checkedData[i].FILE_TITLE })
      if (!fileTemp) {
        continue
      }
      const file = _.find(uploadFiles.value, { fileName: checkedData[i].FILE_TITLE }).file

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

        // console.log('guid.value:',guid.value)
        // console.log('checkedData:',checkedData)
        // console.log('guid2:',props.guid2)

        const param = {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          FILE_ID: props.guid2 ? props.guid2 : guid.value,
          FILE_NO: "",
          FILE_TITLE: file.name,
          FILE_NAME_ORIGINAL: file.name,
          FILE_NAME: file.name,
          FILE_PATH: `${commonStore.systemCode}${route.path}/`,
          FILE_TYPE: file.name.split(".").pop(),
          FILE_SIZE: Math.round(file.size / 1024.0),
          USER_ID: props.insertUserId === "" ? userStore.userId : props.insertUserId,
          CHUNK_NUMBER: currentChunk,
          TOTAL_CHUNKS: totalChunks,
        }
        // param.FILE_SIZE = file[i].size
        // param.CHUNK_NUMBER = currentChunk
        // param.TOTAL_CHUNKS = totalChunks

        console.log('upload에서 param:',param)
        formData.append("file", chunk, file.name)
        formData.append("param", new Blob([JSON.stringify(param)], { type: "application/json" }))

        await commonBigUploadFilesApi(formData)
          .then(async (res) => {
            console.log('formData :: ', formData,'  res :: ',res)
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
              Message.success(t("업로드 되었습니다."))
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
      // onButtonsClick({ id: "btnSearch" })
      console.log('guid.value ', guid.value)
      emit("uploaded", { fileNm: '',fileId: props.guid2 ? props.guid2 : guid.value, cmpnyDiv: searchParams.CMPNY_DIV, fileNm: '' })
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

    // const data

    // userStore2
    // .loginSession()
    // .then(() => {


    // })

    chekedRow.forEach((val) => {
        // console.log('val', val)
        downloadFile(val)
      })

    
  } else {
    closePopup()
  }
}

const downloadFile = (idx) => {
  const currRow = grdMain.value.getDataProvider().getJsonRow(idx)

  console.log('currRow ', currRow)

  commonDownloadFilesApi(currRow)
    .then((res) => {
      console.log('res ', res)
      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //const file = res.contentDisposition.split('fileName=')
      const file = res.contentDisposition.split('fileName="')
      console.log('file ', file)
      const blob = new Blob([res])
      console.log('blob ', blob)
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
      //link.download = file[1])
      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)
      grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 100)
      grdMain.value.getDataProvider().setValue(idx, "STATUS", "D")
    })
    .catch((e) => {
      // console.log('e', e)
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

  return commonSearchnoAuthApi({ queryId: "searchFile", param: searchParams })
}

const setSearchData = (data) => {
  const result = []

  data.forEach((item) => {
    item.STATUS = "P"
    result.push(item)
  })

  return result
}

const afterSearch = (res) => {
  console.log(res, "afterSearch")
  grdMain.value.getDataProvider().setRows(setSearchData(res.ORESULT_CUR))
}

// const getBase64 = file => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()

//     reader.readAsDataURL(file)
//     reader.onload = () => resolve(reader.result)
//     reader.onerror = error => reject(error)
//   })
// }

const selectFile = async(e) => {
  // console.log('selectFile e', e)

    //싱글파일 처리
    if (!props.multipleFile) {

      //신규등록 파일
      if (uploadFiles.value.length > 0 && e.length !== 0) {
        files.value = oldData.value
        return Message.err(t("이미 등록된 파일이 있습니다."));
      } else {
        oldData.value = e
      }

      let flag = ''

      console.log('e ', e)

      //기존파일
      if (grdMain.value.getDataProvider().getRowCount() > 0 && e.length !== 0) {
        await vm.$swal({
          title: '기존 등록된 파일은 삭제됩니다',
          showCancelButton: true,
        }).then(async res => {
          if (await res.isConfirmed) {
            for(let i = 0; i < rowLength(); i++){
              await rowCheck(i)
            }
            await deleteFileApi()
          } else {
            console.log('test1')
            flag = 'X'
          }
        })
      }

      if (flag === 'X') {

        files.value = []
        return  Message.warn(t("테스트."));
      }
    }

  for (let file of e) {
    console.log('file  ::::  ', file)
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
      const msg = props.imgOnly ? t("이미지만 업로드 가능합니다.") : t("사용할 수 없는 파일입니다.")

      Message.err(msg + "<br>" + file.name)

      return
    }
  }

  //

  for (let file of e) {
    const fType = file.name.split(".").pop().toUpperCase()
    // 2024.01.08 박용훈 BMP, GIF 파일 추가
    //if(fType === 'PNG' || fType === 'JPG' || fType === 'JPEG') {
    if (fType === "PNG" || fType === "JPG" || fType === "JPEG" || fType === "BMP" || fType === "GIF") {
      new Compressor(file, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          console.log('result', result)

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
    }
  }
  if (props.autoUpload) {
    setTimeout(() => {
      onButtonsClick({ id: "btnFileUpload" })
    }, 1000)
  }

  // console.log('uploadFiles.value', uploadFiles)
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "header") {
    downloadFile(clickData.itemIndex)
  }
}

// const onCellClicked = (grid, clickData) => {
//   if(clickData.cellType !== 'header' && clickData.column === 'CHKBTN') {
//     downloadFile(clickData.itemIndex)
//   }
// }

const openPopup = (fileId) => {
  
  //팝업열때 fileId를 같이 넘겨주면 파일아이디에 해당하는 파일이 조회되고, 업로드가능
  dialog.value = true
  setGuid(fileId)
  onButtonsClick({ id: "btnSearch" })
}

const openPopup2 = (fileId,cmpnyDiv) => {
  
  //팝업열때 fileId를 같이 넘겨주면 파일아이디에 해당하는 파일이 조회되고, 업로드가능
  dialog.value = true
  searchParams.CMPNY_DIV = cmpnyDiv
  setGuid(fileId)
  onButtonsClick({ id: "btnSearch" })
}

const closePopup = () => {
  dialog.value = false
  // console.log('files ', files.value)
  // console.log('grdMain ', grdMain.value.getDataProvider().getJsonRows(0,-1).length)

  let saveFlag = `첨부(${grdMain.value.getDataProvider().getJsonRows(0, -1).length})`

  // if (grdMain.value.getDataProvider().getJsonRows(0, -1).length > 0) {
    
  // }

  // emit("closed")
  emit("uploaded", { fileId: props.guid2 ? props.guid2 : guid.value, cmpnyDiv: searchParams.CMPNY_DIV,fileNm: saveFlag})
  clearGrid()
}

defineExpose({
  onButtonsClick,
  guid,
  setGuid,
  clearGridChk,
  clearGrid,
  openPopup,
  openPopup2,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="800"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">{{ $t(props.gridTitle) }}</div>
    <VContainer class="pt-0" style="height: 100%; background-color: white;">
      <VRow no-gutters class="alignCenter" style="height: 70px; justify-content: end;">
        <IGridTitle ref="menuTitle" :button-list="props.buttonList" @click-button="onButtonsClick" />
      </VRow>
      <!-- 조회조건 -->
      <VRow v-if="props.isVisibled" no-gutters style="height: 48px;">
        <VCol>
          <v-file-input
            v-model="files"
            :label="$t(props.fileInputText)"
            clearable
            @click:clear="clearGrid"
            :multiple="multipleFile"
            @update:modelValue="selectFile"
          />
        </VCol>
      </VRow>
      <!-- <div id="result"></div> -->
      <!-- 메인그리드 -->
      <VRow no-gutters>
        <VCol>
          <RealGrid
            ref="grdMain"
            style="height: 400px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
          <!-- @onCellClicked="onCellClicked" -->
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>
