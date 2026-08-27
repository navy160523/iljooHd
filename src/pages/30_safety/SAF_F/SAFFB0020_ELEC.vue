<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"

// import SAFFB0020AddPopUp from "@/pages/30_safety/SAF_F/SAFFB0020AddPopUp.vue"

defineOptions({
  name:'30_safety-SAF_F-SAFFB0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const grdMain = ref(null)
const saffb0020PopUp = ref(null)

const searchParam = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
  FROM_DT: dayjs().add(-1, 'day').startOf('month').format('YYYY-MM-DD'),
  TO_DT: dayjs().add(-1, 'day').format('YYYY-MM-DD'), 
  USE_DIV: 'N'
})

const codeList = reactive({
  BSNS_List: [],
  DEPT_List: [],
  PART_List: []
})

const gradeList = reactive([
  // {Text:'안전',Color:'#C0FFC0'},
  // {Text:'주의',Color:'#FFFFC0'},
  // {Text:'경고',Color:'#FFE0C0'},
  // {Text:'위험',Color:'#FF8080'}
  {Text:'안전',Color:'rgba(5, 129, 253, 0.1)'},
  {Text:'주의',Color:'rgba(11, 182, 156, 0.1)'},
  {Text:'경고',Color:'rgba(255, 118, 55, 0.1)'},
  {Text:'위험',Color:'rgba(255, 82, 82, 0.1)'}
])

const customGridStyle = () => {

  // 과소계, 부서소계, 부문 소계 색상 변경
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let value = grid.getValue(item.index, "GROUPING_TEAM")

    if(value == '1' ){
      ret.style = { background: "rgb(220,220, 220)" }
    } else if(value == '3' ){
      ret.style = { background: "rgb(169,169, 169)" }
    } else if(value == '7' ){
      ret.style = { background: "rgb(105,105, 105)" }
    } else {
      // ret.style = { background: "rgb(255,193,158)" }
      //ret = 'orange-color'
    }

    return ret
  })

}

