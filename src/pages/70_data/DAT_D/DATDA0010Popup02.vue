<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonRequest, commonSendSMS, commonSendApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import { chkEmpty } from '@/utils/common'
import sha256 from 'crypto-js/sha256'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from '@/components/IUpload.vue'
import dayjs from 'dayjs'

const props = defineProps({
  ckEditorId: {
    type: String,
    default: 'ck-editor',
  }
})

const emit = defineEmits(['saved'])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const isAdmin = ref(userStore.authGrpCd.includes('DATDA001'))

const detailParam = ref(null)
const dialog = ref(false)
const fileEdit = ref(false)
const password = ref('')
const passwordOk = ref('')

const ckEditor = ref(null)
const fileUpload = ref(null)

const codeList = reactive({
  CONTENT_HD: [],
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  TITLE: '',
  CONTENT: '',
  NOTI_YN: 'N',
  FILE_ID: '',
  NICK_NAME: '',
  PASS: '',
  STATUS: 'A',
  CONTENT_HD: '',
  SEARCH_CNT: 0,
  SHOW_NOTI: 'N',
  EMP_YN: 'N',
})

const initSaveParams = _.cloneDeep(saveParams)

const init = () => {
  Object.keys(saveParams).forEach(key => { saveParams[key] = initSaveParams[key] })

  password.value = ''
  passwordOk.value = ''

  ckEditor.value.setContent('')

  getContentHd()
}

const getContentHd = () => {
  commonSearchApi({ queryId: 'DATDA0010_SEARCH_01', param: { CMPNY_DIV: userStore.cmpnyDiv, USE_YN: 'Y', } }).then(res => {
    codeList.CONTENT_HD = res.ORESULT_CUR
    codeList.CONTENT_HD.unshift({ SEQ: '', CONTENT_HD: '선택', })
  })
}

const openPopup = (mode = null) => {
  detailParam.value = mode
  init()

  if(detailParam.value == null) {
    fileEdit.value = true

    nextTick(() => {
      fileUpload.value.setGuid()
      saveParams.FILE_ID = fileUpload.value.guid
      fileUpload.value.onButtonsClick({ id: 'btnSearch' })
    })
  } else {
    fileEdit.value = false

    nextTick(() => {
      commonRequest('/hse/DATDA0010/searchContent', { queryId: 'DATDA0010_SEARCH_04', param: detailParam.value, }).then(res => {
        if(res.ORESULT_CUR.length > 0) {
          Object.keys(saveParams).forEach(key => {
            saveParams[key] = res.ORESULT_CUR[0][key]
          })

          saveParams.USER_ID = userStore.userId

          ckEditor.value.setContent(saveParams.CONTENT)
          fileUpload.value.setGuid(saveParams.FILE_ID)
          fileUpload.value.onButtonsClick({ id: 'btnSearch' })
        }
      })
    })
  }
  
  dialog.value = true
}

