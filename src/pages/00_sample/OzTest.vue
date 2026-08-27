<script setup>
//import envs from '../envs.js'

import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useRouter } from 'vue-router'
import RealGrid from '@/components/RealGrid.vue'
import OZReport from '@/components/OZReport.vue'

const router = useRouter()
const grdMain = ref(null)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref(null)
// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false },

},

  //keys : ['REPORT_ID'],
  fields : [ 
    { fieldName: 'REPORT_ID', dataType: 'text', styleName: "left-column", header: { text:'ID' }, width:20, editable: true },    { fieldName: 'REPORT_NAME', dataType: 'text', styleName: "left-column", header: { text:'리포트 명칭' }, width:40, editable: false },
    { fieldName: 'PARAM', editor: { type: 'multiline' }, styleName: "left-column multiline-editor", header: { text:'파라미터' }, width: 100, editable: true },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const afterSearch = () => {
  
  const data = [{ REPORT_ID : 'HSE_UIGA1040C.ozr', REPORT_NAME :'건출물 기본정보', PARAM: '' },
              { REPORT_ID : 'TEST.ozr', REPORT_NAME :'테스트 페이지', PARAM: 'IN_PARAM1=\'AA\'' },
              { REPORT_ID : 'TEST2.ozr', REPORT_NAME :'테스트 페이지(파라미터 없이)', PARAM:'' },
              { REPORT_ID : 'ISMS_CONTATTFILE.ozr', REPORT_NAME :'계약서 첨부 내역서', PARAM: 'BB' },
              { REPORT_ID : 'HSE_MNGAA0030.ozr', REPORT_NAME :'HSE 중점 추진 실적', PARAM: 'IN_CMPNY_DIV=HHI, IN_BSNS_CD=AC00, IN_DEPT_CD=C6T0, IN_ASGN_CD=C6T0, IN_YEAR=2023, IN_QUARTER=4' },
              { REPORT_ID : 'HSE_MNGAA0040.ozr', REPORT_NAME :'HSE 중점 추진 실적 분석', PARAM: 'BB' },
              { REPORT_ID : 'PARAM_TEST.ozr', REPORT_NAME :'파라미터 테스트용', PARAM: 'BB' },
              { REPORT_ID : 'MNGTEST.ozr', REPORT_NAME :'테스트용222', PARAM: 'IN_CMPNY_DIV=HHI, IN_BSNS_CD=AC00, IN_DEPT_CD=C6T0, IN_ASGN_CD=C6T0, IN_YEAR=2023, IN_QUARTER=4' },
            ]

  grdMain.value.getDataProvider().setRows(data)
  //grdMain.value.getDataProvider().setRows(setSearchData(res.ORESULT_CUR))
}


// #2 Start ----------------------------
// 출력버튼 클릭시 오즈 리포트 팝업
const onOzPrint = () => { 
  showOz.value = true
}

// #2 End

const onButtonsClick = btn => {
  
  // 조회
  if (btn.id === 'btnSearch') {
    grdMain.value.getGridView().displayOptions.rowHeight = -1
    afterSearch()
  } 
  // 출력
  else if (btn.id === 'btnPrint') {
    
    
    //reportName.value = '/manage/hse/TEST.ozr'
    
    //params.value = ['myt=23']

    onOzPrint()
  }
}

const openPopup = async (path, width, height, param = '', type = '_blank', debugType = '') => {
  console.log('# [apiFunc.js] openPopup() run')
  
  let asisURL = path
  let urlDiv = String(path).split('/')

  if (urlDiv.length > 0) {
    asisURL = urlDiv[urlDiv.length - 1]
  }
  
  let url = '#' + path + '?theme=page'
  
  //store.state.param = param
  console.log('url = ', url)  
  //window.open('itsm.hhi.co.kr', type, 'width=' + width + ', height=' + height + ', scrollbars=yes, resizable=yes')
  //window.open('#/00_sample/OZReport', type, 'width=' + width + ', height=' + height + ', scrollbars=yes, resizable=yes')
  //router.push('/00_sample/OZReport')
  router.push('/00_sample/OZReport?name=abc&report=123aaa')
}

const onCellClicked = (grid, clickData) => {
  //console.log('Selected Row = ',grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex))
  if(clickData.cellType !== 'header') {
    reportName.value = '/manage/hse/' + grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex).REPORT_ID

    let val = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex).PARAM

    params.value = val.replace(/ /g, "").split(',')

    //console.log('')
    //console.log('params value ==', params.value)

    //console.log('param.value = ', params.value.toString().replace(/ /g,""))

    
  }
}
</script>

<template>
<div>
		<VContainer
      class="pt-0"
    >
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            title="OZReport Test"
            :button-list="['btnSearch', 'btnPrint']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 메인그리드 -->
      <VRow no-gutters>
          <VCol>
            <IGridTitle title="Report List">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 410px);"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </VCol>
        </VRow>

      <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
      </VContainer>
	</div>
</template>
