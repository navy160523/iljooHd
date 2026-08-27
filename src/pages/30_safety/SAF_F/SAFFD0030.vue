<!--
화면명 : SLI 현황판 표시 관리
화면개요 : 현황판에 표시할 항목, 설정 관리
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
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import SAFFD0030Popup from '@/pages/30_safety/SAF_F/SAFFD0030Popup.vue'

defineOptions({
  name:'30_safety-SAF_F-SAFFD0030',
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const refIMenuTitle = ref(null)
const refDeptPopup = ref(null)
const refSAFFD0030Popup = ref(null)
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'BSNS_CD', 'DEPT_CD'],
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, mergeRule: { criteria: 'value' }, },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, editable: false, mergeRule: { criteria: 'value' }, },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, styleName: 'left-column' },
    { fieldName: 'ODR', header: { text: t('표시순서1') }, styleName: 'editable_column',
      dataType: 'number', numberFormat: '#,###',
      editor: {
        type: 'number',
        editFormat: '#,###',
        maxIntegerLength: 2,
        maxLengthExceptComma: true,
      } },
    { fieldName: 'ODR2', header: { text: t('표시순서2') }, styleName: 'editable_column',
      dataType: 'number', numberFormat: '#,###',
      editor: {
        type: 'number',
        editFormat: '#,###',
        maxIntegerLength: 2,
        maxLengthExceptComma: true,
      } },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'DISP_BSNS_CD', dataType: 'text', header: { text: t('DISP_BSNS_CD') }, visible: false },
    { fieldName: 'DISP_DEPT_CD', dataType: 'text', header: { text: t('DISP_DEPT_CD') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false },
    { fieldName: 'PART_CD2', dataType: 'text', header: { text: t('PART_CD2') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const cdList = reactive({
  GUBUN: [
    { value: 'A', desc: '전체' },
    { value: '1', desc: '현황판1' },
    { value: '2', desc: '현황판2' }
  ],
  ODR: [],
  ODR2: [],
})

const setInit = () => {
  const temp = []
  const temp2 = []

  for(let i = 1; i <= 12; i++) {
    temp.push({
      id: i,
      desc: '',
    })
  }

  for(let i = 1; i <= 21; i++) {
    temp2.push({
      id: i,
      desc: '',
    })
  }

  cdList.ODR = temp
  cdList.ODR2 = temp2
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ASGN_CD: userStore.asgnCd,
  ASGN_FULL_NM: userStore.asgnFullNm,
})

// console.log('searchParams', searchParams)

const dashboardParams = reactive({
  GUBUN: 'A',
  SECOND: '15',
})

const openDept = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_NM: searchParams.DEPT_NM,
  }

  // console.log('param', param)

  refDeptPopup.value.openPopup(param)
}

const openDashboard = () => {
  refSAFFD0030Popup.value.openPopup(dashboardParams)
}

const onDeptSelected = param => {
  console.log('param', param)

  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.ASGN_SHRT_NM
  searchParams.ASGN_CD = param.ASGN_CD
  searchParams.ASGN_FULL_NM = param.ASGN_FULL_NM
}

const searchMain = async () => {
  return commonSearchApi({ queryId : 'SAFFD0030_SEARCH_01', param: searchParams })
}

const afterSearchMain = res => {
  const el = document.getElementsByClassName('data--wrap')

  for(let i = 0; i < el.length; i++) {
    el[i].classList.remove('used-odr')
  }
  
  const data = res.ORESULT_CUR

  // console.log('afterSearchMain res', data)

  cdList.ODR.forEach(odr => {
    if(_.find(data, { ODR: odr.id })) {
      odr.desc = `${odr.id} : ${_.find(data, { ODR: odr.id }).DEPT_NM}`
    } else {
      odr.desc = odr.id
    }
  })

  cdList.ODR2.forEach(odr => {
    if(_.find(data, { ODR2: odr.id })) {
      odr.desc = `${odr.id} : ${_.find(data, { ODR2: odr.id }).DEPT_NM}`
    } else {
      odr.desc = odr.id
    }
  })

  grdMain.value.getDataProvider().setRows(data)
}

const btnSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMain)
    .setAfter(afterSearchMain)
    .run()
}

const mainCheck = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  const datas = grdMain.value.getDataProvider().getJsonRows()
  // console.log('datas', datas)

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
    // console.log('row', row)
    // console.log('abc', _.filter(datas, { ODR2: row.ODR2 }))

    if(row.ODR !== undefined && row.ODR !== null && _.filter(datas, { ODR: row.ODR }).length > 1) {
      Message.warn(t(`표시순서1이(가) 중복됩니다.(${row.BSNS_NM} - ${row.PART_NM} - ${row.DEPT_NM})`))

      return false
    }

    if(row.ODR2 !== undefined && row.ODR2 !== null && _.filter(datas, { ODR2: row.ODR2 }).length > 1) {
      Message.warn(t(`표시순서2이(가) 중복됩니다.(${row.BSNS_NM} - ${row.PART_NM} - ${row.DEPT_NM})`))

      return false
    }
  }

  return true
}

const saveData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows()

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'SAFFD0030_SAVE_01', list: saveParams })
}

