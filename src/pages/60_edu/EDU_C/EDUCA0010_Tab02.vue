<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from "dayjs";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "60_edu-EDU_C-EDUCA0010_Tab02",
});

const t = useI18n().t; //다국어
const menuTitle = ref(null);
const userStore = useUserStore() 

const grdMain = ref(null);

/* 코드 리스트 1 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  WORK_YR: [],
  YEAR_DATE: [], //년도별 조회 콤보박스
  COLOR_LIST: [], //조회 조건 색상 
})

// 장점
let advantage1 = ''
let advantage2 = ''
let advantage3 = ''

// 단점
let disAdvantage1 = ''
let disAdvantage2 = ''
let disAdvantage3 = ''



/* 조회 조건 1 */
const searchParams = reactive({
  TASK_NO: dayjs(new Date()).format('YYYY'),
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  WORK_YR: '',
  JOB_TIT: '',
  SEARCH_COLOR: '', //조회 조건 색상 
  TOT_COLOR: '',
})





const grdMainProps = reactive({
  gridViewOption : {rowIndicator: {visible: false },edit: { editable: false }},
  fields: [
  { fieldName: "CATEGORY_NM", dataType: "text", header: { text: t("영역") }
  ,renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
        // console.log('cell data',cell.value)
        // console.log('cell row',cell.index.dataRow)
        const currentRow = grdMain.value.getRowData(cell._index.dataRow) 
        // console.log('currentRow.CATEGORY',currentRow.CATEGORY)
        let data = 
          `
          <div style="height: 170px;display: flex; justify-content: center; align-items: center;">
          <p>
          `
        if(currentRow.CATEGORY === advantage1){
          data += `<span class="mdi mdi-numeric-1-box-outline" style="font-size: 28px; color: blue;"></span><br/>${cell.value}</p>
            </div>`
        }else if(currentRow.CATEGORY === advantage2){
          data += `<span class="mdi mdi-numeric-2-box-outline" style="font-size: 28px; color: blue;"></span><br/>${cell.value}</p>
            </div>`
        }else if(currentRow.CATEGORY === advantage3){
          data += `<span class="mdi mdi-numeric-3-box-outline" style="font-size: 28px; color: blue;"></span><br/>${cell.value}</p>
            </div>`
        }else if(currentRow.CATEGORY === disAdvantage1){
          data += `<span class="mdi mdi-numeric-1-box-outline" style="font-size: 28px; color: crimson;"></span><br/>${cell.value}</p>
            </div>`
        }else if(currentRow.CATEGORY === disAdvantage2){
          data += `<span class="mdi mdi-numeric-2-box-outline" style="font-size: 28px; color: crimson;"></span><br/>${cell.value}</p>
            </div>`
        }else if(currentRow.CATEGORY === disAdvantage3){
          data += `<span class="mdi mdi-numeric-3-box-outline" style="font-size: 28px; color: crimson;"></span><br/>${cell.value}</p>
            </div>`
        }else{
          data += `
          ${cell.value}</p>
          </div>`
        }
        return data
      },
    }, 
  }
  ,{ fieldName: "TOT_MAIN", dataType: "text", header: { text: t("전사") } }
  ,{ fieldName: "DEPT_MAIN", dataType: "text", header: { text: t("부서") } }
  ,{ fieldName: "SEQ", dataType: "text", header: { text: t("순번") }, visible: false }
  ,{ fieldName: "CONTENT", dataType: "text", width: "600", styleName: "left-column",header: { text: t("설문내용") } }
  ,{ fieldName: "TOT_SUB", dataType: "text", header: { text: t("전사") } }
  ,{ fieldName: "DEPT_SUB", dataType: "text", header: { text: t("부서") } }
  ,{ fieldName: "MNG_MAIN", dataType: "text", header: { text: t("직영 관리자") } }
  ,{ fieldName: "MNG_SUB", dataType: "text", header: { text: t("직영 근로자") } }
  ,{ fieldName: "EMP_MAIN", dataType: "text", header: { text: t("협력사 관리자") } }
  ,{ fieldName: "EMP_SUB", dataType: "text", header: { text: t("협력사 근로자") } }

  ,{ fieldName: "SUVY_ID", dataType: "text", visible: false }
  ,{ fieldName: "CATEGORY", dataType: "text", visible: false }
  ,{ fieldName: "QSTN_ID", dataType: "text", visible: false }
  ],
  columns: [],
});


grdMainProps.columns = grdMainProps.fields;

