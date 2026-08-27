<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from '@hiway/api/commonFileApi'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import Compressor from 'compressorjs'

const props = defineProps({
  buttonList: {
    type: Array,
    default() {
      return ['btnFileUpload', 'btnDelete']
    },
  },
  isVisibled: {
    type: Boolean,
    default: false,
  },
  // 드롭된 파일
  fileValue: {
    type: [FileList, Array],
    default() {
      return []
    },
  },
  //사진갯수
  cnt: {
    type: Number,
    default: 10, // MB
  },
  title: {
    type: String,
    default: '',
  },
  //이미지 캐러셀 width
  imageSheetWidth: {
    type: String,
    default: '50%',
  },
  height: {
    type: String,
    default: '400',
  },
})

const albumPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()
const guid = ref('')
const deleteRef = ref(null)
const emit = defineEmits(['selected', 'uploaded', 'selectedRefImage', 'deleted'])
const cntVal = ref(0)
const menuTitle = ref(null)

// const dialog = ref(false)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: '',
})

// 파일 추가
const fileInput = ref(null)
const hasErr = ref(false)
// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)
const fileData = ref([])
const dummy = ref(null)

// 파일 리스트
const fileList = reactive({
  src: [],
  art: [],
  fileName: [],
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnFileUpload') {
    fileInput.value.click()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnDownLoad') {
    download()
  } else if (btn.id === 'btnSearch') {
    fileSet()
  }
}

// 파일ID 지정
const setGuid = (val) => {
  if (val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }
  searchParams.FILE_ID = guid.value
}

// 파일 추가
const handleFileInput = async (el) => {
  let resultArr = []
  fileData.value = []
  let data = el
  console.log(el.target)

  if (el.target !== undefined) {
    data = el.target.files
  }

  for (let i of data) {
    let file = i

    if (!(i instanceof File)) {
      const imgUrl = getImage(i)
      file = await urlToFile(imgUrl, i.FILE_NAME)
    }

    await new Promise((resolve) => {
      new Compressor(file, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          resultArr.push(result)
          resolve()
        },
      })
    })
  }
  fileData.value = resultArr
  if (fileData.value.length > props.cnt || cntVal.value > props.cnt) {
    Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`))
    return
  }

  fileUpload()
}

async function urlToFile(imageUrl, fileName) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const file = new File([blob], fileName, { type: blob.type })
  return file
}

const getImage = (item) => {
  let image = ''
  if (item.MIME_TYPE.indexOf('image') > -1) {
    return 'data:' + item.MIME_TYPE + ';base64,' + item.BASE64
  } else if (item.MIME_TYPE.indexOf('video') > -1) {
    image = 'video'
  } else if (item.MIME_TYPE.indexOf('excel') > -1 || item.MIME_TYPE.indexOf('spreadsheetml') > -1) {
    image = 'excel'
  } else if (item.MIME_TYPE.indexOf('word') > -1) {
    image = 'word'
  } else if (item.MIME_TYPE.indexOf('powerpoint') > -1 || item.MIME_TYPE.indexOf('presentation') > -1) {
    image = 'ppt'
  } else if (item.MIME_TYPE.indexOf('pdf') > -1) {
    image = 'pdf'
  } else {
    image = 'file'
  }

  return new URL(`/src/assets/images/mobile/${image}.png`, import.meta.url).href
}
watch(
  () => props.fileValue,
  (newValue) => {
    if (newValue) {
      dropFile(newValue)
    }
  }
)
// 드래그엔 드롭
const dropFile = async (e) => {
  let resultArr = []
  fileData.value = []
  for (let i of e) {
    await new Promise((resolve) => {
      new Compressor(i, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          resultArr.push(result)
          resolve()
        },
      })
    })
  }
  fileData.value = resultArr
  if (fileData.value.length > props.cnt || cntVal.value > props.cnt) {
    Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`))
    return
  }
  fileUpload()
}

