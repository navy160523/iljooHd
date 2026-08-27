<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import HLTNA0010Popup01 from '@/pages/100_health/HLT_N/HLTNA0010Popup01.vue'
import { chkEmpty } from '@/utils/common'
import _ from 'lodash'

defineOptions({
  name: '100_health-HLT_N-HLTNA0010',
})

const props = defineProps({
  positionDiv: {
    type: String,
    default() {
      return ''
    }
  }
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t
const menuTitle = ref(null)
const userLogStore = useLogsStore()
const userStore = useUserStore()
const smsHistory = ref(null)
const grdMain = ref(null)
const positionDivs = ref([])
const isAdmin = userStore.authGrpCd.includes('HLTM002') || userStore.authGrpCd.includes('HIWAYGRP00001')

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
  },
  fields: [
    { fieldName: 'CHECK_DATE2', dataType: 'text', header: { text: t('날짜'), }, mergeRule: { criteria: 'value', }, width: '110',
      editable: false, },
    { fieldName: 'CHECK_TIME2', dataType: 'text', header: { text: t('시간'), }, width: '75',
      editable: false, },
    { fieldName: 'FEEL_TEMP_MAX', dataType: 'text', header: { text: t('체감온도'), styleName: 'multiline-editor', }, width: '75',
      editable: false, },
    { fieldName: 'ACTION_NM', dataType: 'text', header: { text: t('추가 조치사항'), }, styleName: 'multiline-editor', width: '165',
      editable: false, mergeRule: { criteria: "values['CMPNY_DIV'] + values['POSITION_DIV'] + values['CHECK_DATE']" }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'POSITION_DIV', dataType: 'text', header: { text: t('POSITION_DIV'), }, visible: false, },
    { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('CHECK_DATE'), }, visible: false, },
    { fieldName: 'CHECK_TIME', dataType: 'text', header: { text: t('CHECK_TIME'), }, visible: false, },
    { fieldName: 'RED_COL', dataType: 'text', header: { text: t('RED_COL'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [],
})

grdMainProps.columns = grdMainProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  POSITION_DIV: props.positionDiv,
  FROM_DT: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  CHECK_TIME: [''],
  IS_DETAIL: isAdmin ? 'Y' : 'N'
})

const codeList = reactive({
  CHECK_TIME: [{ COD: '', TXT: '전체' }],
})

const setCheckTime = () => {
  searchParams.CHECK_TIME = ['']
  codeList.CHECK_TIME = [{ COD: '', TXT: '전체' }]
  grdMain.value.getDataProvider().setRows([])

  if(searchParams.IS_DETAIL === 'Y') {
    for(let i = 6; i <= 21; i++) {
      codeList.CHECK_TIME.push({
        COD: (i > 9 ? '' : '0') + i + '00', TXT: (i > 9 ? '' : '0') + i + ':00',
      })

      // if(i < 22) {
        codeList.CHECK_TIME.push({
          COD: (i > 9 ? '' : '0') + i + '30', TXT: (i > 9 ? '' : '0') + i + ':30',
        })
      // }
    }
  } else {
    codeList.CHECK_TIME.push({ COD: '0930', TXT: '09:30' })
    codeList.CHECK_TIME.push({ COD: '1430', TXT: '14:30' })
    codeList.CHECK_TIME.push({ COD: '1630', TXT: '16:30' })
    codeList.CHECK_TIME.push({ COD: '1830', TXT: '18:30' })
  }
}

const onButtonsClick = (btn, showMsg = true) => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .showMessage(showMsg)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else if(btnId === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else if(btnId === 'btnSearch2') {
    smsHistory.value.openPopup({ POSITION_DIV: props.positionDiv })
  }
}

const searchData = () => {
  const searchParams2 = {}

  Object.keys(searchParams).forEach(key => {
    searchParams2[key] = searchParams[key]
  })

  searchParams2.CHECK_TIME = _.join(searchParams2.CHECK_TIME, ',')

  if(searchParams2.CHECK_TIME === '') {
    const temp = _.cloneDeep(codeList.CHECK_TIME)
    _.remove(temp, { COD: '' })

    searchParams2.CHECK_TIME = _.map(temp, 'COD').join(',')
  }

  return commonSearchApi({ queryId: 'HLTNA0010_SEARCH_01', param: searchParams2 })
}

