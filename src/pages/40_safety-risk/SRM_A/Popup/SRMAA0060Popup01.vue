<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const isSaved = ref(false)
const dialog = ref(false)

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  ONOFF: '',
})

const openPopup = () => {
  dialog.value = true

  searchOnOff()
}

const searchOnOff = () => {
  commonSearchApi({ queryId: 'SRMAA0060_SEARCH_01', param: { CMPNY_DIV: saveParams.CMPNY_DIV } }).then(res => {
    saveParams.ONOFF = res.ORESULT_CUR[0].CODE_DESC1
  })
}

const saveOnOff = () => {
  commonExecuteApi({ queryId: 'SRMAA0060_SAVE_01', list: [saveParams] }).then(res => {
    searchOnOff()

    Message.success(t('저장되었습니다.'))
    isSaved.value = true
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnUpdate') {
    saveOnOff()
  } else if(btnId === 'btnClose') {
    dialog.value = false

    emit('close', isSaved.value)
  }
}

onMounted(() => {

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
    class="draggable-dialog"
    width="350px"
  >
    <div class="title-bar">
      {{ $t('공모전 설정') }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle :button-list="['btnUpdate', 'btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="searchArea mb-0">
            <div class="d-flex align-center">
              <div class="mr-2">
                리스크 공모전
              </div>
              <v-btn-toggle
                v-model="saveParams.ONOFF"
                mandatory
                color="primary"
              >
                <v-btn value="1">ON</v-btn>
                <v-btn value="0">OFF</v-btn>
              </v-btn-toggle>
            </div>
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>