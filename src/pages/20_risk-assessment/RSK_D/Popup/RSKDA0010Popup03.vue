<!--
  화면명 : 위험성평가 위원회 회의록 등록/현황 팝업(정기위험성 평가 목록)
  화면개요 : 정기위험성 평가 목록
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
import { nextTick } from 'vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null) // 메인 그리드
const grdSub = ref(null)  // 서브 그리드
const imageViewer = ref(null)

// 조회조건
const searchParams = reactive({    
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  PARTNER_CD: '',
  TYPE: 'WORK',
  WORK_STANDARD_NM: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
  RISK_TYPE: [],
  TYPE: [
    { COD: 'WORK', TXT: '작업표준(위험성평가)' },
    { COD: 'SAFE', TXT: '안전표준/지침서' },
  ]
})

//코드리스트 셋팅
const initCodeList = () => {
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
    codeList.BSNS_CD = res[1].ORESULT_CUR
  })
}

// 그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, rowIndicator: { visible: false } },
  keys : ['COMPANY_CD'],
  fields : [ 
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', editable: false, width: '170', header: { text: t('문서번호') } },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', editable: false, width: '250', styleName: 'left-column', header: { text: t('작업표준명') } },
  ]
})

grdMainProps.columns = grdMainProps.fields

// 그리드1 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, rowIndicator: { visible: false } },
  keys : ['COMPANY_CD'],
  fields : [
    { fieldName: 'UNIT_NM', dataType: 'text', editable: false, width: '170', styleName: 'left-column', header: { text: t('단위작업') } },
    { fieldName: 'ACT_NM', dataType: 'text', editable: false, width: '170', 
      styleName: "multiline-editor left-column ", 
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
      },
      header: { text: t('작업행동') } },
    { fieldName: 'CHK_NM', dataType: 'text', editable: false, width: '170', 
      styleName: "multiline-editor left-column ", 
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
      },
      header: { text: t('체크정보') } },
    { fieldName: 'RISK_NM', dataType: 'text', editable: false, width: '170', 
      styleName: "multiline-editor left-column ", 
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
      },
      header: { text: t('위험요인') } },
    { fieldName: 'RM_NM', dataType: 'text', editable: false, width: '170', 
      styleName: "multiline-editor left-column ", 
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
      },
      header: { text: t('감소대책') }},
    { fieldName: 'RISK_TOTAL', dataType: 'int', editable: false, header: { text: t('현재의 위험성') },
      displayCallback: function (grd, idx, val) {
          nextTick(() => {
            let txt = ''
            let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)
            if (data.RISK_TOTAL !== undefined) {
              if (data.RISK_TOTAL < 4) {
                txt = data.RISK_TOTAL + '(매우낮음)'
              } else if (data.RISK_TOTAL < 8) {
                txt = data.RISK_TOTAL + '(낮음)'
              } else if (data.RISK_TOTAL < 15) {
                txt = data.RISK_TOTAL + '(위험)'
              } else {
                txt = data.RISK_TOTAL + '(매우위험)'
              }
            } else {
              txt = ''
            }

            return txt
        })
      },
    },
    { fieldName: 'BEFOR_FRE', dataType: 'text', editable: false, header: { text: t('빈도') } },
    { fieldName: 'BEFOR_MAT', dataType: 'text', editable: false, header: { text: t('강도') } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'COMPANY_CD', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_REVISION', dataType: 'text', visible: false },
    { fieldName: 'RISK_TYPE', dataType: 'text', visible: false },
    { fieldName: 'UNIT_ID', dataType: 'text', visible: false },
    { fieldName: 'RISK_ID', dataType: 'text', visible: false },
    { fieldName: 'ACT_ID', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_NO', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_COUNT', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    // 'WORK_STANDARD_ID',
    // 'WORK_STANDARD_NM',
    // 'WORK_STANDARD_REVISION',
    // 'RISK_TYPE', 
    'UNIT_NM',
    'ACT_NM',
    'CHK_NM',
    'RISK_NM',
    'RM_NM',
    {
      direction: 'vertical',
      width: '100',
      items: [
        'RISK_TOTAL',
        {
          direction: 'horizontal',
          width: '100',
          items: [
            {
              direction: 'horizontal',
              hideChildHeaders: true,
              width: '50',
              items: [
                { column: 'BEFOR_FRE' },
              ],
              header:  { visible: false },
            },
            {
              direction: 'horizontal',
              hideChildHeaders: true,
              width: '50',
              items: [
                { column: 'BEFOR_MAT' },
              ],
              header:  { visible: false },
            },
          ],
          header:  { visible: false },
        },
      ],
      header:  { visible: false },
    },
  ]
})

