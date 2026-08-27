<!--
  화면명 : 단기공사 상세 정보 팝업
  화면개요 : 단기공사 상세 정보 팝업 (출입인원상세)
  최종수정일자: 2024-04-20
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import IUpload from "@/components/IUpload.vue"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'


const props = defineProps({
  editorId: {
    type: String,
    default: "ckEditors",
  },
})

onMounted(() => {
});

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t; //다국어

const fileUpload = ref(null)
const ckEditor = ref(null)
const toolbar = [""]

const noticeField = reactive({
  NOTICE_NO: "test2222333", //공지사항 번호
  NOTICE_TITLE: "", //공지사항 제목
  NOTICE_NOTE: "", //공지사항 내용
  NOTICE_PERIOD: "", //공지사항 기간
  NOTICE_FILE_ID: "", //공지사항 파일 아이디
  NOTICE_KOR_NM: "", //공지사항 작성자
  NOTICE_INSERT_DATE: "", //공지사항 작성일
  // NOTICE_NOTE: "", //내용
})


//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === "btnClose") {
    onClose()
  }
  
}


//컨트롤 초기화
const clearField = () => {
  // grdMain.value.getDataProvider().setRows(null)
  // options.values.BSNS_CD = ""
  // options.values.ASGN_NM = ""
}

//닫기
const onClose = () => {
  clearField()
  dialog.value = false
}

const parsingDate = (dt) => {
  let dateObj = new Date(dt)

  return dateObj.getUTCFullYear() + '-' + String(dateObj.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getUTCDate()).padStart(2, '0')
}

//오픈 팝업
const openPopup =  (popupParam) => {
  console.log("popupParam :: ", popupParam)

  /**************** popupParam Object로 넘겨주기 *****************/

  noticeField.NOTICE_NO = popupParam[0].NOTICE_NO
  noticeField.NOTICE_TITLE = popupParam[0].NOTICE_TITLE
  noticeField.NOTICE_NOTE = ''
  noticeField.NOTICE_PERIOD = popupParam[0].NOTICE_PERIOD
  noticeField.NOTICE_FILE_ID = popupParam[0].NOTICE_FILEID
  noticeField.NOTICE_KOR_NM = popupParam[0].NOTICE_AUTHOR
  noticeField.NOTICE_INSERT_DATE = parsingDate(popupParam[0].NOTICE_DATE)
  setTimeout(() => {
    console.log(popupParam[0].NOTICE_NOTE)
    console.log(ckEditor.value)
    ckEditor.value.setContent(popupParam[0].NOTICE_NOTE)
    console.log('noticeField.NOTICE_NOTE ', noticeField.NOTICE_NOTE)
  }, 100)
  //noticeField.NOTICE_NOTE = ckEditor2.value.setContent(popupParam[0].NOTICE_NOTE)
  searchFile(noticeField.NOTICE_FILE_ID)

  if (!popupParam) {
    dialog.value = true
    return
  }

  dialog.value = true 
}

const searchFile = (fileId) => {
  fileUpload.value.setGuid(fileId)
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}

defineExpose({
  openPopup,
})

</script>

<template>
  <v-dialog
    style="z-index: 2000;"
    v-model="dialog"
    eager
    persistent
    width="900"
    height="700"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet color="primarySub"
            height="50"
            class="px-4 d-flex align-center rounded-t-5 cursor-move"
            @mousedown="startDragging">
      <span>{{ noticeField.NOTICE_TITLE }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle :use-permission="false"
                  :button-list="['btnClose']"
                  @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text>
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <div class=" d-flex">
              <i-input
                v-model="noticeField.NOTICE_KOR_NM "
                :label="$t('작성자')"
                label-width="50px"
                width="200px"
              />
              <i-input 
                :label="$t('작성일')"
                v-model="noticeField.NOTICE_INSERT_DATE"
                type="date" 
                label-width="50px" 
                width="200px"
              /> 
              <i-input
                v-model="noticeField.NOTICE_PERIOD"
                :label="$t('게시기간')"
                label-width="50px"
                width="200px"
              />
            </div>
          </v-sheet>
          <v-sheet height="50%" class="mb-2">
            <CKEditor
              :id="props.editorId"
              ref="ckEditor"
              v-model="noticeField.NOTICE_NOTE"
            />
          </v-sheet>
          <!-- 하단 -->
          <IUpload
            ref="fileUpload"
            style="height: 250px"
            gridTitle="파일 다운로드"
            :button-list="['btnDownLoad']"
            :isVisibled="false"
          ></IUpload>
    
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>


<style scoped lang="scss">



</style>