onMounted(() => {
  console.log(userStore)
  Promise.all([ 
    // 콤보 데이터 
    commonSearchApi({ 
      queryId : 'EDUCA0010_SEARCH_08',
      param: 
      {TASK_NO: dayjs(new Date()).format('YYYY')
      , CMPNY_DIV: userStore.cmpnyDiv  } }),
  ]).then(res => {
    console.log('res',res)
    if(!res[0].ORESULT_CUR1){
      res[0].ORESULT_CUR1 = []
    }
    if(!res[0].ORESULT_CUR2){
      res[0].ORESULT_CUR2 = []
    }
    if(!res[0].ORESULT_CUR8){
      res[0].ORESULT_CUR8 = []
    }
    codeList.CMPNY_DIV = res[0].ORESULT_CUR1
    codeList.BSNS_CD = res[0].ORESULT_CUR2
    codeList.WORK_YR = res[0].ORESULT_CUR8

    if(codeList.CMPNY_DIV.length > 0){
      searchParams.CMPNY_DIV = codeList.CMPNY_DIV[0].COD
    }
    
    // codeList.BSNS_CD.unshift({COD: '', TXT: '전체'})
    codeList.WORK_YR.unshift({COD: '', TXT: '전체'})
     



    setCellStyleGrid()

   
    grdMain.value.getGridView().groupBy(["CATEGORY_NM","TOT_MAIN","DEPT_MAIN"]) //BSNS_COMP_NM 기준으로 그룹핑

    grdMain.value.getGridView().setRowGroup
    ({ 
      expandedAdornments: "none"  //그룹을 펼쳤을때 FOOTER만 보이기
      //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
      , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
      , mergeMode: true // 행 병합 그룹핑 활성화
      //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
    })
    
    
  })  

});


    
//row스타일 사용
const setCellStyleGrid = () => {

  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      
        
        const rowData = grdMain.value.getRowData(dataCell.index.dataRow)
        if(dataCell.dataColumn.fieldName === 'DEPT_SUB'){
          // 부서 색상
          if(rowData.TOT_SUB && rowData.DEPT_SUB){
            let calc = rowData.TOT_SUB - rowData.DEPT_SUB
            if(5 < calc && calc < 10){
              ret.style = { background: "#FFD966" } 
            } else if(calc >= 10){
              ret.style = { background: "#F4B183" } 
            }else{
              ret.style = { background: "#FFFFFF" }
            }
          }else{
            ret.style = { background: "#FFFFFF" }
          }
        }
        if(dataCell.dataColumn.fieldName === 'MNG_MAIN'){
        // 직영 관리자
          if(rowData.TOT_SUB && rowData.MNG_MAIN){
            let calc = rowData.TOT_SUB - rowData.MNG_MAIN
            if(5 < calc && calc < 10){
              ret.style = { background: "#FFD966" } 
            } else if(calc >= 10){
              ret.style = { background: "#F4B183" } 
            }else{
              ret.style = { background: "#FFFFFF" }
            }
          }else{
            ret.style = { background: "#FFFFFF" }
          }
        }
        if(dataCell.dataColumn.fieldName === 'MNG_SUB'){
          // 직영 근로자
          if(rowData.TOT_SUB && rowData.MNG_SUB){
            let calc = rowData.TOT_SUB - rowData.MNG_SUB
            if(5 < calc && calc < 10){
              ret.style = { background: "#FFD966" } 
            } else if(calc >= 10){
              ret.style = { background: "#F4B183" } 
            }else{
              ret.style = { background: "#FFFFFF" }
            }
          }else{
            ret.style = { background: "#FFFFFF" }
          }
        }
        if(dataCell.dataColumn.fieldName === 'EMP_MAIN'){
        // 협력사 관리자
          if(rowData.TOT_SUB && rowData.EMP_MAIN){
            let calc = rowData.TOT_SUB - rowData.EMP_MAIN
            if(5 < calc && calc < 10){
              ret.style = { background: "#FFD966" } 
            } else if(calc >= 10){
              ret.style = { background: "#F4B183" } 
            }else{
              ret.style = { background: "#FFFFFF" }
            }
          }else{
            ret.style = { background: "#FFFFFF" }
          }
        }
        if(dataCell.dataColumn.fieldName === 'EMP_SUB'){
        // 협력사 근로자
          if(rowData.TOT_SUB && rowData.EMP_SUB){
            let calc = rowData.TOT_SUB - rowData.EMP_SUB
            if(5 < calc && calc < 10){
              ret.style = { background: "#FFD966" } 
            } else if(calc >= 10){
              ret.style = { background: "#F4B183" } 
            }else{
              ret.style = { background: "#FFFFFF" }
            }
          }else{
            ret.style = { background: "#FFFFFF" }
          }
        }
          
      
      return ret
    })
}


const onButtonsClick = async btn =>{
  if(btn.id === 'btnSearch'){ // 조회 버튼
    Promise.all([ 
      commonSearchApi({ 
        queryId : 'EDUCA0010_SEARCH_02',
        param: searchParams }),

    ]).then(res => {
      console.log('1 번 데이터', res[0].ORESULT_CUR) 
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      console.log('rows', grdMain.value.getDataProvider().getRows())
      const gridData = res[0].ORESULT_CUR
      let tempList = []

      gridData.forEach((e) => {
        tempList.push({
          CATEGORY: e.CATEGORY
          ,CALC: e.DEPT_MAIN - e.TOT_MAIN
        })
      })
      const arrUnique = tempList.filter(
        (character, idx, arr) => {
          return (
            arr.findIndex((item) => item.CATEGORY === character.CATEGORY) === idx
          )
        }
      )
      tempList = arrUnique
      

      // console.log('tempList', tempList)

      console.log('searchParams',searchParams)

      if(searchParams.BSNS_CD === '' && searchParams.WORK_YR === ''){
        advantage1 = ''
        advantage2 = ''
        advantage3 = ''
        disAdvantage1 = ''
        disAdvantage2 = ''
        disAdvantage3 = ''

      }else{
        tempList.sort((a, b) => a.CALC - b.CALC)
        console.log('entries',tempList)
        advantage1 = tempList[0].CATEGORY
        advantage2 = tempList[1].CATEGORY
        advantage3 = tempList[2].CATEGORY

        tempList.sort((a, b) => b.CALC - a.CALC)
        disAdvantage1 = tempList[0].CATEGORY
        disAdvantage2 = tempList[1].CATEGORY
        disAdvantage3 = tempList[2].CATEGORY
      }

      // Sort entries by value in ascending order
      
      

    })
  }
}

