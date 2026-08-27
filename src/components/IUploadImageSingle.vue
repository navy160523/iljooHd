<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import Compressor from "compressorjs"
import _ from "lodash"
import { commonSearchApi } from "@hiway/api/commonApi"
import {
  commonDownloadFilesApi,
  commonDeletFilesApi,
  commonBigUploadFilesApi,
} from "@hiway/api/commonFileApi"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import IMenuTitle from "@/components/IMenuTitle.vue"
import Message from "@hiway/utils/notify"

const props = defineProps({
  // 제목
  title: {
    type: String,
    default: "파일첨부",
  },
  // 첨부가능한 최대파일크기
  maxFileSize: {
    type: Number,
    required: false,
    default: 20, // MB
  },
  //버튼리스트
  buttonList: {
    type: Array,
    default() {
      return ["btnAttach", "btnFileUpload", "btnDownLoad", "btnDelete"]
    },
  },
  // disable 자동처리여부
  useAutoDisabled: {
    type: Boolean,
    default() {
      return true
    },
  },

  // 메시지 출력여부
  showMessage: {
    type: Boolean,
    default() {
      return true
    },
  },
})

const emit = defineEmits([
  "selected",
  "uploaded",
  "downloaded",
  "deleted",
  "URL",
])

defineOptions({
  name: "IUploadSingle",
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const route = useRoute()
const commonStore = useCommonStore()
const t = useI18n().t
const refIMenuTitle = ref(null)
const refVFileInput = ref(null)
const guid = ref(null)
const imgUrl = ref("")
const saveFile = ref(null)
const fileTypes = "jpg,gif,bmp,png,jpeg"

const getDisableAttach = () => {
  return !(saveParams.FILE_NO === "")
}

const getDisableFileUpload = () => {
  return !(saveParams.FILE_NO === "" && saveFile.value !== null)
}

const getDisableDownLoad = () => {
  return !(saveParams.FILE_NO !== "" && saveFile.value !== null)
}

const getDisableDelete = () => {
  return saveParams.FILE_NO === ""
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: "",
})

const saveParams = reactive({
  CMPNY_DIV: "",
  FILE_ID: "",
  FILE_NO: "",
  FILE_TITLE: "",
  FILE_NAME_ORIGINAL: "",
  FILE_NAME: "",
  FILE_PATH: "",
  FILE_TYPE: "",
  FILE_SIZE: "",
  USER_ID: "",
  CHUNK_NUMBER: 0,
  TOTAL_CHUNKS: 0,
})

const setDisableBtns = () => {
  // console.log('props.useAutoDisabled', props.useAutoDisabled)

  if (
    props.buttonList &&
    props.buttonList.length > 0 &&
    props.useAutoDisabled
  ) {
    refIMenuTitle.value.disableBtn("btnAttach", getDisableAttach())
    refIMenuTitle.value.disableBtn("btnFileUpload", getDisableFileUpload())
    refIMenuTitle.value.disableBtn("btnDownLoad", getDisableDownLoad())
    refIMenuTitle.value.disableBtn("btnDelete", getDisableDelete())
  }
}

const setGuid = (val) => {
  // console.log('val', val)
  if (val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }
  searchParams.FILE_ID = guid.value
  //console.log('파일아이디',searchParams.FILE_ID)
  // console.log('guid', guid.value)
}

const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const clearImg = () => {
  saveParams.CMPNY_DIV = ""
  saveParams.FILE_ID = ""
  saveParams.FILE_NO = ""
  saveParams.FILE_TITLE = ""
  saveParams.FILE_NAME_ORIGINAL = ""
  saveParams.FILE_NAME = ""
  saveParams.FILE_PATH = ""
  saveParams.FILE_TYPE = ""
  saveParams.FILE_SIZE = ""
  saveParams.USER_ID = ""
  saveParams.CHUNK_NUMBER = 0
  saveParams.TOTAL_CHUNKS = 0
  imgUrl.value = ""
  saveFile.value = null
}

const btnSearch = async () => {
  clearImg()
  await commonSearchApi({ queryId: "searchFile", param: searchParams }).then(
    async (res) => {
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
      saveParams.FILE_TYPE = result[0].FILE_TYPE
      saveParams.FILE_SIZE = result[0].FILE_SIZE
      saveParams.USER_ID = result[0].USER_ID

      await commonDownloadFilesApi(saveParams)
        .then((res2) => {
          saveFile.value = res2
          const blob = new Blob([res2])
          imgUrl.value = URL.createObjectURL(blob)
          emit("URL", imgUrl.value)
          console.log("URLURLURLURLURLURLURLURL")
        })
        .catch((e) => {
          if (props.showMessage) {
            Message.err(t("파일을 가져오지 못하였습니다."))
          } else console.log(e, "에러발생")
        })
    }
  )

  setDisableBtns()
}

const btnAttach = () => {
  if (saveParams.FILE_NO) {
    Message.err(t("이미 등록된 파일이 있습니다."))
    return
  }

  refVFileInput.value.click()
}

const btnFileUpload = async () => {
  if (saveParams.FILE_NO) {
    Message.err(t("이미 등록된 파일이 있습니다."))
    return
  }

  if (!saveFile.value) {
    Message.err(t("저장할 이미지가 없습니다."))
    return
  }

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
    formData.append("file", chunk, saveFile.value.name)
    formData.append(
      "param",
      new Blob([JSON.stringify(saveParams)], { type: "application/json" })
    )

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        // 전송 결과가 207이면 다음 파일 조각 전송
        if (res.result.status === "207") {
          currentChunk++
          if (currentChunk < totalChunks) {
            await sendNextFile()
          }
        } else if (res.result.status === "200") {
          // console.log('commonBigUploadFilesApi res', res)

          // 마지막 파일까지 전송 되면
          saveParams.FILE_NO = res.RES_FILE_NO
          saveParams.FILE_PATH = res.FILE_PATH
          saveParams.FILE_NAME = res.FILE_NAME
          Message.success(t("업로드 되었습니다."))
        }
      })
      .catch((e) => {
        // console.log('e', e)
        hasErr = true
      })
  }

  await sendNextFile()
  setDisableBtns()

  if (!hasErr) {
    emit("uploaded", saveParams)
  }
}

