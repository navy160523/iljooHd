<!--
  화면명 : 건강관리대상자 사후관리 현황 계획등록
  화면개요 : 건강관리대상자 사후관리 현황 계획등록
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import HLTKC0020Popup01 from '@/pages/100_health/HLT_K/HLTKC0020Popup01.vue'
import HLTKC0020Popup03 from '@/pages/100_health/HLT_K/HLTKC0020Popup03.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const hltkc0020Popup01 = ref(null)
const hltkc0020Popup03 = ref(null)
const type = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: '',
  VEND_CD: '',
  VEND_NAME: '',
  EMP_NO: '',
  YEAR: '',
  BIRTH_DAY: '',
  UNFIT_RES_NAME: ''
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'KOR_NM', width: '60', dataType: 'text', header: { text: t('성명') }, },
    { fieldName: 'IDX_SEQ', width: '40', dataType: 'text', styleName: 'right-column', header: { text: t('차수') }, },
    { fieldName: 'INSERT_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('등록일자') }, },
    { fieldName: 'BTN', width: '40', dataType: 'text', header: { text: t('상태') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let confirm = ''
          if(type.value == 'A') {
            if(grid.getValue(cell.index.itemIndex, 'IDX_SEQ') == '1' && grid.getValue(cell.index.itemIndex, 'STD_CONFIRM_YN') != 'Y') {
              confirm = 'C'
            } else {
              confirm = grid.getValue(cell.index.itemIndex, 'STD_CONFIRM_YN')
            }
          } else {
            if(grid.getValue(cell.index.itemIndex, 'STD_CONFIRM_YN') != 'Y') {
              confirm = 'C'
            } else {
              confirm =  grid.getValue(cell.index.itemIndex, 'CONFIRM_YN')
            }
          }
          // let confirm = type.value == 'A' ? 
          //   grid.getValue(cell.index.itemIndex, 'STD_CONFIRM_YN') : (grid.getValue(cell.index.itemIndex, 'STD_CONFIRM_YN') != 'Y' ?
          //      'C' : grid.getValue(cell.index.itemIndex, 'CONFIRM_YN'))
          let btnBackColor = confirm == 'Y' ? '#1eaf1e' : '#919191'
          let btnValue = confirm == 'Y' ? '완료' : '미등록'
          var str =             
            `<button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px; height:22px; width: 43px;"
            >${btnValue}</button>`
          return str
        },
      }
    },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'STD_CONFIRM_YN', dataType: 'text', header: { text: t('계획최종저장') }, visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text', header: { text: t('순번') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param, popupType) => {
  grdMain.value.getGridView().filterPanel.visible = true
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.VEND_CD = param.VEND_CD
  searchParams.VEND_NAME = param.VEND_NAME
  searchParams.EMP_NO = param.EMP_NO
  searchParams.YEAR = param.YEAR
  searchParams.BIRTH_DAY = param.BIRTH_DAY + ' (' + param.AGE_INT + ')'
  searchParams.UNFIT_RES_NAME = param.UNFIT_RES_NAME
  type.value = popupType

  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTKC0020_SEARCH_02', param: { ...searchParams, TYPE: type.value } })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if(col.target.className === 'v-btn' && col.column === 'BTN'){
    let param = {
      ...data,
      VEND_CD: searchParams.VEND_CD,
      VEND_NAME: searchParams.VEND_NAME,
      EMP_NO: searchParams.EMP_NO,
      BIRTH_DAY: searchParams.BIRTH_DAY,
      UNFIT_RES_NAME: searchParams.UNFIT_RES_NAME
    }
    if(type.value == 'A') {
      if(grdMain.value.getDataProvider().getJsonRows().length == 1 && 
        data.STD_CONFIRM_YN != 'Y') {
        return Message.warn(t('보건관리계획서 작성을 완료하셔야합니다.'))
      }
      hltkc0020Popup01.value.openPopup(param, 'A')
    } else {
      if(data.STD_CONFIRM_YN != 'Y') {
        return Message.warn(t('계획등록을 완료하셔야 합니다.'))
      }
      hltkc0020Popup03.value.openPopup(param)
    }
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
    width="600"
    height="600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ type == 'A' ? '계획등록' : '실적등록' }}</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 300px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellItemClicked="onCellItemClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
  <HLTKC0020Popup01 ref="hltkc0020Popup01" @after-search="getData"/>
  <HLTKC0020Popup03 ref="hltkc0020Popup03" @after-search="getData"/>
</template>

<style scoped lang="scss">
</style>
