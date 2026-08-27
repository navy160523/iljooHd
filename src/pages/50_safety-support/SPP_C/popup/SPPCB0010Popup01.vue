<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import OZReport from '@/components/OZReport.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

const emit = defineEmits(['selected', 'closePopup'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const commonStore = useCommonStore()
const searchArea = ref(null)
const t = useI18n().t //다국어
const route = useRoute()

const dialog = ref(false) 

// 팝업
const deptPopup = ref(null)
const fileUploadPopup = ref(null)

// 리포트
const reportName = ref("/manage/hse/SPPCB0010.ozr")
const params = ref([])
const showOz = ref(false)

const beforeFile = ref('')
const afterFile = ref('')

// 캐러셀
const beforCarousel = ref(0)
const beforCarouselIdx = ref(0)

const afterCarousel = ref(0)
const afterCarouselIdx = ref(0)

// 파일 리스트
const beforFileList = ref({
  src: [], 
  art: [],
  fileName: []
})

const afterFileList = ref({
  src: [], 
  art: [],
  fileName: []
})

const dummy = ref(null)

// 권한
const isAdmin = ref(userStore.deptCd === 'N1K0' || userStore.userId === 'BP21926' ? true : false) // 관리자(안전보건지원부 전원)
const isExecutive = ref(userStore.offiResCd.includes('15', '62', '16') ? true : false)  // 부서장, 운영과장

// 조회조건
const searchParams = reactive({
  TASK_SEQ: '',
	CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  HALF: '',
  AGENDA_ITEM: '',
  PROPOSER : '',
  CONTENT: '',
  STATUS: '',
  REVIEW_DEPT_CD: '',
  REVIEW_DEPT_NM: '',
  REVIEW_OPIN: '',
  CONSULTATION_RESULT: '',
  ACTION_RESULT: '',
  PROGRES_STATUS: '',
  REG_DT: dayjs().format('YYYY-DD-MM'),
  LOCATION: '',
  PROGRESS: '',
  PROGRESS: '',
  FILE_ID: '',
  BEFOR_FILE_ID: '',
  AFTER_FILE_ID: '',
  TEMP_YN: '',
  FINAL_CHECK: '',
  FILE_COUNT: '',
})

const codeList = reactive({
  PROGRES_STATUS: [
    { COD: 'A', TXT: '진행전' },
    { COD: 'B', TXT: '진행중' },
    { COD: 'C', TXT: '조치완료' },
  ]
})

// 팝업 오픈
const openPopup = async val => {
  searchParams.TASK_SEQ = val.TASK_SEQ

  await searchData()

  dialog.value = true
  
  // 테스트
  if (userStore.empNo === 'BP22733') {
    isAdmin.value = true
  }
}

//초기 데이터셋팅
onMounted(() => {
  window.addEventListener('mousemove', mouseUpdate)
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnPrint') {
    showOz.value = true

    params.value = [
      "IN_TASK_SEQ=" + searchParams.TASK_SEQ,
    ]
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 개선전 버튼 이벤트
const beforeButtonsClick = btn => {
  if (btn.id === 'btnFileUpload') {
    beforeFile.value.click()
  } else if (btn.id === 'btnDownLoad') {
    downLoad(1)
  } else if (btn.id === 'btnDelete') {
    deleteData(1)
  }
}

// 개선후 버튼 이벤트
const afterButtonsClick = btn => {
  if (btn.id === 'btnFileUpload') {
    afterFile.value.click()
  } else if (btn.id === 'btnDownLoad') {
    downLoad(2)
  } else if (btn.id === 'btnDelete') {
    deleteData(2)
  }
}

// 조회
const searchData = async () => {
  // 관리자, 부서장, 안전보건지원부-안전지원과는 전체 조회가능, 일반 사용자는 본인 부서만 조회 가능
  if (isAdmin.value || userStore.asgnCd === 'N096') {
    searchParams.REVIEW_DEPT_CD = ''
  } else {
    searchParams.REVIEW_DEPT_CD = userStore.deptCd
  }

  await commonSearchApi({
    queryId : 'SPPCB0010_POPUP_SEARCH_01', 
    param : { TASK_SEQ: searchParams.TASK_SEQ }
  }).then(async res => {
    if (res.ORESULT_CUR[0].length !== 0) {
      for (let i in res.ORESULT_CUR[0]) {
        searchParams[i] = res.ORESULT_CUR[0][i]
      }
    }

    await fileSet(1)
    await fileSet(2)
  })
}

// 저장
const saveData = async () => {
  let saveParams = {...searchParams}
  saveParams.REG_DT = saveParams.REG_DT.replaceAll('-', '')

  commonExecuteApi({
    queryId: 'SPPCB0010_POPUP_SAVE_01',
    list: [saveParams]
  }).then(res => {
    if (res.result.status === '200') {
      Message.success(t('저장 되었습니다.'))
    }
  }).catch(err => {
    return Message.err(err) 
  })
}

// 삭제
const deleteData = num => {
  let deleteParams = num === 1 ? beforFileList.value.fileName[beforCarouselIdx.value] : afterFileList.value.fileName[afterCarouselIdx.value]

  vm.$swal({ 
    title: t('삭제하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonDeletFilesApi([deleteParams]).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        searchData()
      })
    }
  })
}

// 다운로드
const downLoad = num => {
  const data = num === 1 ? beforFileList.value.fileName[beforCarouselIdx.value] : afterFileList.value.fileName[afterCarouselIdx.value]

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

// 닫기
const onClose = () => {
  // 초기화
  for (let i in searchParams) {
    searchParams[i] = ''
  }

  beforFileList.value = {}
  afterFileList.value = {}

  dialog.value = false
}

// 파일 추가
const handleFileInput01 = (el) => {
  let file = el.target.files[0]

  if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
    return Message.warn(t('이미지 파일만 업로드 할 수 있습니다.'))
  } else {
    fileUpload(file, 1)
  }
}
const handleFileInput02 = (el) => {
  let file = el.target.files[0]

  if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
    return Message.warn(t('이미지 파일만 업로드 할 수 있습니다.'))
  } else {
    fileUpload(file, 2)
  }
}

// 파일 업로드
const fileUpload = async (val, num) => {
  if (num === 1) {
    searchParams.BEFOR_FILE_ID = searchParams.BEFOR_FILE_ID ? searchParams.BEFOR_FILE_ID : create_UUID()
  } else {
    searchParams.AFTER_FILE_ID = searchParams.AFTER_FILE_ID ? searchParams.AFTER_FILE_ID : create_UUID()
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
    FILE_ID: num === 1 ? searchParams.BEFOR_FILE_ID : searchParams.AFTER_FILE_ID,
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
      await fileSet(num)
    }
  }).catch(err => {
    return Message.err(err)
  })
}

