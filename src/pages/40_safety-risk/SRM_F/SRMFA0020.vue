<!--
  화면명 : 안전긴급예산 전체 현황
  화면개요 : 안전긴급예산 현황을 조회하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SRMFA0010 from '@/pages/40_safety-risk/SRM_F/SRMFA0010.vue'
import SRMFA0020Popup01 from '@/pages/40_safety-risk/SRM_F/SRMFA0020Popup01.vue'
import { useRouter } from 'vue-router'
import { useRoute } from "vue-router";
import { useCommonStore } from "@hiway/stores/common";
defineOptions({
  name: '40_safety-risk-SRM_F-SRMFA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const commonStore = useCommonStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const sRMFA0010 = ref(null)
const sRMFA0020Popup01 = ref(null)
const dummy =ref('')

//조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  BSNS_NM: '',
  DEPT_NM: '',
  LINK: '',         // 출처
  LGUBN: '',         // 대구분
  SGUBN: '',         // 소구분
  COMPLETED: '',    // 진행현황
  SDATE: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
  EDATE: dayjs().format('YYYY-MM-DD'),
  BG_GUBN: '',
  STATUS: '',
  TITLE: '',
  DATE_GUBN:'O',
  PROGRESS:'',
  COLUMN_VISIBLE:'Y',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  COMPLETED : [],
  LINK: [], // 출처
  LGUBN : [{COD : '', TXT : '전체'},
          {COD : 'L01', TXT : '법규/규정준수'},
          {COD : 'L02', TXT : '사고 재발방지'},
          {COD : 'L03', TXT : '선제적 개선활동'},
          {COD : 'L04', TXT : '안전문화증진'}],
  SGUBN : [{COD : '', TXT : '전체'},
          {COD : 'S01', TXT : '크레인'},
          {COD : 'S02', TXT : '통신'},
          {COD : 'S03', TXT : '계측'},
          {COD : 'S04', TXT : '문화'},
          {COD : 'S05', TXT : '공법 개선'},
          {COD : 'S06', TXT : '컨설팅'},
          {COD : 'S07', TXT : '시설개선'},
          {COD : 'S08', TXT : '기타'}],
  STATUS: [{COD : '', TXT : '전체'},{COD : '3', TXT : '검토 보류 / 반려항목'},{COD : '2', TXT : '검토요청항목'},{COD : '1', TXT : '지원 집행항목'}],
  PROGRESS: [{COD : '', TXT : '전체'},{COD : 'X', TXT : '반려'},{COD : 'O', TXT : '보류'},{COD : '1', TXT : '투자접수(기초 자료포함)'},{COD : '2', TXT : '[SRM]담당과장 검토중(초안)'},
              {COD : '3', TXT : '[SRM]부서장 검토중(초안)'},{COD : '4', TXT : '[담당부서]지원 확약 및 최종보고서 작성중'},
              {COD : '5', TXT : '[SRM]최종보고서 확인(담당자->담당과장->부서장)'},{COD : '6', TXT : '[담당부서]최종보고서 결재 중(현업)'},
              {COD : '7', TXT : '[담당부서]최종보고서 결재 중(사업부 원가)'},{COD : '8', TXT : '[담당부서]최종보고서 결재 중(재무)'},
              {COD : '9', TXT : '[재무]예산이관 중'},{COD : '10', TXT : '[재무]예산이관 완료(업무종료)'},],    // 진행현황
  BG_GUBN: [{COD : '', TXT : '전체'},{COD : 'F', TXT : '시설투자'},{COD : 'C', TXT : '경상비'}],
  DATE_GUBN: [{COD : 'O', TXT : '목표일정'},{COD : 'R', TXT : '요청일자'},{COD : 'V', TXT : '검토일자'},{COD : 'E', TXT : '집행일자'}],
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
    getCodeList("HHIJJC12"), // 출처[2]
    getCodeList("HHIJJE12"), // 진행현황[3]
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.LINK = res[2].ORESULT_CUR
    codeList.COMPLETED = res[3].ORESULT_CUR
    
    
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
    codeList.LINK.unshift({ COD: '', TXT: '전체' })
    codeList.COMPLETED.unshift({ COD: '', TXT: '전체' })

    // grdMain.value.setBindingColumn("TASK_NO_STEP", codeList.LINK, "COD", "TXT") // 출처 LookUp
  })
  codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
}

