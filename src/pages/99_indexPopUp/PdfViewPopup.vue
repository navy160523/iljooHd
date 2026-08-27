
<!--
  화면명 : 매뉴얼 보기
  화면개요 : 각 화면에 해당되는 매뉴얼을 보여준다
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from 'dayjs'
import {
  commonSearchApi,
  commonExecuteApi,
} from "@hiway/api/commonApi"
import {
  commonDownloadFilesApi,
} from "@hiway/api/commonFileApi"
import { useI18n } from "vue-i18n"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging, } from "@/utils/useDrag.js"
import _ from "lodash"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const pdfViewPopup = ref(null)
const imgUrlTemp1 = ref([])
const logsStore = useLogsStore()
// const buttonList = "['btnCreate','btnDelete','btnDownLoad']"
const title = ref('매뉴얼 보기')
const files1 = ref({})

const props = defineProps({
  buttonList: {
    Type: Array,
    default: [],
  },
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: 'DATCA0070',
  PATH: ''
})

// 팝업 오픈 함수
const openPopup =  params => {
  pdfViewPopup.value = true
  title.value = '매뉴얼 보기'
  // pdf 초기화
  imgUrlTemp1.value = []
  searchParams.PATH = params
  files1.value = {}
  commonSearchApi({ queryId : 'DATCA0070_SEARCH_04', param: searchParams }).then( res => {
    if(res.ORESULT_CUR.length <= 0) return Message.err(t('해당화면에는 매뉴얼이 없습니다.'))
    files1.value = res.ORESULT_CUR[0]
    commonDown(res.ORESULT_CUR[0])
  }).finally(() => {
  })
}

// 팝업 오픈 함수
const openMSDSPopup =  (params, queryId) => {
  pdfViewPopup.value = true

  title.value = 'MSDS 보기'
  // pdf 초기화
  imgUrlTemp1.value = []
  searchParams.PATH = params
  files1.value = {}
  commonSearchApi({ queryId : queryId, param: params }).then( res => {
    if(res.ORESULT_CUR.length <= 0) return Message.err(t('해당화면에는 매뉴얼이 없습니다.'))
    files1.value = res.ORESULT_CUR[0]
    // commonDown(res.ORESULT_CUR[0])
    imgUrlTemp1.value.push('https://hises.hd.com/HiSEsFiles/' +
      res.ORESULT_CUR[0].FILE_PATH.replaceAll(/\\/g, '/') +
      res.ORESULT_CUR[0].FILE_NAME
    )
  }).finally(() => {
  })
}

const openPopupUrl = (url) => {
  pdfViewPopup.value = true
  title.value = 'pdf 보기'
  // pdf 초기화
  imgUrlTemp1.value = []
  files1.value = {}

  imgUrlTemp1.value.push(url)
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnClose") {
    onClose()
  } else if(btn.id === "btnDownLoad") { 
    if(files1.value == null || files1.value == {}) return Message.err(t('해당화면에는 매뉴얼이 없습니다.'))
    pdfDownload()
  }
}

const pdfDownload = async () => {
  await commonDownloadFilesApi(files1.value)
  .then((res) => {
    const file = res.contentDisposition.split('fileName="')
    const blob = new Blob([res])
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = decodeURI(file[1].replace('";', ""))
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

const onClose = () => {
  imgUrlTemp1.value = []
  pdfViewPopup.value = false
}

const commonDown = async file => {
  if(file.FILE_ID === '' || file.FILE_ID === ' '){
    return false
  }
  await commonDownloadFilesApi(file)
    .then((res)=>{
      const blob = new Blob([res], { type: 'application/pdf' })
      const imageURL = URL.createObjectURL(blob)
      imgUrlTemp1.value.push(imageURL)
    })
}

defineExpose({
  openPopup,
  openMSDSPopup,
  openPopupUrl
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="pdfViewPopup"
    eager
    persistent
    width="1200"
    height="950"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
  <!-- 헤더 -->
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
    >
      <span>{{ title }}</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          :use-permission="false"
          :button-list="['btnDownLoad','btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">

          <!-- pdf 미리보기 -->
          <v-sheet class="mt-4 h-auto">
            <div class="d-flex mt-4 fill-height">
              <!-- 안전보건환경 방침 -->
              <v-sheet class="mr-2 h-auto">
                <iframe :src="imgUrlTemp1[0]" class="object-fit-cover h-auto" />
              </v-sheet>
            </div>
          </v-sheet>
     
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.object-fit-cover {
  object-fit: cover;
}
</style>