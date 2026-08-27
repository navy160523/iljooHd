
<!-- 
  * Vue 내 용 : 평가협력사 근거 및 평가 기준 
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/08
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/08 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
  },
  field: [
    {
      fieldName: "COL1",
      dataType: "text",
      width: "75",
      mergeRule: { "criteria": "value" },
    },
    {
      fieldName: "COL2",
      dataType: "text",
      width: "150",
      mergeRule: { "criteria": "value" },
    },
    {
      fieldName: "COL3",
      dataType: "text",
      width: "50",
      header: { text: t("점수") },
      mergeRule: { "criteria": "value" },
    },
    {
      fieldName: "COL4",
      dataType: "text",
      width: "300",
      styleName: " left-column",
      header: { text: t("평가근거") },
    },
    {
      fieldName: "COL5",
      dataType: "text",
      width: "70",
      header: { text: t("평가기준") },
      mergeRule: { "criteria": "value" },
    },
    {
      fieldName: "COL6",
      dataType: "text",
      width: "350",
      styleName: "left-column",
      header: { text: t("비고") },
      mergeRule: { "criteria": "value" },
    },
  ],
  columns: [],
  columnLayout: [
    {
      name: '평가항목',
      hideChildHeaders:true,
      direction: 'horizontal',
      items: [
        'COL1',
        'COL2',
      ],
      header: {
        text: t('평가항목'),
      },
    },
    'COL3',
    'COL4',
    'COL5',
    'COL6',
  ],
})

grdMainProps.columns = grdMainProps.field

//그리드 데이터 입력
const data1 = [
  { 
    COL1: '안전리더십',	
    COL2: '재해지표',	
    COL3: '20.0',	
    COL4: '안전사고 등급별 건수에 대한 감점 부여',	
    COL5: '20.0',
    COL6: '감점 최대 -20점', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '재해지표',	
    COL3: '-20.0',	
    COL4: '산재은폐 발생 시 (분기 말 문령훈 책임 문의)',	
    COL5: '감점',
    COL6: '감점 최대 -20점', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '재해지표',	
    COL3: '-10.0',	
    COL4: '구급차 미이용 발행 시 (분기 말 문령훈 책임 문의)',	
    COL5: '감점',
    COL6: '감점 최대 -20점', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '안전관리자 역량평가',	
    COL3: '10.0',	
    COL4: '협력사 안전관리자 역량평가 점수 반영',	
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '안전관리자 역량평가',	
    COL3: '10.0',	
    COL4: '직전 반기 평가점수가 없는 경우 (신규협력사 / 신규 안전관리자)',	
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '안전관리자 역량평가',	
    COL3: '10.0',	
    COL4: '평가 해당분기 내 안전관리자가 없는 경우 (0점)',
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '대표 안전 경영활동',	
    COL3: '10.0',	
    COL4: '협력사 대표 안전리더십 평가',
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '안전리더십',	
    COL2: '대표 안전경영활동',	
    COL3: '가점',	
    COL4: '협력사 대표 안전활동 건수',
    COL5: '가점',
    COL6: '최대+5점', 
  },
  { 
    COL1: '안전시스템',	
    COL2: '위험성평가',	
    COL3: '10.0',	
    COL4: '상/하반기 정기 위험성 평가 실시율 반영',
    COL5: '10.0',
    COL6: '[특수선사업부]특수선 작업표준 시스템 기반 점수 활용', 
  },
  { 
    COL1: '안전시스템',	
    COL2: '모바일 작업지시',	
    COL3: '10.0',	
    COL4: '모바일 작업지시서 활용도',
    COL5: '10.0',
    COL6: '[특수선사업부]특수선 작업표준 기반 작업지시서 발행/활용 여부로 평가', 
  },
  { 
    COL1: '안전시스템',	
    COL2: '법적서류 및 인증',	
    COL3: '감점',	
    COL4: '안전보건 법적서류 최신업데이트 상태',
    COL5: '감점',
    COL6: '최대+10점', 
  },
  { 
    COL1: '안전시스템',	
    COL2: '법적서류 및 인증',	
    COL3: '가점',	
    COL4: '위험성평가 인정사업장',
    COL5: '가점',
    COL6: '최대+2점', 
  },
  { 
    COL1: '안전시스템',	
    COL2: '법적서류 및 인증',	
    COL3: '가점',	
    COL4: 'ISO45001, KOSHA MS 등 안전경영시스템 인증',
    COL5: '가점',
    COL6: '최대+2점', 
  },
  { 
    COL1: '안전문화',	
    COL2: '제도준수',	
    COL3: '15.0',	
    COL4: '협력사별 수칙위반 증감율',
    COL5: '15.0',
    COL6: '', 
  },
  { 
    COL1: '안전문화',	
    COL2: '제도준수',	
    COL3: '15.0',	
    COL4: '사업개시 6개월 이상 협력사에 대해 포상 시행',
    COL5: '15.0',
    COL6: '', 
  },
  { 
    COL1: '안전문화',	
    COL2: '안전교육',	
    COL3: '5.0',	
    COL4: '법정 안전교육',
    COL5: '5.0',
    COL6: '', 
  },
  { 
    COL1: '현장안전관리',	
    COL2: '현장점검',	
    COL3: '5.0',	
    COL4: '현장 점검 : TBM (체크리스트 9문항 활용)',
    COL5: '5.0',
    COL6: '', 
  },
  { 
    COL1: '현장안전관리',	
    COL2: '안전개입/안전작업요구권',	
    COL3: '5.0',	
    COL4: '안전개입 등록 & 안전작업요구권 조치 실적',
    COL5: '5.0',
    COL6: '', 
  },
  { 
    COL1: '현장안전관리',	
    COL2: '현장 개선활동',	
    COL3: '가점',	
    COL4: '개선 활동 (개선활동 건 당 1점)',
    COL5: '가점',
    COL6: '최대+5점', 
  },
  { 
    COL1: '보건',	
    COL2: '건강관리/보건시스템 활용',	
    COL3: '10.0',	
    COL4: '건강관리위험대상자 재검 (6점): 가중치*미조치율*-10',
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '보건',	
    COL2: '건강관리/보건시스템 활용',	
    COL3: '10.0',	
    COL4: '보건관리자 선임 혹은 보건관리대행 여부 (2점)',
    COL5: '10.0',
    COL6: '', 
  },
  { 
    COL1: '보건',	
    COL2: '건강관리/보건시스템 활용',	
    COL3: '10.0',	
    COL4: 'HiSEs 건강관리시스템 활용 (권한 부여) (2점)',
    COL5: '10.0',
    COL6: '', 
  },
]

const openPopup = () => {
  grdMain.value.getDataProvider().setRows(data1)
  dialog.value = true
}

const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnClose')
  {
    onClose()
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1280"
    height="920"
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
      <span>평가협력사 근거 및 평가기준</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
