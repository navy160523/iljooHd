<!--
  * 화면명 : 협력사 안전관리자 경력관리
  * 화면개요 : 협력사 안전관리자 개인정보 관리 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import img1 from '@images/pages/pose-fs-9.png'
import TAB01 from '@/pages/30_safety/SAF_I/TAB/SAFID0010_TAB01.vue'
import TAB02 from '@/pages/30_safety/SAF_I/TAB/SAFID0010_TAB02.vue'
import TAB03 from '@/pages/30_safety/SAF_I/TAB/SAFID0010_TAB03.vue'
import TAB04 from '@/pages/30_safety/SAF_I/TAB/SAFID0010_TAB04.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업

defineOptions({
  name:'30_safety-SAF_I-SAFID0010',
})

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const exPanVal = ref(0)
const grd1 = ref(null)
const tab = ref('tab01')
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const tab04 = ref(null)
const empPopup = ref(null)
const img = ref(img1)

/* 협력사 안전관리자 조회 조건 */
const searchParams1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  BSNS_CD: '',     // 사업부
  DEPT_CD: '',     // 소속부서
  CAREER_GBN: '',     // 근무기간
  HLD_OFFI_GBN: '', // 재직구분
  MANAGER_YN: '', // 안전관리자 대상
  COMPLETION: '', // 멘토링
})

/* 그리드에서 선택한 user정보 */
const userParams = reactive({
  CMPNY_DIV: '',
  EMP_NO: '',
  BSNS_NM: '',
  BSNS_CD: '',
  BIRTH_DAY: '',
  ENT_DATE: '',
  DEPT_NM: '',
  DEPT_CD: '',
  ASGN_NM: '',
  ASGN_CD: '',
  PART_NM: '',
  KOR_NM: '',
  TEL_NO: '',
  START_DATE: '',
  END_DATE: '',
})
 
/* 콤보박스 데이터 저장 */
const codeList = reactive({
  CMPNY_DIV: [{ CD:'HHI', NM: 'HD현대중공업' }],
  BSNS_CD: [],
  ALL_DEPT_CD: [],
  DEPT_CD: [],
  LICE_CNT: [],
  GRADE: [],
})

