<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import {
  commonBigUploadFilesApi
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

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

const props = defineProps({
  buttonList: {
    type: Array,
    default() {
      return ['btnFileUpload']
    },
  },
  isVisibled: {
    type: Boolean,
    default: false,
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
    default: '60%',
  },
  height: {
    type: String,
    default: '780',
  },
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()
const guid = ref('')
const emit = defineEmits([
  'selected',
  'uploaded'
])
const cntVal = ref(0)
const menuTitle = ref(null)

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

const onButtonsClick = (btn) => {
  if (btn.id === 'btnFileUpload') {
    fileInput.value.click()
  }
}

// 팝업 닫기
// const onClose = () => {
//   dialog.value = false
// }

// 파일ID 지정
const setGuid = (val) => {
  console.log(val)
  if (val) {
    guid.value = val
  } else {
    guid.value = create_UUID()
  }
  searchParams.FILE_ID = guid.value
}

// 파일 추가
const handleFileInput = async (el) => {
  const files = Array.from(el.target.files); // 선택한 파일들을 배열로 변환
  const resultArr = [];
  fileData.value = [];
  for (const file of files) {
    // PDF 파일 여부 확인
    if (file.type === "application/pdf") {
      resultArr.push(file);
    } else {
      Message.err(t("PDF 파일만 업로드 가능합니다."));
      return;
    }
  }

  // 파일 개수 제한 검사
  if (resultArr.length > props.cnt) {
    Message.err(t(`최대 ${props.cnt}개의 파일만 업로드 가능합니다.`));
    return;
  }
  
  fileData.value = resultArr; // PDF 파일 배열 업데이트
  console.log(fileData.value)
  fileUpload(); // 파일 업로드 로직 호출
};

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

watch(
  () => searchParams.FILE_ID,
  (newValue) => {
    if (newValue) {
      fileSet(); // FILE_ID가 설정된 후 호출
    }
  }
);

// Grid, Carousel Setting
const fileSet = () => {
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  console.log(searchParams.FILE_ID)
  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: searchParams.FILE_ID,
    },
  }).then(async (res) => {
    await res.ORESULT_CUR.forEach((e) => {
      let type = e.FILE_TYPE.toUpperCase()
      console.log(e)
      if (
        type === 'PDF' 
      ) {
        cnt++
        fileList.fileName.push(e)
        console.log(e)
      } 
    })
    console.log(fileList)

    fileList.fileName.forEach((e, idx) => {
      let fileUrl = e.FILE_PATH; // 파일 URL
      loadPdf(fileUrl);  // PDF를 이미지로 변환하여 src에 추가
    });
  })
}
const loadPdf = async (pdfUrl) => {
  console.log(pdfUrl)
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const canvas = document.createElement('canvas');
  console.log(canvas)
  const context = canvas.getContext('2d');
  const viewport = pdf.getPage(1).getViewport({ scale: 1 });
  console.log(pdf)

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const page = await pdf.getPage(1);  // 첫 번째 페이지만 변환 (전체 페이지로 확장 가능)
  await page.render({ canvasContext: context, viewport }).promise;

  const imageUrl = canvas.toDataURL();  // 캔버스를 이미지 URL로 변환
  console.log(imageUrl)
  fileList.src.push(imageUrl);  // 변환된 이미지를 src 배열에 추가
};

//2024.07.02 김현재 작성 컴포넌트 초기화함수
//그리드와 이미지뷰어를 초기화한다.
const clearGrid = () => {
  fileList.src = [];
  fileList.fileName = [];
  searchParams.FILE_ID = '';
};

defineExpose({
  setGuid,
  guid,
  onButtonsClick,
  clearGrid,
})
//초기 데이터셋팅
onMounted(() => {})
</script>

<template>
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
              height="100%"
            />
          </v-carousel>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
