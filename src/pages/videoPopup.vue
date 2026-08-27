<!--
  화면명 : 동영상 플레이 팝업
  화면개요 : 동영상 플레이 팝업
  작성자 : 박성학 2024.07.12
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { useCommonStore } from "@hiway/stores/common"
import { commonSearchApi, commonRequest2 } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import { truncate } from "lodash-es"

const dialog = ref(false)
const t = useI18n().t //다국어
const videoUrl = ref(null)
const videoPlayer =  ref(null)
const clearYn = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const contextPath = window.location.protocol + '//' + window.location.host
const commonStore = useCommonStore()
const userStore = useUserStore()

const props = defineProps({
  id: {
    Type: String,
    default: "",
  },
  btnList: {
    Type: Array,
    default: ['btnClose']
  },
  isReadonly: {
    Type: String,
    default: "true"
  },
  isToolBar: {
    Type: String,
    default: "false"
  },
})

const emit = defineEmits(['closeVideoPopup'])

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs(new Date()).format('YYYY'),
  MNTH: dayjs(new Date()).format('MM'),
  EMP_NO: userStore.empNo,
  POINT_SEQ: '0',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NAME: userStore.asgnFullNm,
  EMP_NAME: userStore.empNm,
  ORGN_DIV: userStore.userDiv,
  ACCUMULATED_CONTENT_KEY: '',
  ACCUMULATED_CONTENT_CD: '30',
  ACCUMULATED_CONTENT_DETAIL: '영상교육자료(개인지급)',
  ACCUMULATED_DATE: '',
  ACCUMULATED_POINT: '',
  PAYMENT_DATE: '',
  CHANGE_POINT: '',
  CHANGE_DATE: '',
  CHANGE_USER_IP: '',
  REMAINING_POINT: '',
  CLOSE_DATE: '',
  REMARK: '',
  INSERT_USER_ID: userStore.empNo,
  INSERT_DATE: '',
  POINT: '',
})

const title = ref('')
const date =  ref('')
const content =  ref('')
const ckEditor = ref(null)
const toolbar = ref([])

const openPopup = async item => {
  dialog.value = true
  commonStore.loading = false
  let fiflePath = '', fileNm = ''
  
  // searchParam.ACCUMULATED_CONTENT_KEY = item.NOTICE_DIV + '_' + item.NOTICE_NO
  // searchParam.POINT = item.POINT
  // searchParam.PAYMENT_DATE = item.PAYMENT_DATE
  // console.log('openPopup searchParam', searchParam)
  title.value = item.NOTICE_TITLE
  date.value = item.INSERT_DATE
  content.value = item.NOTICE_NOTE

  fileNm = item.FILE_INFO.FILE_NAME
  fiflePath = item.FILE_INFO.FILE_PATH.replaceAll('\\','/')
  videoUrl.value = `${contextPath}/hse/image/loadVideoFile?FILE_PATH=` + fiflePath + '&FILE_NM=' + fileNm
}

const closePopup = () => {
  console.log('closepopup',clearYn.value)
  // if(!clearYn.value) {
  //   vm.$swal({
  //     title: t('재생중입니다. 종료하시겠습니까?'),
  //     showCancelButton: true,
  //   }).then((ck) => {
  //     if (ck.isConfirmed === true) {
  //       dialog.value = false
  //       videoUrl.value = null
  //       clearYn.value = false
  //     }
  //   })
  // } else {
  //   dialog.value = false
  //   videoUrl.value = null
  //   clearYn.value = false
  //   emit('closeVideoPopup')
  // }
  dialog.value = false
  videoUrl.value = null
  clearYn.value = false
}

const onButtonsClick = btn => {
  closePopup()
}