const afterSearch = res => {
  positionDivs.value = _.cloneDeep(res.ORESULT_CUR1)
  let isEditable = searchParams.POSITION_DIV === '03'
  
  const columnLayout = [
    'CHECK_DATE2',
    'CHECK_TIME2',
    'FEEL_TEMP_MAX',
    'ACTION_NM',
    {
      name: '측정치',
      direction: 'horizontal',
      items: [],
      header: { text: t('측정치') },
    },
  ]

  const tempFields = _.cloneDeep(grdMainProps.fields)
  _.remove(tempFields, col => {
    return col.fieldName.indexOf('ADD_') > -1
  })

  for(let i = 0; i < res.ORESULT_CUR1.length; i++) {
    const row = res.ORESULT_CUR1[i]

    tempFields.push({ fieldName: `ADD_${row.SYS_CD}_TEMP`, dataType: 'number', header: { text: t('온도'), }, width: '75',
      editable: isEditable, editor: { type: 'number', }, styleName: isEditable ? 'editable_column' : '',
    })
    tempFields.push({ fieldName: `ADD_${row.SYS_CD}_HUMI`, dataType: 'number', header: { text: t('습도'), }, width: '75',
      editable: isEditable, editor: { type: 'number', },  styleName: isEditable ? 'editable_column' : '',
    })
    tempFields.push({ fieldName: `ADD_${row.SYS_CD}_FEEL_TEMP`, dataType: 'number', header: { text: t('체감온도'), }, width: '75', 
      editable: false,
    })

    const layout = {
      name: `${row.SYS_CDNM}`,
      direction: 'horizontal',
      items: [
        `ADD_${row.SYS_CD}_TEMP`,
        `ADD_${row.SYS_CD}_HUMI`,
        `ADD_${row.SYS_CD}_FEEL_TEMP`
      ],
      header: { text: t(`${row.SYS_CDNM}`) },
    }

    columnLayout[4].items.push(layout)
  }

  grdMainProps.columns = grdMainProps.fields = tempFields
  grdMainProps.columnLayout = columnLayout

  grdMain.value.getDataProvider().setFields(grdMainProps.fields)
  grdMain.value.getGridView().setColumns(grdMainProps.columns)
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)

  const resultData = []
  const defaultCols = [
    'CMPNY_DIV',
    'POSITION_DIV',
    'POSITION_DIV_NM',
    'CHECK_DATE',
    'CHECK_DATE2',
    'CHECK_TIME',
    'CHECK_TIME2',
    'FEEL_TEMP_MAX',
    'ACTION_CD',
    'ACTION_NM',
  ]

  for(let i = 0; i < res.ORESULT_CUR2.length; i++) {
    const row = res.ORESULT_CUR2[i]

    if(!_.some(resultData, {
      CMPNY_DIV: row.CMPNY_DIV,
      POSITION_DIV: row.POSITION_DIV,
      CHECK_DATE: row.CHECK_DATE,
      CHECK_TIME: row.CHECK_TIME,
    })) {
      let redFlag = true
      const addData = {}
      const filtered = _.filter(res.ORESULT_CUR2, {
        CMPNY_DIV: row.CMPNY_DIV,
        POSITION_DIV: row.POSITION_DIV,
        CHECK_DATE: row.CHECK_DATE,
        CHECK_TIME: row.CHECK_TIME,
      })

      defaultCols.forEach(el => { addData[el] = row[el] })
      for(let j = 0; j < filtered.length; j++) {
        const row2 = filtered[j]

        addData[`ADD_${row2.POSITION_ID}_TEMP`] = row2.TEMP
        addData[`ADD_${row2.POSITION_ID}_HUMI`] = row2.HUMI
        addData[`ADD_${row2.POSITION_ID}_FEEL_TEMP`] = row2.FEEL_TEMP

        /* 대표체감온도: 장소중 MAX일때 */
        // if(redFlag && row2.FEEL_TEMP === row2.FEEL_TEMP_MAX && row2.FEEL_TEMP != null && row2.FEEL_TEMP != undefined) {
        //   redFlag = false
        //   addData.RED_COL = `ADD_${row2.POSITION_ID}_FEEL_TEMP`
        // }
      }

      /* 대표체감온도: 백엽상일때 */
      if(!chkEmpty(addData.FEEL_TEMP_MAX)) {
        addData.RED_COL = `ADD_${props.positionDiv === '01' ? '1033' : (props.positionDiv === '02' ? '1031' : '0001')}_FEEL_TEMP`
      }
      
      addData.ACTION_NM = addData.ACTION_NM.replace(/, /gi, '\n')

      resultData.push(addData)
    }
  }
  
  grdMain.value.getDataProvider().setRows(resultData)

  grdMain.value.getGridView().setOptions({
    checkBar: { visible: isEditable, }
  })
}

