<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

const options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    ORGN_DIV: 'A',
    BSNS_CD: '',
    ASGN_NM: '',
    DEPT_CD: '',
    TO_TEAM: 'Y', //팀이름까지 조회하는 플래그값
  },
})

//코드리스트
const codeList = reactive({
  company: [],
  orgnDiv: [],
  bsnsCd: [],
  orgnDiv: [
    { name: '직영', code: 'A' },
    { name: '사내협력사', code: 'B' },
  ],
})

const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false },  stateBar: { visible: false }},
  field: [
    { fieldName: 'C_PATH', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false  },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('조직명') }, width: 'auto' },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('코드') }, width: '30' },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnSelect") {
    onSelect()
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: "searchDeptTree", param: options.values })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'C_PATH')

  /* ***** tree grid 전체 확장 ***** */
  grdMain.value.getGridView().expandAll()
}

const onSelect = () => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  emit("selected", rtnData)
  onClose()
}

const openPopup = val => {
  if(val){
    options.values.ORGN_DIV = val.ORGN_DIV
    options.values.BSNS_CD = val.BSNS_CD
    options.values.ASGN_NM = val.ASGN_NM
    options.values.DEPT_CD = val.DEPT_CD
    options.values.TO_TEAM = val.TO_TEAM //팀이름까지 조회하는 플래그값
  } else {
    options.values.ORGN_DIV = 'A'
    options.values.BSNS_CD = ''
    options.values.ASGN_NM = ''
    options.values.DEPT_CD = ''
    options.values.TO_TEAM = 'Y' //팀이름까지 조회하는 플래그값
  }
  dialog.value = true 
  grdMain.value.getGridView().filterPanel.visible = true
  onButtonsClick({id: 'btnSearch'})
}

const onClose = () => {
  grdMain.value.getGridView().setColumnProperty('ASGN_NM' , 'autoFilter', false)
  options.values.BSNS_CD = ''
  options.values.ASGN_NM = ''
  options.values.DEPT_CD = ''

  dialog.value = false
  // 2025.05.27 손상규 
  // 필터패널 사용 후 다시 팝업오픈시 필터에 값이 남아있는 문제때문에 추가함
  grdMain.value.getGridView().filterPanel.clearInput()
}

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

  })
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
})

</script>
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="700"
    height="800"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>조직 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                v-model="options.values.CMPNY_DIV"
                top-label
                :label="$t('회사구분')"
                width="200px"
                :items="codeList.company"
                item-value="COD"
                item-title="TXT"
                disabled
              />
              <i-select
                v-model="options.values.BSNS_CD"
                top-label
                :label="$t('사업부')"
                width="200px"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="onButtonsClick({id:'btnSearch'})"
              />
              <div class="d-flex align-center">
                <VRadioGroup
                  v-model="options.values.ORGN_DIV"
                  class="mt-auto mb-1"
                  inline
                  readonly
                  @update:modelValue="onButtonsClick({id:'btnSearch'})"
                >
                  <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
                </VRadioGroup>
              </div>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              is-tree
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onSelect"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scss="lang" scoped>

</style>