const openPopup2 = () => {
  openPopup()
  saveParams.NOTI_YN = 'Y'
  saveParams.SHOW_NOTI = 'Y'
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnRegist') {
    new saveFlowHelper(vm, t)
      .setBefore(() => {
        if(chkEmpty(saveParams.CONTENT_HD)) {
          Message.warn('말머리를 선택해주세요.')
          return false
        } else if(chkEmpty(saveParams.NICK_NAME)) {
          Message.warn('별명을 입력해주세요.')
          return false
        } else if(saveParams.NOTI_YN !== 'Y' && chkEmpty(password.value)) {
          Message.warn('비밀번호를 입력해주세요.')
          return false
        } else if(saveParams.NOTI_YN !== 'Y' && password.value.length < 6) {
          Message.warn('비밀번호는 6글자 이상입니다.')
          return false
        } else if(saveParams.NOTI_YN !== 'Y' && detailParam.value == null && password.value !== passwordOk.value) {
          Message.warn('비밀번호와 비밀번호 확인의 값이 다릅니다.')
          return false
        } else if(saveParams.NOTI_YN !== 'Y' && detailParam.value != null && sha256(password.value).toString() !== saveParams.PASS) {
          Message.warn('잘못된 비밀번호입니다.')
          return false
        } else if(chkEmpty(saveParams.TITLE)) {
          Message.warn('제목을 입력해주세요.')
          return false
        } else if(chkEmpty(ckEditor.value.getContent())) {
          Message.warn('내용을 입력해주세요.')
          return false
        }

        return true
      })
      .setQuery(() => {
        const param = _.cloneDeep(saveParams)
        param.PASS = sha256(password.value).toString()
        param.CONTENT = ckEditor.value.getContent()

        return commonRequest('/hse/DATDA0010/saveContent', {
          queryId: 'DATDA0010_SAVE_03',
          list: [param],
        })
      })
      .setAfter(res => {
        sendAlarm(res)
        
        emit('saved')
        dialog.value = false
      })
      .run()
  } else if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(() => {
        if(chkEmpty(saveParams.CONTENT_HD)) {
          Message.warn('말머리를 선택해주세요.')
          return false
        } else if(chkEmpty(saveParams.NICK_NAME)) {
          Message.warn('별명을 입력해주세요.')
          return false
        } else if(!isAdmin.value && chkEmpty(password.value)) {
          Message.warn('비밀번호를 입력해주세요.')
          return false
        } else if(!isAdmin.value && sha256(password.value).toString() !== saveParams.PASS) {
          Message.warn('잘못된 비밀번호입니다.')
          return false
        } else if(chkEmpty(saveParams.TITLE)) {
          Message.warn('제목을 입력해주세요.')
          return false
        } else if(chkEmpty(ckEditor.value.getContent())) {
          Message.warn('내용을 입력해주세요.')
          return false
        }

        return true
      })
      .setQuery(() => {
        const param = _.cloneDeep(saveParams)
        param.PASS = sha256(password.value).toString()
        param.CONTENT = ckEditor.value.getContent()

        return commonRequest('/hse/DATDA0010/saveContent', {
          queryId: 'DATDA0010_SAVE_03',
          list: [param],
        })
      })
      .setAfter(res => {
        // sendAlarm(res)
        
        emit('saved')
        dialog.value = false
      })
      .run()
  } else if(btnId === 'btnFileEdit') {
    if(!isAdmin.value && chkEmpty(password.value)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(!isAdmin.value && sha256(password.value).toString() !== saveParams.PASS) {
      Message.warn('잘못된 비밀번호입니다.')
      return false
    }
    
    fileEdit.value = true

    nextTick(() => {
      fileUpload.value.setGuid(saveParams.FILE_ID)
      fileUpload.value.onButtonsClick({ id: 'btnSearch' })
    })
  } else if(btnId === 'btnClose') {
    dialog.value = false
  }
}