const customGridStyle2 = () => {
  // 총점 셀 색상 변경
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    // console.log("setCellStyleCallback start")
    let ret = {}
    // console.log("dataCell.dataColumn.fieldName=" + dataCell.dataColumn.fieldName)
    if(dataCell.dataColumn.fieldName === 'MPOINT_TOTAL' || dataCell.dataColumn.fieldName === 'PPOINT_TOTAL' ){
      // 연한 파란색
      ret.style = { background: "rgb(176, 224, 230)" }
      // 약간 짙은 파란색
    } else if(dataCell.dataColumn.fieldName === 'TOTAL' ){
      ret.style = { background: "rgb(176, 196, 222)" }
    }

    return ret
  })
}


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable:true }, header: { height: 75 },  checkBar: { visible: true } },
  keys : [],
  fields : [ 
    // , mergeRule: { "criteria": "value" }dff
    { fieldName: 'CMPNY_DIV' , dataType: 'text',  width: '80' , readOnly: true, visible: false, editable: false, header: { text: t('회사코드2')  }  },     
	{fieldName: 'BSNS_CD' , dataType: 'text',  width: '80' , readOnly: true, visible: false, editable: false, header: {text: t('사업부코드2')  }  }, 
  {fieldName: 'YYYYMMDD' , dataType: 'text',  width: '80' , readOnly: true, visible: false, editable: false, header: {text: t('YYYYMMDD')  }  }, 
  {fieldName: 'GROUPING_TEAM' , dataType: 'text',  width: '100' , readOnly: true, visible: true, editable: false, header: {text: t('GROUPING')  }  }, 
	{fieldName: 'PART_CD' , dataType: 'text',  width: '40' , readOnly: true, editable: false, visible: false, header: {text: t('부문코드')  }  }, 
	{fieldName: 'PART_NM' , dataType: 'text',  width: '80' , readOnly: true, editable: false, header: {text: t('부문명')  }, mergeRule: { "criteria": "value" }  }, 
	{fieldName: 'DEPT_CD' , dataType: 'text',  width: '80' , readOnly: true, editable: false, visible: false, header: {text: t('부서코드')  }  }, 
	{fieldName: 'DEPT_NM' , dataType: 'text',  width: '130' , readOnly: true, editable: false, header: {text: t('부서명')  }, mergeRule: { "criteria": "value" }  }, 
  {fieldName: 'OUT_NM' , dataType: 'text',  width: '80' , readOnly: true, editable: false, header: {text: t('구분')  }, mergeRule: { "criteria": "value" }  }, 
	{fieldName: 'ASGN_CD' , dataType: 'text',  width: '80' , readOnly: true, editable: false, visible: false, header: {text: t('과코드')  }  }, 
	{fieldName: 'ASGN_NM' , dataType: 'text',  width: '110' , readOnly: true, editable: false, header: {text: t('과명')  }, mergeRule: { "criteria": "value" }  }, 
	{fieldName: 'TEAM_CD' , dataType: 'text',  width: '80' , readOnly: true, editable: false, visible: false, header: {text: t('팀코드')  }  }, 
	{fieldName: 'TEAM_NM' , dataType: 'text',  width: '110' , readOnly: true, editable: false, header: {text: t('팀명')  }  }, 
	{fieldName: 'EMP_NO' , dataType: 'text',  width: '80' , readOnly: true, editable: false, visible: false, header: {text: t('직책자사번')  }  }, 
	{fieldName: 'EMP_NM' , dataType: 'text',  width: '100' , readOnly: true, editable: false, header: {text: t('직책자명')  }  }, 
	{fieldName: 'ACC_COUNT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('건수')  }  }, 
	{fieldName: 'ACC_MPOINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('감점')  }  }, 
	{fieldName: 'ACC_POINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('점수')  }  }, 
	{fieldName: 'RUL_COUNT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('건수')  }  }, 
	{fieldName: 'RUL_MPOINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('감점')  }  }, 
	{fieldName: 'RUL_POINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('점수')  }  }, 
	{fieldName: 'DNG_POINT' , dataType: 'text',  width: '80' , readOnly: true, editable: false, header: {text: t('안전개선\n활동\n(15점)'), styleName: 'multiline-editor' } }, 
	{fieldName: 'SAF_MPOINT' , dataType: 'text',  width: '70' , readOnly: true, editable: false, header: {text: t('자율안전\n(10점)'), styleName: 'multiline-editor'  }  }, 
	{fieldName: 'CHK_MPOINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('감점')  }  }, 
  {fieldName: 'CHK_COUNT_B' , dataType: 'number',  width: '80' , readOnly: false, editable: true, maximum: 2, numberFormat: '0', header: {text: t('안전계획서\n미제출(건)'), styleName: 'multiline-editor'  } ,
    editor: {
            type: 'line',
            textAlignment: 'far',
            inputCharacters: "0-9",
            maxLength: 1,

          }    
        },
  {fieldName: 'CHK_COUNT_C' , dataType: 'number',  width: '100' , readOnly: false, editable: true, maximum: 5, numberFormat: '0', header: {text: t('안전수칙\n위반자교육(건)'), styleName: 'multiline-editor'  }, 
    editor: {
            type: 'line',
            textAlignment: 'far',
            inputCharacters: "0-9",
            maxLength: 1,

          }    
        }, 
  {fieldName: 'CHK_COUNT_D' , dataType: 'number',  width: '80' , readOnly: false, editable: true,maximum: 2, numberFormat: '0', header: {text: t('요청자료\n미제출(건)'),styleName: 'multiline-editor'  } ,

    editor: {
            type: 'line',
            textAlignment: 'far',
            inputCharacters: "0-9",
            maxLength: 1,

          }    
        },     
	{fieldName: 'CHK_POINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('점수')  }  }, 
	{fieldName: 'TBM_COUNT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('감점')  }  }, 
	{fieldName: 'TBM_MPOINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('점수')  }  }, 
	{fieldName: 'EDU_MPOINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('감점')  }  }, 
	{fieldName: 'EDU_POINT' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('점수')  }  }, 
	{fieldName: 'MPOINT_TOTAL' , dataType: 'text',  width: '50' , readOnly: true, editable: false, header: {text: t('평가계')  }  }, 
	{fieldName: 'CPN_PPOINT' , dataType: 'number',  maximum: 2, width: '60' , numberFormat: '0', styleName: 'right-column', editable: true, readOnly: false, header: {text: t('칭찬쿠폰\n(2점)'), styleName: 'multiline-editor'}, 
    editor: {
          type: 'line',
          textAlignment: 'far',
          inputCharacters: "0-9",
          maxLength: 1,

        }
  }, 
	{fieldName: 'ENV_PPOINT' , dataType: 'number',  maximum: 1, width: '60' ,  numberFormat: '0', editable: true, readOnly: false, header: {text: t('환경정화\n(1점)'), styleName: 'multiline-editor' },
    editor: {
      type: 'line',
          textAlignment: 'far',
          inputCharacters: "0-9",
          maxLength: 1,        
        }
  }, 
	{fieldName: 'DSN_PPOINT' , dataType: 'number',  maximum: 1, width: '60' , numberFormat: '0', editable: true,  readOnly: false, header: {text: t('안전설계\n(1점)'), styleName: 'multiline-editor'  },
  editor: {
    type: 'line',
          textAlignment: 'far',
          inputCharacters: "0-9",
          maxLength: 1,        
        }
  }, 
	{fieldName: 'EMP_COUNT' , dataType: 'text',  width: '40' , editable: false, readOnly: true, header: {text: t('인원')  }  }, 
	{fieldName: 'PPOINT_TOTAL' , dataType: 'number',  width: '50' , numberFormat: '#.#', editable: false, readOnly: true, header: {text: t('가점계')  }  }, 
	{fieldName: 'TOTAL' , dataType: 'number',  width: '40' , editable: false, numberFormat: '##.#', readOnly: true, header: {text: t('총점')  }  }, 
  ],
  columns : [],
  columnLayout:[
    'YYYYMMDD',   
    'CMPNY_DIV', 
    'BSNS_CD',     
    'GROUPING_TEAM',
    'PART_CD', 
    'PART_NM', 
    'DEPT_CD', 
    'DEPT_NM', 
    'OUT_NM',
    'ASGN_CD', 
    'ASGN_NM', 
    'TEAM_CD', 
    'TEAM_NM', 
    'EMP_NO', 
    'EMP_NM',     
    {
      name: 'ACC',
      direction: 'horizontal',
      items: ['ACC_COUNT', 'ACC_MPOINT', 'ACC_POINT'],
      header: { text: t('안전사고(30점)') },
    },
    {
      name: 'RUL',
      direction: 'horizontal',
      items: ['RUL_COUNT', 'RUL_MPOINT', 'RUL_POINT'],
      header: { text: t('안전수칙위반(20점)') },
    },
    
        
    'DNG_POINT', 
    'SAF_MPOINT', 
    {
      name: 'DNG',
      direction: 'horizontal',
      items: ['CHK_MPOINT', 'CHK_COUNT_B', 'CHK_COUNT_C', 'CHK_COUNT_D', 'CHK_POINT'],
      header: { text: t('안전업무(5점)') },
    },
    
    {
      name: 'TBM',
      direction: 'horizontal',
      items: ['TBM_COUNT', 'TBM_MPOINT'],
      header: { text: t('TBM(10점)') },
    },
    {
      name: 'EDU',
      direction: 'horizontal',
      items: ['EDU_MPOINT', 'EDU_POINT'],
      header: { text: t('안전교육(10점)') },
    },    
    'MPOINT_TOTAL', 
    {
      name: 'PPOINT',
      direction: 'horizontal',
      items: ['CPN_PPOINT', 'ENV_PPOINT', 'DSN_PPOINT'],
      header: { text: t('가점') },
    },     
    'EMP_COUNT', 
    'PPOINT_TOTAL', 
    'TOTAL', 
    
  ],
  
})
grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnFold'){
    grdMain.value.getGridView().collapseAll()  // 전체 접기
  }else if(btn.id === 'btnExpand'){
    grdMain.value.getGridView().expandAll()       // 전체 펼치기
  }else if(btn.id === 'btnRegist'){    
    saffb0020PopUp.value.openPopup({a:'a' }) // // 수작업 등록
           
  }else if(btn.id === 'btnUpdate'){    
    new saveFlowHelper(vm, t)
      // .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

  }

}

//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {

  grdMain.value.getGridView().commit()
  
  let saveParams = []
  let updateParams = []
  const updatedRows = grdMain.value.getDataProvider().getStateRows("updated")

  console.log("updatedRows=" + updatedRows)
  // const createdRows = grdMain.value.getDataProvider().getStateRows("created")
  // for (let rowIdx of createdRows) {
  //   let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
  //   saveParams.push(data)
  // }
  for (let rowIdx of updatedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)    
        
    console.log("data.CPN_PPOINT", data.CPN_PPOINT)
    console.log("data.ENV_PPOINT", data.ENV_PPOINT)
    console.log("data.DSN_PPOINT", data.DSN_PPOINT)

    // 칭찬쿠폰
    if (data.CPN_PPOINT !== undefined ) {
      data.SEQ = "0"
      data.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data.TYPE = "CPN"
      data.PPOINT = data.CPN_PPOINT    
      saveParams.push(data)
    }
    
    // 환경정화
    if (data.ENV_PPOINT !== undefined ) {
      const data2 = JSON.parse(JSON.stringify(data))
      data2.SEQ = "0"
      data2.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data2.TYPE = "ENV"
      data2.PPOINT = data.ENV_PPOINT    
      saveParams.push(data2)
    }
    // 안전설계
    if (data.DSN_PPOINT !== undefined ) {
      const data3 = JSON.parse(JSON.stringify(data))
      data3.SEQ = "0"
      data3.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data3.TYPE = "DSN"
      data3.PPOINT = data.DSN_PPOINT    
      saveParams.push(data3)
    }

    // 안전계획서 미제출(건수)
    if (data.CHK_COUNT_B !== undefined ) {
      const data4 = JSON.parse(JSON.stringify(data))
      data4.SEQ = "0"
      data4.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data4.TYPE = "CHK_B"
      data4.COUNT = data.CHK_COUNT_B  
      DATCA0020_TAB04Vue.PPOINT = data.CHK_COUNT_B * -2  
      saveParams.push(data4)
    }

    // 안전수칙위반자 교육(건)
    if (data.CHK_COUNT_C !== undefined ) {
      const data5 = JSON.parse(JSON.stringify(data))
      data5.SEQ = "0"
      data5.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data5.TYPE = "CHK_C"
      data5.COUNT = data.CHK_COUNT_C    
      data5.PPOINT = data.CHK_COUNT_C * -1 
      saveParams.push(data5)
    }

    // 요청자료 미제출(건)
    if (data.CHK_COUNT_D !== undefined ) {
      const data6 = JSON.parse(JSON.stringify(data))
      data6.SEQ = "0"
      data6.YYYYMMDD = searchParam.TO_DT.replaceAll("-", "")
      data6.TYPE = "CHK_D"
      data6.COUNT = data.CHK_COUNT_D
      data6.PPOINT = data.CHK_COUNT_D * -2
      saveParams.push(data6)
    }
    
  }  

  return commonExecuteApi({ queryId: "SAFFB0020_ELEC_SAVE_01", list: saveParams })
}


const beforeSave = () => {
  
  return true;
}


const searchData = () => {
  
  return commonSearchApi({ queryId : 'SAFFB0020_ELEC_SEARCH_01', param: searchParam })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // grdMain.value.getGridView().groupBy(['YYYYMMDD'])

  // grdMain.value.getGridView().setRowGroup({
  //   headerStatement: '${groupValue} _ ${rowCount} 건',    // group header 글자 표시
  //   expandedAdornments: 'header'                          // group footer 표시
  // })

  cellStyle()

  customGridStyle2()
}

const bsnsChange = e => {
  searchParam.PART_CD = ''
  searchParam.DEPT_CD = ''
  codeList.DEPT_List = [{ ASGN_NM: '전체', ASGN_CD: '' }]
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search03', param : searchParam }),
  ]).then(res => {
    codeList.PART_List = res[0].ORESULT_CUR
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
  })
}

const partChange = e => {
  searchParam.DEPT_CD = ''
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search04', param : searchParam }),
  ]).then(res => {
    codeList.DEPT_List = res[0].ORESULT_CUR
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
  })
}