// 삭제
const deleteData = () => {
  let deleteParams = []

  if (fileList.fileName.length === 0) {
    return Message.warn(t('삭제할 데이터가 없습니다.'))
  } else {
    for (let file of fileList.fileName) {
      deleteParams.push(file)
    }
  }

  vm.$swal({
    title: t('삭제하시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      commonDeletFilesApi(deleteParams)
        .then((res) => {
          if (res.result.status === '200') {
            Message.success(t('삭제 되었습니다.'))
          }
        })
        .catch((err) => {
          return Message.success(err)
        })
        .finally(() => {
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
    commonDownloadFilesApi(data).then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ''))
      link.click()
      URL.revokeObjectURL(link.href)
    })
  }
}

// 파일 업로드
const fileUpload = async (e) => {
  for (let i = 0; i < fileData.value.length; i++) {
    // 자르는 사이즈
    let chunkSize = 1024 * 1024 // 1MB
    let currentChunk = 0

    const upLoad = async () => {
      if (!searchParams.FILE_ID) {
        searchParams.FILE_ID = create_UUID()
      }

      // 대용량은 안올라가서 수정

      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, fileData.value[i].size)
      const chunk = fileData.value[i].slice(start, end)
      const totalChunks = Math.ceil(fileData.value[i].size / chunkSize)

      // total size 계산

      // form data 형식으로 전송
      const formData = new FormData()

      const param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: searchParams.FILE_ID,
        FILE_NO: '',
        FILE_TITLE: fileData.value[i].name,
        FILE_NAME_ORIGINAL: fileData.value[i].name,
        FILE_NAME: fileData.value[i].name,
        FILE_PATH: `${commonStore.systemCode}${route.path}/`,
        FILE_TYPE: fileData.value[i].name.split('.').pop().toUpperCase(),
        FILE_SIZE: Math.round(fileData.value[i].size / 1024.0),
        USER_ID: userStore.userId,
        CHUNK_NUMBER: currentChunk,
        TOTAL_CHUNKS: totalChunks,
      }
      formData.append('file', chunk, fileData.value[i].name)
      formData.append('param', new Blob([JSON.stringify(param)], { type: 'application/json' }))
      await commonBigUploadFilesApi(formData)
        .then(async (res) => {
          if (res.result.status === '207') {
            currentChunk++
            if (currentChunk < totalChunks) {
              await upLoad()
            }
          } else if (res.result.status === '200') {
            Message.success(t('업로드 되었습니다.'))
          }
        })
        .catch((err) => {
          return Message.err(err)
        })
    }
    await upLoad()
  }
  //파일이 모두 업로드가 되면 emit으로 업로드정보 올려줌
  emit('uploaded', searchParams)
  fileSet()
}