grdSubProps.columns = grdSubProps.fields


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
    queryId : 'SEARCH_WORKNO_LIST', 
    param : {
      COMPANY_CD: searchParams.CMPNY_DIV,
      DEPT_CD: searchParams.DEPT_CD,
      PARTNER_CD: searchParams.PARTNER_CD,
      WORK_STANDARD_NM: searchParams.WORK_STANDARD_NM,
    }
  }).then(res => {
    if (res.ORESULT_CUR.length === 0) {
      Message.err('데이터가 없습니다.')
    } else {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

// 적용
const applyData = () => {
  // const index = grdMain.value.getGridView().getCurrent().itemIndex
  // const row = grdMain.value.getDataProvider().getJsonRow(index)
  let applyParams = []

  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  
  for (let i of checkedRows) {
    const data = grdSub.value.getDataProvider().getJsonRow(i)

    applyParams.push(data)
  }

  // 지워야함. ACT_NM 작업행동, UNIT_NM 단위작업
  emit('selected', applyParams)
  closePopup()

}

// 팝업 오픈
const openPopup = async el => {
  dialog.value = true

  searchParams.CMPNY_DIV = el.CMPNY_DIV
  searchParams.BSNS_CD = el.BSNS_CD
  searchParams.DEPT_CD = el.DEPT_CD

  if(el.WORK_STANDARD_NM != undefined && el.WORK_STANDARD_NM != null) {
    searchParams.WORK_STANDARD_NM = el.WORK_STANDARD_NM
  }

  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  initCodeList ()

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

  // 자동조회
  searchData()
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

// 클릭한 셀의 상세 데이터 조회
const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  const row = grdMain.value.getDataProvider().getJsonRow(newIdx)

  commonSearchApi({
    queryId : 'SEARCH_WORK_LIST', 
    param : {
      COMPANY_CD: searchParams.CMPNY_DIV,
      DEPT_CD: searchParams.DEPT_CD,
      PARTNER_CD: searchParams.PARTNER_CD,
      WORK_STANDARD_ID: row.WORK_STANDARD_ID
    }
  }).then(res => {
    if (res.ORESULT_CUR.length === 0) {
      Message.err('데이터가 없습니다.')
    } else {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      // CheckBar 병합 처리
      // grdMain.value.getGridView().checkBar.mergeRule = "value['WORK_STANDARD_ID']" 
    }
  })
}

// 더블 클릭 이벤트
const onCellDblClicked = (grd, data) => {
  const row = grdSub.value.getDataProvider().getJsonRow(data.dataRow)

  emit('selected', [row])
  closePopup()
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
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
      return searchParams.DEPT_CD = !searchParams.DEPT_CD ? codeList.DEPT_CD[0].DEPT_CD : searchParams.DEPT_CD
    }
    if (newValue !== oldValue) {
      // 사업부가 변경 시 부서 리스트의 첫 인덱스의 데이터를 출력
      return searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
    }
  })
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
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

defineExpose({
  openPopup,
})

onMounted(() => {
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    eager 
    persistent 
    width="1600" 
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
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnRskCopyApp', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                :label="$t('회사')"
                v-model="searchParams.CMPNY_DIV"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                readonly
                width="240px"
              />
              <i-select
                :label="$t('사업부')"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                width="240px"
              />
              <i-select
                :label="$t('부서')"
                v-model="searchParams.DEPT_CD"
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                width="240px"
              />
              <i-select
                :label="$t('협력사')"
                v-model="searchParams.PARTNER_CD"
                :items="codeList.PARTNER_CD"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
                width="240px"
              />
              <i-input
                :label="$t('작업표준명')"
                v-model="searchParams.WORK_STANDARD_NM"
                width="380px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="(e) => {onButtonsClick({ id: 'btnSearch' })}"
                @keydown.enter="(e) => {
                  onButtonsClick({ id: 'btnSearch' })
                }"
              />
            </div>
          </v-sheet>
          <v-sheet height="100%" class="mt-2 d-flex">
            <div class="h-grow">
              <v-sheet width="30%" class="h-auto mr-3">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  :column-layout="grdMainProps.columnLayout"
                  @onCurrentRowChanged="onCurrentRowChanged"
                />
              </v-sheet>
              <v-sheet width="70%">
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys" 
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                  :column-layout="grdSubProps.columnLayout"
                  @onCellDblClicked="onCellDblClicked"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <ImageViewer ref="imageViewer" />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 230px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}

.draggable-dialog {
  position: absolute;
  user-select: none;
}

.thBg{
  background-color: #e8eaf2;
}

/* 참석자 출력 */
div.v-col-md-2.v-col-12.ma-2 {
  background-color: #E8EAF2;
  border-radius: 5px;
  text-align: center;
}
div.v-col-md-1.v-col-12{
  align-self: center;
  text-align: center;
}
</style>