// 조회1 년도 변경 감지
watch(
  () => searchParams.TASK_NO,
  (newValue) => {
    if(parseInt(searchParams.TASK_NO) >= 2024){
      searchParams.CMPNY_DIV = userStore.cmpnyDiv
    }
    if (!newValue) {
    } else {
      commonSearchApi({
        queryId: "EDUCA0010_SEARCH_08",
        param: { TASK_NO: newValue , CMPNY_DIV: searchParams.CMPNY_DIV },
      }).then((res) => {
      console.log('res',res)
      searchParams.CMPNY_DIV = ''
      searchParams.BSNS_CD = ''
      searchParams.WORK_YR = ''
      if(!res.ORESULT_CUR1){
        res.ORESULT_CUR1 = []
      }
      if(!res.ORESULT_CUR2){
        res.ORESULT_CUR2 = []
      }
      if(!res.ORESULT_CUR8){
        res.ORESULT_CUR8 = []
      }
      codeList.CMPNY_DIV = res.ORESULT_CUR1
      codeList.BSNS_CD = res.ORESULT_CUR2
      codeList.WORK_YR = res.ORESULT_CUR8

      if(codeList.BSNS_CD.length > 0) {
        searchParams.BSNS_CD = codeList.BSNS_CD[0].TXT
      }
      codeList.CMPNY_DIV.unshift({COD: '', TXT: '전체'})
      // codeList.BSNS_CD.unshift({COD: '', TXT: '전체'})
      codeList.WORK_YR.unshift({COD: '', TXT: '전체'})

    
      })
    }
  }
)

// 회사 변경감지

watch( 
  () => searchParams.CMPNY_DIV 
  ,(newValue,oldValue) => {
    if(oldValue !== newValue){
      commonSearchApi({
        queryId: "EDUCA0010_SEARCH_04",
        param: { TASK_NO: searchParams.TASK_NO, CMPNY_DIV: newValue },
      }).then((res) => {
        codeList.BSNS_CD = res.ORESULT_CUR
        codeList.BSNS_CD.unshift({COD: '', TXT: '전체'})
        searchParams.BSNS_CD = ''
      })
    }
  })


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
        <IMenuTitle
          ref="menuTitle"
          :button-list="[ 'btnSearch']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
        <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
        <!-- 첫번째 조회 조건 -->
          <v-sheet class="searchArea d-flex" style="justify-content: space-between;">
            <v-sheet class="d-flex" style="align-items: center;">
              <i-select
                :label="$t('년도')"
                label-width="30px"
                width="150px"
                v-model="searchParams.TASK_NO"
                type="YEAR"
                style="margin-left:16px;"
                @change="yearChange('search1')"
              />
              <i-select
                :label="$t('회사')"
                label-width="30px"
                width="250px"
                v-model="searchParams.CMPNY_DIV"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
              />
              <i-select
                :label="$t('사업부')"
                label-width="40px"
                width="250px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="COD"
                item-title="TXT"
              />
              <i-select
                :label="$t('근속년수')"
                label-width="50px"
                width="250px"
                v-model="searchParams.WORK_YR"
                :items="codeList.WORK_YR"
                item-value="COD"
                item-title="TXT"
              />
            </v-sheet>
            <v-sheet class="d-flex" style="align-items: center;">
              <p style="font-size: large;">
                장점 순위 : 
                <v-icon icon="mdi-numeric-1-box-outline" style="color: blue;"></v-icon>
                <v-icon icon="mdi-numeric-2-box-outline" style="color: blue;"></v-icon>
                <v-icon icon="mdi-numeric-3-box-outline" style="color: blue;"></v-icon>
                 / 단점 순위: 
                <v-icon icon="mdi-numeric-1-box-outline" style="color: crimson;" ></v-icon>
                <v-icon icon="mdi-numeric-2-box-outline" style="color: crimson;"></v-icon>
                <v-icon icon="mdi-numeric-3-box-outline" style="color: crimson;"></v-icon>
              </p>
            </v-sheet>
          </v-sheet>
          <div class="fill-height" style="display: flex;">
            <v-sheet class="pa-0 h-auto fill-height">
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
</template>

<style scoped lang="scss">
.v-navigation-drawer__scrim {
    display: none;
  }
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 220px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 580px;
  }
}
.rg-renderer{
  max-height: 180px !important;  
}
</style>