// 선택한 행 정보 담기
const selectEmp = reactive({
  EMP_NO: 'B12345',
  KOR_NM: '홍길동',
  BSNS_NM: 'HD현대중공업',
  DEPT_NM: '조선사업부',
  ASGN_NM: '현대기업',
  HND_PHN: '010-0000-0000',
})

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, width: '140', styleName: 'left-column' },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, editable: false, width: '140', styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('소속') }, editable: false, width: '140', styleName: 'left-column' },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, editable: false, width: '140', styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, width: '80' },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: '60' },
    { fieldName: 'SEX_GBN', dataType: 'text', header: { text: t('성별') }, editable: false, width: '60' },
    { fieldName: 'BIRTH_DAY', dataType: 'text', header: { text: t('생년월일(연령)') }, editable: false, width: '150',
      'styleCallback': function(grid, dataCell){
        var ret =  { style: { background:undefined } }
        if(grid.getValue(dataCell.index.itemIndex, 'AGE_INT') > 64) ret.style.background = '#fffa1ecf'
        
        return ret
      },
      'displayCallback': function (grid, index, value) {
        return value + ' (만 ' + grid.getValue(index.itemIndex, 'AGE_INT') + '세)'
      },
    },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false, width: '80' },
    { fieldName: 'START_DATE', dataType: 'text', header: { text: t('접수일') }, editable: false, width: '100'},
    { fieldName: 'END_DATE', dataType: 'text', header: { text: t('종료일') }, editable: false, width: '100' },
    { fieldName: 'CAREER', dataType: 'text', header: { text: t('경력(근무일수)') }, editable: false, width: '120',
      'styleCallback': function(grid, dataCell){
        var ret =  { style: { background:undefined } }
        if(grid.getValue(dataCell.index.itemIndex, 'CAREER') == null) return ret
        if(grid.getValue(dataCell.index.itemIndex, 'CAREER').indexOf('년') >= 0) {
          var year = grid.getValue(dataCell.index.itemIndex, 'CAREER').split('년')[0]
          if(year < 1) ret.style.background = '#71eb71'
          else if(year < 3) ret.style.background = '#ffc65e'
          else ret.style.background = '#e13030'          
        }

        return ret
      },
    },
    { fieldName: 'ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false, width: '100' },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, editable: false, width: '100' },
    { fieldName: 'GRADE', dataType: 'text', editable: true, header: { text: t('자격순위') }, lookupDisplay: true,  styleName: 'editable_column', editor: { type: 'dropdown' }, width: '80' },
    { fieldName: 'MONEY', dataType: 'text', header: { text: t('지원금') }, editable: false, width: '80' },
    { fieldName: 'LICE_NAME', dataType: 'text', header: { text: t('자격증 및 그 외 기준') }, editable: false, width: '200', styleName: 'left-column' },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('연락처') }, editable: false, width: '150' },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: true, width: '150', styleName: 'left-column editable_column' },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'AGE_INT', dataType: 'text', header: { text: t('AGE_INT') }, visible: false },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('협력사코드') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'CAREER_GBN', dataType: 'text', header: { text: t('CAREER_GBN') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('소속코드') }, visible: false },
    { fieldName: 'END_VAL', dataType: 'text', header: { text: t('END_VAL') }, visible: false },
    { fieldName: 'LICE_CNT', dataType: 'text', header: { text: t('LICE_CNT') }, visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('HLD_OFFI_GBN') }, visible: false },
    { fieldName: 'LICE_INFO', dataType: 'text', header: { text: t('LICE_INFO') }, visible: false },
    { fieldName: 'PART_CD', dataType: 'text', header: { text: t('부문코드') }, visible: false },
    { fieldName: 'REG_NO', dataType: 'text', header: { text: t('REG_NO') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('TEL_NO') }, visible: false },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

/* 사업부, 소속부서 콤보박스 데이터 가져오기 */
const getCode = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv } }), // 부서
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams1.BSNS_CD, USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'DATBA0010_SEARCH_COMMONCODE', param : { CMPNY_DIV: userStore.cmpnyDiv, ALL_SYS_CD: 'HHIZH60010', USE_FLAG:'Y' } }), // 부서
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.ALL_DEPT_CD = res[1].ORESULT_CUR
    codeList.GRADE = res[2].ORESULT_CUR
    
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD:'' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
    codeList.GRADE.unshift({ COD:'', TXT:'' }) //자격순위 공백 추가
    grd1.value.setBindingColumn('GRADE', codeList.GRADE, 'COD', 'TXT') 
  })
}

//조회 함수
const searchData = () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grd1])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 조회
const searchMainData = () => { 
  return commonSearchApi({ queryId : 'SAFID0010_SEARCH_01', param: searchParams1 })
}

//조회 후 반영
const afterMainSearch = res =>{
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams1,
    mgs: '[협력사안전관리자경력관리] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

/* 버튼 클릭 */
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    grd1.value.getDataProvider().setRows([])
    searchData()
  } else if (btn.id === 'btnCreate') {

    // 인원검색시 체크박스 활성화, 사내 협력사 Default
    let popupParam = {
      MULTI: true,
      USER_DIV: 'B',
    }
    empPopup.value.openPopup(popupParam)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grd1, row: 'check' }])
      .setGridList([grd1])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grd1, row: 'check' }])
      .setGridList([grd1])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}


// 저장 전
const beforeSave = () => {
  let checkedRows = grd1.value.getGridView().getCheckedRows(true)

  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))

    return false
  }

  return true
}
 
// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grd1.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'SAFID0010_SAVE_01', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  searchData()
  Message.success(t('성공적으로 저장되었습니다'))
}