/* ******************* 합산등급 색상 변경 ******************* */
const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    
    if(dataCell.dataColumn.fieldName === 'TOT_GRADE'){
      // if(dataCell.value === '안전'){
      //   ret.style = { background: '#C0FFC0'}
      // }else if(dataCell.value === '주의'){
      //   ret.style = { background: '#FFFFC0'}
      // }else if(dataCell.value === '경고'){ 
      //   ret.style = { background: '#FFE0C0'}
      // }else if(dataCell.value === '위험'){
      //   ret.style = { background: '#FF8080'}
      // }
      if(dataCell.value === '안전'){
        ret.style = { background: gradeList[0].Color}
      }else if(dataCell.value === '주의'){
        ret.style = { background: gradeList[1].Color}
      }else if(dataCell.value === '경고'){ 
        ret.style = { background: gradeList[2].Color}
      }else if(dataCell.value === '위험'){
        ret.style = { background: gradeList[3].Color}
      }
    }

    return ret
  })
}

/* 엑셀 다운로드시 merge 위해 전체 펼치기 */
const onContextMenuPopup = (grid, x, y, elementName) => {
  onButtonsClick({id: 'btnExpand'})
}

const initCodeList = () => {
  Promise.all([    
    // 사업부 
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search02', param : searchParam }),
    // 부문
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search03', param : searchParam }),
    // 부서
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search04', param : searchParam }),
  ]).then(res => {
    codeList.BSNS_List = res[0].ORESULT_CUR

    codeList.BSNS_List.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })

    // 일렉을 디폴트로 선택
    searchParam.BSNS_CD = "AW00"
    // 부문 데이터 로드
    bsnsChange()

    // grdMain.value.getGridView().groupPanel.visible = false    // 그룹핑 헤더 판넬영역
    // grdMain.value.getGridView().setGroupingOptions({
    //    expandWhenGrouping: false   // 그룹핑시 그룹 펼침 여부
    // })
  })
}

