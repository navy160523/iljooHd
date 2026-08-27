<script setup>
import { ref, onMounted, getCurrentInstance, reactive } from 'vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import { useCommonStore } from '@hiway/stores/common'
import { useRoute } from 'vue-router'
import {
  commonDownloadFilesApi,
  commonDeletFilesApi,
  commonBigUploadFilesApi,
} from '@hiway/api/commonFileApi'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import { create_UUID } from '@/utils/common'
import Compressor from 'compressorjs'
import _ from 'lodash'

const props = defineProps({
  readOnly: {
    type: Boolean,
    default() {
      return false
    }
  },
  autoUpload: {
    type: Boolean,
    default() {
      return true
    }
  },
  types: {
    type: Array,
    default() {
      return [
        'jpg',
        'jpeg',
        'gif',
        'bmp',
        'png',
        'pdf',
      ]
    }
  },
  addIconSize: {
    type: Number,
    default() {
      return 36
    }
  },
  downIconSize: {
    type: Number,
    default() {
      return 36
    }
  },
  delIconSize: {
    type: Number,
    default() {
      return 36
    }
  }
})

const emit = defineEmits([
  'uploaded',
  'downloaded',
  'deleted',
])

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const commonStore = useCommonStore()
const route = useRoute()

const saveFile = ref(null)
const imgUrl = ref('')
const pdfUrl = ref('')
const guid = ref(null)
const addImgInput = ref(null)

const setGuid = (val) => {
  // console.log('setGuid', val)

  if(val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }

  searchParams.FILE_ID = guid.value
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: '',
})

const saveParams = reactive({
  CMPNY_DIV: '',
  FILE_ID: '',
  FILE_NO: '',
  FILE_TITLE: '',
  FILE_NAME_ORIGINAL: '',
  FILE_NAME: '',
  FILE_PATH: '',
  FILE_TYPE: '',
  FILE_SIZE: '',
  USER_ID: '',
  CHUNK_NUMBER: 0,
  TOTAL_CHUNKS: 0,
})

const initParams = _.cloneDeep(saveParams)

const clearImg = () => {
  Object.keys(saveParams).forEach(key => {
    saveParams[key] = initParams[key]
  })

  imgUrl.value = ''
  pdfUrl.value = ''
  saveFile.value = null
}

const onDrop = e => {
  // console.log('onDrop e', e)

  if(props.readOnly) {
    return
  }

  const dropFile = e.dataTransfer.files

  checkFile(dropFile)
}

const showFileDialog = () => {
  addImgInput.value.click()
}

const addFile = e => {
  // console.log('addFile e', e)

  checkFile(e.target.files)
  
  addImgInput.value.value = null
}

const checkFile = paramFile => {
  if (saveParams.FILE_NO) {
    Message.err('이미 등록된 파일이 있습니다.')
    return
  }

  if(paramFile.length > 1) {
    Message.err('이미지 하나만 등록 가능합니다.')
    return
  }

  if(paramFile.length < 1) {
    return
  }

  const fileType = paramFile[0].name.split('.')[1].toLowerCase()

  if(!props.types.includes(fileType)) {
    Message.err('이미지, PDF만 등록 가능합니다.')
    return
  }

  saveFile.value = paramFile[0]

  // console.log('saveFile.value', saveFile.value)
  // console.log('fileType', fileType)

  if(fileType === 'pdf') {
    setPdf()
  } else {
    setImage()
  }
}

const setPdf = () => {
  const file = saveFile.value
  const blob = new Blob([file], { type: 'application/pdf' })
  pdfUrl.value = URL.createObjectURL(blob)

  saveParams.CMPNY_DIV = userStore.cmpnyDiv
  saveParams.FILE_ID = guid.value
  saveParams.FILE_NO = ''
  saveParams.FILE_TITLE = file.name
  saveParams.FILE_NAME_ORIGINAL = file.name
  saveParams.FILE_NAME = file.name
  saveParams.FILE_PATH = `${commonStore.systemCode}${route.path}/`
  saveParams.FILE_TYPE = file.name.split(".").pop().toLowerCase()
  saveParams.FILE_SIZE = Math.round(file.size / 1024.0)
  saveParams.USER_ID = userStore.userId
  saveParams.CHUNK_NUMBER = 0
  saveParams.TOTAL_CHUNKS = 0

  if(props.autoUpload) {
    uploadFile()
  }
}

