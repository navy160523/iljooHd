
<script setup>
import { ref, reactive, onMounted, onDeactivated } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
  commonDeletFilesApi,
} from '@hiway/api/commonFileApi'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import Compressor from 'compressorjs'
import AlbumPopup from '@/components/popup/AlbumPopup.vue'

const props = defineProps({
  buttonList: {
    type: Array,
    default() {
      return ['btnFileUpload', 'btnMobileAlbum', 'btnDownLoad', 'btnDelete']
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
    default: '55%',
  },
  //파일그리드 width
  fileGridWidth: {
    type: String,
    default: '45%',
  },
  height: {
    type: String,
    default: '400',
  },
  refImage: {
    type: Boolean,
    default: false,
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


const resetCntVal = () => {
  console.log("resetCntVal", cntVal.value)
  cntVal.value = 0
  console.log( cntVal.value)
}

const emit = defineEmits([
  'selected',
  'uploaded',
  'selectedRefImage',
  'deleted',
  'closed'
])
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
const fileNo = ref(null) //대표이미지 fileno

// 파일 리스트
const fileList = reactive({
  src: [],
  art: [],
  fileName: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
    {
      fieldName: 'OPINION_CMPNY',
      dataType: 'text',
      header: { text: t('파일명'), styleName: 'header_color' },
    },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
    { fieldName: 'FILE_PATH', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME', dataType: 'text', visible: false },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', visible: false },
  ],
  columns: [],
})

//대표이미지가 선택된 행에 색상을 부여하기 위해서 넣음
if (props.refImage) {
  grdMainProps.fields.push({
    fieldName: 'REF_YN',
    header: { text: t('대표이미지여부') },
    dataType: 'text',
    // visible: false,
  })
  grdMainProps.columns = grdMainProps.fields
} else {
  grdMainProps.columns = grdMainProps.fields
}

// 팝업 오픈
// const openPopup = (popupParam) => {
//   // dialog.value = true

//   if (popupParam) {
//     searchParams.FILE_ID = popupParam.FILE_ID

//     fileSet()
//   }
// }

const onButtonsClick = (btn) => {
  if (btn.id === 'btnFileUpload') {
    fileInput.value.click()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnDownLoad') {
    download()
  } else if (btn.id === 'btnClose') {
    onClose()
  } else if (btn.id === 'btnSearch') {
    fileSet()
  }
  //대표이미지설정 버튼
  else if (btn.id === 'btnUpdateRefImage') {
    if (props.refImage) {
      setRefImage()
    }
  }else if (btn.id === 'btnMobileAlbum') {
    albumPopup.value.openPopup({
      FILE_PATH: `XX09/mobile/album/${userStore.userId}/`,
    })
  }
}

// 팝업 닫기
const onClose = () => {
  // dialog.value = false
  emit('closed')
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
  if(el.target !== undefined) {
    data = el.target.files
  }

  for (let i of data) {
    let file = i

    if(!(i instanceof File)) {
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
  if ((fileData.value.length > props.cnt) || (cntVal.value >= props.cnt)) {
    console.log("fileData.value.length/ cntVal.value", fileData.value.length, cntVal.value)
    Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`))
    return
  }

  fileUpload()
}

async function urlToFile(imageUrl, fileName) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type });
  return file;
}

const getImage = item => {
  let image = ''
  if(item.MIME_TYPE.indexOf('image') > -1) {
    return "data:"+ item.MIME_TYPE +";base64,"+item.BASE64
  } else if(item.MIME_TYPE.indexOf('video') > -1) {
    image = 'video'
  } else if(item.MIME_TYPE.indexOf('excel') > -1 || item.MIME_TYPE.indexOf('spreadsheetml') > -1) {
    image = 'excel'
  } else if(item.MIME_TYPE.indexOf('word') > -1) {
    image = 'word'
  } else if(item.MIME_TYPE.indexOf('powerpoint') > -1 || item.MIME_TYPE.indexOf('presentation') > -1 ) {
    image = 'ppt'
  } else if(item.MIME_TYPE.indexOf('pdf') > -1) {
    image = 'pdf'  
  } else {
    image = 'file'
  }
  
  return new URL(`/src/assets/images/mobile/${image}.png`, import.meta.url).href

}

// const handleFileInput = async (el) => {
//   let resultArr = []
//   fileData.value = []
//   console.log(el)
//   console.log(typeof el)
//   for (let i of el.target.files) {
//     await new Promise((resolve) => {
//       new Compressor(i, {
//         convertSize: 1000000, // 1MB
//         quality: 0.8,
//         success(result) {
//           resultArr.push(result)
//           resolve()
//         },
//       })
//     })
//   }
//   fileData.value = resultArr
//   if (fileData.value.length > props.cnt || cntVal.value > props.cnt) {
//     Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`))
//     return
//   }

//   fileUpload()
// }

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
  if (fileData.value.length > props.cnt || cntVal.value >= props.cnt) {
    console.log("fileData.value.length/ cntVal.value", fileData.value.length, cntVal.value)
    Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`))
    return
  }
  fileUpload()
}

// 삭제
const deleteData = () => {
  let deleteParams = []
  console.log('여기탐?1')
  //대표이미지 설정시
  if (props.refImage) {
    console.log('여기탐?2')
    const checkedRow = grdMain.value.getGridView().getCheckedRows()
    if (checkedRow.length === 0) {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return false
    }
    for (let i = 0; i < checkedRow.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(checkedRow[i])
      deleteParams.push(data)
    }
    emit('deleted', deleteParams)
    if (deleteRef.value === false) {
      console.log('여기탐?3')
      return false
    }
  }
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
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      commonDeletFilesApi(deleteParams)
        .then((res) => {
          if (res.result.status === '200') {
            Message.success(t('삭제 되었습니다.'))
          }
          //대표이미지 설정시 저장된 파일번호 초기화
          if (props.refImage) {
            fileNo.value = ''
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
      // if (!val) {
      //   return
      // }
      // console.log(val, "val")
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
      formData.append(
        'param',
        new Blob([JSON.stringify(param)], { type: 'application/json' })
      )
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
  grdMain.value.getDataProvider().setRows([])
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

      if (
        type === 'PNG' ||
        type === 'JPG' ||
        type === 'JPEG' ||
        type === 'GIF'
      ) {
        cnt++
        isGbn = true
        fileList.fileName.push(e)
      } else {
        isGbn = false
      }

      grdMain.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
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
          } else if (
            fileType.toLowerCase() === 'jpeg' ||
            fileType.toLowerCase() === 'jpg'
          ) {
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
          grdMain.value.getGridView().checkAll(false)
          grdMain.value.getGridView().resetCurrent()

          cntVal.value = grdMain.value.getGridView().getItemCount()
          console.log("cntVal.value" , cntVal.value)
          if (props.refImage) {
            let count = grdMain.value.getGridView().getItemCount()
            for (let i = 0; i < count; i++) {
              let grdFileNo = grdMain.value
                .getDataProvider()
                .getJsonRow(i).FILE_NO
              if (grdFileNo === fileNo.value) {
                grdMain.value.getDataProvider().setValue(i, 'REF_YN', 'Y')
              }
            }
          }
        })
    })
  })
}

//2024.07.17김현재 작성
//대표이미지 설정 버튼 관련 로직 시작
const setRefImage = async () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRow.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  } else if (checkedRow.length > 1) {
    Message.warn(t('대표이미지는 1장만 선택 가능합니다.'))
    return false
  }

  let result = await vm.$swal({
    title: t('선택한 이미지를 대표이미지로 설정 하시겠습니까?'),
    showCancelButton: true,   
    didOpen: () => {
      const confirmButton = document.querySelector('.swal2-confirm');
      if (confirmButton) {
        confirmButton.focus(); // ✅ 수동으로 포커스 줘야함 안주면 다른쪽으로 포커스 잡힘
      }
    }
  })

  if (result.isConfirmed) {
    let checkImageData = grdMain.value.getGridView().getCheckedRows(true)
    console.log('checkImageData', checkImageData)
    let data = grdMain.value.getDataProvider().getJsonRow(checkImageData[0])
    fileNo.value = data.FILE_NO //대표이미지의 파일번호를 저장
    emit('selectedRefImage', data)
    Message.success(t('대표이미지가 선택되었습니다.'))
    //대표이미지가 선택된 행의 'REF_YN'컬럼에 Y를 SET
    let grdCount = grdMain.value.getGridView().getItemCount()

    for (let i = 0; i < grdCount; i++) {
      grdMain.value.getDataProvider().setValue(i, 'REF_YN', '')
    }
    grdMain.value.getDataProvider().setValue(checkImageData[0], 'REF_YN', 'Y')
  }
}

//대표이미지 설정 버튼 관련 로직 끝

//대표이미지가 설정된 행에 대해서 Y를 세팅한다.
const setRefYn = (FILE_NO) => {
  if (FILE_NO && props.refImage) {
    let count = grdMain.value.getGridView().getItemCount()
    fileNo.value = FILE_NO
    for (let i = 0; i < count; i++) {
      let grdFileNo = grdMain.value.getDataProvider().getJsonRow(i).FILE_NO

      if (FILE_NO == grdFileNo) {
        grdMain.value.getDataProvider().setValue(i, 'REF_YN', 'Y')
      } else {
        continue
      }
    }
  }
}

//2024.07.02 김현재 작성 컴포넌트 초기화함수
//그리드와 이미지뷰어를 초기화한다.
const clearGrid = () => {
  if (props.refImage) {
    fileNo.value = ''
  }
  grdMain.value.getDataProvider().setRows(null)
  fileData.value = []
  //fileInput.value = null
  searchParams.FILE_ID = ''
  for (let i in fileList) {
    fileList[i] = []
  }
}

//2024.07.11 김현재 작성 버튼 활성화 함수
const enableButton = (buttonId) => {
  menuTitle.value.disableBtn(buttonId, false)
}

//2024.07.11 김현재 작성 버튼 비활성화 함수
const disableButton = (buttonId) => {
  menuTitle.value.disableBtn(buttonId, true)
}

//저장하지않고, 대표이미지가 설정된 이미지를 삭제하려했을때
const checkDeleteRef = (flag) => {
  deleteRef.value = flag
}

// 셀 클릭 이벤트(이미지 변경)
const onCellClicked = async (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = await grdMain.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow)
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
  clearGrid,
  enableButton,
  disableButton,
  setRefYn,
  checkDeleteRef,
  resetCntVal,
})
//초기 데이터셋팅
onMounted(() => {


})

onDeactivated(()=>{

})


</script>

<template>
  <!-- <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  > -->
  <!-- <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>이미지 뷰어</span>
  </v-sheet> -->
  <v-card
    class="pa-0 fill-height rounded-b-5"
    @dragenter.prevent
    @dragleave.prevent
    @dragover.prevent
    @drop.prevent
  >
    <v-card-title class="px-4 pt-2 pb-0">
      <IGridTitle
        :title="props.title"
        ref="menuTitle"
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
          multiple
        />
      </div>
      <div class="d-flex mt-2" :style="{ height: props.height + 'px' }">
        <v-sheet :width="props.imageSheetWidth" class="h-auto pa-2 pt-0">
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
        <v-sheet :width="props.fileGridWidth" class="h-auto pa-2 pt-0">
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
    <AlbumPopup
      ref="albumPopup"
      @selected="handleFileInput"
    />
    <!-- @closePopup="closePopup" -->
  </v-card>
  <!-- </v-dialog> -->
</template>