const onProjectSelected = val => {
  console.log("onProjectSelected")
}

onMounted(() => {
  // 일단 제거함. (2024.12.18)
  // grdMain.value.getGridView().setFixedOptions({colCount: 6 })
  initCodeList()

  // 그리드 소계 셀색상 표시
  customGridStyle()

  customGridStyle2()

})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 'btnSearch','btnFold','btnExpand', 'btnUpdate', 'btnPrint', 'btnReqApply'-->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-1">
          <i-input
            :label="$t('조회일자')"
            labelWidth="60px"
            type="date"
            width="230px"
            class="mr-1"
            v-model="searchParam.TO_DT"
          />
          <!-- 
          <i-input
            :label="$t('~')"
            type="date"
            width="180px"
            v-model="searchParam.TO_DT"
          /> -->
          <i-select
            :label="$t('사업부')"
            labelWidth="45px"
            width="250px"
            v-model="searchParam.BSNS_CD"
            :items="codeList.BSNS_List"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="bsnsChange"
          />
          <i-select
            :label="$t('부문')"
            labelWidth="35px"
            width="250px"
            v-model="searchParam.PART_CD"
            :items="codeList.PART_List"
            item-value="PART_CD"
            item-title="PART_NM"
            @update:modelValue="partChange"
          />
          <i-select
            :label="$t('부서')"
            labelWidth="35px"
            width="300px"
            v-model="searchParam.DEPT_CD"
            :items="codeList.DEPT_List"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
          />
        </v-sheet>
        <v-sheet class="h-auto flex-column">
          <div class="d-flex align-self-end">
            <!--
            <div v-for="item in gradeList" :key="item" class="d-flex align-center mb-1 ml-2">
              <div class="pr-1">{{ item.Text }}</div>
              <div class="border pa-2" :style="'width:40px; height:25px; background-color: ' + item.Color"></div>
            </div>
            -->
          </div>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onContextMenuPopup="onContextMenuPopup"
          />
          

        </v-sheet>
        
      </div>
    </v-card-text>
  </v-card>
  <SAFFB0020AddPopUp  ref="saffb0020PopUp" @selected="onProjectSelected"/>
</template>
  
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>