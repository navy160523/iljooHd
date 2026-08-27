<!-- 
  * Vue 내 용 : SAFIC0020 협력사 안전관리자 역량평가 결과
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/12
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/12 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import _ from 'lodash'
import SAFIC0020Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIC0020Popup01.vue"

defineOptions({
  name:'30_safety-SAF_I-SAFIC0020',
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const codeList = reactive({})

const grdMain = ref(null)
const menuTitle = ref(null)
const sAFIC0020Popup01 = ref(null)
const isCharger = ref(false)  //담당자확인

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HALF: '',
  BSNS_CD: '', // 전체
  STATUS:'',
  CHRG_GRP: '',
  RANK_GBN: 'A',
  USER_ID: userStore.userId,
})

const dtHalf = reactive([
  { COD: "1", TXT: "상반기" },
  { COD: "2", TXT: "하반기" },
])

const dtBusiness = reactive([
  { COD: "", TXT: "전체" },
  { COD: "AC00", TXT: "조선사업부" },
  { COD: "AE00", TXT: "특수선사업부" },
  { COD: "AQ00", TXT: "해양에너지사업본부" },
  { COD: "AK00", TXT: "엔진기계사업부" },
])

const dtCharger = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "조선" },
  { COD: "G", TXT: "군산" },
])

/* 조회 구분 */
const dtRank = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "사업부" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    checkBar: { visible: true },
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
    { 
      fieldName: 'RANKING', 
      dataType: 'text', 
      width: '50',
      header: { text: t('순위') },
    },
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
      styleName: "left-column",
      header: { text: t('부문') },
      mergeRule: { "criteria": "value" },
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
      styleName: "left-column",
      header: { text: t('부서') },
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
      fieldName: 'AWARD_HIS', 
      dataType: 'text', 
      width: '70',
      styleName: "left-column",
      header: { text: t('포상이력') },
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
    { 
      fieldName: 'SELF_EVAL_STATUS_NM', dataType: 'text',
      width: '170',
      header: { text: t('업체자체 평가상태') },
      styleCallback: function(grid,dataCell){
        let ret = {}
        var status = grid.getValue(dataCell.index.itemIndex, "SELF_EVAL_STATUS")
        
        if(status === 'C'){
          
          ret.styleName = "button-blue"
        }
        else if(status === 'Y') {
          ret.styleName = "button-grey"
        }
        else if (status == 'F') {
          ret.styleName = "button-green"
        }
        else {
          ret.styleName = "button-white"
        }

        ret.renderer = {
          type:'button',
        }

        return ret
      },  
    },
    { 
      fieldName: 'STATUS', dataType: 'text', 
      width: '150',
      editable: false,
      header: { text: t('최종 확정상태') },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'COMP_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'SELF_EVAL_STATUS', dataType: 'text' , visible: false },
    { fieldName: 'GM_CONFIRM_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 6,
    })
    searchParams.HALF = getHalf(dayjs().format('MM'))
    initPage()
  })  
})

const initPage = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    ASGN_CD: userStore.asgnCd,
    EMP_NO: userStore.userId,
  }

  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIB0010_SEARCH_EMP', param }) , 
  ]).then(res => {
    if(res[0].ORESULT_CUR.length === 0) {
      searchParams.BSNS_CD = userStore.bsnsCd

      // setDisableBtns('Y')
      isCharger.value = false
    }
    else {
      res[0].ORESULT_CUR.forEach( value => {
        console.log('[initPage] value : ', value.PS_GUBUN)
        
        //총괄 담당자 및 각 사업 담당자는 모두 저장, 삭제, 불러오기, 엑셀 업로드 버튼 활성화
        if(value.PS_GUBUN === 'PS00' || value.PS_GUBUN === 'PS10' ||
        value.PS_GUBUN === 'PS20' || value.PS_GUBUN === 'PS30' ||
        value.PS_GUBUN === 'PS40' || value.PS_GUBUN === 'PS50') {
          isCharger.value = true
        }
        else {
          isCharger.value = false
        }

        if(value.PS_GUBUN === 'PS00') { //총괄담당자
          codeList.BSNS_CD = dtBusiness
          searchParams.BSNS_CD = ''
        }
        else if(value.PS_GUBUN === 'PS10') {  //조선담당자
          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )
          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'S',
          )

          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'A'
        }
        else if(value.PS_GUBUN === 'PS20') {  //군산담당자
          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )

          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'G',
          )
          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'G'
        }
        else if(value.PS_GUBUN === 'PS30') {  //해양담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AQ00',
          )
          searchParams.BSNS_CD = 'AQ00'
        }
        else if(value.PS_GUBUN === 'PS40') {  //엔진기계담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AK00',
          )
          searchParams.BSNS_CD = 'AK00'
        }
        else if(value.PS_GUBUN === 'PS50') {  //특수선담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AE00',
          )
          searchParams.BSNS_CD = 'AE00'
        }
      })
    }
  })
}

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
  console.log('searchData : ', searchParams)

  return commonSearchApi({ queryId : 'SAFIC0020_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearchGrdMain : ', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  searchParams.STATUS = res.ORESULT_CUR[0].STATUS

  // 조건에 따라 그리드 색상 변경
  customGridCellStyle()
} 

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

  console.log('[onCellItemClicked] = ', col.field)

  if(col.field === 18) {
    switch(data.SELF_EVAL_STATUS) {
    case "C":
    case "Y":
    case "F":
      sAFIC0020Popup01.value.openPopup(data, isCharger.value)
      break
    case "N":
      Message.err("자체평가를 하지 않은 데이터 입니다.")
      break
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    searchParams.STATUS = row.STATUS
  }
}

const popupClosed = val => {
  console.log('popupClosed : ', val)
  onButtonsClick({ id: "btnSearch" })
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

const customGridCellStyle = () => {

  grdMain.value.getGridView().setCellStyleCallback(function(grid, dataCell) {
    let ret = {}

    if(dataCell.dataColumn.fieldName === 'KOR_NM') {
      let confirm = grid.getValue(dataCell.index.itemIndex, 'CONFIRM_YN')

      if(confirm === 'Y') {
        ret.style = { background: "#6799FF" } 
      }
      else{
        ret.style = { background: "#FFFFFF" } 
      }
    }

    return ret
  })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              label-width="60px"
              append-inner-icon="mdi-magnify"
              :items="codeList.BSNS_CD"
              item-title="TXT"
              item-value="COD"
              width="250px"
            />
            <div>
              <v-radio-group
                v-model="searchParams.CHRG_GRP"
                inline
              >
                <v-radio 
                  v-for="(item, i) in codeList.CHRG_GRP" 
                  :key="i" 
                  class="radio-box mx-2"
                  :value="item.COD" 
                  :label="item.TXT"
                />
              </v-radio-group>
            </div>
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="60px"
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
            <i-select
              v-model="searchParams.RANK_GBN"
              :label="$t('순위')"
              label-width="60px"
              append-inner-icon="mdi-magnify"
              :items="dtRank"
              item-title="TXT"
              item-value="COD"
              width="230px"
            />
            <i-input
              v-model="searchParams.STATUS"
              :label="$t('진행상태')"
              label-width="50px"
              width="250px"
              readonly
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            class="pa-0 h-auto"
          >
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @on-cell-item-clicked="onCellItemClicked "
              @on-cell-clicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </div>
      <!-- 업체 안전관리자 자체평가 팝업 -->
      <SAFIC0020Popup01
        ref="sAFIC0020Popup01"
        @closed="popupClosed"
      />
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.radio-box{
    width: 60px;
}
</style>
