<!--
  화면명 : 건강관리 대상자 현황 오류신고 및 개선 의뢰
  화면개요 : 건강관리 대상자 현황 오류신고 및 개선 의뢰
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import CkEditor from '@/components/ckEditor/CKEditor.vue'

const emit = defineEmits(['after-search', 'send-notify'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const editor = ref(null)
const content = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  VEND_NAME: '',
  EMP_NM: userStore.userName,
  TEL_NO: '',
  RCV_EMAIL: '',
  TITLE: `${dayjs().format('YYYYMMDD')}_HiSEs 협력사 건강관리대상자 현황 메뉴 오류 신고 및 개선의뢰`,
  MSG: '',
  SUCCESS_YN: true,
  SEND_DATE: dayjs().format('YYYY-MM-DD')
})

const editorOptions = reactive({
  components: {
    CkEditor,
  },
  editorOptions: {
    id: 'test-ck-editor',
    data: '',
    height: '400px',
    lang: 'ko',
  },
})

// 팝업 OPEN
const openPopup = (param) => {
  searchParams.EMP_NM = param.EMP_NM
  searchParams.VEND_NAME = param.VEND_NAME
  searchParams.TEL_NO = ''

  let content = `
  <div style="font-weight:bold; font-size:22px;">
    오류 신고 및 개선 의뢰 내용을 아래에 자유롭게 작성해주시기 바랍니다.
  </div>
  <div style="font-weight:bold; font-size:22px;">
     * 메뉴 관리자: 안전보건지원부 임은희 책임 T. 2-5407
  </div>
  `
  editor.value.setContent(content)
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendMail') {
    if(isEmpty(searchParams.TITLE)) {
      return Message.warn(t('제목을 입력 바랍니다.'))
    } else if (isEmpty(editor.value.getContent())) {
      return Message.warn(t('내용을 입력 바랍니다.'))
    } else if (isEmpty(searchParams.TEL_NO)) {
      return Message.warn(t('회신연락처 입력 바랍니다.'))
    }
    vm.$swal({
      title: t('메일 전송하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonSearchApi({ queryId: 'HLTKC0010_SEARCH_04', param: searchParams }).then(res => {
          searchParams.MSG = editor.value.getContent()
          for(let result of res.ORESULT_CUR) {
            if(isEmpty(result.EMAIL)) {
              continue
            }
            let mailParam = {
              EMAIL: [result.EMAIL],
              REFERER: [],
              SUBJECT: searchParams.TITLE,
              CONTENT: `<div>발신 : ${searchParams.VEND_NAME} / ${searchParams.EMP_NM} (${searchParams.TEL_NO}) </div><br/> ${editor.value.getContent()}`
            }
              
            commonSendApi(mailParam).then((res) => {
              if(res.result.status == '200') {
                searchParams.SUCCESS_YN = true
              } else {
                searchParams.SUCCESS_YN = false
              }
              searchParams.RCV_EMAIL = result.EMAIL
              commonExecuteApi({ queryId : 'HLTKC0010_SAVE_04', list: [searchParams] })
            })
          }
          Message.success(t(`${res.ORESULT_CUR.length}건 메일발송이 완료되었습니다.`))
          closePopup()
        })
      }  
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="800"
    height="800"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>오류신고 및 개선 건의</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSendMail', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <i-input
            v-model="searchParams.TITLE"
            width="700px"
            :label="$t('제목')"
            label-width="50px"
          />
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.SEND_DATE"
              label-width="50px"
              :label="$t('발송일자')"
              width="180px"
              type="date"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.TEL_NO"
              width="180px"
              :label="$t('회신연락처')"
              label-width="70px"
            />
          </div>
        </v-sheet>
      </div>
      <div ref="content" class="pa-4 pt-0">
        <ck-editor
          ref="editor"
          :id="editorOptions.editorOptions.id"
          :initialValue="editorOptions.editorOptions.data"
          :lang="editorOptions.editorOptions.lang"
          :height="editorOptions.editorOptions.height"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
</style>
