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
const grdSub = ref(null)
const elYn = ref(true)


const options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    ORGN_DIV: 'A',
    BSNS_CD: '',
    ASGN_NM: '',
    DEPT_CD: '',
    TO_TEAM: 'N', //팀이름까지 조회하는 플래그값
    EMP_NO: '',
    EMP_NM: '',
    RETI_TMP_DATE: '',
    FLAG: 'N',
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
    { name: '단기공사', code: 'D' },
    { name: '기타', code: 'Z' },
  ],
})

const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false },  stateBar: { visible: false }, rowIndicator:{visible: false } },
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

const grdSubProps = reactive({
  gridViewOption: { edit: { editable: false },  stateBar: { visible: false }},
  field: [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('부서') }, width: '200'},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직급') }},
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내번호') }},
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.field

//메뉴버튼
const onButtonsClick = (btn) => {
  elYn.value = true
  if (btn.id === "btnSearch") {
    if(options.values.ORGN_DIV === 'Z' || (options.values.EMP_NO || options.values.EMP_NM)){
      elYn.value = false
      let param = {
        CMPNY_DIV: options.values.CMPNY_DIV,
        BSNS_CD: options.values.BSNS_CD,
        DEPT_CD: options.values.DEPT_CD,
        ASGN_CD: options.values.ASGN_CD,
        USER_DIV: options.values.ORGN_DIV,
        EMP_NO: options.values.EMP_NO,
        EMP_NM: options.values.EMP_NM,
        RETI_TMP_DATE: '',
        FLAG: 'N',
      }
      onCellClicked('', {cellType: 'data2' , param: param})
    }else {
      elYn.value = true
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
    }
    
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

  // grdMain.value.getGridView().setColumnProperty('ASGN_NM' , 'autoFilter', true) 
}

const onSelect = () => {
  let rowIdx = grdSub.value.getGridView().getCurrent().dataRow

  let rtnData = grdSub.value.getDataProvider().getJsonRow(rowIdx)

  emit("selected", rtnData)
  onClose()
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    let param = {
      CMPNY_DIV: data.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      ASGN_CD: data.ASGN_CD,
      USER_DIV: options.values.ORGN_DIV,
      EMP_NO: '',
      EMP_NM: '',
      RETI_TMP_DATE: '',
      FLAG: 'N',
    }

    if(param.DEPT_CD){
      commonSearchApi({ queryId : 'searchEMP', param: param }).then(res => {
        grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }else {
      grdSub.value.getDataProvider().setRows([])
    }
  }else if(clickData.cellType === 'data2'){
    commonSearchApi({ queryId : 'searchEMP', param: clickData.param }).then(res => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const openPopup = () => {
  dialog.value = true 
  onButtonsClick({id: 'btnSearch'})
}

const onClose = () => {
  // grdMain.value.getGridView().setColumnProperty('ASGN_NM' , 'autoFilter', false)
  options.values.EMP_NO = ''
  options.values.EMP_NM = ''
  options.values.ORGN_DIV = 'A'

  grdSub.value.getDataProvider().setRows([])

  dialog.value = false
}

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), // 사업부
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

  })
}

const changeBSNS_CD = e => {
  codeList.bsnsCd = []
  Promise.all([
    commonSearchApi({queryId: 'searchBSNS', param: { CMPNY_DIV: e, USE_DIV: 'N' }}) 
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    options.values.BSNS_CD = ''

    onButtonsClick({id: 'btnSearch'})
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
    width="1350"
    height="850"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>사원 검색</span>
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
                @update:modelValue="changeBSNS_CD"
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
              <div class="d-flex align-center mr-4">
                <VRadioGroup
                  v-model="options.values.ORGN_DIV"
                  class="mt-auto mb-1"
                  inline
                  @update:modelValue="onButtonsClick({id:'btnSearch'})"
                >
                  <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
                </VRadioGroup>
              </div>
              <i-input 
                v-model="options.values.EMP_NO"
                :label="$t('사번')"
                label-width="50px" 
                width="180px"
                top-label
                @keydown.enter="onButtonsClick({id:'btnSearch'})"
              />
              <i-input 
                v-model="options.values.EMP_NM"
                :label="$t('이름')"
                label-width="50px" 
                width="180px"
                top-label
                @keydown.enter="onButtonsClick({id:'btnSearch'})"
              />
            </div>
          </v-sheet>
          <div class="h-grow">
            <v-sheet class="pa-0 h-auto mr-3" width="40%" v-if="elYn" :key="elYn">
              <RealGrid
                ref="grdMain"
                is-tree
                :gridViewOption="grdMainProps.gridViewOption"
                :fields="grdMainProps.field"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
            <v-sheet class="pa-0 h-auto" width="60%">
              <RealGrid
                ref="grdSub"
                :gridViewOption="grdSubProps.gridViewOption"
                :fields="grdSubProps.field"
                :columns="grdSubProps.columns"
                @onCellDblClicked="onSelect"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scss="lang" scoped>

</style>