// 파일 ID 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Grid, Carousel Setting
const fileSet = () => {
  // grdMain.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  fileList.file = []
  let cnt = 0

  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: searchParams.FILE_ID,
    },
  }).then(async (res) => {
    await res.ORESULT_CUR.forEach((e) => {
      let type = e.FILE_TYPE.toUpperCase()
      let isGbn = true

      if (type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        isGbn = true
        fileList.fileName.push(e)
      } else {
        isGbn = false
      }
    })

    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성
      let file = null
      let fileType = null

      commonDownloadFilesApi(e)
        .then((res2) => {
          contentDisposition = res2.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]
          //기존에는 fileName을 .으로 split해서 fileName[1]이 fileType으로 갔는데
          //파일 이름이 1111.2222.jpg인경우에는 fileName이 2222로 들어가서 fileNameArr로 .으로 split해서 배열을 구한다음에 마지막 배열에 있는 값을 넣음
          let fileNameArr = fileName.split('.') //fileName을 .으로  split
          fileType = fileNameArr[fileNameArr.length - 1]
          if (fileType.toLowerCase() === 'gif') {
            blob = new Blob([res2], { type: 'image/gif' })
          } else if (fileType.toLowerCase() === 'jpeg' || fileType.toLowerCase() === 'jpg') {
            blob = new Blob([res2], { type: 'image/jpeg' })
          } else if (fileType.toLowerCase() === 'png') {
            blob = new Blob([res2], { type: 'image/png' })
          } else if (fileType.toLowerCase() === 'pdf') {
            blob = new Blob([res2], { type: 'application/pdf' })
          } else if (fileType.toLowerCase() === 'ppt') {
            blob = new Blob([res2], { type: 'application/ppt' })
          } else if (fileType.toLowerCase() === 'txt') {
            blob = new Blob([res2], { type: 'text/plain' })
          } else if (fileType.toLowerCase() === 'xls') {
            blob = new Blob([res2], { type: 'application/vnd.ms-excel' })
          } else if (fileType.toLowerCase() === 'zip') {
            blob = new Blob([res2], { type: 'application/zip' })
          }

          file = new File([blob], fileName, { type: blob.type })

          // blob = new Blob([res2])
          imageURL = URL.createObjectURL(blob)

          img = new Image() // 이미지 요소 생성

          img.src = imageURL // 이미지 URL 설정
          img.alt = fileName
          dummy.value = imageURL
        })
        .finally(() => {
          fileList.src[idx] = imageURL
          fileList.file[idx] = file
          carousel.value++
          //grdMain.value.getGridView().checkAll(false)
          //grdMain.value.getGridView().resetCurrent()
          //cntVal.value = grdMain.value.getGridView().getItemCount()
        })
    })
  })
}

//2024.07.11 김현재 작성 버튼 활성화 함수
const enableButton = (buttonId) => {
  menuTitle.value.disableBtn(buttonId, false)
}

//2024.07.11 김현재 작성 버튼 비활성화 함수
const disableButton = (buttonId) => {
  menuTitle.value.disableBtn(buttonId, true)
}

//2025.08.01 김현재 작성 버튼 감추는 함수
const unVisibleButton = (buttonId) => {
  menuTitle.value.visibleBtn(buttonId, false)
}

//2025.08.01 김현재 작성 버튼 보이게하는 함수
const visibleButton = (buttonId) => {
  menuTitle.value.visibleBtn(buttonId, true)
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

watch(
  () => props.isVisibled,
  (newValue) => {
    if (newValue) {
      menuTitle.value.disableBtn('btnFileUpload', true)
      menuTitle.value.disableBtn('btnDelete', true)
      menuTitle.value.disableBtn('btnUpdateRefImage', true)
    }
  }
)

defineExpose({
  setGuid,
  guid,
  onButtonsClick,
  enableButton,
  disableButton,
  unVisibleButton,
  visibleButton,
})
//초기 데이터셋팅
onMounted(() => {})
</script>

<template>
  <v-card class="pa-0 fill-height rounded-b-5" @dragenter.prevent @dragleave.prevent @dragover.prevent @drop.prevent>
    <v-card-title class="px-4 pt-2 pb-0">
      <IGridTitle :title="props.title" ref="menuTitle" :button-list="props.buttonList" @click-button="onButtonsClick" />
    </v-card-title>
    <v-card-text class="pa-2 pt-0">
      <!-- 숨김 처리 -->
      <div class="d-none">
        <v-file-input ref="fileInput" :label="$t('여기에 파일을 끌어놓으세요.')" @change="handleFileInput" multiple />
      </div>
      <div class="d-flex mt-2" :style="{ width: '200px', height: props.height + 'px' }">
        <!-- <v-sheet :width="props.imageSheetWidth" class="h-auto pa-2 pt-0"> -->
        <img :src="fileList.src[0]" alt="" />
        <!-- </v-sheet> -->
      </div>
    </v-card-text>
  </v-card>
  <!-- </v-dialog> -->
</template>
