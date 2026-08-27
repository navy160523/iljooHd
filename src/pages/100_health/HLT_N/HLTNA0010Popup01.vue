<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import RealGrid from '@/components/RealGrid.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const logStore = useLogsStore()
const grdMain = ref(null)
const dialog = ref(false)
const popupTitle = ref('체감온도 문자발송 이력조회 팝업')
const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  POSITION_DIV: '',
  FROM_DT: '',
  TO_DT: '',
  SUCCESS_YN: '',
  AM_PM: '',
})

const codeList = reactive({
  POSITION_DIV: [],
  AM_PM: [
    { COD: '', TXT: '전체' },
    { COD: 'AM', TXT: '오전' },
    { COD: 'PM', TXT: '오후' },
    { COD: 'OV', TXT: '연장' }
  ],
  SUCCESS_YN: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '성공' },
    { COD: 'N', TXT: '실패' }
  ]
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속'), }, styleName: 'left-column', width: '280', },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명'), }, width: '90', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '90', },
    { fieldName: 'POSITION_NM', dataType: 'text', header: { text: t('공장'), }, width: '90', },
    { fieldName: 'AM_PM', dataType: 'text', header: { text: t('오전/오후'), }, width: '90', },
    { fieldName: 'SUCCESS_YN', dataType: 'text', header: { text: t('발송성공'), }, width: '90', },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('발송일시'), }, width: '150', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = param => {
  popupParams.POSITION_DIV = param.POSITION_DIV
  popupParams.FROM_DT = dayjs().format('YYYY-MM-DD')
  popupParams.TO_DT = dayjs().format('YYYY-MM-DD')

  dialog.value = true

  onButtonsClick({ id: 'btnSearch' }, false)
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows([])
  return commonSearchApi({ queryId: 'HLTNA0010_SEARCH_SMS_HISTORY', param: popupParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = (btn, showMsg = true) => {
  const btnId = btn.id

  if(btnId === 'btnClose') {
    dialog.value = false
  } else if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .showMessage(showMsg)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

onMounted(() => {
  nextTick(() => {
    getCodeList('HHII830A').then(res => {
      codeList.POSITION_DIV = res.ORESULT_CUR
      codeList.POSITION_DIV.unshift({ COD: '', TXT: '전체' })
    })
    
    grdMain.value.getGridView().filterPanel.visible = true
  })
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
    width="1000px"
    height="100%"
  >
    <div class="title-bar">
      {{ popupTitle }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle
          ref="gridTitle"
          title="체감온도 문자발송 이력"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex align-center">
              <i-input
                label-width="30px"
                width="180px" 
                :label="$t('기간')" type="date"
                v-model="popupParams.FROM_DT"
                margin="10px"
              />
              <i-input
                width="160px"
                :label="$t('~')" type="date"
                v-model="popupParams.TO_DT"
              />
              <i-select
                label-width="30px"
                :label="$t('공장')"
                v-model="popupParams.POSITION_DIV"
                :items="codeList.POSITION_DIV"
                item-value="COD"
                item-title="TXT"
                width="155px"
              />
              <i-select
                label-width="55px"
                :label="$t('오전/오후')"
                v-model="popupParams.AM_PM"
                :items="codeList.AM_PM"
                item-value="COD"
                item-title="TXT"
                width="155px"
              />
              <i-select
                label-width="50px"
                :label="$t('성공여부')"
                v-model="popupParams.SUCCESS_YN"
                :items="codeList.SUCCESS_YN"
                item-value="COD"
                item-title="TXT"
                width="150px"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>