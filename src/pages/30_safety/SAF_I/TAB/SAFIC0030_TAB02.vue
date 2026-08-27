<!-- 
  * Vue 내 용 : 협력사 안전관리 수준 자체평가
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/09
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
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

defineOptions({
  name:'30_safety-SAF_I-TAB-SAFIC0030_TAB02',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HALF: '',
  BSNS_CD: '', // 전체
  USER_ID: userStore.userId,
})

const dtHalf = reactive([
  { COD: "1", TXT: "상반기" },
  { COD: "2", TXT: "하반기" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    edit: { editable: false },
    footers: {
      visible: true,
      items:[
        {},
        { height: 30,styleName:"text-primary" },
        { height: 30,styleName:"text-primary" },
      ],
    },
  },
  keys : ['CMPNY_DIV','COMP_CD','BSNS_CD','DEPT_CD', 'ASGN_CD', 'PART_CD', 'EMP_NO'],
  fields : [
    // { 
    //   fieldName: 'YEAR', 
    //   dataType: 'text', 
    //   width: '70',
    //   header: { text: t('년도') },
    //   mergeRule: { "criteria": "value" },
    // },
    // { 
    //   fieldName: 'HALF', 
    //   dataType: 'text', 
    //   width: '70',
    //   header: { text: t('반기') },
    //   mergeRule: { "criteria": "value" },
    // },
    { 
      fieldName: 'BSNS_NM', 
      dataType: 'text', 
      width: '120',
      header: { text: t('사업부') },
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'PART_NM', 
      dataType: 'text', 
      width: '150',
      header: { text: t('부문') },
      mergeRule: { "criteria": "value" },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '150',
      header: { text: t('부서') },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    {
      fieldName: 'COMP_NM', 
      dataType: 'text', 
      width: '150',
      styleName: "left-column",
      header: { text: t('협력사') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'EMP_NO', 
      dataType: 'text', 
      width: '120',
      header: { text: t('사번') },
    },
    { 
      fieldName: 'KOR_NM', 
      dataType: 'text', 
      width: '75',
      header: { text: t('성명') },
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
      fieldName: 'EVAL1', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '70',
      styleName: "right-column",
      header: { text: t('재해지표 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL2', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      styleName: "right-column",
      header: { text: t('업무역량  (15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL3', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      styleName: 'styleName: "right-column",',
      header: { text: t('점검활동 (15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL4', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '75',
      styleName: "right-column",
      header: { text: t('현장관리 (10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL5', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      styleName: "right-column",
      header: { text: t('직무능력 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL6',
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      styleName: "right-column",
      header: { text: t('협력사평가 (20점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL7', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      styleName: "right-column",
      header: { text: t('개선활동 (가점/5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL8', 
      dataType: 'number',
      numberFormat: "#,###.#",
      width: '80',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('신규자격증획득 (가점/5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SUM_VAL', 
      dataType: 'number', 
      numberFormat: "#,###.#",
      width: '60',
      styleName: "right-column",
      header: { text: t('합계 (100점) + α') },
      footers:[
        {},
        {
          numberFormat: "#,###.#",
          expression: "avg",
        },
        {
          numberFormat: "#,###.#",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL_RESULT', dataType: 'text', 
      width: '70',
      header: { text: t('평가결과 (가점포함)') },
    },
    { 
      fieldName: 'AWARD_HIS', dataType: 'text', 
      width: '70',
      header: { text: t('포상이력') },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      width: '200',
      styleName: "left-column",
      header: { text: t('비고') }, 
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'COMP_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 6,
    })
    searchParams.HALF = getHalf(dayjs().format('MM'))
    onButtonsClick({ id: "btnSearch" })
  })  
})

//메뉴버튼
const onButtonsClick = async btn => {
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
  console.log('searchData : ', searchParams)

  return commonSearchApi({ queryId : 'SAFIC0030_SEARCH_02', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearchGrdMain : ', res)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 


const getHalf  = month => {
  let half = '1'
  
  switch(month) {
  case "01":
  case "02":
  case "03":
  case "04":
  case "05":
  case "06":
    half = '1'
    break
  case "07":
  case "08":
  case "09":
  case "10":
  case "11":
  case "12":
    half = '2'
    break
  }

  return half
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="50px"
            type="Number"
            width="150px"
          />
          <i-select
            v-model="searchParams.HALF"
            :label="$t('반기')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :items="dtHalf"
            item-title="TXT"
            item-value="COD"
            width="230px"
          />
        </v-sheet>
        <v-sheet 
          height="75%" 
        >
          <!-- 메인그리드 -->
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
  </v-card>
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
    min-height: 400px;
  }
}
</style>