/* ******************* 삭제 ******************** */
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grd1.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'SAFID0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  onButtonsClick({ id :'btnSearch' })
  Message.success(t('성공적으로 삭제되었습니다'))
}

/* 협력사 안전관리자 경력관리 그리드 셀 클릭 */
const onCellClicked = (grid, clickData) => {
  if(clickData.dataRow == null) return
  let data = grd1.value.getDataProvider().getJsonRow(clickData.dataRow)

  if(selectEmp.EMP_NO == data.EMP_NO) return

  selectEmp.EMP_NO = data.EMP_NO
  selectEmp.KOR_NM = data.KOR_NM
  selectEmp.BSNS_NM = data.BSNS_NM
  selectEmp.DEPT_NM = data.DEPT_NM
  selectEmp.ASGN_NM = data.ASGN_NM
  selectEmp.HND_PHN = data.HND_PHN
  
  userParams.CMPNY_DIV = data.CMPNY_DIV
  userParams.EMP_NO = data.EMP_NO
  userParams.BSNS_NM = data.BSNS_NM
  userParams.BSNS_CD = data.BSNS_CD
  userParams.BIRTH_DAY = data.BIRTH_DAY
  userParams.ENT_DATE = data.ENT_DATE
  userParams.DEPT_NM = data.DEPT_NM
  userParams.DEPT_CD = data.DEPT_CD
  userParams.ASGN_NM = data.ASGN_NM
  userParams.ASGN_CD = data.ASGN_CD
  userParams.PART_NM = data.PART_NM
  userParams.KOR_NM = data.KOR_NM
  userParams.TEL_NO = data.TEL_NO
  userParams.START_DATE = data.START_DATE
  userParams.END_DATE = data.END_DATE

  img.value = 'http://SCMS.HHIGROUP.KR/services/Common/LoadResources.aspx?EID=' + data.EMP_NO

  if(tab01.value != null) tab01.value.searchData(userParams)
  if(tab02.value != null) tab02.value.searchData(userParams)
  if(tab03.value != null) tab03.value.searchData(userParams)
  if(tab04.value != null) tab04.value.searchData(userParams)
}

// 협력사 직원 팝업에서 선택 시
// 2024-06-11 ILJOO_DUCHA 협력사 직원 멀티 선택으로 수정
const selectedemp = row => {
  if(!row){
    return
  }

  let selectData = {}

  grd1.value.getGridView().filterPanel.clearInput()
  for (let item of row) {
    selectData = {
      BSNS_NM: item.BSNS_NM,
      BSNS_CD: item.BSNS_CD,
      BIRTH_DAY: item.BIRTH_DAY,
      CMPNY_DIV: item.CMPNY_DIV,
      ENT_DATE: item.COM_ENT_DATE,
      DEPT_NM: item.DEPT_NM,
      DEPT_CD: item.DEPT_CD,
      ASGN_NM: item.ASGN_SHRT_NM,
      ASGN_CD: item.COMP_CD,
      KOR_NM: item.EMP_NM,
      EMP_NO: item.EMP_NO,
      TEL_NO: item.TEL_NO,
      AGE_INT: item.AGE,
    }
    grd1.value.addRow(selectData, false)
  }
}

onMounted(() => {
  getCode()
  grd1.value.getGridView().filterPanel.visible = true
})

/* 사업부 콤보박스 데이터 변화 */
watch(() => searchParams1.BSNS_CD, (newValue, oldValue) => {
  if(searchParams1.BSNS_CD === '') searchParams1.DEPT_CD = ''
  let bsnsNm = ''
  codeList.DEPT_CD = []
  
  for(let cd of codeList.BSNS_CD) {
    if(cd.BSNS_CD === newValue) {
      bsnsNm = cd.BSNS_NM
      break
    }
  }

  for(let cd of codeList.ALL_DEPT_CD) {
    if(bsnsNm === cd.BSNS_NM) codeList.DEPT_CD.push(cd)
  }
  codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
})

