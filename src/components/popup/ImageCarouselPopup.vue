<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

const props = defineProps({
  buttonList: {
    type: Array,
    default() {
      return ["btnFileUpload", "btnDownLoad", "btnDelete", "btnClose"]
    },
  },
  isVisibled: {
    type: Boolean,
    default: true,
  },
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()

const emit = defineEmits(['selected'])

const dialog = ref(false)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: ''
})

// 파일 추가
const fileInput = ref(null)

// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

const dummy = ref(null)

// 파일 리스트
const fileList = reactive({
  src: [], 
  art: [],
  fileName: []
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true }
  },
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'}},

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
    { fieldName: 'FILE_PATH', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈
const openPopup = popupParam => {
  dialog.value = true

  if (popupParam) {
    searchParams.FILE_ID = popupParam.FILE_ID

    fileSet()
  }
}

const onButtonsClick = btn => {
  if (btn.id === 'btnFileUpload') {
    fileInput.value.click()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnDownLoad') {
    download()
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 팝업 닫기
const onClose = () => {
  dialog.value = false
}

// 파일 추가
const handleFileInput = el => {
  let file = el.target.files[0]

  if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
    return Message.warn(t('이미지 파일만 업로드 할 수 있습니다.'))
  } else {
    fileUpload(file)
  }
}

// 삭제
const deleteData = () => {
  let deleteParams = []
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if (checkedRow.length === 0) {
    return Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    for (let rowNum of checkedRow) {
      const data = grdMain.value.getDataProvider().getJsonRow(rowNum)

      deleteParams.push(data)
    }
  }

  vm.$swal({ 
    title: t('삭제하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonDeletFilesApi(deleteParams).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
        }
      }).catch(err => {
        return Message.success(err)
      }).finally(() => {
        fileSet()
      })
    }
  })
}

// 다운로드
const download = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()
  const data = grdMain.value.getDataProvider().getJsonRow(checkedRow)

  if (checkedRow.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.')) 
  } else {
    commonDownloadFilesApi(data).then(res => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)
    })
  }
}

// 파일 업로드
const fileUpload = async val => {
  if (!searchParams.FILE_ID) {
    searchParams.FILE_ID = create_UUID()
  }

  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB

  // total size 계산
  let totalChunks = Math.ceil(val.size / chunkSize) 

  let currentChunk = 0

  const start = currentChunk * chunkSize
  const end = Math.min(start + chunkSize, val.size)
  const chunk = val.slice(start, end)

  // form data 형식으로 전송
  const formData = new FormData()

  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    FILE_ID: searchParams.FILE_ID,
    FILE_NO: '',
    FILE_TITLE: val.name,
    FILE_NAME_ORIGINAL: val.name,
    FILE_NAME: val.name,
    FILE_PATH: `${commonStore.systemCode}${route.path}/`,
    FILE_TYPE: val.name.split(".").pop(),
    FILE_SIZE: Math.round(val.size / 1024.0),
    USER_ID: userStore.userId,
    CHUNK_NUMBER: currentChunk,
    TOTAL_CHUNKS: totalChunks
  }

  formData.append("file", chunk, val.name)
  formData.append(
    "param",
    new Blob([JSON.stringify(param)], { type: "application/json" })
  )

  await commonBigUploadFilesApi(formData).then(async res => {
    if (res.result.status === '200') {
      Message.success(t("업로드 되었습니다."))
      fileSet()
    }
  }).catch(err => {
    return Message.err(err)
  })
}

// 파일 ID 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Grid, Carousel Setting
const fileSet = () => {
  grdMain.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  fileList.file = []
  let cnt = 0

  commonSearchApi({
    queryId: "searchFile", 
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      FILE_ID: searchParams.FILE_ID
    } 
  }).then(async res => {
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      let isGbn = true

      if (type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        isGbn = true
        fileList.fileName.push(e)
      } else {
        isGbn = false
      }

      grdMain.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE ,
        FILE_ID: e.FILE_ID, 
        FILE_NO: e.FILE_NO, 
        CMPNY_DIV: e.CMPNY_DIV, 
        cnt: isGbn ? cnt : null,
        FILE_PATH: e.FILE_PATH,
        FILE_NAME: e.FILE_NAME,
        FILE_NAME_ORIGINAL: e.FILE_NAME_ORIGINAL,
      })
    })

    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성
      let file = null
      let fileType = null

      commonDownloadFilesApi(e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        fileType = fileName.split('.')

        if (fileType[1] === 'gif') {
          blob = new Blob([res2],{type: 'image/gif'})
        } else if (fileType[1] === 'jpeg' || fileType[1] === 'jpg') {
          blob = new Blob([res2],{type: 'image/jpeg'})
        } else if (fileType[1] === 'png') {
          blob = new Blob([res2],{type: 'image/png'})
        } else if (fileType[1] === 'pdf') {
          blob = new Blob([res2],{type: 'application/pdf'})
        } else if (fileType[1] === 'ppt') {
          blob = new Blob([res2],{type: 'application/ppt'})
        } else if (fileType[1] === 'txt') {
          blob = new Blob([res2],{type: 'text/plain'})
        } else if (fileType[1] === 'xls') {
          blob = new Blob([res2],{type: 'application/vnd.ms-excel'})
        } else if (fileType[1] === 'zip') {
          blob = new Blob([res2],{type: 'application/zip'})
        }

        file = new File([blob], fileName, {type: blob.type} )

        // blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName
        dummy.value = imageURL

      }).finally(() => {
        fileList.src[idx] = imageURL
        fileList.file[idx] = file
        carousel.value++
        grdMain.value.getGridView().checkAll(false)
        grdMain.value.getGridView().resetCurrent()
      })
    })
  })
}

// 셀 클릭 이벤트(이미지 변경)
const onCellClicked = async (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (rowData.cnt) {
      carouselIdx.value = rowData.cnt - 1
    }
  }
}

defineExpose({
  openPopup,
})

//초기 데이터셋팅
onMounted(() => {})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="600"
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
      <span>이미지 뷰어</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <IGridTitle
          :title="$t('사진 및 자료 첨부')"
          :button-list="props.buttonList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
        <!-- 숨김 처리 -->
        <div class="d-none">
          <v-file-input
            ref="fileInput"
            :label="$t('여기에 파일을 끌어놓으세요.')"
            @change="handleFileInput"
          /> 
        </div>
        <div class="d-flex fill-height mt-2">
          <v-sheet width="60%" class="h-auto pa-2 pt-0">
            <v-carousel 
              hide-delimiters 
              height="100%"
              class="border"
              show-arrows="hover"
              hide-delimiter-background
              :key="carousel"
              v-model="carouselIdx"
            >
              <v-carousel-item 
                v-for="(item, i) in fileList.src"
                :key="i"
                :src="item"
                width="100%"
              />
            </v-carousel>
          </v-sheet>
          <v-sheet width="40%" class="h-auto pa-2 pt-0">
            <RealGrid
              ref="grdMain"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
