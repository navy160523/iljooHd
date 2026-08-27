<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick, onBeforeUpdate } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from '@/components/IUpload.vue'
import dayjs from 'dayjs'
import _ from 'lodash'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const isMain = ref(false)
const oneDayCookieCheckBoxValue = ref('N')
const threeDayCookieCheckBoxValue = ref('N')
const currNotice = ref(0)
const noticeData = ref([])
const fileUploads = ref([])
const currVue = ref('')
const ckEditor = ref(null)

const openPopup = param => {
  isMain.value = param.isMain
  noticeData.value = _.cloneDeep(param.list)

  for(let i = 0; i < noticeData.value.length; i++) {
    noticeData.value[i].fileUpload = null
  }
  // currVue.value = ''

  nextTick(() => {
    // console.log('isMain.value', isMain.value)
    // console.log('noticeData.value', noticeData.value)

    for(let i = 0; i < fileUploads.value.length; i++) {
      // console.log(`fileUploads.value[${i}]`, fileUploads.value[i])
      fileUploads.value[i].setGuid(noticeData.value[i].NOTICE_FILEID)
      fileUploads.value[i].onButtonsClick({ id: 'btnSearch' })
    }

    dialog.value = true
  })
}

const setCookie = () => {
  if(isMain.value === 'Y') {
    if (oneDayCookieCheckBoxValue.value === 'Y') {
      let date = new Date(Date.now() + 86400e3)
      let expireDate = 'expires=' + date.toUTCString() //쿠키만료시간 현재시각 + 1일
      let cookieName = 'NOTICE-EXPIRE-COOKIE' + '='
      let cookieValue = 'expire' + ';'
      document.cookie = cookieName + cookieValue + expireDate
    }

    if (threeDayCookieCheckBoxValue.value === 'Y') {
      let date = new Date(Date.now() + 86400e3 * 3)
      let expireDate = 'expires=' + date.toUTCString() //쿠키만료시간 현재시각 + 3일
      let cookieName = 'NOTICE-EXPIRE-COOKIE' + '='
      let cookieValue = 'expire' + ';'
      document.cookie = cookieName + cookieValue + expireDate
    }
  }
}

const btnClick = btn => {
  if(btn === 'close') {
    setCookie()
    init()
    dialog.value = false
  }
}

const init = () => {
  currNotice.value = 0
  oneDayCookieCheckBoxValue.value = 'N'
  threeDayCookieCheckBoxValue.value = 'N'
  currVue.value = ''
  isMain.value = false
  noticeData.value = []
  fileUploads.value = []
}

onMounted(() => {
  // console.log('yyyy', dayjs().format('YYYY'))
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
    width="1000px"
  >
    <v-card class="pt-10 pb-3 px-0 fill-height">
      <div class="px-12 pb-2">
        <p class="text-textGrey2 f-16 w-700">NOTICE</p>
      </div>
      <v-carousel class="popup-carousel px-11" v-model="currNotice" hide-delimiters :continuous="false" height="auto">
        <template v-slot:prev="{ props }">
          <v-btn width="36" height="36" color="transparent" style="margin-left: -56px;">
            <v-icon color="primary" size="x-large" icon="mdi-chevron-left" @click="props.onClick"></v-icon>
          </v-btn>
        </template>
        <template v-slot:next="{ props }">
          <v-btn width="36" height="36" color="transparent" style="margin-right: -56px;">
            <v-icon color="primary" size="x-large" icon="mdi-chevron-right" @click="props.onClick"></v-icon>
          </v-btn>
        </template>
        <v-carousel-item v-for="(notice, idx) in noticeData" :key="`notice_${idx}`" cover eager>
          <v-card-title class="pa-0">
            <p class="f-24 w-700">{{ notice.NOTICE_TITLE }}</p>
            <v-sheet
              class="searchArea mT-16 pY-12 pX-20 f-16 w-400 d-flex"
              style="gap: 40px"
            >
              <div class="text-textGrey2">
                작성자<span class="text-textMain pL-10">{{ notice.NOTICE_KOR_NM }}</span>
              </div>
              <div class="text-textGrey2">
                작성일<span class="text-textMain pL-10">{{ notice.NOTICE_INSERT_DATE }}</span>
              </div>
              <div class="text-textGrey2">
                게시기간<span class="text-textMain pL-10">{{ notice.NOTICE_PERIOD }}</span>
              </div>
            </v-sheet>
          </v-card-title>
          <v-card-text class="pl-0 pr-2 py-0 content-area overflow-y-auto" style="max-height: 550px;">
            <v-sheet class="d-flex flex-column fill-height">
              <CKEditor
                ref="ckEditor"
                :id="notice.NOTICE_NO.toString()"
                :initialValue="notice.NOTICE_NOTE"
                :toolbar="[]"
                isReadOnly="true"
                isToolBar="false" 
                height="450px"
              />
              <div>
                <div class="mt-3 mb-1 d-flex align-center justify-space-between">
                  <div class="gridTitle">
                    파일 다운로드
                  </div>
                  <div style="color: #0000ff;">
                    ※ 더블 클릭 시 다운로드됩니다.
                  </div>
                </div>
                <div class="ma-n2">
                  <IUpload
                    :ref="el => fileUploads[idx] = (el)"
                    style="height: 200px"
                    grid-only      
                  />
                </div>
              </div>
            </v-sheet>
          </v-card-text>
        </v-carousel-item>
      </v-carousel>
    </v-card>
    <div class="title-bar d-flex justify-space-between align-center">
      <div class="d-flex">
        <v-checkbox
          v-show="isMain === 'Y'"
          true-value="Y"
          false-value="N"
          small
          v-model="oneDayCookieCheckBoxValue"
          label="하루동안 이 창을 열지 않음"
        />
        <v-checkbox
          v-show="isMain === 'Y'"
          true-value="Y"
          false-value="N"
          small
          v-model="threeDayCookieCheckBoxValue"
          label="3일 동안 이 창을 열지 않음"
          class="ml-4"
        />
      </div>
      <v-btn @click.stop="btnClick('close')">
        닫기
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </div>
  </v-dialog>
</template>

<style lang="scss" scoped>
.title-bar {
  border-radius: 0 0 6px 6px;
}

.v-card {
  border-radius: 6px 6px 0 0 !important;
}

::v-deep(.v-checkbox) {
  .v-label {
    color: #ffffff !important;
  }
}
</style>