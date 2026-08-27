<!--
  화면명 : 정기위험성 평가 목록(팝업)
  화면개요 : 정기위험성 평가 목록을 조회한다.
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import ImageViewer from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0010Popup04.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)
const imageViewer = ref(null)

// 조회조건
const searchParams = reactive({    
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  PARTNER_CD: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
  RISK_TYPE: [],
})

//코드리스트 셋팅
const initCodeList = async () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),

    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      }, 
    }),
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    searchParams.CMPNY_DIV = codeList.CMPNY_DIV[0].COD
    codeList.BSNS_CD = res[1].ORESULT_CUR
    searchParams.BSNS_CD = codeList.BSNS_CD[0].BSNS_CD
  })
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['COMPANY_CD'],
  fields : [ 
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', editable: false, width: '150', header: { text: t('문서번호') } },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', editable: false, width: '150', header: { text: t('작업표준명') }, styleName:'left-column' },
    { fieldName: 'WORK_STANDARD_REVISION', dataType: 'text', editable: false, header: { text: t('최종개정차수') }, styleName:'right-column'  },
    { fieldName: 'RISK_TYPE', dataType: 'text', editable: false, header: { text: t('평가유형') } , lookupDisplay: true },
    { fieldName: 'DEPT_NM', dataType: 'text', editable: false, header: { text: t('협력사명') } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'COMPANY_CD', dataType: 'text', visible: false },
    { fieldName: 'UNIT_ID', dataType: 'text', visible: false },
    { fieldName: 'RISK_ID', dataType: 'text', visible: false },
    { fieldName: 'ACT_ID', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_NO', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_COUNT', dataType: 'text', visible: false },
  ],
  columns : [],
  // columnLayout: [
  //   'WORK_STANDARD_ID',
  //   'WORK_STANDARD_NM',
  //   'WORK_STANDARD_REVISION',
  //   'RISK_TYPE'
  // ]
})

grdMainProps.columns = grdMainProps.fields

// 버튼 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    searchData()
  } else if (btn.id === 'btnRskCopyApp') {
    applyData()
  } else if (btn.id ==='btnClose') {
    closePopup()
  }
}

// 조회
const searchData = () => {
  commonSearchApi({
    queryId : 'EDUAB0030_TAB01_POP01_POP11_SEARCH_03', 
    param : {
      COMPANY_CD: searchParams.CMPNY_DIV,
      DEPT_CD: searchParams.DEPT_CD,
      PARTNER_CD: searchParams.PARTNER_CD
    }
  }).then(res => {
    console.log("조회 레스 확인",res)
    if (res.ORESULT_CUR.length === 0) {
      grdMain.value.getDataProvider().setRows([])
      Message.err('데이터가 없습니다.')
    } else {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success(t('조회되었습니다.'))
      // CheckBar 병합 처리
      //grdMain.value.getGridView().checkBar.mergeRule = "value['WORK_STANDARD_ID']"
    }
  })
}

// 적용
const applyData = () => {
  let list = []
  let result = []
  let resultObj = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    list.push(grdMain.value.getDataProvider().getJsonRow(rowIdx))
  }

  for (let i of list) {
    let obj = {}
    obj.WORK_STANDARD_ID = i.WORK_STANDARD_ID
    obj.WORK_STANDARD_NM = i.WORK_STANDARD_NM

    if (!result.includes(i.WORK_STANDARD_ID)) {
      result.push(i.WORK_STANDARD_ID)
      resultObj.push(obj)
    }
  }

  emit("onSelect", resultObj)
  closePopup()
}

// 팝업 오픈
const openPopup = async el => {
  openRefresh()
  dialog.value = true

  // 평가유형[2]
  await commonSearchApi({ 
    queryId : 'RSKBA0010_SEARCH_02', 
    param : { 
      COMM_CD: userStore.cmpnyDiv, 
      TYPE: 'DETAIL',
    }, 
  }).then(res => {
    codeList.RISK_TYPE = res.ORESULT_CUR
    grdMain.value.setBindingColumn("RISK_TYPE", codeList.RISK_TYPE, "CODE_ID", "CODE_NM")
  }).catch(err => {
    Message.err(err)
  })
}

//팝업 오픈시 데이터 초기화
const openRefresh = () => {
  Object.keys(searchParams).forEach(key => {
    searchParams[key] = ''
  })
  Object.keys(codeList).forEach(key => {
    codeList[key] = []
  })
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().checkAll(false)

  initCodeList()
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

// 그리드 item 클릭 이벤트(파일)
const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  let popupParams = {
    FILE_ID: data.FILE_ID,
    buttonList: []
  }
  if (col.fieldIndex === 12) {
    imageViewer.value.openPopup(popupParams)
  }
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  commonSearchApi({ 
    queryId : 'searchDept3',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: newValue,
      USE_DIV:'Y'
    } 
  }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    if (!oldValue) {
      return searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
    }
    if (newValue !== oldValue) {
      // 사업부가 변경 시 부서 리스트의 첫 인덱스의 데이터를 출력
      return searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
    }
  })
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  searchParams.PARTNER_CD = ''
  commonSearchApi({ 
    queryId : 'searchVend',
    param : {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: newValue 
    } 
  }).then(res => {
    codeList.PARTNER_CD = res.ORESULT_CUR
    codeList.PARTNER_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
    if (codeList.PARTNER_CD.length !== 0) {
      searchParams.PARTNER_CD = ''
    }
  })
})

//조회조건 변경 시 그리드 초기화
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

defineExpose({
  openPopup,
})

onMounted(() => {
})
</script>

<template>
  <v-dialog 
    v-model="dialog" 
    eager 
    persistent 
    width="1200" 
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>정기위험성 평가 목록</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSearch', 'btnRskCopyApp', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet class="flex-column searchArea">
          <div class="d-flex">
            <i-select 
              :label="$t('회사')"
              width="200px"
              labelWidth="30px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              @update:model-value="gridRefresh"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="200px"
              labelWidth="45px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:model-value="gridRefresh"
            />
            <i-select 
              :label="$t('부서')"
              width="300px"
              labelWidth="30px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('협력사')"
              width="300px"
              labelWidth="45px"
              v-model="searchParams.PARTNER_CD"
              :items="codeList.PARTNER_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              @update:model-value="gridRefresh"
            />
          </div>
        </v-sheet>
        <div class="d-flex" style="height:85%">
          <v-sheet width="100%" class="flex-column">
            <RealGrid
              ref="grdMain"
              class="mt-0"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellItemClicked="onCellItemClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <ImageViewer ref="imageViewer" />
  </v-dialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (430px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>
