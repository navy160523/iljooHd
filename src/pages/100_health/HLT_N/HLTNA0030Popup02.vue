<script setup>
import { ref, reactive, onMounted, getCurrentInstance, } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import saveFlowHelper from '@/utils/saveFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const logStore = useLogsStore()
const grdMain = ref(null)
const dialog = ref(false)
const popupTitle = ref('결재자 선택 팝업')
const isSaved = ref(false)
const emit = defineEmits(['close'])
const popupParams = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, exclusive: true, },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), }, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명'), }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = param => {
  popupParams.value = param

  commonSearchApi({ queryId: 'HLTNA0030_SEARCH_03', param: param }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })

  dialog.value = true
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnClose') {
    emit('close', isSaved.value)
    dialog.value = false
  } else if(btnId === 'btnReqApply') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('결재상신 하시겠습니까?')
      .setResultMessage('결재상신 되었습니다.')
      .setBefore(() => {
        const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

        if(checkedRows.length < 1) {
          Message.warn('결재자를 선택해 주세요.')
          return false
        }

        return true
      })
      .setQuery(() => {
        const checkedRows = grdMain.value.getGridView().getCheckedRows(true)
        const data = grdMain.value.getDataProvider().getJsonRow(checkedRows[0])

        const appParam = {
          CMPNY_DIV: popupParams.value.CMPNY_DIV,
          YEAR: dayjs().$y,
          APPROVE_ID:
            useLogsStore().vueId +
            '_' +
            userStore.userId +
            '_' +
            dayjs().$y +
            (dayjs().$M + 1).toString().padStart(2, '0') +
            dayjs().$D.toString().padStart(2, '0') +
            dayjs().$H.toString().padStart(2, '0') +
            dayjs().$m.toString().padStart(2, '0') +
            dayjs().$s.toString().padStart(2, '0'), 
          FORM_ID: useLogsStore().vueId,
          APP_EMP_NO: data.EMP_NO,
          APPROVE_GBN: 'I',
          APP_REQ_EMP_NO: userStore.userId,
          APP_STATUS: 'N',
          PATH: '/100_health/HLT_N/HLTNA0030',
          USER_ID: userStore.userId,
          YEAR: popupParams.value.YEAR,
          BSNS_CD: popupParams.value.BSNS_CD,
          DEPT_CD: popupParams.value.DEPT_CD,
          ASGN_CD: popupParams.value.ASGN_CD,
          SEQ: popupParams.value.SEQ,
        }

        // console.log('appParam', appParam)

        return commonExecuteApi({ queryId: 'HLTNA0030_APPROVE_01', list: [appParam] })
      })
      .setAfter(async res => {
        isSaved.value = true
        onButtonsClick({ id: 'btnClose' })
      })
      .run()
  }
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
    class="draggable-dialog"
    width="600px"
    height="700px"
  >
    <div class="title-bar">
      {{ popupTitle }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle
          ref="gridTitle"
          title="결재자 리스트"
          :button-list="['btnReqApply', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>