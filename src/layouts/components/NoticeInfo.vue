<script setup>
import IUpload from "@/components/IUpload.vue"
import ILabel from "@/components/ILabel.vue"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import CKViewer from "@/components/ckEditor/CKViewer.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import { onMounted } from "vue"

//변수선언부 시작
const props = defineProps({
  noticeInfoArray: {
    type: Object,
    default() {
      return {}
    },
  },
})
const dialog = ref(true)
const fileUpload = ref(null)
const ckEditor = ref("null")
const toolbar = [""]
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const button = ["btnDownLoad"]
const isVisibled = false
const showSearchMessage = false
const noticeField = reactive({
  NOTICE_NO: "", //공지사항 번호
  NOTICE_TITLE: "", //공지사항 제목
  NOTICE_NOTE: "", //공지사항 내용
  NOTICE_PERIOD: "", //공지사항 기간
  NOTICE_FILE_ID: "", //공지사항 파일 아이디
  NOTICE_KOR_NM: "", //공지사항 작성자
  NOTICE_INSERT_DATE: "", //공지사항 작성일
})

const searchPeriod = reactive([
  { TXT: "영구", COD: "A" },
  { TXT: "7일", COD: "7" },
  { TXT: "15일", COD: "15" },
  { TXT: "30일", COD: "30" },
  { TXT: "90일", COD: "90" },
])
const emit = defineEmits(["cookieCreate", "closePopup"])
//하루동안 이 창을 열지않음 옆 체크박스를 선택하고 닫기를 눌렀을때 true로 변경되고, true이면 emit을 발생시키고, 쿠키생성
const cookieFlag = ref("")
//변수선언부 끝

const closeNoticeInfo = () => {
  if (cookieFlag.value === "Y") {
    emit("cookieCreate", noticeField.NOTICE_NO.toString())
  }
  dialog.value = false
}

onMounted(() => {
  //ck에디터가 마운트 되기전에 값을 할당하려고 하기때문에, setTimeout으로 약간 지연시킴
  //setTimeout이 없으면 setData에서 에러발생함
  noticeField.NOTICE_NO = props.noticeInfoArray.NOTICE_NO
  noticeField.NOTICE_TITLE = props.noticeInfoArray.NOTICE_TITLE
  noticeField.NOTICE_KOR_NM = props.noticeInfoArray.KOR_NM
  noticeField.NOTICE_INSERT_DATE = props.noticeInfoArray.INSERT_DATE
  if (props.noticeInfoArray.NOTICE_PERIOD === "A") {
    noticeField.NOTICE_PERIOD = "영구"
  } else if (props.noticeInfoArray.NOTICE_PERIOD === "7") {
    noticeField.NOTICE_PERIOD = "7일"
  } else if (props.noticeInfoArray.NOTICE_PERIOD === "15") {
    noticeField.NOTICE_PERIOD = "15일"
  } else if (props.noticeInfoArray.NOTICE_PERIOD === "30") {
    noticeField.NOTICE_PERIOD = "30일"
  } else {
    noticeField.NOTICE_PERIOD = "90일"
  }

  setTimeout(() => {
    noticeField.NOTICE_NOTE = ckEditor.value.setContent(props.noticeInfoArray.NOTICE_NOTE)
  }, 100)
  searchFile(props.noticeInfoArray.NOTICE_FILEID)
  // //파일조회
  
})

const searchFile = (fileId) => {
  fileUpload.value.setGuid(fileId)
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}
</script>

<template>
  <VContainer class="pa-11 noticePopup" style="background: #fff">
    <section>
      <p class="text-textGrey2 f-16 w-700">NOTICE</p>
      <p class="text-textMain f-24 w-700 mT-10">{{ noticeField.NOTICE_TITLE }}</p>
      <v-sheet
        color="popupBg"
        class="mT-16 pY-12 pX-20 f-16 w-400 d-flex"
        style="gap: 40px">
        <div class="text-textGrey2">
          작성자<span class="text-textMain pL-10">{{ noticeField.NOTICE_KOR_NM }}</span>
        </div>
        <div class="text-textGrey2">
          작성일<span class="text-textMain pL-10">{{ noticeField.NOTICE_INSERT_DATE }}</span>
        </div>
        <div class="text-textGrey2">
          게시기간<span class="text-textMain pL-10">{{ noticeField.NOTICE_PERIOD }}</span>
        </div>
      </v-sheet>
    </section>
    <VRow>
      <VCol cols="12" md="12" class="pa-1 mt-3">
        <CKEditor
          ref="ckEditor"
          :id="props.noticeInfoArray.NOTICE_NO.toString()"
          v-model="noticeField.NOTICE_NOTE"
          :toolbar="toolbar"
          isReadOnly="true"
          isToolBar="false" 
          height="480px"    
        ></CKEditor>
      </VCol>
    </VRow>
    <!-- 하단 -->
    <VRow class="mt-5" v-show="false">
      <IUpload
        ref="fileUpload"
        style="height: 250px"
        gridTitle="파일 다운로드"
        :button-list="button"
        :isVisibled="isVisibled"        
      ></IUpload>
    </VRow>
  </VContainer>
</template>