const sendAlarm = param => {
  const sParam = {
    CMPNY_DIV: param.CMPNY_DIV,
    SEQ: param.OUT_RES_COD,
    USER_ID: userStore.userId,
  }

  commonRequest(
    '/hse/DATDA0010/searchContent',
    {
      queryId: 'DATDA0010_SEARCH_04',
      param: sParam
    }
  ).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      const currData = res.ORESULT_CUR[0]
      const mailTitle = '[HiSEs] 안전 소통 게시판 게시글 등록 안내'
      let mailContent = ''

      mailContent += `<html>`
      mailContent += `  <style>`
      mailContent += `    p {`
      mailContent += `      margin: 0;`
      mailContent += `    }`
      mailContent += `  </style>`
      mailContent += `  <div style=\"margin-bottom: 12px;\">`
      mailContent += `    <div>아래와 같이 게시글이 등록되어 관리자분께 안내 드립니다.</div>`
      mailContent += `    <div>HiSEs 접속 후 [자료실/게시판] - [안전 소통 게시판] 메뉴/화면에서 게시글을 확인 후 답글을 달아주시기 바랍니다.</div>`
      mailContent += `  </div>`
      mailContent += `  <table style=\"border-collapse: collapse; border: 1px solid #555555;\">`
      mailContent += `    <tbody>`
      mailContent += `      <tr>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\" colspan=\"4\">◎ 게시글 정보</th>`
      mailContent += `      </tr>`
      mailContent += `      <tr>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\">글번호</th>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\">제목</th>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\">작성자</th>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\">등록일</th>`
      mailContent += `      </tr>`
      mailContent += `      <tr>`
      mailContent += `        <td style=\"border: 1px solid #555555; padding: 8px 12px; text-align: center;\">${currData.SEQ}</td>`
      mailContent += `        <td style=\"border: 1px solid #555555; padding: 8px 12px; text-align: center;\">${currData.TITLE2.substr(currData.TITLE2.indexOf('[', 2))}</td>`
      mailContent += `        <td style=\"border: 1px solid #555555; padding: 8px 12px; text-align: center;\">${currData.NICK_NAME}</td>`
      mailContent += `        <td style=\"border: 1px solid #555555; padding: 8px 12px; text-align: center;\">${currData.INSERT_DATE}</td>`
      mailContent += `      </tr>`
      mailContent += `      <tr>`
      mailContent += `        <th style=\"border: 1px solid #555555; padding: 8px 12px; background-color: #eeeeee;\" colspan=\"4\">내용</th>`
      mailContent += `      </tr>`
      mailContent += `      <tr>`
      mailContent += `        <td colspan=\"4\">`
      mailContent += `          ${currData.CONTENT}`
      mailContent += `        </td><p> </p>`
      mailContent += `      </tr>`
      mailContent += `    </tbody>`
      mailContent += `  </table>`
      mailContent += `</html>`

      commonSearchApi({
        queryId: 'DATDA0010_SEARCH_07',
        param: { 
          CMPNY_DIV: currData.CMPNY_DIV,
          CONTENT_HD: currData.CONTENT_HD,
        }
      }).then(target => {
        const dtTarget = target.ORESULT_CUR
        const emails = []

        for(let i = 0; i < dtTarget.length; i++) {
          if(!chkEmpty(dtTarget[i].HND_PHN)) {
            commonSendSMS({
              EMPNO_FROM: 'A490342',
              EMPNO_TO: dtTarget[i].EMP_NO,
              SYSCODE: '156',
              FROM_P_NO: '0522036394',
              TO_P_NO: dtTarget[i].HND_PHN,
              TITLE: 'HiSEs 안전 소통 게시판에 게시글이 등록되었습니다. 확인 바랍니다.'
            })
          }

          if(!chkEmpty(dtTarget[i].EMAIL)) {
            emails.push(dtTarget[i].EMAIL)
          }
        }

        commonSendApi({
          EMAIL: emails,
          SUBJECT: mailTitle,
          CONTENT: mailContent,
        })
      })
    }
  })
}

const changeEmpYN = () => {
  if(saveParams.EMP_YN === 'Y') {
    saveParams.NICK_NAME = userStore.empNm

    vm.$swal({ title: t(`이 글은 실명으로 작성됩니다.\n익명으로 작성이 필요할 경우 ‘실명 작성’ 해제를 해 주시기 바랍니다.`), })
  } else {
    saveParams.NICK_NAME = ''
  }
}