const setImage = () => {
  const file = saveFile.value
  
  new Compressor(file, {
    convertSize: 1000000, // 1MB
    quality: 0.8,
    success(result) {
      const blob = new Blob([result])
      imgUrl.value = URL.createObjectURL(blob)

      saveParams.CMPNY_DIV = userStore.cmpnyDiv
      saveParams.FILE_ID = guid.value
      saveParams.FILE_NO = ''
      saveParams.FILE_TITLE = result.name
      saveParams.FILE_NAME_ORIGINAL = result.name
      saveParams.FILE_NAME = result.name
      saveParams.FILE_PATH = `${commonStore.systemCode}${route.path}/`
      saveParams.FILE_TYPE = result.name.split(".").pop().toLowerCase()
      saveParams.FILE_SIZE = Math.round(result.size / 1024.0)
      saveParams.USER_ID = userStore.userId
      saveParams.CHUNK_NUMBER = 0
      saveParams.TOTAL_CHUNKS = 0

      saveFile.value = result

      if(props.autoUpload) {
        uploadFile()
      }
    },
  })
}

const uploadFile = async () => {
  let hasErr = false

  // 자르는 사이즈
  const chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  const totalChunks = Math.ceil(saveFile.value.size / chunkSize)
  let currentChunk = 0

  // console.log('guid.value:',guid.value)
  const sendNextFile = async () => {
    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, saveFile.value.size)
    const chunk = saveFile.value.slice(start, end)

    // form data 형식으로 전송
    const formData = new FormData()

    // console.log('guid.value:',guid.value)
    // console.log('checkedData:',checkedData)
    // console.log('guid2:',props.guid2)

    saveParams.CHUNK_NUMBER = currentChunk
    saveParams.TOTAL_CHUNKS = totalChunks

    // console.log('upload에서 param:',param)
    // console.log('param', param)
    formData.append('file', chunk, saveFile.value.name)
    formData.append(
      'param',
      new Blob([JSON.stringify(saveParams)], { type: 'application/json' })
    )

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        // 전송 결과가 207이면 다음 파일 조각 전송
        if (res.result.status === '207') {
          currentChunk++
          if (currentChunk < totalChunks) {
            await sendNextFile()
          }
        } else if (res.result.status === '200') {
          // console.log('commonBigUploadFilesApi res', res)

          // 마지막 파일까지 전송 되면
          saveParams.FILE_NO = res.RES_FILE_NO
          saveParams.FILE_PATH = res.FILE_PATH
          saveParams.FILE_NAME = res.FILE_NAME
          Message.success('업로드 되었습니다.')
        }
      })
      .catch((e) => {
        // console.log('e', e)
        hasErr = true
      })
  }

  await sendNextFile()

  if (!hasErr) {
    emit('uploaded', saveParams)
  }
}

