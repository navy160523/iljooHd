<!--
  화면명 : MNGAA0060Popup2.vue
  화면개요 : 부문별 HSE 중점추진사항 수립 -> HSE 부문별 주요 KPI 등록/수정 팝업 -> 부서 선택
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const readonly = ref(true)

const searchParams = reactive({
  BSNS_CD: '',
  PART_CD:'',
  ORGN_DIV:'',
  ASGN_NM:'',
})

// 코드리스트 선언
const codeList_popup2 = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
})

// 코드리스트 오리지날 선언
const codeList_popup2_orign = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
})

//코드리스트
const codeList = reactive({
  company: [],
  orgnDiv: [],
  bsnsCd: [],
  orgnDiv: [],
})

//코드리스트 셋팅
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

    codeList.orgnDiv = [
      { name: "전체", code: "" },
      { name: "직영", code: "A" },
      { name: "사내협력사", code: "B" },
    ]
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    // grdMain.value.setBindingColumn("CMPNY_DIV", codeList.company, "COD", "TXT") // 회사구분
    // grdMain.value.setBindingColumn("BSNS_CD", codeList.bsnsCd, "BSNS_CD", "BSNS_NM") // 사업부
    // grdMain.value.setBindingColumn("ORGN_DIV", codeList.orgnDiv, "code", "name") // 구분

    if (!userStore.company) {
      codeList.company = null
    }
  })
}

const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  field: [
    { fieldName: "BSNS_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("사업부") }, },
    { fieldName: "ASGN_SHRT_NM", dataType: "text", styleName: "left-column", editable: false, header: { text: t("부서명") }, },

    { fieldName: 'ASGN_CD', dataType: 'text', visible: false},
    
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM',
    'ASGN_SHRT_NM', 
  ]
})

grdMainProps.columns = grdMainProps.field

const openPopup = async (codeList_popup, codeList_popup_orign, saveParams, type) => {

  initCodeList()
  codeList_popup2.BSNS = codeList_popup.BSNS
  codeList_popup2.BUMUN = codeList_popup.BUMUN

  codeList_popup2_orign.BSNS = codeList_popup_orign.BSNS
  codeList_popup2_orign.BUMUN = codeList_popup_orign.BUMUN

  searchParams.BSNS_CD = saveParams.BSNS_CD
  searchParams.PART_CD = saveParams.PART_CD
  searchParams.PREV_CD = saveParams.ASGN_ITEM_CD

  searchParams.ORGN_DIV = 'A'
  
  readonly.value = type === 'CREATE' ? false : true 

  onButtonsClick({ id :'btnSearch' })
  
  dialog.value = true  
}

// 부문 선택 시 사업부 자동으로 변경
const changedBumun = e => {
  let bsnsCd = ''
  if(e){
    codeList_popup2.BUMUN.forEach((list,idx) => {
      if(list.PART_CD === e){
        bsnsCd = codeList_popup2.BUMUN[idx].BSNS_CD
      } 
    })
    searchParams.BSNS_CD = bsnsCd
  }
  changedBsns(searchParams.BSNS_CD, true)
  //POPUP OPEN
}

// 사업부 선택시 부문리스트 자동으로 정리
const changedBsns = (e, ckBumun) => {
  let arr = []
  if(e){
    codeList_popup2_orign.BUMUN.forEach((list, idx) => {
      if(list.BSNS_CD === e){
        arr.push({
          BSNS_CD : codeList_popup2_orign.BUMUN[idx].BSNS_CD,
          PART_CD : codeList_popup2_orign.BUMUN[idx].PART_CD,
          ASGN_SHRT_NM : codeList_popup2_orign.BUMUN[idx].ASGN_SHRT_NM
        })
      }
    })
    codeList_popup2.BUMUN = arr
    if(!ckBumun){
      searchParams.PART_CD = ''
    }
  }
}

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })


//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnSelect") {
    //여기서 등록 팝업으로 데이터 보내기
    let checkedItem = grdMain.value.getGridView().getCheckedRows()
    let newArr = []
    if (checkedItem.length != 0) {
      for (let i of checkedItem) {
        let pushArr = grdMain.value.getDataProvider().getJsonRow(i)
        newArr.push(pushArr)
      }
      emit("selected", newArr, searchParams)
      onClose()
    }
  } else if(btn.id === "btnClose") {
    onClose() 
  }
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  if(searchParams.ASGN_NM){
    grdMain.value.getDataProvider().setRows([])
    return true
  }
  
  if(!searchParams.PART_CD){
    Message.warn(t('부문을 선택하세요.'))
    return false
  }
  
  
  return true
}

// 조회로직
const searchData = () => {
  if(searchParams.ASGN_NM){
    // 부서명으로 조회하는 경우
    let deptSearchParams = {
      CMPNY_DIV : 'HHI',
      HSE_ONLY : 'Y',
      USE_ONLY : 'Y',
      ORGN_DIV : searchParams.ORGN_DIV,
      ASGN_NM : searchParams.ASGN_NM
    }
    return commonSearchApi({ queryId: 'searchDept', param: deptSearchParams })
  }
  return commonSearchApi({ queryId : 'MNGAA0060_POPUP_SEARCH_01', param: searchParams }) 
}

const afterSearch = (res) => {
  if(searchParams.ASGN_NM){
    searchParams.BSNS_CD = ''
    searchParams.PART_CD = ''
  }
  let dataProvider = grdMain.value.getDataProvider()
  dataProvider.setRows(res.ORESULT_CUR)
  let prevData = searchParams.PREV_CD.replaceAll(' ','').split(',')

  let idx = []
  res.ORESULT_CUR.forEach((e, index)=>{
    let filterData = prevData.filter(item => item === e.ASGN_CD)
    if(filterData.length > 0){
      idx.push(index)
    } 
  })
  grdMain.value.getGridView().checkRows(idx)
}

watch(() => [searchParams.ORGN_DIV, searchParams.BSNS_CD, searchParams.PART_CD],([newValue_ORGN_DIV, newValue_BSNS_CD, newValue_PART_CD], [oldValue_ORGN_DIV, oldValue_BSNS_CD, oldValue_PART_CD]) => {
  onButtonsClick({ id: 'btnSearch' })
})

const onClose = () => {
  clearField()
  dialog.value = false
}

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const clearField = () => {
  searchParams.ASGN_NM = ''
  grdMain.value.getDataProvider().setRows(null)
  
}

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="730"
    height="650"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>대상부서 선택</span>
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
              <VRadioGroup
                v-model="searchParams.ORGN_DIV"
                class="mt-auto mb-1"
                inline
                >
                <!-- :readonly="readonly" -->
                <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
              </VRadioGroup>
              <!-- 사업부 -->
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.BSNS_CD"
                top-label
                :label="$t('사업부')"
                width="210px"
                :items="codeList_popup2.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="changedBsns"
                />
                <!-- :readonly="readonly" -->

              <i-select
                v-model="searchParams.PART_CD"
                top-label
                :label="$t('부문')"
                width="210px"
                :items="codeList_popup2.BUMUN"
                item-value="PART_CD"
                item-title="ASGN_SHRT_NM"
                @update:modelValue="changedBumun"
                />
                <!-- :readonly="readonly" -->

              <i-input
                v-model="searchParams.ASGN_NM"
                top-label
                width="210px"
                :label="$t('부서명')"
                @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              />
            </div>
            
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