onMounted(() => {
  // videoPlayer.value.controlsList  = ["nodownload"]
  // videoPlayer.value.addEventListener("ended", event => {
  //   //재생완료 처리
  //   commonSearchApi({
  //     queryId: "MAINPAGE_SEARCH_05_01", 
  //     param: {
  //       CMPNY_DIV: searchParam.CMPNY_DIV,
  //       EMP_NO: searchParam.EMP_NO,
  //       CONTENT_KEY: searchParam.ACCUMULATED_CONTENT_KEY,
  //     },
  //   }).then( res => {
  //     console.log('MAINPAGE_SEARCH_05_01',res.ORESULT_CUR.length)
  //     if(res.ORESULT_CUR.length === 0) {
  //       commonSearchApi({
  //         queryId: "EDUDC0020_GET_PAYMENT_INFO_PC", 
  //         param: { 
  //           CMPNY_DIV: searchParam.CMPNY_DIV,
  //           EMP_NO: searchParam.EMP_NO,
  //           ACCUMULATED_CONTENT_CD: searchParam.ACCUMULATED_CONTENT_CD,
  //           POINT: searchParam.POINT,
  //         },
  //       }).then( res => {
  //         console.log('EDUDC0020_GET_PAYMENT_INFO_PC res',res)
  //         if (res.ORESULT_CUR[0].STOP_YN === 'Y') {
  //           Message.warn(t(`${searchParam.EMP_NAME}님은 지급 중단대상입니다.`))
        
  //           return
  //         } else {
  //           searchParam.ACCUMULATED_POINT = res.ORESULT_CUR[0].EARNABLE_POINT
  //           console.log('ended res',searchParam)
  //           commonSearchApi({ 
  //             queryId: "EDUDC0020_ADD_HDPAY", param: searchParam,
  //           }).then( res => {
  //             console.log('EDUDC0020_ADD_HDPAY res',res)
  //             Message.warn(t(`${searchParam.ACCUMULATED_POINT}P가 지급되었습니다.`))
  //             clearYn.value = true
  //             closePopup()
  //           })
  //         }
  //       })
  //     } else {
  //       clearYn.value = true
  //       Message.warn(t('중복 지급 이력이 있습니다. 포인트가 지급되지 않았습니다.'))
  //     }
      
  //   })

    
    
    // vm.$swal({
    //   title: t('미디어 재생이 완료되었습니다. 종료하시겠습니까?'),
    //   showCancelButton: true,
    // }).then((ck) => {
    //   if (ck.isConfirmed === true) {
    //     dialog.value = false
    //     videoUrl.value = null
    //     clearYn.value = false
    //   }
    // })
    
  // } ,false)

  // videoPlayer.value.addEventListener("ratechange", event => {
  //   //재생속도 변경 처리
  //   console.log("재생속도변경.", event)
  //   videoPlayer.value.playbackRate = 1
    
  // })

})

defineExpose({
  openPopup,
})
</script>

<template>
    <v-dialog
      v-model="dialog"
      eager
      persistent
      width="940"
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
            <span>{{ title }}</span>
        </v-sheet>
        <v-card class="pa-0 fill-height rounded-b-5">
            <v-card-title class="pa-4 pb-2">
                <IGridTitle
                ref="menuTitle"
                :use-permission="false"
                :button-list="props.btnList"
                @click-button="onButtonsClick"
                />
            </v-card-title>
            <v-card-text class="pa-4 pt-0 content-area">
              <p class="text-textCaption f-16 w-400 mb-3">
                등록일자 : {{ dayjs(date).format("YYYY.MM.DD") }}
              </p>
              <v-sheet class="mb-2">
                <CKEditor 
                  :id="props.id"
                  ref="ckEditor"
                  v-model="content"
                  is-tool-bar="false"
                  is-read-only="true"
                  :toolbar="toolbar"
                  :initial-value="content"
                  class="mb-3 f-100"
                />
              </v-sheet>
              <div class="d-flex flex-column fill-height">
                <v-sheet height="100%" class="mb-2">
                    <!-- 동영상 뷰어 -->
                    <video ref="videoPlayer" height="98%" width="100%" :src="videoUrl" type="video/*"
                        controls oncontextmenu="return false;">
                        <!-- nodownload -->
                    </video>
                </v-sheet>
              </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
video::-webkit-media-controls {
    // display: none !important;
}
video::-webkit-media-controls-timeline {
    // display: none !important;
}
video::-webkit-media-controls-download-button {
    // display: none !important;
}
video::-internal-media-controls-download-button {
    // display:none !important;
}
video::-webkit-media-controls-enclosure {
    // overflow:hidden !important;
}
video::-webkit-media-controls-panel {
//   width: calc(100% + 100px) !important;
    // display:none !important;
}
video::-webkit-media-controls-options-button {
    // display:none !important;
}
video::-webkit-media-controls-toggle-closed-captions-button {
    // display:none !important;
}
video::-webkit-media-controls-fullscreen-button {}
video::-webkit-media-controls-play-button { //플레이 버튼
  // display:none !important;
}
video::-webkit-media-controls-current-time-display{}
video::-webkit-media-controls-time-remaining-display {}
video::-webkit-media-controls-mute-button { //음소거 버튼
}
video::-webkit-media-controls-volume-slider {}
</style>