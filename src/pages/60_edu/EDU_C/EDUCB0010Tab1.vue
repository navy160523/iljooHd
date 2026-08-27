<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0010Tab1',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdEquip = ref(null)
const grdJic = ref(null)

const grdEquipProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'EQUIP_SEQ', dataType: 'text', header: { text: t('장비ID'), }, editable: false, },
    { fieldName: 'EQUIP_NM', dataType: 'text', header: { text: t('장비명'), }, styleName: 'editable_column left-column', width: '350', },
    { fieldName: 'ORDER_NUM', dataType: 'number', numberFormat: '#,###', header: { text: t('순서'), }, styleName: 'editable_column',
      editor: { type: 'number', editFormat: '#,###' }, },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), }, styleName: 'editable_column change_back_check', editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
  ],
  columns: [],
})

grdEquipProps.columns = grdEquipProps.fields

const grdJicProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'JIC_SEQ', dataType: 'text', header: { text: t('직종ID'), }, editable: false, },
    { fieldName: 'JIC_NM', dataType: 'text', header: { text: t('직종명'), }, styleName: 'editable_column left-column', width: '350', },
    { fieldName: 'ORDER_NUM', dataType: 'number', numberFormat: '#,###', header: { text: t('순서'), }, styleName: 'editable_column',
      editor: { type: 'number', editFormat: '#,###' }, },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), }, styleName: 'editable_column change_back_check', editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
  ],
  columns: [],
})

grdJicProps.columns = grdJicProps.fields

const searchParamsEquip = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EQUIP_NM: '',
  USE_YN: 'Y',
})

const searchParamsJic = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  JIC_NM: '',
  USE_YN: 'Y',
})

const searchDataEquip = () => {
  grdEquip.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUCB0010_SEARCH_01', param: searchParamsEquip })
}

const afterSearchEquip = res => {
  grdEquip.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchDataJic = () => {
  grdJic.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUCB0010_SEARCH_02', param: searchParamsJic })
}

const afterSearchJic = res => {
  grdJic.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSaveEquip = () => {
  const checkedRows = grdEquip.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdEquip.value.getDataProvider().getJsonRow(checkedRows[i])

    if(chkEmpty(row.EQUIP_NM)) {
      Message.warn('장비명을 입력해주세요.')
      return false
    }
  }

  return true
}

const saveDataEquip = () => {
  const saveParams = []
  const checkedRows = grdEquip.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdEquip.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_01', list: saveParams })
}

const afterSaveEquip = () => {
  onButtonsClickEquip({ id: 'btnSearch' }, false)
}

const beforeSaveJic = () => {
  const checkedRows = grdJic.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdJic.value.getDataProvider().getJsonRow(checkedRows[i])

    if(chkEmpty(row.JIC_NM)) {
      Message.warn('직종명을 입력해주세요.')
      return false
    }
  }

  return true
}

const saveDataJic = () => {
  const saveParams = []
  const checkedRows = grdJic.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdJic.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_02', list: saveParams })
}

const afterSaveJic = () => {
  onButtonsClickJic({ id: 'btnSearch' }, false)
}

const onButtonsClickEquip = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdEquip])
      .showMessage(showMsg)
      .setQuery(searchDataEquip)
      .setAfter(afterSearchEquip)
      .run()
  } else if(btn.id === 'btnCreate') {
    const row = grdEquip.value.getDataProvider().addRow({
      CMPNY_DIV: searchParamsEquip.CMPNY_DIV,
      USE_YN: 'Y',
    })

    grdEquip.value.getGridView().setCurrent({ dataRow: row })
    // grdEquip.value.getGridView().checkRow(row)
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdEquip, row: 'check' }])
      .setGridList([grdEquip])
      .setBefore(beforeSaveEquip)
      .setQuery(saveDataEquip)
      .setAfter(afterSaveEquip)
      .run()
  }
}

const onButtonsClickJic = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdJic])
      .showMessage(showMsg)
      .setQuery(searchDataJic)
      .setAfter(afterSearchJic)
      .run()
  } else if(btn.id === 'btnCreate') {
    const row = grdJic.value.getDataProvider().addRow({
      CMPNY_DIV: searchParamsJic.CMPNY_DIV,
      USE_YN: 'Y',
    })

    grdJic.value.getGridView().setCurrent({ dataRow: row })
    // grdJic.value.getGridView().checkRow(row)
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdJic, row: 'check' }])
      .setGridList([grdJic])
      .setBefore(beforeSaveJic)
      .setQuery(saveDataJic)
      .setAfter(afterSaveJic)
      .run()
  }
}

const chkEmpty = data => {
  return data == undefined || data == null || data === ''
}

onMounted(async () => {
  vm.$nextTick(() => {
    onButtonsClickEquip({ id: 'btnSearch' }, false)
    onButtonsClickJic({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet width="50%" class="h-auto">
      <IGridTitle
        title="장비 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate']"
        @click-button="onButtonsClickEquip"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            :label="$t('장비명')"
            v-model="searchParamsEquip.EQUIP_NM"
            @keydown.enter="onButtonsClickEquip({ id: 'btnSearch' })"
            width="250px"
          />
          <v-checkbox
            v-model="searchParamsEquip.USE_YN"
            label="사용여부"
            true-value="Y"
            false-value="N"
          />
        </div>
      </v-sheet>
      <RealGrid
        ref="grdEquip"
        :grid-view-option="grdEquipProps.gridViewOption"
        :keys="grdEquipProps.keys" 
        :fields="grdEquipProps.fields"
        :columns="grdEquipProps.columns"
      />
    </v-sheet>
    <v-sheet width="50%" class="h-auto ml-3">
      <IGridTitle
        title="직종 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate']"
        @click-button="onButtonsClickJic"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            :label="$t('직종명')"
            v-model="searchParamsJic.JIC_NM"
            @keydown.enter="onButtonsClickJic({ id: 'btnSearch' })"
            width="250px"
          />
          <v-checkbox
            v-model="searchParamsJic.USE_YN"
            label="사용여부"
            true-value="Y"
            false-value="N"
          />
        </div>
      </v-sheet>
      <RealGrid
        ref="grdJic"
        :grid-view-option="grdJicProps.gridViewOption"
        :keys="grdJicProps.keys" 
        :fields="grdJicProps.fields"
        :columns="grdJicProps.columns"
      />
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
</style>