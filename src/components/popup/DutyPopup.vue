<script setup>
import { ref, reactive, onMounted } from 'vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const grdMain = ref(null)
const dialog = ref(false)
const userStore = useUserStore() //유저정보

const props = defineProps({
  readOnlyBsns: {
    type: Boolean,
    default: false,
  },
  readOnlyDept: {
    type: Boolean,
    default: false,
  },
  readOnlyDiv: {
    type: Boolean,
    default: false,
  },
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  USER_DIV: userStore.userDiv, //조직구분
  BSNS_CD: userStore.bsnsCd, //사업부코드
  DEPT_CD: userStore.deptCd, //부서코드
  UNT_DUTY_NM: '', //직무명
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    closePopup()
  }
}

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'Y' },
    }), // 사업부
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
  })
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SEARCH_DUTY_INFO',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//그리드 속성셋팅
const grdMainProps = reactive({
  field: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '90',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '90',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'STD_DUTY_CD',
      dataType: 'text',
      width: '90',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'UNT_DUTY_CD',
      dataType: 'text',
      width: '90',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'STD_DUTY_NM',
      dataType: 'text',
      width: '90',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'UNT_DUTY_NM',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('직종명') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (data) => {
  dialog.value = true
  if (data) {
    searchParam.BSNS_CD = data.BSNS_CD
    searchParam.DEPT_CD = data.DEPT_CD
  }
  onButtonsClick({ id: 'btnSearch' })
}

const closePopup = () => {
  dialog.value = false
  //searchParam.BSNS_CD = ''
  //searchParam.DEPT_CD = ''
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  emit('selected', data)
  closePopup()
}

// 사업부가 바뀌면 부서 데이터 가져오기
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV: 'Y',
      },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

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
    height="780"
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
      <span>직종 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle :use-permission="false" :button-list="['btnSearch', 'btnClose']" @click-button="onButtonsClick" />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div>
              <v-radio-group v-model="searchParam.USER_DIV" inline :disabled="props.readOnlyDiv">
                <v-radio label="전체" value=""></v-radio>
                <v-radio label="직영" value="A"></v-radio>
                <v-radio label="협력사" value="B"></v-radio>
              </v-radio-group>
            </div>
            <div class="d-flex">
              <i-select
                top-label
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                :label="$t('사업부')"
                width="200px"
                v-model="searchParam.BSNS_CD"
                :readonly="props.readOnlyBsns"
              >
              </i-select>
              <i-select
                top-label
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                :label="$t('부서')"
                width="200px"
                v-model="searchParam.DEPT_CD"
                :readonly="props.readOnlyDept"
              >
              </i-select>
            </div>
            <div class="mt-2">
              <i-input
                top-label
                v-model="searchParam.UNT_DUTY_NM"
                width="250px"
                :label="$t('직종명')"
                @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              >
              </i-input>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              style="height: 450px"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