const btnUpdate = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(mainCheck)
    .setQuery(saveData)
    .setAfter(res => {
      btnSearch()
    })
    .run()
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    btnSearch()
  } else if(btn.id === 'btnUpdate') {
    btnUpdate()
  }
}

const onCellEdited = (grid, itemIndex, row, field) => {
  // console.log('grid', grid)
  // console.log('itemIndex', itemIndex)
  // console.log('row', row)
  // console.log('field', field)

  const rows = grdMain.value.getDataProvider().getJsonRows()

  const el = document.getElementsByClassName('data--wrap')

  for(let i = 0; i < el.length; i++) {
    el[i].classList.remove('used-odr')
  }
  
  for(let i = 0 ; i < rows.length; i++) {
    const odr = rows[i].ODR
    const odr2 = rows[i].ODR2

    if(odr) {
      const el = document.getElementsByClassName(`ODR-${odr}`)[0]
      
      if(el) {
        el.classList.add('used-odr')
      }
    }
    
    if(odr2) {
      const el = document.getElementsByClassName(`ODR2-${odr2}`)[0]

      if(el) {
        el.classList.add('used-odr')
      }
    }
  }
}

onMounted(() => {
  setInit()
  btnSearch()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="refIMenuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="d-flex">
            <i-input
              :label="$t('조회/저장조직')"
              v-model="searchParams.ASGN_FULL_NM"
              readonly
              required
              width="450px"
              margin="5px"
              append-inner-icon="mdi-magnify"
              @click:append-inner="openDept"
            />
            <i-input
              v-model="searchParams.ASGN_CD"
              readonly
              width="150px"
            />
          </div>
          <div class="d-flex align-center">
            <div class="formLabelText mr-5">
              {{ $t('표시 선택') }}
            </div>
            <VRadioGroup
              class="mr-5"
              v-model="dashboardParams.GUBUN"
              inline
            >
              <VRadio
                v-for="(item, idx) in cdList.GUBUN"
                :key="`gubun__${idx}`"
                :label="item.desc"
                :value="item.value"
              />
            </VRadioGroup>
            <i-input
              :label="$t('화면전환(초)')"
              v-model="dashboardParams.SECOND"
              reverse
              width="150px"
              margin="6px"
              oninput="javascript: this.value = this.value.replace(/[^0-9.]/gi, '').replace(/(\..*)\./gi, '$1');"
            />
            <VBtn
              class="titleBtn"
              @click.stop="openDashboard"
            >
              현황판표시
            </VBtn>
          </div>
        </v-sheet>
        <div class="h-grow overflow-hidden">
          <v-sheet width="65%" class="pa-0 h-auto mr-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @on-cell-edited="onCellEdited"
            />
          </v-sheet>
          <v-sheet width="35%" class="pa-0 h-auto">
            <div class="div--panels h-full pa-2 overflow-y-auto">
              <div class="div--panels__odr">
                <div class="title--odr text-center">
                  현황판 1 표시순서
                </div>
                <div class="panel--odr">
                  <div
                    class="row--odr d-flex mt-2 mx-n1"
                    v-for="odrRowIdx in (cdList.ODR.length / 3)"
                    :key="`row--odr__${odrRowIdx}`"
                  >
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR-${odrRowIdx * 3 - 2}`">
                        {{ cdList.ODR[odrRowIdx * 3 - 3].desc }}
                      </div>
                    </div>
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR-${odrRowIdx * 3 - 1}`">
                        {{ cdList.ODR[odrRowIdx * 3 - 2].desc }}
                      </div>
                    </div>
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR-${odrRowIdx * 3}`">
                        {{ cdList.ODR[odrRowIdx * 3 - 1].desc }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="div--panels__odr2 mt-2">
                <div class="title--odr text-center">
                  현황판 2 표시순서
                </div>
                <div class="panel--odr2">
                  <div
                    class="row--odr d-flex mt-2 mx-n1"
                    v-for="odrRowIdx in (cdList.ODR2.length / 3)"
                    :key="`row--odr__${odrRowIdx}`"
                  >
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR2-${odrRowIdx * 3 - 2}`">
                        {{ cdList.ODR2[odrRowIdx * 3 - 3].desc }}
                      </div>
                    </div>
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR2-${odrRowIdx * 3 - 1}`">
                        {{ cdList.ODR2[odrRowIdx * 3 - 2].desc }}
                      </div>
                    </div>
                    <div class="data--odr px-1">
                      <div class="data--wrap d-flex justify-center align-center" :class="`ODR2-${odrRowIdx * 3}`">
                        {{ cdList.ODR2[odrRowIdx * 3 - 1].desc }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <DeptPopup 
      ref="refDeptPopup" 
      @selected="onDeptSelected"
    />

    <SAFFD0030Popup ref="refSAFFD0030Popup" />
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

.row--grid {
  height: calc(100vh - 322px);
}

.div--panels {
  border: 1px solid #cccccc;
  border-radius: 7px;

  .title--odr {
    color: #000000;
    font-size: 20px;
  }

  .data--odr {
    width: 50%;

    .data--wrap {
      border: 2px solid rgb(160, 224, 224);
      border-radius: 4px;
      background-color: rgb(192, 255, 255);
      height: 84px;
      padding: 0 8px;
      color: #000000;
      font-size: 16px;
    }
  }
}

.used-odr {
  border-color: #0000ff !important;
  background: #aaddff !important;
}
</style>