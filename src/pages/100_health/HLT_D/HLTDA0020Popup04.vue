<!--
  화면명 : 경고표지 출력 그리드
  화면개요 : 경고표지 출력 그리드
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

// 리포트
const reportName = ref('/manage/hse/HLTDA0020_1.ozr')
const reportParam = ref([])
const showOz = ref(false)

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  SAUPBU: '',
  DEPT_CD: '',
  VNDCOD: '',
  MATNO: '',
  MSDS_NM: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN', width: '30', dataType: 'text', header: { text: t('구분') }, },
    { fieldName: 'CAPACITY', width: '60', dataType: 'text', editable: false, header: { text: t('용기용량') }, },
    { fieldName: 'STICKER_SIZE', width: '60', dataType: 'text', editable: false, header: { text: t('스티거 크기') }, },
    { fieldName: 'SELECTION', width: '30', dataType: 'text', editable: false, header: { text: t('선택') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<button 
            class="v-btn" 
            style="color: #fff; background: #1a40c7; padding: 4px;"
          >출력</button>`;
          return str;
        },
      },
    },

  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈 시 실행
const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.SAUPBU = param.SAUPBU
  searchParams.VNDCOD = param.VNDCOD
  searchParams.MATNO = param.MATNO
  searchParams.MSDS_NM = param.MSDS_NM
  grdMain.value.getGridView().setRowIndicator({visible: false})
  grdMain.value.getDataProvider().setRows( [
    { GBN: '소', CAPACITY: '5ℓ미만', STICKER_SIZE: '9㎝ x 6㎝', SELECTION: '' },
    { GBN: '중', CAPACITY: '5ℓ≤ 용량 < 50ℓ', STICKER_SIZE: '12㎝ x 8㎝', SELECTION: '' },
    { GBN: '대', CAPACITY: '50ℓ≤ 용량 < 200ℓ', STICKER_SIZE: '18㎝ x 12㎝', SELECTION: '' },
    { GBN: '특대', CAPACITY: '200ℓ 이상', STICKER_SIZE: '27㎝ x 18㎝', SELECTION: '' },
  ])

  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false 
}

// 출력 버튼 클릭
const onCellItemClicked = (grid, index, col) => {
  // let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if(col.target.className === 'v-btn' && col.column === 'SELECTION') {
    if(index.dataRow == 0) {
      reportName.value = ref('/manage/hse/HLTDA0020_1.ozr')
    } else if (index.dataRow == 1) {
      reportName.value = ref('/manage/hse/HLTDA0020_2.ozr')
    } else if (index.dataRow == 2) {  
      reportName.value = ref('/manage/hse/HLTDA0020_3.ozr')
    } else if (index.dataRow == 3) {
      reportName.value = ref('/manage/hse/HLTDA0020_4.ozr')
    }
    print()
  }
}

//출력 관련 로직 시작
const print = () => {
  reportParam.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_DEPT_CD=' + searchParams.DEPT_CD,
    'IN_VNDCOD=' + searchParams.VNDCOD,
    'IN_SAUPBU=' + searchParams.SAUPBU,
    'IN_MATNO=' + searchParams.MATNO,
    'IN_MSDS_NM=' + searchParams.MSDS_NM,
  ]

  showOz.value = true
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
    width="500"
    height="400"
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
      <span>경고표지 출력 팝업</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :title="$t('출력 크기 선택')"
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
                style="height: 170px;"
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
    <!-- 출력 -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="reportParam"
      @close="showOz = $event"
    ></OZReport>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