const fileSet = async (num) => {
  let fileList = {}

  fileList.src = []
  fileList.fileName = []
  fileList.file = []

  let cnt = 0

  await commonSearchApi({
    queryId: "searchFile", 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: num === 1 ? searchParams.BEFOR_FILE_ID : searchParams.AFTER_FILE_ID
    } 
  }).then(async res => {
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      let type = res.ORESULT_CUR[i].FILE_TYPE.toUpperCase()
      let isGbn = true

      if (type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        isGbn = true
        fileList.fileName.push(res.ORESULT_CUR[i])
      } else {
        isGbn = false
      }
    }

    for (let j = 0; j < fileList.fileName.length; j++) {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성
      let file = null
      let fileType = null

      await commonDownloadFilesApi(fileList.fileName[j]).then(async res2 => {
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

        fileList.src[j] = imageURL
        fileList.file[j] = file

        if (num === 1) {
          beforFileList.value = {...fileList}
          beforCarousel.value++
        } else {
          afterFileList.value = {...fileList}
          afterCarousel.value++
        }
      })
    }
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

// 이미지 클릭 이벤트
const changeBeforImg = (idx) => {
  beforCarouselIdx.value = idx
}

const changeAfterImg = (idx) => {
  afterCarouselIdx.value = idx
}

// 검토부서 선택
const onSelectReviewDept = () => {
  deptPopup.value.openPopup()
}

const selectedReviewDept = val => {
  searchParams.REVIEW_DEPT_CD = val.ASGN_CD
  searchParams.REVIEW_DEPT_NM = val.ASGN_SHRT_NM
}

// 보충자료 업로드
const suppleFileUpload = () => {
  fileUploadPopup.value.openPopup(searchParams.FILE_ID) 
}

const uploaded = async val => {
  searchParams.FILE_ID = val.fileId
}

// function Expose
defineExpose({ openPopup })

// mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  let gapx = event.pageX-x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    width="1200"
    height="900"
    class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >

  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>안건관리 등록/수정</span>
  </v-sheet>
  <v-card class="pa-3 fill-height rounded-b-5">
    <v-card-title class="pa-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="isAdmin || isExecutive ? ['btnUpdate', 'btnPrint', 'btnClose'] : ['btnPrint', 'btnClose']"
        @click-button="onButtonsClick"
        :hiddenManuel="true"
      />
    </v-card-title>
    <v-card_text class="pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="60px"
              width="175px"
              readonly
              bgColor="#EEEEEE"
            />
            <i-input
              v-model="searchParams.HALF"
              :label="$t('분기')"
              label-width="60px"
              width="175px"
              readonly
              bgColor="#EEEEEE"
            />
            <i-textarea
              v-model="searchParams.AGENDA_ITEM"
              :label="$t('상정안건 항목')"
              width="450px"
              readonly
              :no-resize="false"
              :row="1"
              bgColor="#EEEEEE"
              class="d-flex" 
            />
            <i-select
              v-model="searchParams.FINAL_CHECK"
              :label="$t('안전최종확인')"
              width="270px"
              :items="codeList.PROGRES_STATUS"
              item-value="COD"
              item-title="TXT"
              :bgColor="isAdmin ? '' : '#EEEEEE'"
              :readonly="!isAdmin"
            />
          </div>
          <div class="d-flex mt-2">
            <i-textarea
              v-model="searchParams.CONTENT"
              :label="$t('안건 내용')"
              label-width="60px"
              width="370px"
              readonly
              :no-resize="true"
              :row="2"
              bgColor="#EEEEEE"
              class="d-flex"
            />
            <i-textarea
              v-model="searchParams.CONSULTATION_RESULT"
              :label="$t('협의결과')"
              label-width="75px" 
              width="450px"
              readonly
              :no-resize="false"
              :row="2"
              bgColor="#EEEEEE"
              class="d-flex"
            />
            <i-input
              v-model="searchParams.FILE_COUNT"
              :label="$t('보충자료')"
              width="270px"
              label-width="70px"
              readonly
              bgColor="#EEEEEE"
              append-inner-icon="mdi-magnify"
              @click:appendInner="suppleFileUpload"
            />
          </div>
          <div class="d-flex mt-2">
            <i-textarea 
              v-model="searchParams.REVIEW_OPIN"
              :label="$t('검토의견')"
              label-width="60px"
              width="840px"
              readonly
              :no-resize="false"
              :row="2"
              bgColor="#EEEEEE"
              class="d-flex"
            />
          </div>
        </v-sheet>
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input
              :label="$t('등록일자')"
              v-model="searchParams.REG_DT"
              label-width="60px"
              width="250px"
              type="date"
              :readonly="!isAdmin || isExecutive"
              />
            <i-select
              v-model="searchParams.PROGRES_STATUS"
              :label="$t('진행상태')"
              label-width="60px" 
              width="300px"
              :items="codeList.PROGRES_STATUS"
              item-value="COD"
              item-title="TXT"
              :readonly="!isAdmin || isExecutive"
              />
            <i-input 
              :label="$t('검토부서')"
              v-model="searchParams.REVIEW_DEPT_NM"
              label-width="60px"
              width="300px"
              :append-inner-icon="isAdmin || isExecutive ? 'mdi-magnify' : ''"
              @click:appendInner="onSelectReviewDept"
              readonly
              />
          </div>
          <div class="d-flex mt-2">
            <i-textarea
              :label="$t('조치결과')"
              v-model="searchParams.ACTION_RESULT"
              type="text"
              label-width="60px"
              width="890px"
              :readonly="!isAdmin || isExecutive"
              />
          </div>
        </v-sheet>
        <div class="d-flex mt-0">
          <v-sheet width="100%" class="d-flex">
            <v-sheet width="50%" class="pa-0 pr-1">
              <v-sheet width="100%" class="pa-2 border-sm rounded">
                <IGridTitle
                  ref="menuTitle"
                  :button-list="isAdmin ? ['btnFileUpload', 'btnDownLoad', 'btnDelete'] : ['btnDownLoad']"
                  :title="$t('개선 전 사진')"
                  @click-button="beforeButtonsClick"
                />
                <div class="d-none">
                  <v-file-input
                    ref="beforeFile"
                    :label="$t('여기에 파일을 끌어놓으세요.')"
                    @change="handleFileInput01"
                  /> 
                </div>
                <div class="mt-0 pa-0 d-flex searchArea">
                  <v-slide-group show-arrows>
                    <v-slide-group-item
                      v-for="(item, idx) in beforFileList.src"
                      :key="idx"
                    >
                      <v-img
                        :src="item"
                        width="100"
                        height="70"
                        class="px-0 py-2"
                        @click="changeBeforImg(idx)"
                      />
                    </v-slide-group-item>
                  </v-slide-group>
                </div>
                <div class="mt-0">
                  <v-carousel 
                    hide-delimiters 
                    height="300px"
                    class="border"
                    show-arrows="hover"
                    hide-delimiter-background
                    :key="beforCarousel"
                    v-model="beforCarouselIdx"
                  >
                    <v-carousel-item 
                      v-for="(item, i) in beforFileList.src"
                      :key="i"
                      :src="item"
                      width="100%"
                    />
                  </v-carousel>
                </div>
              </v-sheet>
            </v-sheet>
            <v-sheet width="50%" class="pa-0 pl-1">
              <v-sheet width="100%" class="pa-2 border-sm rounded">
                <IGridTitle
                  ref="menuTitle"
                  :button-list="isAdmin ? ['btnFileUpload', 'btnDownLoad', 'btnDelete'] : ['btnDownLoad']"
                  :title="$t('개선 후 사진')"
                  @click-button="afterButtonsClick"
                />
                <div class="d-none">
                  <v-file-input
                    ref="afterFile"
                    :label="$t('여기에 파일을 끌어놓으세요.')"
                    @change="handleFileInput02"
                  /> 
                </div>
                <div class="mt-0 pa-0 d-flex searchArea">
                  <v-slide-group show-arrows>
                    <v-slide-group-item
                      v-for="(item, idx) in afterFileList.src"
                      :key="idx"
                    >
                      <v-img
                        :src="item"
                        width="100"
                        height="70"
                        class="px-0 py-2"
                        @click="changeAfterImg(idx)"
                      />
                    </v-slide-group-item>
                  </v-slide-group>
                </div>
                <div class="mt-0">
                  <v-carousel 
                    hide-delimiters 
                    height="300px"
                    class="border"
                    show-arrows="hover"
                    hide-delimiter-background
                    :key="afterCarousel"
                    v-model="afterCarouselIdx"
                  >
                    <v-carousel-item 
                      v-for="(item, i) in afterFileList.src"
                      :key="i"
                      :src="item"
                      width="100%"
                    />
                  </v-carousel>
                </div>
              </v-sheet>
            </v-sheet>
          </v-sheet>
        </div>
      </div>
    </v-card_text>

    <!-- OZReport -->
    <OZReport 
      :showPop="showOz" 
      :reportName="reportName" 
      :params="params" 
      @close="showOz = $event" 
    />

    <!-- 검토부서 선택 -->
    <DeptPopup ref="deptPopup" @selected="selectedReviewDept"/>

    <!-- UPLOAD 팝업 -->
    <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded" 
      :buttonList="isAdmin ? ['btnUpload', 'btnDownLoad', 'btnDelete', 'btnClose'] : ['btnDownLoad', 'btnClose']"
      :autoUpload="true"
      :isVisibled="isAdmin ? true : false"
    />

  </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
// .content-area {
//   position: relative;
//   height: calc(100vh - (205px - 12px));
//   overflow-y: auto;
// }
// .draggable-dialog {
//   position: absolute;
//   user-select: none;
// }
</style>