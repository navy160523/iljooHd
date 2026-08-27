<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import { chkEmpty } from '@/utils/common'
import sha256 from 'crypto-js/sha256'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from '@/components/IUpload.vue'
import { truncate } from 'lodash-es'

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
const crud = ref('')
const dialog = ref(false)
const fileEdit = ref(false)
const password = ref('')
const passwordOk = ref('')

const ckEditor = ref(null)
const fileUpload = ref(null)

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTI_SEQ: '',
  TITLE: '',
  CONTENT: '',
  FILE_ID: '',
  NICK_NAME: '',
  PASS: '',
  EMP_YN: 'N',
})

const initSaveParams = _.cloneDeep(saveParams)

const init = () => {
  Object.keys(saveParams).forEach(key => { saveParams[key] = initSaveParams[key] })

  password.value = ''
  passwordOk.value = ''

  ckEditor.value.setContent('')
}

const openPopup = (mode = null) => {
  fileEdit.value = false
  detailParam.value = mode
  detailParam.value.TITLE = `Re ${detailParam.value.TITLE.substr(detailParam.value.TITLE.indexOf('[', 2))}`
  init()

  commonRequest('/hse/DATDA0010/searchContent', { queryId: 'DATDA0010_SEARCH_05', param: detailParam.value, }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      crud.value = 'U'

      Object.keys(saveParams).forEach(key => {
        saveParams[key] = res.ORESULT_CUR[0][key]
      })

      saveParams.USER_ID = userStore.userId

      nextTick(() => {
        ckEditor.value.setContent(saveParams.CONTENT)
        fileUpload.value.setGuid(saveParams.FILE_ID)
        fileUpload.value.onButtonsClick({ id: 'btnSearch' })
      })
    } else {
      fileEdit.value = true
      crud.value = 'I'

      Object.keys(detailParam.value).forEach(key => {
        saveParams[key] = detailParam.value[key]
      })

      nextTick(() => {
        fileUpload.value.setGuid()
        saveParams.FILE_ID = fileUpload.value.guid
        fileUpload.value.onButtonsClick({ id: 'btnSearch' })
      })
    }
  })
  
  dialog.value = true
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnRegist') {
    new saveFlowHelper(vm, t)
      .setBefore(() => {
        if(chkEmpty(saveParams.NICK_NAME)) {
          Message.warn('별명을 입력해주세요.')
          return false
        }
        //  else if(chkEmpty(password.value)) {
        //   Message.warn('비밀번호를 입력해주세요.')
        //   return false
        // } else if(password.value.length < 6) {
        //   Message.warn('비밀번호는 6글자 이상입니다.')
        //   return false
        // } else if(crud.value === 'I' && password.value !== passwordOk.value) {
        //   Message.warn('비밀번호와 비밀번호 확인의 값이 다릅니다.')
        //   return false
        // } else if(crud.value !== 'I' && sha256(password.value).toString() !== saveParams.PASS) {
        //   Message.warn('잘못된 비밀번호입니다.')
        //   return false
        // } 
        else if(chkEmpty(saveParams.TITLE)) {
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
          queryId: 'DATDA0010_SAVE_04',
          list: [param],
        })
      })
      .setAfter(() => {
        emit('saved')
        dialog.value = false
      })
      .run()
  } else if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(() => {
        if(chkEmpty(saveParams.NICK_NAME)) {
          Message.warn('별명을 입력해주세요.')
          return false
        }
        // else if(!isAdmin.value && chkEmpty(password.value)) {
        //   Message.warn('비밀번호를 입력해주세요.')
        //   return false
        // } else if(!isAdmin.value && crud.value !== 'I' && sha256(password.value).toString() !== saveParams.PASS) {
        //   Message.warn('잘못된 비밀번호입니다.')
        //   return false
        // }
        else if(chkEmpty(saveParams.TITLE)) {
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
          queryId: 'DATDA0010_SAVE_04',
          list: [param],
        })
      })
      .setAfter(() => {
        emit('saved')
        dialog.value = false
      })
      .run()
  } else if(btnId === 'btnFileEdit') {
    if(!isAdmin.value && chkEmpty(password.value)) {
      Message.warn('비밀번호를 입력해주세요.')
      return
    } else if(!isAdmin.value && crud.value !== 'I' && sha256(password.value).toString() !== saveParams.PASS) {
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
      {{ $t(`${crud === 'I' ? '답변 등록' : '답변 수정'}`) }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0">
        <template v-if="crud === 'I'">
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
              <i-input
                v-model="saveParams.TITLE"
                :label="$t('제목')"
                label-width="40px"
                width="100%"
              />
            </div>
            <div class="d-flex mt-2 align-center">
              <i-input
                v-model="saveParams.NICK_NAME"
                :label="$t('별명')"
                label-width="40px"
                width="250px"
                margin="0"
                maxlength="20"
                placeholder="별명(1 ~ 20글자 입력)"
                :readonly="saveParams.EMP_YN === 'Y'"
              />
              <!-- <i-input
                v-model="saveParams.NICK_NAME"
                :label="$t('별명 / 패스워드')"
                label-width="90px"
                width="300px"
                margin="8px"
                maxlength="20"
                placeholder="별명(1 ~ 20글자 입력)"
                :readonly="saveParams.EMP_YN === 'Y'"
              />
              <div>/</div>
              <div class="ml-2" style="width: 202px;">
                <v-text-field
                  v-model="password"
                  type="password"
                  :minlength="6"
                  :maxlength="20"
                  placeholder="비밀번호(6 ~ 20글자 입력)"
                />
              </div>
              <div v-show="crud === 'I'">
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
              </div> -->
              <v-checkbox
                class="ml-5"
                true-value="Y"
                false-value="N"
                v-model="saveParams.EMP_YN"
                label="실명 작성"
                @update:model-value="changeEmpYN"
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