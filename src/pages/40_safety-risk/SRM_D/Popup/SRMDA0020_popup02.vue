<!-- 
  화면명   : S.O.M 등록/관리 팝업
  화면개요 : S.O.M 신규 등록 및 내용 수정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"



// defineOptions({
//   name: "40_safety-risk-SRM_C-SRMCA0010",
// })

const vm = getCurrentInstance().proxy // 다이얼로그관련
const userStore = useUserStore()      // 유저정보
const commonStore = useCommonStore()  // 공통
const route = useRoute()              // 라우터
const t = useI18n().t                 // 다국어

const emit = defineEmits(['updated'])
const dialog = ref(false)
const grdMain = ref(null)              // 사진 및 자료 첨부 그리드

// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

const dummy = ref(null)

// 관리자
const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)

// 팝업
const fileInput = ref(null)

// v-model
const searchParams = reactive({
  TASK_NO: '',
  SOLT_NO: '',
  SOLT_TITLE: '',
  SOLT_CONTENTS: '',
  SOLT_USER_ID: '',
  SOLT_USER_NM: '',
  SOLT_DT: '',
  SOLT_FILE_ID: '',
  SAFE_OPI: '',
  DEPT_NM: '',
  DEPT_CD: ''
})

const fileList = reactive({
  src: [],
  art: [],
  fileName: []
})


// 그리드 셋팅(사진 및 자료 첨부)
const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false }, checkBar: { visible: false }},
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'}},

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'number', visible: false }
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈
const openPopup = popupParam => {
  dialog.value = true

  for (let i in popupParam) {
    searchParams[i] = popupParam[i]
  }

  searchParams.SOLT_DT = dayjs(searchParams.SOLT_DT).format('YYYY-MM-DD')

  // 이미지 파일 세팅
  fileSet(searchParams.SOLT_FILE_ID)
}

// 팝업 닫기
const onClose = () => {
  dialog.value = false
}

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 저장
const saveData = () => {
  let saveParams = {}

  saveParams.TASK_NO = searchParams.TASK_NO
  saveParams.USER_ID = searchParams.SOLT_USER_ID
  saveParams.SOLT_NO = searchParams.SOLT_NO
  saveParams.SOLT_TITLE = searchParams.SOLT_TITLE
  saveParams.SOLT_CONTENTS = searchParams.SOLT_CONTENTS
  saveParams.SAFE_OPI = searchParams.SAFE_OPI

  console.log('sssssave', saveParams)

  vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMDA0020_SAVE_04', 
        list: [saveParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('저장 되었습니다.'))
          emit('updated', res.list[0].TASK_NO)
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        onClose()
      })
    }
  })
}

// 삭제
const deleteData = () => {
  let deleteParams = {
    TASK_NO: searchParams.TASK_NO,
    SOLT_NO: searchParams.SOLT_NO
  }

  vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMDA0020_DELETE_01', 
        list: [deleteParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
          emit('updated', res.list[0].TASK_NO)
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        onClose()
      })
    }
  })
}

const fileSet = data => {
  grdMain.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  commonSearchApi({
    queryId: "searchFile", 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: data
    } 
  }).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        fileList.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdMain.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV, 
        cnt: cnt
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName
        dummy.value = imageURL

      }).finally(() => {
        fileList.src[idx] = imageURL
        carousel.value++
        grdMain.value.getGridView().checkAll(false)
        grdMain.value.getGridView().resetCurrent()
      })
    })
  })
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange = async (grid, clickData) => {
  let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  carouselIdx.value = rowData.cnt - 1
}

onMounted(() => {})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-card class="pa-0 fill-height">
      <v-sheet
        color="primarySub"
        height="50"
        class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
      >
        <span>솔루션 제안 상세</span>
      </v-sheet>
      <v-sheet>
        <v-card-text class="pa-2 py-0 content-area">
          <div class="d-flex flex-column fill-height">
            <!-- 로그인한 User Id와 제안자가 같으면 수정,삭제 가능 그 외 조회만 가능 -->
            <IGridTitle
              v-if="isAdmin"
              ref="gridTitle"
              :button-list="['btnUpdate', 'btnDelete', 'btnClose']" 
              @click-button="onButtonsClick"
              class="mt-2"
            />
            <IGridTitle
              v-else-if="searchParams.SOLT_USER_ID === userStore.userId && !searchParams.PRIZE"
              ref="gridTitle"
              :button-list="['btnUpdate', 'btnDelete', 'btnClose']" 
              @click-button="onButtonsClick"
              class="mt-2"
            />
            <IGridTitle
              v-else
              ref="gridTitle"
              :button-list="['btnClose']" 
              @click-button="onButtonsClick"
              class="mt-2"
            />
            <v-sheet class="pa-0 mt-0">
              <div class="d-flex fill-height">
                <v-sheet width="60%">
                  <v-carousel 
                    hide-delimiters 
                    height="300px"
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
                      width="584"
                    />
                  </v-carousel>
                </v-sheet>
                <v-sheet class="h-auto ml-2">
                  <RealGrid
                    ref="grdMain"
                    class="border"
                    height="300px"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    @onCellClicked="imageChange"
                  />
                </v-sheet>
              </div>
            </v-sheet>
            <v-sheet class="searchArea flex-column mt-3">
              <div class="d-flex">
                <i-input
                  v-model="searchParams.SOLT_NO"
                  :label="$t('제안번호')"
                  width="150px"
                  topLabel
                  readonly
                />
                <i-input
                  v-model="searchParams.SOLT_DT"
                  :label="$t('제안일자')"
                  width="150px"
                  topLabel
                  readonly
                />
                <i-input
                  v-model="searchParams.DEPT_NM"
                  :label="$t('부서')"
                  width="150px"
                  topLabel
                  readonly
                />
                <i-input
                  v-model="searchParams.SOLT_USER_NM"
                  :label="$t('제안자')"
                  width="150px"
                  topLabel
                  readonly
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  v-model="searchParams.SOLT_TITLE"
                  :label="$t('제안명')"
                  width="490px"
                  topLabel
                  :readonly="isAdmin || searchParams.SOLT_USER_ID === userStore.userId ? (!searchParams.PRIZE ? false : true) : true"
                />
              </div>
              <div class="d-flex mt-2">
                <i-textarea 
                  v-model="searchParams.SOLT_CONTENTS"
                  :label="$t('제안 내용')"
                  width="490px" 
                  :row="3"
                  topLabel
                  :readonly="isAdmin || searchParams.SOLT_USER_ID === userStore.userId ? (!searchParams.PRIZE ? false : true) : true"
                />
              </div>
              <div class="d-flex mt-2">
                <i-textarea
                  v-model="searchParams.SAFE_OPI"
                  :label="$t('안전 의견')"
                  width="490px"
                  topLabel
                  :readonly="!isAdmin"
                  
                />
              </div>
            </v-sheet>
          </div>
        </v-card-text>
      </v-sheet>
    </v-card>
  </v-dialog>
</template>