const mainCheck = () => {
  return true
}

const saveData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    positionDivs.value.forEach(item => {
      const saveParam = {
        CMPNY_DIV: data.CMPNY_DIV,
        POSITION_DIV: data.POSITION_DIV,
        POSITION_ID: item.SYS_CD,
        CHECK_DATE: data.CHECK_DATE,
        CHECK_TIME: data.CHECK_TIME,
        TEMP: data[`ADD_${item.SYS_CD}_TEMP`],
        HUMI: data[`ADD_${item.SYS_CD}_HUMI`],
      }

      saveParams.push(saveParam)
    })
  }

  // console.log('saveParams', saveParams)

  return commonExecuteApi({ queryId: 'HLTNA0010_SAVE_01', list: saveParams })
}

const deleteData = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  // console.log('deleteParams', deleteParams)

  return commonExecuteApi({ queryId: 'HLTNA0010_DELETE_01', list: deleteParams })
}

const updateCheckTime = e => {
  if(searchParams.CHECK_TIME.length > 0 && searchParams.CHECK_TIME[searchParams.CHECK_TIME.length - 1] === '') {
    searchParams.CHECK_TIME = ['']
  } else {
    _.remove(searchParams.CHECK_TIME, el => {
      return el === ''
    })
  }

  const sorted = _.sortBy(searchParams.CHECK_TIME)
  searchParams.CHECK_TIME = sorted
}

onMounted(() => {
  nextTick(() => {
    menuTitle.value.setBtnProperty('btnSearch2', 'text', '문자발송이력')

    setCheckTime()
    grdMain.value.getGridView().setFixedOptions({ colCount: 4 })
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })

    grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = { style: { 'background-color': '' } }
      const data = grdMain.value.getDataProvider().getJsonRow(dataCell.index.dataRow)

      if(data.CHECK_TIME === '0930' || data.CHECK_TIME === '1430' || data.CHECK_TIME === '1630' || data.CHECK_TIME === '1830') {
        if(dataCell.dataColumn.fieldName === 'FEEL_TEMP_MAX') {
          if(dataCell.value != null && dataCell.value != undefined) {
            if(dataCell.value * 1 >= 33) {
              ret.style = { 'background-color': '#f79090' }
            } else {
              ret.style = { 'background-color': '#adf9ad' }
            }
          }
        } else {
          if(dataCell.dataColumn.fieldName === data.RED_COL) {
            if(data.FEEL_TEMP_MAX >= 33) {
              ret.style = { 'background-color': '#f79090' }
            } else {
              ret.style = { 'background-color': '#adf9ad' }
            }
          }
        }
      }
      
      return ret
    })

    onButtonsClick({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="px-3 py-0">
      <IMenuTitle
        ref="menuTitle"
        hidden-manuel
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnSearch2']" 
        @click-button="onButtonsClick"
      >
        <template #editors>
          <div style="font-size: 16px; color: #000000;">
            [ 온열질환 예방 기본 조치 : 관리감독자  작업자 건강 상태 상시 확인, 적정 휴식부여, 혹서일/혹서기 중식 휴게시간 연장 ]
          </div>
        </template>
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex align-center">
            <i-input
              label-width="30px"
              width="180px" 
              :label="$t('기간')" type="date"
              v-model="searchParams.FROM_DT"
              margin="10px"
            />
            <i-input
              width="160px"
              :label="$t('~')" type="date"
              v-model="searchParams.TO_DT"
            />
            <i-select
              label-width="30px"
              :label="$t('시간')"
              v-model="searchParams.CHECK_TIME"
              :items="codeList.CHECK_TIME"
              item-value="COD"
              item-title="TXT"
              width="350px"
              margin="10px"
              multiple
              @update:modelValue="updateCheckTime"
            />
            <v-checkbox
              v-show="isAdmin"
              v-model="searchParams.IS_DETAIL"
              label="상세정보 보기"
              true-value="Y"
              false-value="N"
              class="mR-25"
              @update:model-value="setCheckTime"
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
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </div> 
    </v-card-text>

    <HLTNA0010Popup01 ref="smsHistory" />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 276px);
  overflow-y: auto;
  > div {
    min-height: 500px;
  }
}

::v-deep(.rg-grid) {
  .rg-data-row {
    td:last-child {
      border-right: 1px solid #DFE3EF !important;
    }
  }

  .rg-header-cell:last-child {
    border-right: 1px solid #DFE3EF !important;
  }
}
</style>