onMounted(() => {
  //
})

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="65%"
    height="100%"
  >
    <div class="title-bar">
      {{ $t(`${saveParams.NOTI_YN === 'Y' ? '공지' : '내용'} ${detailParam == null ? '등록' : '수정'}`) }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0">
        <template v-if="detailParam == null">
          <IGridTitle
            :button-list="['btnRegist', 'btnClose']"
            @click-button="onButtonsClick"
            :use-permission="false"
          />
        </template>
        <template v-else>
          <IGridTitle
            :button-list="['btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
            :use-permission="false"
          />
        </template>
      </v-card-title>
      <v-card-text class="pa-0 content-area overflow-y-auto">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex flex-column">
            <div class="d-flex align-center">
              <i-select
                v-model="saveParams.CONTENT_HD"
                :items="codeList.CONTENT_HD"
                item-value="SEQ"
                item-title="CONTENT_HD"
                :label="$t('말머리')"
                :label-width="`${90 - (saveParams.NOTI_YN === 'Y' ? 50 : 0)}px`"
                :width="`${300 - (saveParams.NOTI_YN === 'Y' ? 50 : 0)}px`"
              />
              <v-checkbox
                v-show="saveParams.NOTI_YN === 'Y'"
                true-value="Y"
                false-value="N"
                v-model="saveParams.SHOW_NOTI"
                label="공지 게시"
              />
              <!-- <v-checkbox
                v-show="isAdmin"
                true-value="Y"
                false-value="N"
                v-model="saveParams.NOTI_YN"
                label="공지여부"
              /> -->
            </div>
            <div class="d-flex mt-2 align-center">
              <i-input
                v-model="saveParams.NICK_NAME"
                :label="saveParams.NOTI_YN === 'Y' ? $t('별명') : $t('별명 / 패스워드')"
                :label-width="`${90 - (saveParams.NOTI_YN === 'Y' ? 50 : 0)}px`"
                :width="`${300 - (saveParams.NOTI_YN === 'Y' ? 50 : 0)}px`"
                :margin="`${8 - (saveParams.NOTI_YN === 'Y' ? 8 : 0)}px`"
                maxlength="20"
                placeholder="별명(1 ~ 20글자 입력)"
                :readonly="saveParams.EMP_YN === 'Y'"
              />
              <div v-show="saveParams.NOTI_YN !== 'Y'">/</div>
              <div v-show="saveParams.NOTI_YN !== 'Y'" class="ml-2" style="width: 202px;">
                <v-text-field
                  v-model="password"
                  type="password"
                  :minlength="6"
                  :maxlength="20"
                  placeholder="비밀번호(6 ~ 20글자 입력)"
                />
              </div>
              <div v-show="detailParam == null && saveParams.NOTI_YN !== 'Y'">
                <div class="d-flex align-center">
                  <div class="ml-5 mr-2" style="color: #222; font-size: 14px; font-weight: 400;">
                    비밀번호 확인
                  </div>
                  <div style="width: 212px;">
                    <v-text-field
                      v-model="passwordOk"
                      type="password"
                      :minlength="6"
                      :maxlength="20"
                      placeholder="비밀번호를 똑같이 입력해주세요."
                    />
                  </div>
                </div>
              </div>
              <v-checkbox
                class="ml-5"
                true-value="Y"
                false-value="N"
                v-model="saveParams.EMP_YN"
                label="실명 작성"
                @update:model-value="changeEmpYN"
              />
            </div>
            <div class="d-flex mt-2 align-center">
              <i-input
                v-model="saveParams.TITLE"
                :label="$t('제목')"
                :label-width="`${90 - (saveParams.NOTI_YN === 'Y' ? 50 : 0)}px`"
                width="100%"
              />
            </div>
          </v-sheet>
          <div>
            <CKEditor
              :id="props.ckEditorId"
              ref="ckEditor"
              height="475px"
            />
          </div>
          <div class="mt-3">
            <template v-if="fileEdit">
              <IUpload
                ref="fileUpload"
                fix-height
                :chk-update="false"
                style="height: 250px"
              />
            </template>
            <template v-else>
              <div class="mb-1 pt-2" style="border-top: 1px solid #cccccc; font-size: 18px; font-weight: bold;">
                첨부파일
                <v-btn @click="onButtonsClick({ id: 'btnFileEdit' })">
                  파일수정
                </v-btn>
              </div>
              <IUpload
                class="file-list"
                ref="fileUpload"
                fix-height
                grid-only
                :chk-update="false"
                style="height: 250px"
              />
            </template>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.file-list {
  padding: 0 !important;
}
</style>