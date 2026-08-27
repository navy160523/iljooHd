<!--
화면명 : 산재 업무 관련 담당자 관리
화면개요 : 메일발송 대상 산재 담당자 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'

defineOptions({
  name: '30_safety-SAF_A-SAFAG0090',
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const menuTitle = ref(null)
const grdMain = ref(null)
const sangbnList = ref([])
const saupList = ref([])
const empPopup = ref(null)

const searchParams = reactive({  
  CMPNY_DIV: userStore.cmpnyDiv,
  SANGBN: '',
  NAME: '',
})

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'SANGBN', 'EMP_NO'],
  fields : [
    { fieldName: 'ROW_STT', dataType: 'text', header: { text: t('신규여부') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    // { fieldName: 'SANGBN', dataType: 'text', header: { text: t('산재구분'), styleName: 'header_validit' }, styleName: 'editable_column',
    //   required: true, requiredMessage: '[산재구분]은 필수입니다.', lookupDisplay: true,
    //   editor: {
    //     type: 'dropdown', domainOnly: true, dropDownWhenClick: true,
    //   },
    // },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, editable: false, styleName: 'left-column', width: 225 },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column editable_column', width: 300,
      lookupDisplay: true,
      editor: {
        type: 'checklist', textReadOnly: true, dropDownWhenClick: true, showAllCheck: true,
        acceptText: '확인', allCheckText: '전체', cancelText: '취소'
      },
    },
    { fieldName: 'EMPGBN', dataType: 'text', header: { text: t('퇴직발송구분') }, styleName: 'editable_column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown', domainOnly: true, dropDownWhenClick: true,
      },
    },
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('E-MAIL') }, editable: false, styleName: 'left-column', width: 125 },
    { fieldName: 'REMARKS', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column editable_column' },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const searchMain = () => {
  return commonSearchApi({ queryId : 'SAFAG0090_SEARCH_01', param: searchParams })
}

const afterSearchMain = res => {
  const data = res.ORESULT_CUR

  grdMain.value.getDataProvider().setRows(data)
}

const mainCheck = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const saveData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(data)
  }
  
  return commonExecuteApi({ queryId : 'SAFAG0090_SAVE_01', list: saveParams })
}

const deleteData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(data)
  }
  
  return commonExecuteApi({ queryId : 'SAFAG0090_DELETE_01', list: saveParams })
}

const openEmpPopup = async () => {
  empPopup.value.openPopup({ MULTI: true })
}

const onEmpSelected = param => {
  // console.log('onEmpSelected param', param)
  // console.log('all data', grdMain.value.getDataProvider().getJsonRows())

  const allData = grdMain.value.getDataProvider().getJsonRows()

  param.forEach(item => {
    if(_.some(allData, { EMP_NO: item.EMP_NO })) {
      Message.warn(`중복되는 인원이 있습니다.<br />${item.EMP_NM}(${item.EMP_NO})`)
      return
    }
  })

  param.forEach(item => {
    const row = {
      ROW_STT: 'C',
      CMPNY_DIV: item.CMPNY_DIV,
      ASGN_FULL_NM: item.ASGN_NM,
      EMP_NO: item.EMP_NO,
      KOR_NM: item.EMP_NM,
      EMAIL: item.EMAIL,
    }

    grdMain.value.addRow(row)
  })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run()
  } else if(btn.id === 'btnCreate') {
    openEmpPopup()
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const getCmmCd = async () => {
  // 산재구분
  // await getCodeList('HHIB250030', 'HHI', 'Y').then(res => {
  //   // console.log('HHIB250030 res', res.ORESULT_CUR)

  //   // 조회조건용 산재구분
  //   const searchSANGBN = [..._.cloneDeep(res.ORESULT_CUR)]

  //   searchSANGBN.unshift({
  //     TXT: '전체',
  //     COD :'',
  //   })
    
  //   // 그리드용 산재구분
  //   const grdSANGBN = [..._.cloneDeep(res.ORESULT_CUR)]

  //   sangbnList.value = searchSANGBN

  //   grdMain.value.setBindingColumn('SANGBN', grdSANGBN, 'COD', 'TXT')
  // })

  // 퇴직발송구분
  await getCodeList('HHIB250120', 'HHI', 'Y').then(res => {
    // console.log('HHIB250030 res', res.ORESULT_CUR)

    // const grdEMPGBN = [..._.cloneDeep(res.ORESULT_CUR)]

    const grdEMPGBN = [
      // { COD: '', TXT: '' },
      { COD: 'O', TXT: 'O' },
    ]

    grdMain.value.setBindingColumn('EMPGBN', grdEMPGBN, 'COD', 'TXT')
  })

  const param = { CMPNY_DIV: userStore.cmpnyDiv }

  // 사업부
  await commonSearchApi({ queryId: 'searchBSNS', param }).then(res => {
    // console.log('searchBSNS res', res.ORESULT_CUR)

    saupList.value = res.ORESULT_CUR
    grdMain.value.setBindingColumn('BSNS_CD', saupList.value, 'BSNS_CD', 'BSNS_NM')
  })
}

onMounted(async () => {
  await getCmmCd()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('성명')"
            v-model="searchParams.NAME"
            width="350px"
            @keyup.enter="onButtonsClick({ id: 'btnSearch' })"
          />
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
      </div>
    </v-card-text>

    <EmpPopup 
      ref="empPopup"
      @selected="onEmpSelected"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>