//그리드 속성셋팅
const grdMainProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  fields: [
    { fieldName: 'EB_COD',   dataType: 'text', width: '90', header: { text: t('안전긴급예산') } },
    { fieldName: 'REG_DT',   dataType: 'text', width: '120', header: { text: t('요청일자') } },
    { fieldName: 'RISK_NM',  dataType: 'text', width: '200', header: { text: t('제목') }, styleName: 'left-column' },
    { fieldName: 'LGUBN', dataType: 'text', lookupData:  { value: "COD", label: "TXT", list: codeList.LGUBN }, lookupDisplay: true, width: '100', header: { text: t('대구분') } },
    { fieldName: 'SGUBN', dataType: 'text', lookupData:  { value: "COD", label: "TXT", list: codeList.SGUBN }, lookupDisplay: true, width: '100', header: { text: t('소구분') } },
    { 
      fieldName: 'THUMBNAIL',
      width: '200',
      header: { text: t('썸네일') },
      renderer: {
        width: '200',
        type: 'image',
        imageField: 'THUMBNAIL',
        imageHeight: 130,
      }
    },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '120', header: { text: t('담당부서') } },
    { fieldName: 'STATUS', dataType: 'text', lookupData:  { value: "COD", label: "TXT", list: codeList.PROGRESS }, lookupDisplay: true, width: '140', header: { text: t('진행현황') } },
    { fieldName: 'EB_EDATE', dataType: 'text', width: '120', header: { text: t('목표일정') } },
    { fieldName: 'TASK_NO_1', dataType: 'text', width: '100', header: { text: t('Hi-SAFE') } },
    { fieldName: 'BG_CUR_EXP', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('경상비') }, visible : searchParams.COLUMN_VISIBLE === 'Y' },
    { fieldName: 'BG_FAC_INV', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('시설투자') }, visible : searchParams.COLUMN_VISIBLE === 'Y' },
    { fieldName: 'TOTAL', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('합계') } },
    { fieldName: 'COST_RESULT_BS', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('자체진행') }, visible : searchParams.COLUMN_VISIBLE === 'Y' },
    { fieldName: 'COST_RESULT_DS', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('예산변동') }, visible : searchParams.COLUMN_VISIBLE === 'Y' },
    { fieldName: 'COST_RESULT_SS', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", width: '120', header: { text: t('현업이관') }, visible : searchParams.COLUMN_VISIBLE === 'Y' },
    { fieldName: 'MANAGER_NM', dataType: 'text', width: '80', header: { text: t('담당자') } },
    { fieldName: 'TASK_SEQ', dataType: 'text', width: '80', header: { text: t('리스크 관리번호') } },
  ],
  columns: [],
})

grdMainProps1.columns = grdMainProps1.fields

const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnExcel') {
    let excelFileNM = searchParams.SDATE + '~' + searchParams.EDATE + ' 안전긴급예산 현황'
    
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
    })
  } else if (btn.id === 'btnDetail') {
    sRMFA0020Popup01.value.openPopup()
  }
}

//로우 더블 클릭시 발생하는 이벤트
const cellDbClick = (grid, data) => {
  let row =  grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  if(row === null) return

  sRMFA0010.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, TASK_SEQ : row.TASK_SEQ, EB_COD : row.EB_COD }) 
}


const searchData = () => {

  return commonSearchApi({ 
    queryId : 'SRMFA0020_SEARCH_01',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      DATE_GUBN: searchParams.DATE_GUBN,
      LGUBN: searchParams.LGUBN,
      SGUBN: searchParams.SGUBN, // 출처
      SDATE: searchParams.SDATE.replaceAll('-', ''),       // 진행현황 
      EDATE: searchParams.EDATE.replaceAll('-', '') ,      // 부문
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      MANAGER_ID: searchParams.MANAGER_ID,
      BG_GUBN: searchParams.BG_GUBN,
      STATUS: searchParams.PROGRESS,
      USER_ID:  userStore.userId, 
    } 
  }) 
} 

const afterSearch = async(res) => {
  let searchParam = {}
  let fileInfo = []

  for (let i of res.ORESULT_CUR) {
    // param 정의
    searchParam.CMPNY_DIV = i.CMPNY_DIV
    searchParam.FILE_ID = i.RP_FILE_ID

    await commonSearchApi({ 
      queryId: "searchFile", 
      param: searchParam
    }).then(res => {
      fileInfo.push(res.ORESULT_CUR[0])
    })
  }

  outThumbnail(fileInfo)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 썸네일 이미지 출력
const outThumbnail = async(val) => {
  for (let [index, item] of val.entries()) {
    await commonDownloadFilesApi(item).then(res => {
      const contentDisposition = res.contentDisposition
      const fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

      const blob = new Blob([res])
      const imageURL = URL.createObjectURL(blob)

      const img = new Image() // 이미지 요소 생성

      img.src = imageURL // 이미지 URL 설정
      img.alt = fileName
      dummy.value = imageURL

      grdMain.value.getDataProvider().setValue(index, "THUMBNAIL", dummy.value)
    }).catch(err => {
      console.log(err)
    })
  }
}

//컬럼 visible control
const handleColumn = () =>{
  let visibleColumns = ['BG_CUR_EXP','BG_FAC_INV','COST_RESULT_BS','COST_RESULT_DS','COST_RESULT_SS']
  
  grdMainProps1.fields.forEach(item =>{
    if(visibleColumns.includes(item.fieldName)){
      item.visible = searchParams.COLUMN_VISIBLE === 'Y'
    }
  })
  grdMain.value.getDataProvider().setFields(grdMainProps1.fields)
  grdMain.value.getGridView().setColumns(grdMainProps1.fields)
  grdMain.value.getGridView().setColumnLayout(grdMainProps1.columnLayout)
  grdMain.value.getGridView().commit()
}

// 사업부 변경 시 부문, 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, async (newValue, oldValue) => {
  // 부서[0]
  await commonSearchApi({
    queryId : 'searchDept3',
    param : {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: newValue,
      USE_DIV:'Y'
    }
  }).then(async res => {
    codeList.DEPT_CD = res.ORESULT_CUR // 부서

    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
    if (newValue !== oldValue) {
      searchParams.DEPT_CD = ''
    }
    if(newValue === userStore.bsnsCd){
      searchParams.DEPT_CD = userStore.deptCd
    }
  })
})

