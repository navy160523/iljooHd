<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import SRMAA0070Popup01 from '@/pages/40_safety-risk/SRM_A/Popup/SRMAA0070Popup01.vue'
import SRMAA0030Popup01 from '@/pages/40_safety-risk/SRM_A/SRMAA0030Popup01.vue'

defineOptions({
  name: '40_safety-risk-SRM_A-SRMAA0070',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t
const menuTitle = ref(null)
const userLogStore = useLogsStore()
const userStore = useUserStore()
const grdMain = ref(null)

const dashPop = ref(null)
const detailPop = ref(null)
const showDetail = ref(false)

const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)

const grdProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: isAdmin.value ? true : false },
  }, 
  fields: [
    { fieldName: 'TASK_SEQ', dataType: 'text', header: { text: t('통합관리번호'), }, width: '100', },
    { fieldName: 'REG_DT', dataType: 'text', header: { text: t('등록일자'), }, width: '100', },
    { fieldName: 'RISK_NM', dataType: 'text', header: { text: t('제목'), }, styleName: 'left-column multiline-editor rg_blue', width: '250', },
    { fieldName: 'THUMBNAIL', dataType: 'text', header: { text: t('썸네일'), },
      renderer: { width: '290', type: 'image', imageField: 'THUMBNAIL', imageHeight: 150, },
      width: '290', },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('담당부서'), }, width: '125', },
    { fieldName: 'RESULT_NM', dataType: 'text', header: { text: t('진행상태'), }, width: '150', },
    { fieldName: 'IMP_FI_DT', dataType: 'text', header: { text: t('개선기간'), }, styleName: 'multiline-editor', width: '125',
      renderer: {
        type: 'html',
        callback: function (grid, model, width, height) {
          let daysDifference = ''

          if (dayjs(model.value).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(+' + dayjs().diff(dayjs(model.value), 'day') + ' Days)'
          } else if (dayjs(model.value).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(D-Day)'
          } else {
            daysDifference = ''
          }

          return '<span>~ '+ dayjs(model.value).format('YYYY-MM-DD') + '</span><br/>' + '<span style=\'color: red;\'>' + daysDifference + '</span>'
        }
      } },
    { fieldName: 'TASK_NO_1', dataType: 'text', header: { text: t('Hi-SAFE'), }, width: '100', },
    { fieldName: 'TASK_NO_4', dataType: 'text', header: { text: t('S.O.M'), }, width: '100', },
    { fieldName: 'TASK_NO_2', dataType: 'text', header: { text: t('안전긴급예산'), }, width: '100',
      visible: isAdmin.value ? true : false, },
    { fieldName: 'TASK_NO_3', dataType: 'text', header: { text: t('리스크공모전'), }, width: '100',
      visible: isAdmin.value ? true : false, },
    { fieldName: 'HRZN_STATUS_NM', dataType: 'text', header: { text: t('횡전개 진행상태'), }, width: '100', },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().format('YYYY-01-01'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
})

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch2') {
    dashPop.value.openPopup()
  } else if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btnId === 'btnPrint') {
    excelData()
  } else if(btnId === 'btnDelete') {
    deleteData()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SRMAA0070_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const excelData = () => {
  const excelFileNM = searchParams.FROM_DT + '~' + searchParams.TO_DT + ' 전사 횡전개 제안 검토'
    
  if (grdMain.value.getDataProvider().getRows().length === 0) {
    return Message.warn('조회된 데이터가 없습니다.')
  }

  grdMain.value.getGridView().exportGrid({ 
    type: 'excel',
    target: 'local',
    fileName: excelFileNM,
    progressMessage: '엑셀 다운로드중입니다.', 
    showProgress: true, 
    indicator: 'visible', 
    header: 'visible', 
    footer: 'hidden', 
    allColumns: false,
    lookupDisplay: true,
    exportTemplate: true,
    exportImage: true,
  })
}

const deleteData = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows()

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    deleteParams.push(data)
  }

  vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId: 'SRMAA0030_DELETE_01',
        list: deleteParams
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
          onButtonsClick({ id: 'btnSearch' })
        }
      }).catch(err => {
        return Message.err(err)
      })
    }
  })
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  if(clickData.fieldName === 'RISK_NM') {
    const currData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    detailPop.value.popupOpen(currData)
    showDetail.value = true

    // 조회수 증가
    commonExecuteApi({ queryId: 'SRMAA0060_SAVE_02', list: [currData] })
  }
}

onMounted(() => {
  nextTick(() => {
    menuTitle.value.setBtnProperty('btnSearch2', 'text', '현황')

    if(!isAdmin.value) {
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
    }

    // grdMain.value.getGridView().displayOptions.fitStyle = 'none'
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch2', 'btnSearch', 'btnDelete', 'btnPrint']" 
        @click-button="onButtonsClick"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.FROM_DT"
                :label="$t('등록기간')" 
                width="200px"
                type="date" 
                margin="10px"
              /> 
              <i-input 
                v-model="searchParams.TO_DT"
                :label="$t('~')" 
                label-width="10px"
                width="165px"
                type="date"
              />
            </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div> 
    </v-card-text>

    <SRMAA0070Popup01 ref="dashPop" />

    <v-dialog
      v-model="showDetail"
      eager
      persistent
      width="1000"
      height="850"
      class="p-absolute user-select-none"
    >
      <SRMAA0030Popup01 
        ref="detailPop" 
        @close="showDetail = false" 
        @selected="showDetail = false, onButtonsClick({id: 'btnSearch'})" 
        :isAdminDiv="true" 
        :btnList="['btnDupSearch', 'btnTemporaryStorage', 'btnUpdate', 'btnDelete', 'btnClose']"
      /> 
    </v-dialog>
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

.light-div {
  width: 25px;
  height: 25px;
  border-radius: 50%;
}

.light__0 {
  background-color: #aaaaaa;
  border: 1px solid #888888;
}

.light__1 {
  background-color: #7fff00;
  border: 1px solid #5bbb00;
}

::v-deep(.rg-grid) {
  .rg-image-renderer {
    img {
      padding: 6px;
    }
  }
}
</style>