// 탭 레퍼런스가 할당될 때마다 searchData를 실행
watch([tab01], ([tab01Value]) => {
  if(userParams.CMPNY_DIV == '' && userParams.EMP_NO == '') return
  if(tab01Value == null) return
  tab01.value.searchData(userParams)
})

watch([tab02], ([tab02Value]) => {
  if(userParams.CMPNY_DIV == '' && userParams.EMP_NO == '') return
  if(tab02Value == null) return
  tab02.value.searchData(userParams)
})

watch([tab03], ([tab03Value]) => {
  if(userParams.CMPNY_DIV == '' && userParams.EMP_NO == '') return
  if(tab03Value == null) return
  tab03.value.searchData(userParams)
})

watch([tab04], ([tab04Value]) => {
  if(userParams.CMPNY_DIV == '' && userParams.EMP_NO == '') return
  if(tab04Value == null) return
  tab04.value.searchData(userParams)
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 상단 제목 및 버튼 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column mb-0">
          <div class="d-flex">
            <i-select
              v-model="searchParams1.CMPNY_DIV"
              :label="$t('회사구분')"
              :items="codeList.CMPNY_DIV"
              item-value="CD"
              item-title="NM" 
              width="250px"   
              disabled
            />
            <i-select
              v-model="searchParams1.BSNS_CD"
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              width="250px"  
            />
            <i-select
              v-model="searchParams1.DEPT_CD"
              :label="$t('소속부서')"
              :disabled="searchParams1.BSNS_CD === '' ? true : false"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="250px"  
            />
            <div class="legend ml-2 align-center d-flex">
              <div class="legend-65up mr-1"></div>
              <div> : 만 65세 이상</div>
              <div class="legend-1down mr-1 ml-3"></div>
              <div> : 경력 1년 이하</div>
              <div class="legend-1to3 mr-1 ml-3"></div>
              <div> : 경력 1년 ~ 3년</div>
              <div class="legend-3up mr-1 ml-3"></div>
              <div> : 경력 3년 이상</div>
            </div>
          </div>
          <div class="d-flex mt-2">
            <div class="mr-5 pt-1" style="margin-left: -15px">
              <ILabel :label="$t('근무기간(경력)')">
                <template #editor>
                  <VRadioGroup  
                    v-model="searchParams1.CAREER_GBN"
                    inline
                  >
                    <VRadio :label="$t('전체')" value="" />
                    <VRadio :label="$t('1년 미만')" value="A" />
                    <VRadio :label="$t('1년 ~ 3년')" value="B" />
                    <VRadio :label="$t('3년 이상')" value="C" />
                  </VRadioGroup>
                </template>
              </ILabel>
            </div>
            <div class="mr-5 pt-1">
              <ILabel :label="$t('재직구분')">
                <template #editor>
                  <VRadioGroup  
                    v-model="searchParams1.HLD_OFFI_GBN"
                    inline
                  >
                    <VRadio :label="$t('전체')" value="" />
                    <VRadio :label="$t('재직')" value="1" />
                    <VRadio :label="$t('퇴직')" value="3" />
                  </VRadioGroup>
                </template>
              </ILabel>
            </div>
            <div class="mr-5 pt-1">
              <ILabel :label="$t('안전관리자')">
                <template #editor>
                  <VRadioGroup  
                    v-model="searchParams1.MANAGER_YN"
                    inline
                  >
                    <VRadio :label="$t('전체')" value="" />
                    <VRadio :label="$t('대상')" value="Y" />
                    <VRadio :label="$t('미대상')" value="N" />
                  </VRadioGroup>
                </template>
              </ILabel>
            </div>
            <div class="mr-5 pt-1">
              <ILabel :label="$t('멘토링')">
                <template #editor>
                  <VRadioGroup  
                    v-model="searchParams1.COMPLETION"
                    inline
                  >
                    <VRadio :label="$t('전체')" value="" />
                    <VRadio :label="$t('이수')" value="Y" />
                    <VRadio :label="$t('미이수')" value="N" />
                  </VRadioGroup>
                </template>
              </ILabel>
            </div>
          </div>
        </v-sheet>
       
        <div class="h-grow">
          <v-sheet class="h-auto mr-2" width="30%">
            <RealGrid
              ref="grd1"
              class="mt-2"
              :style="{ height: exPanVal === 0 ? '40%' : '100%' }"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              @on-cell-clicked="onCellClicked"
            /> 
            <VExpansionPanels
              v-model="exPanVal"
              class="mt-2"
            >
              <VExpansionPanel elevation="0">
                <VExpansionPanelTitle
                  class="font-weight-bold"
                  color="base"
                >
                  {{ t('사내협력사 안전관리자') }}
                </VExpansionPanelTitle>
                <VExpansionPanelText>
                  <div class="d-flex">
                    <VCard style="text-align: center;" class="profile mt-4 mr-2">
                      <v-card-title class="name title">{{ selectEmp.KOR_NM }}({{ selectEmp.EMP_NO }})</v-card-title>
                      <VImg height="20vh" :src="img" />
                      <v-divider class="mt-1"></v-divider>
                      <v-card-item class="pa-1 ma-1 sub">{{ selectEmp.BSNS_NM }} {{ selectEmp.DEPT_NM }}</v-card-item>
                      <v-divider></v-divider>
                      <v-card-item class="pa-1 ma-1 sub">{{ selectEmp.ASGN_NM }}</v-card-item>
                      <v-divider></v-divider>
                      <v-card-item class="pa-1 ma-1 sub">{{ selectEmp.HND_PHN }}</v-card-item>
                      <v-divider></v-divider>
                    </VCard>
                    <!-- 탭 화면 -->
                    <div class="tabGrid">
                      <v-sheet class="mb-2 h-auto">
                        <!-- 탭 -->
                        <VTabs 
                          v-model="tab"
                        >
                          <VTab value="tab01"> 
                            경력관리 
                          </VTab>
                          <VTab value="tab02">
                            자격증관리
                          </VTab>
                          <VTab value="tab03">
                            포상관리
                          </VTab>
                          <VTab value="tab04">
                            멘토링 교육
                          </VTab>
                        </VTabs>
                      </v-sheet>
                      <VWindow 
                        v-model="tab" 
                        class="pa-0"
                      >
                        <VWindowItem value="tab01">
                          <TAB01 ref="tab01" />
                        </VWindowItem>
                        <VWindowItem value="tab02">
                          <TAB02 ref="tab02" />
                        </VWindowItem>
                        <VWindowItem value="tab03">
                          <TAB03 ref="tab03" />
                        </VWindowItem>
                        <VWindowItem value="tab04">
                          <TAB04 ref="tab04" />
                        </VWindowItem>
                      </VWindow> 
                    </div>
                  </div>
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </v-sheet>
        </div>
      </div>
      <EmpPopup 
        ref="empPopup" 
        @selected="selectedemp"
      />
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
    min-height: 700px;
  }
}

.profile {
  width: 20%;
  background: rgb(244, 244, 244);
  .title {
    font-size: 1.5rem;
    font-weight: bold;
  }
  .sub {
    font-size: 1rem;
  }
}

.tabGrid {
  width: 80%;
}


.legend {
  font-size: 14px;
  margin-left: auto !important;
}
.legend-65up {
  width: 40px;
  height: 25px;
  background-color: #fffa1ecf;
}
.legend-1down {
  width: 40px;
  height: 25px;
  background-color: #71eb71;
}
.legend-1to3 {
  width: 40px;
  height: 25px;
  background-color: #ffc65e;
}
.legend-3up {
  width: 40px;
  height: 25px;
  background-color: #e13030;
}
</style>
