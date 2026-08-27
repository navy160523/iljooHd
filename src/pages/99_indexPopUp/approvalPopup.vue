<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import { commonRequest, commonSearchApi } from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)

const props = defineProps({
  appList: { 
    type: Array, 
    default: '',
  }
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_ID: userStore.userId,
  DTE_FROM: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  DTE_TO: dayjs().format("YYYY-MM-DD"),
})

const ZZ_APP_STATUS_LIST = reactive([
  // { value: '', label: '' },
  { value: 'A', label: '작성중' },
  { value: 'B', label: '결재중' },
  { value: 'C', label: '반려' },
  { value: 'N', label: '미결' },
  { value: 'Y', label: '결재완료' },
  { value: 'Z', label: '취소' },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'ZZ_FORMTITLE', dataType: 'text', width: '240', header: { text: t('제목')}, styleName: 'left-column' },
    // { fieldName: 'ZZ_APP_STATUS', dataType: 'text', width: '100', header: { text: t('결재상태')}, lookupDisplay: true, lookupData: ZZ_APP_STATUS_LIST },
    { fieldName: 'APPROVER', dataType: 'text', width: '70', header: { text: t('결재 요청자')}},
    { fieldName: 'ZZ_APPUP_DATE', dataType: 'text', width: '90', header: { text: t('결재요청일시')}},
    
    { fieldName: 'EMPLID', dataType: 'text', header: { text: t('사번') }, visible: false  },
    { fieldName: 'ZZ_FORMID', dataType: 'text', header: { text: t('결재 아이디') }, visible: false  },
    { fieldName: 'ZZ_CUR_EMPLID', dataType: 'text', header: { text: t('ZZ_CUR_EMPLID') }, visible: false  },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'ZZ_FORMTITLE', dataType: 'text', width: '220', header: { text: t('제목')}, styleName: 'left-column' },
    { fieldName: 'ZZ_APPUP_DATE', dataType: 'text', width: '100', header: { text: t('결재요청일시')}},
    { fieldName: 'ZZ_APP_STATUS', dataType: 'text', width: '70', header: { text: t('결재상태')}, lookupDisplay: true, lookupData: ZZ_APP_STATUS_LIST },
    { fieldName: 'CURRENT_APPROVER', dataType: 'text', width: '100', header: { text: t('현재 결재 대상자')}},
    
    { fieldName: 'EMPLID', dataType: 'text', header: { text: t('사번') }, visible: false  },
    { fieldName: 'ZZ_FORMID', dataType: 'text', header: { text: t('결재 아이디') }, visible: false  },
    { fieldName: 'ZZ_CUR_EMPLID', dataType: 'text', header: { text: t('ZZ_CUR_EMPLID') }, visible: false  },
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

const openPopup = val => {
  dialog.value = true
  onButtonsClick({ id: "btnSearch" })

  grdMain.value.getDataProvider().setRows(props.appList)

  // commonSearchApi({queryId: 'MAINPAGE_SEARCH_08', param: searchParams} ).then(res => {
  //   grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  // })

}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchSub)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
  } else {
    dialog.value = false
  }
}

const searchSub = () => {
  return commonSearchApi({queryId: 'MAINPAGE_SEARCH_08', param: searchParams })
}

const afterSearch = res =>{
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  openPopup
})

</script>
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1350"
    height="730"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>승인ㆍ결재 리스트</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-5">

      <v-card-title class="pa-4 pb-0 pt-2 mb-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
          class="mb-0"
        />

        <v-sheet class="searchArea d-flex" style="margin-top: 10px;">
          <i-input
            v-model="searchParams.DTE_FROM"
            :label="$t('기간')"
            label-width="45px"
            type="date"
            width="210px"
            class="mr-1"
            required
          />
          <i-input
            v-model="searchParams.DTE_TO"
            :label="$t('~')"
            width="180px"
            type="date"
          />
        </v-sheet>

      </v-card-title>

      <v-card-text class="pa-3 pt-0">
        <div class="d-flex fill-height">
          <v-sheet class="flex-column" width="50%" height="88%">
            <IGridTitle
              title="결재 필요 리스트"
              class="mb-0"
            />
            <div class="mb-2 text-blue">
              <!-- <span class="mdi mdi-message-text"></span> -->
              HD오피스에서 결재가 필요한 업무 현황입니다. HD오피스에서 결재 진행 바랍니다.
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <v-sheet class="flex-column ml-2" width="50%" height="88%">
            <IGridTitle
              title="결재 상신 현황"
              class="mb-0"
            />
            <div class="mb-2 text-blue">
              <!-- <span class="mdi mdi-message-text"></span> -->
              HiSEs에서 HD오피스로 결재를 올린 내역과 결재상태 현황입니다.
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