const btnDownLoad = () => {
  if (!saveParams.FILE_NO) {
    Message.err(t("다운로드할 이미지가 없습니다."))
    return false
  }

  commonDownloadFilesApi(saveParams)
    .then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)

      Message.success(t("다운로드 되었습니다."))
    })
    .catch((e) => {
      Message.err(t("파일을 가져오지 못하였습니다."))
    })
}

const btnDelete = () => {
  new deleteFlowHelper(vm, t)
    .setBefore(() => {
      if (!saveFile.value) {
        Message.err(t("삭제할 이미지가 없습니다."))
        return false
      }

      return true
    })
    .setQuery(() => {
      return commonDeletFilesApi([saveParams])
    })
    .setAfter(async () => {
      await btnSearch()
      emit("deleted", saveParams)
    })
    .run()
}

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await btnSearch()
  } else if (btn.id === "btnAttach") {
    await btnAttach()
  } else if (btn.id === "btnFileUpload") {
    await btnFileUpload()
  } else if (btn.id === "btnDownLoad") {
    await btnDownLoad()
  } else if (btn.id === "btnDelete") {
    await btnDelete()
  }
}

const selectFile = (e) => {
  if (e.length < 1) {
    return
  }

  if (saveParams.FILE_NO) {
    Message.err(t("이미 등록된 파일이 있습니다."))
    return
  }

  const file = e[0]
  const fType = file.name.split(".").pop().toUpperCase()
  const fUseType = fileTypes.split(",").map((item) => {
    return item.toUpperCase()
  })

  if (file.size >= props.maxFileSize * 1024 * 1024) {
    Message.err(
      props.maxFileSize +
        t("MB 이상 첨부파일은 등록 불가능 합니다.") +
        "<br>" +
        file.name
    )
    return
  } else if (!_.includes(fUseType, fType)) {
    const msg = props.imgOnly
      ? t("이미지만 업로드 가능합니다.")
      : t("사용할 수 없는 파일입니다.")
    Message.err(msg + "<br>" + file.name)
    return
  }

  new Compressor(file, {
    convertSize: 1000000, // 1MB
    quality: 0.8,
    success(result) {
      // console.log('file', file)
      // console.log('result', result)

      const blob = new Blob([result])
      imgUrl.value = URL.createObjectURL(blob)

      saveParams.CMPNY_DIV = userStore.cmpnyDiv
      saveParams.FILE_ID = guid.value
      saveParams.FILE_NO = ""
      saveParams.FILE_TITLE = result.name
      saveParams.FILE_NAME_ORIGINAL = result.name
      saveParams.FILE_NAME = result.name
      saveParams.FILE_PATH = `${commonStore.systemCode}${route.path}/`
      saveParams.FILE_TYPE = result.name.split(".").pop()
      saveParams.FILE_SIZE = Math.round(result.size / 1024.0)
      saveParams.USER_ID = userStore.userId
      saveParams.CHUNK_NUMBER = 0
      saveParams.TOTAL_CHUNKS = 0

      saveFile.value = result
      setDisableBtns()
      emit("selected", saveParams)
    },
  })
  // console.log('uploadFiles.value', uploadFiles)
}

const setDisable = (btns) => {
  props.buttonList.forEach((b) => {
    refIMenuTitle.value.disableBtn(b, _.includes(btns, b))
  })
}

onMounted(() => {})

defineExpose({
  onButtonsClick, // 파라미터: { id: 버튼 }
  guid,
  setGuid, // 파라미터: file id
  clearImg,
  setDisable, // 파라미터: 배열, ex) ['btnSearch', 'btnUpdate']
  saveFile,
})
</script>

<template>
  <VContainer class="h-full w-full pa-0">
    <IMenuTitle
      ref="refIMenuTitle"
      :button-list="props.buttonList"
      :title="$t(props.title)"
      @click-button="onButtonsClick"
      style="height: 31px"
    />
    <div class="pt-2" style="height: calc(100% - 31px)">
      <div class="div--imgwrap w-full h-full pa-2">
        <div
          class="div--img w-full h-full"
          :style="`background-image: url(${imgUrl});`"
        ></div>
      </div>
    </div>
    <VFileInput
      ref="refVFileInput"
      accept="image/*"
      @update:modelValue="selectFile"
      style="display: none"
    />
  </VContainer>
</template>

<style lang="scss" scoped>
.div--imgwrap {
  border: 1px solid #cccccc;
  border-radius: 7px;

  .div--img {
    background-size: contain;
    background-position: 50% 50%;
  }
}
</style>
