<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdPopUp = ref(null)
const userStore = useUserStore() //유저정보
const empPopup = ref(null)

const MainSearchParams = reactive({
  CMPNY_DIV: '',
  DATE_YN: '',
  FROM: '',
  TO: '',
  EMP_NO: '',
  FILENUM: '',
  NAME: '',
  USER_ID: '',
  IP_ADDRESS: '',
})

const codeList = reactive({})

const SaveData = reactive({})

const intCode = (popupParam) => {
  Promise.all([
    getCodeList('HHIZ000'), //0

    getCodeList('HHIB250010'), //1
    getCodeList('HHIB250020'), //2
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_02',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), //3
  ])
    .then((res) => {
      codeList.company = res[0].ORESULT_CUR
      codeList.company.unshift({ TXT: '전체', COD: '' })
      grdPopUp.value.setBindingColumn(
        'REQGBN',
        res[1].ORESULT_CUR,
        'COD',
        'TXT'
      )
      grdPopUp.value.setBindingColumn('YOGBN', res[2].ORESULT_CUR, 'COD', 'TXT')
      grdPopUp.value.setBindingColumn(
        'INJURYPART',
        res[3].ORESULT_CUR,
        'COD',
        'TXT'
      )
      MainSearchParams.NAME = popupParam.PATIENT_NM
      MainSearchParams.CMPNY_DIV = popupParam.CMPNY_DIV
      MainSearchParams.DATE_YN = 'N'
      MainSearchParams.FILENUM = ''
      onButtonsClick({ id: 'btnSearch' })
    })
    .catch((err) => {})
}

//  팝업오픈 emp

//  조치자 셀렉트 이벤트

const openPopup = (popupParam) => {
  SaveData.param = ''
  intCode(popupParam)
  dialog.value = true
}

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ['FILENUM'],
  fields: [
    { fieldName: 'FILENUM', dataType: 'text', header: { text: t('파일번호') } },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      header: { text: t('요양구분') },
      lookupDisplay: true,
    },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } },
    { fieldName: 'EMPLNO', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'REG_NO', dataType: 'text', header: { text: t('주민번호') } },
    {
      fieldName: 'OCCURDATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('재해일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
    {
      fieldName: 'REQGBN',
      dataType: 'text',
      header: { text: t('신청구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SAGOTYPE_NM2',
      dataType: 'text',
      header: { text: t('사고형태') },
    },
    {
      fieldName: 'INJURYPART',
      dataType: 'text',
      header: { text: t('재해부위') },
      lookupDisplay: true,
    },

    //  저장 위함
    { fieldName: 'ADDR', dataType: 'text', visible: false },
    { fieldName: 'ADD_DESC', dataType: 'text', visible: false },
    { fieldName: 'APPROVEDTE', dataType: 'text', visible: false },
    { fieldName: 'BANK', dataType: 'text', visible: false },
    { fieldName: 'BIGO', dataType: 'text', visible: false },
    { fieldName: 'BOKDTE', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'BVTYP', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DMCL_DOM', dataType: 'text', visible: false },
    { fieldName: 'ENDDTE', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FROMDTE1', dataType: 'text', visible: false },
    { fieldName: 'FROMDTE2', dataType: 'text', visible: false },
    { fieldName: 'GAINUM', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false },
    { fieldName: 'GRADEDTE', dataType: 'text', visible: false },
    { fieldName: 'HAPAMT', dataType: 'text', visible: false },
    { fieldName: 'HAPBIGO', dataType: 'text', visible: false },
    { fieldName: 'HAPDTE', dataType: 'text', visible: false },
    { fieldName: 'HAP_STATUS', dataType: 'text', visible: false },
    { fieldName: 'HAP_YN', dataType: 'text', visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', visible: false },
    { fieldName: 'HOSPITAL', dataType: 'text', visible: false },
    { fieldName: 'HUDTE', dataType: 'text', visible: false },
    { fieldName: 'INGAMDTE', dataType: 'text', visible: false },
    { fieldName: 'INJURYTYPE', dataType: 'text', visible: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', visible: false },
    { fieldName: 'OCCURTIME', dataType: 'text', visible: false },
    { fieldName: 'OFFICE_TEL', dataType: 'text', visible: false },
    { fieldName: 'OKDTE', dataType: 'text', visible: false },
    { fieldName: 'ORGBELNR', dataType: 'text', visible: false },
    { fieldName: 'ORGBELNRDTE', dataType: 'text', visible: false },
    { fieldName: 'RECEIPTDTE', dataType: 'text', visible: false },
    { fieldName: 'REQEMP', dataType: 'text', visible: false },
    { fieldName: 'REQEMP_NM', dataType: 'text', visible: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', visible: false },
    { fieldName: 'SAGOGAEYO', dataType: 'text', visible: false },
    { fieldName: 'SAGOLOC', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE_NM1', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE_NM3', dataType: 'text', visible: false },
    { fieldName: 'SALARY', dataType: 'text', visible: false },
    { fieldName: 'SALARYDTE', dataType: 'text', visible: false },
    { fieldName: 'SANGBN', dataType: 'text', visible: false },
    { fieldName: 'SANGBYUNG', dataType: 'text', visible: false },
    { fieldName: 'SANNO', dataType: 'text', visible: false },
    { fieldName: 'SANOK', dataType: 'text', visible: false },
    { fieldName: 'SEND_YN', dataType: 'text', visible: false },
    { fieldName: 'SJE_TYPE_CD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'TARGETDTE', dataType: 'text', visible: false },
    { fieldName: 'TELGBN', dataType: 'text', visible: false },
    { fieldName: 'TELNO1', dataType: 'text', visible: false },
    { fieldName: 'TELNO2', dataType: 'text', visible: false },
    { fieldName: 'TODTE1', dataType: 'text', visible: false },
    { fieldName: 'TODTE2', dataType: 'text', visible: false },
    { fieldName: 'UNION_YN', dataType: 'text', visible: false },
    { fieldName: 'UNT_DUTY_NM', dataType: 'text', visible: false },
    { fieldName: 'WRT_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BIRTH_DAY', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields

// 조회

const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'SAFAG0080_search_Pop01',
    param: MainSearchParams,
  })
}

const afterSearch01 = (res) => {
  grdPopUp.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = () => {
  onSelect()
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdPopUp])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnSelect') {
    onSelect()
  } else if (btn.id === 'btnClose') {
    dialog.value = false
  }
}
const onSelect = () => {
  if (!grdPopUp.value.getGridView().getCurrent()) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return
  }

  var rowIdx = grdPopUp.value.getGridView().getCurrent().dataRow

  var rtnData = grdPopUp.value.getDataProvider().getJsonRow(rowIdx)

  emit('selected', rtnData)

  onButtonsClick({ id: 'btnClose' })
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">산재자</div>
    <VContainer style="background-color: white">
      <!-- 최상단 -->
      <VRow class="my-1">
        <VCol>
          <IMenuTitle
            :use-permission="false"
            :button-list="['btnSearch', 'btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!--  그리드  -->
      <VRow no-gutters>
        <VCol>
          <RealGrid
            ref="grdPopUp"
            class="mt-2"
            style="height: 650px"
            :grid-view-option="grdPopUpProps.gridViewOption"
            :keys="grdPopUpProps.keys"
            :fields="grdPopUpProps.fields"
            :columns="grdPopUpProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