const deptDisable = ref(false)

const setDisable = async () =>{
  if(userStore.bsnsCd === 'AN00' || userStore.bsnsCd === 'AX00' ||userStore.empNo === 'BP23091'){
    deptDisable.value = false
  }
  else{
    deptDisable.value = true   

    searchParams.BSNS_CD = userStore.bsnsCd
  }
}


onMounted(() => {
  initCodeList()
  setDisable()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnDetail', 'btnSearch', 'btnExcel']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <!-- 목표일정 -->
            <i-select
              width="110px"
              v-model="searchParams.DATE_GUBN"
              :items="codeList.DATE_GUBN"
              item-value="COD"
              item-title="TXT"
            />
            <!-- 등록기간 -->
            <i-input
              v-model="searchParams.SDATE"
              label-width="50px" 
              width="150px" 
              type="date" 
              margin="10px"
            />
            <i-input 
              v-model="searchParams.EDATE"
              label-width="20px"
              width="170px" 
              :label="$t('~')" 
              type="date"
            />            
            <!-- 사업부 -->
            <i-select
              :label="$t('사업부')"
              label-width="60px"
              width="230px" 
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              :readonly="deptDisable"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <!-- 부서 -->
            <i-select
              :label="$t('부서')"
              label-width="70px"
              width="300px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              :readonly="deptDisable"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
            />
            <!-- 예산 구분 -->
            <i-select
              :label="$t('예산 구분')"
              label-width="110px"
              width="300px"
              v-model="searchParams.LGUBN"
              :items="codeList.LGUBN"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              width="200px"
              v-model="searchParams.SGUBN"
              :items="codeList.SGUBN"
              item-value="COD"
              item-title="TXT"
            />
          </div>
          <div class="d-flex mt-2">
            <!-- 진행현황 -->
            <i-select
              :label="$t('진행현황')"
              label-width="70px"
              width="460px"
              v-model="searchParams.PROGRESS"
              :items="codeList.PROGRESS"
              item-value="COD"
              item-title="TXT"
            />
            <!-- 진행일정 -->
            <i-select
              :label="$t('진행상태')"
              label-width="60px"
              width="230px"
              v-model="searchParams.COMPLETED"
              :items="codeList.COMPLETED"
              item-value="COD"
              item-title="TXT"
            />
            <!-- 모듈 별 조회 -->
            <i-select
              :label="$t('모듈 별 조회')"
              label-width="70px"
              width="300px"
              v-model="searchParams.LINK"
              :items="codeList.LINK"
              item-value="COD"
              item-title="TXT"
            />
            <i-input
              v-model="searchParams.RISK_NM"
              :label="$t('제목 및 내용 조회')"
              label-width="110px"
              width="600px"
              append-inner-icon="mdi-magnify"
              @keydown="e => { if(e.keyCode == 13) onButtonsClick({ id :'btnSearch' }) }"
            />
            <v-checkbox
              :label="$t('상세컬럼')"
              v-model="searchParams.COLUMN_VISIBLE"
              true-value="Y"
              false-value="N"
              @change="handleColumn"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps1.gridViewOption"
            :keys="grdMainProps1.keys" 
            :fields="grdMainProps1.fields"
            :columns="grdMainProps1.columns"
            :column-layout="grdMainProps1.columnLayout"
            @onCellDblClicked ="cellDbClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
  <!-- 저장 화면 팝업 테스트 -->
  <SRMFA0010 ref="sRMFA0010" editor-id="sRMFA0020" @saved="sRMFA0010Saved" />
  <!-- 상세 화면 팝업 -->
  <SRMFA0020Popup01 ref="sRMFA0020Popup01" @saved="sRMFA0020Popup01Saved" />
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
    min-height: 700px;
  }
}

</style>
