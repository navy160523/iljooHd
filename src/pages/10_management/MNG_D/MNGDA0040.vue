<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import MNGDA0040Pop01 from "./MNGDA0040Pop01.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name:'10_management-MNG_D-MNGDA0040',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const searchArea = ref(null)
const mNGDA0040Pop01 = ref(null)
const fileUploadPopup = ref(null)

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnClose'])

//파라미터 모델
const paramList = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs().format("YYYY"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  IN_OUT: '',
  USE_DIV: 'Y',
})

//코드리스트
const codeList = reactive({
  BSNS : [],
  DEPT : [],
  IN_OUT: [{ COD: '', TXT: '전체' }, { COD: 'IN', TXT: '내부' }, { COD: 'OT', TXT: '외부' }],
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { editable : false, header : { height : 45 } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_FULL_NM', dataType: 'text', header: { text: t('조치부서') }, editable : false, width: '200', styleName: 'left-column' },
    { fieldName: 'IN_OUT_NM', dataType: 'text', header: { text: t('내/외부') }, editable : false, width: '60' },
    { fieldName: 'CERT_DT', dataType: 'text', header: { text: t('심사일') }, editable : false, width: '60' },
    { fieldName: 'CERT_EMP_NM', dataType: 'text', header: { text: t('HSE 추진자') }, editable : false, width: '50' },
    { fieldName: 'RESULT_CD', dataType: 'text', header: { text: t('부적합구분') }, editable : false, width: '80' },
    { fieldName: 'RESULT_CONTENTS', dataType: 'text', header: { text: t('부적합 내용') }, editable : false, width: '250', styleName: 'multiline-editor-left' },
    { fieldName: 'SOLUTION_PLAN', dataType: 'text', header: { text: t('개선조치방안') }, editable : false, width: '250', styleName: 'multiline-editor-left' },
    { fieldName: 'CERT_NM', dataType: 'text', header: { text: t('인증규격') }, editable : false, width: '150' },
    { fieldName: 'RECEIPT_DT', dataType: 'text', header: { text: t('회신\n요구일'), styleName: 'orange-column multiline-editor' }, editable : false, width: '60' },
    { fieldName: 'APP_DATE', dataType: 'text', header: { text: t('결재일자') }, editable : false, width: '60' },
    { fieldName: 'STATUS_NM', dataType: 'text', header: { text: t('상태') }, editable : false, width: '120' },
    { fieldName: 'ACTION_CONTENTS1', dataType: 'text', header: { text: t('조치결과\n(부적합 사항을 제거하기 위한 시정조치결과)'), styleName: 'orange-column multiline-editor' }, editable : false, width: '260', styleName: 'multiline-editor-left' },
    { fieldName: 'ACTION_CONTENTS2', dataType: 'text', header: { text: t('발생원인\n(근본원인)'), styleName: 'orange-column multiline-editor' }, editable : false, width: '250', styleName: 'multiline-editor-left' },
    { fieldName: 'ACTION_CONTENTS3', dataType: 'text', header: { text: t('근본원인 제거를 위한\n재발방지대책'), styleName: 'orange-column multiline-editor' }, editable : false, width: '250', styleName: 'multiline-editor-left' },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      editable: false,
      width: '50',
      isFile: { value: true },
      header: { text: t('파일\n첨부'), styleName: 'orange-column multiline-editor' },
    },
    { fieldName: 'SA_COMMENT', dataType: 'text', header: { text: t('검토의견') }, editable : false, width: '250', styleName: 'multiline-editor-left' },
  ],
  columns : [],
  columnLayout: [
    'DEPT_FULL_NM', 
    'IN_OUT_NM', 
    'CERT_DT', 
    'CERT_EMP_NM', 
    'RESULT_CD', 
    'RESULT_CONTENTS', 
    'SOLUTION_PLAN', 
    'CERT_NM', 
    'RECEIPT_DT', 
    'APP_DATE', 
    'STATUS_NM', 
    'ACTION_CONTENTS1', 
    'ACTION_CONTENTS2', 
    'ACTION_CONTENTS3', 
    'FILE_ID',
    'SA_COMMENT', 
  ],
})

grdMainProps.columns = grdMainProps.fields

