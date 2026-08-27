<!-- 
  * Vue 내 용 : 협력사 안전관리 수준평가 결과(해양)
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/01
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/01 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import { isEmpty } from 'lodash-es'

const props = defineProps({
  business03: { 
    type: String, 
    default: '',
  },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const grdMain = ref(null)
const menuTitle = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  QUARTER: '',
  BSNS_CD: '',
  USER_ID: userStore.userId,
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])

const dtBusiness = reactive([
  { COD: "", TXT: "전체" },
  { COD: "AC00", TXT: "조선사업부" },
  { COD: "AE00", TXT: "특수선사업부" },
  { COD: "AQ00", TXT: "해양에너지사업본부" },
  { COD: "AK00", TXT: "엔진기계사업부" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    header: { height: 100 },
    footers: {
      visible: true,
      items:[
        {},
        { height: 30,styleName:"text-primary" },
        { height: 30,styleName:"text-primary" },
      ],
    },
  },
  fields : [
    { 
      fieldName: 'CONTENT', 
      dataType: 'text', 
      width: '200',
      header: { text: t('부분') },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: 200px; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
      footers:[
        {},
        {
          text:"평점",
          visible:"true",
          align:"center",
        },
        {
          text:"최대점수",
          visible:"true",
          align:"center",
        },
      ],
    }, 
    { 
      fieldName: 'DSST_INDC', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { 
        text: t('재해지표(20점)'),
      },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'DSST_INDC')
                rowCnt++
              }
            }

            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_MNGR_CMPT_ASSM', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('안전관리자역량평가(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'SFTY_MNGR_CMPT_ASSM')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'FCFC_INTRV', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('대면인터뷰(가점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'FCFC_INTRV')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_ACTVT', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('안전활동 건수(가점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'SFTY_ACTVT')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'RISK_ASSMN', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('위험성평가(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'RISK_ASSMN')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'MBL_WRK_ORD',
      dataType: 'number', 
      width: '100',
      styleName: "right-column",
      header: { text: t('모바일 작업지시(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'MBL_WRK_ORD')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'LGL_DOCS_CERTIFIED', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('법적서류 및 인증(가점/감점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'LGL_DOCS_CERTIFIED')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'CMP_SYS', 
      dataType: 'number', 
      width: '100',
      styleName: "right-column",
      header: { text: t('제도준수(15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'CMP_SYS')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_EDCT', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('안전교육(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'SFTY_EDCT')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SITE_INSPC', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('현장점검(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'SITE_INSPC')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_INTR_WORK', 
      dataType: 'number',
      width: '100',
      styleName: "right-column",
      header: { text: t('안전개입/안전작업 요구권(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'SFTY_INTR_WORK')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'ONST_ACTV',
      dataType: 'number',
      width: '100', 
      styleName: "right-column",
      header: { text: t('현장 개선활동(가점)') }, 
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'ONST_ACTV')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'HCARE_HSYS', 
      dataType: 'number', 
      width: '100',
      styleName: "right-column",
      header: { text: t('건강관리/보건시스템 활용(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'HCARE_HSYS')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'TOTAL', 
      dataType: 'number', 
      width: '100',
      styleName: "right-column",
      header: { text: t('합계(100점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          valueCallback: function (grid, column, footerIndex, columnFooter, value){
            let sum = 0
            let rowCnt = 0
            let prod = grid.getDataSource()
            let cnt  = prod.getRowCount()

            for (var i=0 ; i < cnt ; i++) {
              let value = prod.getValue(i, 'GUBUN')

              if(value === '담당임원'){
                sum += prod.getValue(i, 'TOTAL')
                rowCnt++
              }
            }
            
            return sum / rowCnt
          },
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'CHRG_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'EMP_NO', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text' , visible: false },
    { fieldName: 'GUBUN', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'CONTENT', 
    {
      name: 'SAFETY_LEADERSHIP',
      fieldName : 'SAFETY_LEADERSHIP',
      direction: 'horizontal',
      items: [
        'DSST_INDC',
        'SFTY_MNGR_CMPT_ASSM',
        {
          name: '대표 안전 경영활동(10점 + α)',
          direction: 'horizontal',
          items: [
            'FCFC_INTRV',
            'SFTY_ACTVT',
          ],
          header: {
            text: t('대표 안전 경영활동(10점 + α)'),
          },
        },
      ],
      header: {
        text: t('안전리더십(40점 + α)'),
      },
    },
    {
      name: 'SAFETY_SYSTEM',
      fieldName : 'SAFETY_SYSTEM',
      direction: 'horizontal',
      items: [
        'RISK_ASSMN',
        'MBL_WRK_ORD',
        'LGL_DOCS_CERTIFIED',
      ],
      header: {
        text: t('안전시스템(20점 +α)'),
      },
    },
    {
      name: 'SAFETY_CULTURE',
      fieldName : 'SAFETY_CULTURE',
      direction: 'horizontal',
      items: [
        'CMP_SYS',
        'SFTY_EDCT',
      ],
      header: {
        text: t('안전문화(20점)'),
      },
    },
    {
      name: 'SITE_SAFETY_MANAGE',
      fieldName : 'SITE_SAFETY_MANAGE',
      direction: 'horizontal',
      items: [
        'SITE_INSPC',
        'SFTY_INTR_WORK',
        'ONST_ACTV',
      ],
      header: {
        text: t('현장안전관리(10점 + α)'),
      },
    },
    {
      name: '보건(10점)',
      direction: 'horizontal',
      items: [
        'HCARE_HSYS',
      ],
      header: {
        text: t('보건(10점)'),
      },
    },
    'TOTAL',
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  vm.$nextTick(() => {
    searchParams.QUARTER = getQuarter(new Date())
    grdMain.value.getGridView().setFixedOptions({
      colCount: 1,
    })
  })  
})

// props 감지
watch(
  () => props.business03, newValue => {
    console.log('[watch03] : ', newValue)
    searchParams.BSNS_CD = props.business03
  },
)

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

// 조회
const searchData = () =>{
  if(!isEmpty(props)) {
    searchParams.BSNS_CD = props.business03
  }

  return commonSearchApi({ queryId : 'SAFIB0010_SEARCH_MAIN03', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  setCellStyleGrid()
}

//row스타일 사용
const setCellStyleGrid = () => {
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    let ret = {}
    let OFFI_RES_CD = grid.getValue(item.index, "OFFI_RES_CD")

    // 부문장 표시
    if (!isEmpty(OFFI_RES_CD) && OFFI_RES_CD === '12') {
      ret.style = { background: "#FAED7D" }
    }

    return ret
  })
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card-text class="pa-3 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"  
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-input
          v-model="searchParams.YEAR"
          :label="$t('년도')"
          label-width="50px"
          type="Number"
          width="150px"
        />
        <i-select
          v-model="searchParams.QUARTER"
          :label="$t('분기')"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          :items="dtQuater"
          item-title="TXT"
          item-value="COD"
          width="200px"
        />
      </v-sheet>
      <v-sheet 
        height="69%"
      >
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
        />
      </v-sheet>
    </div>
  </v-card-text>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>