const searchImg = async () => {
  clearImg()

  await commonSearchApi({ queryId: 'searchFile', param: searchParams }).then(async res => {
    const result = res.ORESULT_CUR
    // console.log('result', result)
    
    if (result.length < 1) {
      return
    }

    saveParams.CMPNY_DIV = searchParams.CMPNY_DIV
    saveParams.FILE_ID = searchParams.FILE_ID
    saveParams.FILE_NO = result[0].FILE_NO
    saveParams.FILE_TITLE = result[0].FILE_TITLE
    saveParams.FILE_NAME_ORIGINAL = result[0].FILE_NAME_ORIGINAL
    saveParams.FILE_NAME = result[0].FILE_NAME
    saveParams.FILE_PATH = result[0].FILE_PATH
    saveParams.FILE_TYPE = result[0].FILE_TYPE.toLowerCase()
    saveParams.FILE_SIZE = result[0].FILE_SIZE
    saveParams.USER_ID = result[0].USER_ID

    // console.log('saveParams.FILE_TYPE', saveParams.FILE_TYPE)

    await commonDownloadFilesApi(saveParams).then(res2 => {
        saveFile.value = res2

        if(saveParams.FILE_TYPE === 'pdf') {
          const blob = new Blob([res2], { type: 'application/pdf' })
          pdfUrl.value = URL.createObjectURL(blob)
        } else {
          const blob = new Blob([res2])
          imgUrl.value = URL.createObjectURL(blob)
        }
      })
      .catch(e => {
        Message.err('파일을 가져오지 못하였습니다.')
      })
    })
}

const downImg = () => {
  if (!saveParams.FILE_NO) {
    Message.err('다운로드할 이미지가 없습니다.')
    return
  }

  commonDownloadFilesApi(saveParams)
    .then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ''))
      link.click()
      URL.revokeObjectURL(link.href)

      Message.success('다운로드 되었습니다.')
    })
    .catch(e => {
      Message.err('파일을 가져오지 못하였습니다.')
    })
}

const delImg = (showMsg = true) => {
  commonDeletFilesApi([saveParams]).then(async res => {
    await searchImg()

    if(showMsg) {
      Message.success('삭제 되었습니다.')
    }

    emit('deleted', saveParams)
  })
}

const delImg2 = () => {
  if(saveParams.FILE_ID !== '') {
    commonDeletFilesApi([saveParams])
  }
}

defineExpose({
  guid,
  setGuid,
  searchImg,
  clearImg,
  uploadFile,
  delImg2,
})
</script>

<template>
  <div
    class="image-drag-drop"
    @drop.prevent="onDrop"
    @dragenter.prevent
    @dragover.prevent
  >
    <div
      v-if="saveFile == null"
      class="d-flex justify-center align-center div-file div-file-null"
    >
      <div>
        <div>
          Drag & Drop
        </div>
        <div v-if="!props.readOnly" class="text-center">
          <v-icon
            class="add-icon"
            icon="mdi-plus-circle-outline"
            :size="addIconSize"
            @click="showFileDialog"
          />
        </div>
      </div>
    </div>
    <div
      v-else
      class="div-file div-file-notnull"
    >
      <iframe
        v-if="saveParams.FILE_TYPE === 'pdf'"
        width="100%"
        height="100%"
        :src="pdfUrl"
      />
      <img
        v-else
        class="show-img"
        :src="imgUrl"
      />
      <div class="div-down-close">
        <v-icon
          class="down-img"
          icon="mdi-download-circle-outline"
          :size="downIconSize"
          @click="downImg"
        />
        <v-icon
          v-if="!props.readOnly"
          class="del-img"
          icon="mdi-close-circle-outline"
          :size="delIconSize"
          @click="delImg"
        />
      </div>
    </div>
    <input
      ref="addImgInput"
      type="file"
      hidden
      @input="addFile"
      accept="image/*, .pdf"
    />
  </div>
</template>

<style lang="scss" scoped>
.image-drag-drop {
  width: 100%;
  height: 100%;
  border: 1px solid #eeeeee;
  border-radius: 8px;

  .div-file {
    height: 100%;
  }

  .div-file-null {
    color: #bbbbbb;
    font-size: 24px;
    font-weight: bold;

    .add-icon {
      color: #5555ff;
    }
  }

  .div-file-notnull {
    position: relative;

    .show-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .add-img {
      cursor: pointer;
    }

    .div-down-close {
      position: absolute;
      top: 4px;
      right: 4px;
      .down-img {
        color: #55dd55;
        cursor: pointer;
      }

      .del-img {
        color: #ff5555;
        cursor: pointer;
      }
    }
  }
}
</style>