//사업부 설정
const setBsnsCombo = () =>{
  codeList.BSNS = []
  codeList.DEPT = []
  codeList.BSNS.push({ BSNS_CD: '', BSNS_NM: '전체'  })
  commonSearchApi({ queryId : 'searchBSNS', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.BSNS.push(element)
    })
  })
}

//연도 변경
const keyupYYYY = async event => {
  if(event.key === 'Enter'){
    onButtonsClick({ id :'btnSearch' })
  }  

  let regex = /[^.0-9]/g
  
  paramList.YEAR = paramList.YEAR.replaceAll(regex, '')
  if(paramList.YEAR.length > 4){
    paramList.YEAR = paramList.YEAR.substring(0,4)
  }
}

// 사업부 변경 시 부문, 부서 변경 이벤트
watch(() => paramList.BSNS_CD, (newValue, oldValue) => {
  Promise.all([
    // 부서[0]
    commonSearchApi({
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV:'Y'
      }
    })
  ]).then(res => {
    codeList.DEPT = res[0].ORESULT_CUR // 부서

    codeList.DEPT.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 

    if (newValue !== oldValue) {
      paramList.DEPT_CD = ''
    }
  })
})

//부서 설정
const setDeptMainCombo = () =>{ 
  let paramDept = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    BSNS_CD : paramList.BSNS_CD,
    USE_DIV : paramList.USE_DIV,
  }
  
  codeList.DEPT = [{ DEPT_CD: '', DEPT_NM: '전체'  }]
  
  commonSearchApi({ queryId : 'searchDept3', param: paramDept }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.DEPT.push(element)  
    })
  })  
}

//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  fileUploadPopup.value.openPopup(data.FILE_ID)
}

//콤보박스 설정
const initCombo = () => {  
  //사업부 설정
  setBsnsCombo()

  //부서 설정
  setDeptMainCombo()
}

//조회 전 유효성 및 사전준비
const beforeSearch = () => {  
  return true
}

//조회 실행
const searchMainData = () => {
  return commonSearchApi({ queryId : 'MNGDA0040_SEARCH_01', param: paramList })
}

//조회 후
const afterMainSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().displayOptions.rowHeight = -1
}

//조회
const searchData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()    
}

//조회버튼 이벤트
const onButtonsClick = btn => {
  searchData()
}

//팝업창 호출 이벤트
const onButtonsClickPop = btn => {
  mNGDA0040Pop01.value.openPopup({YEAR : paramList.YEAR, BSNS_CD : paramList.BSNS_CD, IN_OUT : paramList.IN_OUT})
}

onMounted(() => {
  vm.$nextTick(() => {
    initCombo() 
    searchData()
  }) 
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <VForm ref="searchArea" class="searchArea d-flex justify-space-between " >
          <div class="d-flex align-center">
            <!--  년도  -->
            <i-input
            :label="$t('년도')"
            label-width="35px"
            width="150px"
            v-model="paramList.YEAR"
            type="Number"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            />
            <!-- 사업부 -->
            <i-select
              :label="$t('사업부')"
              label-width="60px"
              width="230px" 
              v-model="paramList.BSNS_CD"
              :items="codeList.BSNS"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <!-- 부서 -->
            <i-select
              :label="$t('부서')"
              label-width="70px"
              width="300px"
              v-model="paramList.DEPT_CD"
              :items="codeList.DEPT"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
            />   
            <!-- 내외 여부 -->
            <i-select
              :label="$t('내/외부')"
              label-width="70px"
              width="300px"
              v-model="paramList.IN_OUT"
              :items="codeList.IN_OUT"
              item-value="COD"
              item-title="TXT"
            />                               
          </div>
          <div class="d-flex align-center">
            <IGridTitle
              ref="gridTitle"
              class="mt-2"
              :button-list="['btnIncongruitySearch']"
              @click-button="onButtonsClickPop"
            />
          </div>
        </VForm>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 800px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellItemClicked="onCellButtonClicked"
        />
      </div>
    </v-card-text>
    <MNGDA0040Pop01 ref="mNGDA0040Pop01" />
    <!-- 파일업로드팝업 -->
    <IUploadPopup ref="fileUploadPopup" :isVisibled="false" :buttonList="buttonList"  />
  </v-card>
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
