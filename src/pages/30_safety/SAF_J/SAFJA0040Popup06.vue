<!--
  화면명 : 단기공사 현황 - 연간 총 공사일수 팝업
  화면개요 : 단기공사 현황의 연간 공사 현황 조회 팝업
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SAFJA0040Popup04 from '@/pages/30_safety/SAF_J/SAFJA0040Popup04.vue'

//****************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const deptPopup2 = ref(null)
const emit = defineEmits(['selected'])
const readonly = ref(true)
const isadmin = ref(false)

//코드리스트 셋팅
const codeList = ref({
  DIVISION : [],
  MORGN_NM: [],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VND_CD: '',                       // 협력회사코드
  VND_NM: '',                       // 협력회사명
  FROM_DT : '',                     // 기간 시작
  TO_DT : '',                       // 기간 종료
  TOT_PERIOD_YEAR1 : '',            // 연간 총 공사일수 (누적)
  TOT_PERIOD_YEAR2 : '',            // 연간 총 공사일수 (중복제외)
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: 'REQ_DEPT_NM',     dataType: 'text', width: '170', editable: false, header: { text: t('출입신청부서') }, styleName: 'left-column'},
    { fieldName: 'DEPT_NM',         dataType: 'text', width: '170', editable: false, header: { text: t('공사담당부서') }, styleName: 'left-column'},
    { fieldName: 'WRK_MNG_DEPT_NM', dataType: 'text', width: '170', editable: false, header: { text: t('공사관리부서') }, styleName: 'left-column'},
    { fieldName: 'WORK_DESC',       dataType: 'text', width: '150', editable: false, header: { text: t('공사명') },      styleName: 'left-column'},
    { fieldName: 'WORK_NO_INFO',    dataType: 'text', width: '160', editable: false, header: { text: t('공사번호') },    styleName: 'left-column'},
    { fieldName: 'REQ_DATE',        dataType: 'text', width: '100', editable: false, header: { text: t('신청일') },      styleName: 'center-column'},
    { fieldName: 'WORK_DT',         dataType: 'text', width: '180', editable: false, header: { text: t('공사기간') },    styleName: 'center-column'},
    { fieldName: 'TOT_PERIOD_YEAR', dataType: 'text', width: '50', editable: false,  header: { text: t('공사\n일수'),    styleName: "multiline-editor"},     styleName: 'right-column'},
    { fieldName: 'WORK_AREA',       dataType: 'text', width: '150', editable: false, header: { text: t('공사장소') },    styleName: 'left-column'},
    { fieldName: 'IN_PERSON_CNT',   dataType: 'text', width: '50', editable: false,  header: { text: t('출입\n인원'),    styleName: "multiline-editor"},     styleName: 'right-column'},
    { fieldName: 'STATUS_NAME',     dataType: 'text', width: '150', editable: false, header: { text: t('진행상태') },    styleName: 'left-column'},
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//****************************************세팅 영역(종료)***************************************************/

//****************************************오픈 팝업***************************************************/
const openPopup = (popupParam) => {

  // 팝업 데이터 초기화
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.VND_CD = popupParam.VEND_CD
  searchParams.VND_NM = popupParam.VND_NAME
  searchParams.FROM_DT = dayjs(popupParam.YEAR + "0101").format('YYYY-MM-DD')
  searchParams.TO_DT = dayjs(popupParam.YEAR + "1231").format('YYYY-MM-DD')

  searchParams.TOT_PERIOD_YEAR1 = popupParam.TOT_PERIOD_YEAR1 + '일'
  searchParams.TOT_PERIOD_YEAR2 = popupParam.TOT_PERIOD_YEAR2 + '일'
  
  // 관리자 조건 필요!!
  isadmin.value = false

  if (isadmin.value){
    readonly.value = false
  }else{
    readonly.value = true
  }
  
  // 팝업 오픈
  dialog.value = true

  onButtonsClick({id: 'btnSearch'})
}

//****************************************오픈 팝업(종료)***************************************************/

//****************************************이벤트 영역***************************************************/
//버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//추가 버튼 이벤트
const onAddButtonClick = () => {
  var row = grdMain.value.getGridView().getCheckedRows(true)
  if(row.length === 0) {
    Message.warn(t('추가할 데이터를 선택해 주세요.'))
    return
  }
  var checkedRowList= []
  for(let i = 0; i < row.length; i++){
    checkedRowList.push(grdMain.value.getDataProvider().getJsonRow(row[i]))
  }
  emit("selected", checkedRowList)
  onClose()
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

//****************************************이벤트 영역(종료)***************************************************/

//****************************************조회 영역***********************************************************/
//조회 전 유효성 검사
const beforeSearch = async () => {
  return true
}

//조회
const searchData = idx => {
  return commonSearchApi({ queryId : 'SAFJA0040_SEARCH_POP_01', param: searchParams })
}

//조회 후
const afterSearch = res => {
  console.log('res ', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//****************************************조회 영역(종료)***************************************************/

//단기공사 협력회사 조회 팝업 오픈
const openDeptPopup2 = () => {
  if (isadmin.value){
    deptPopup2.value.openPopup({
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      VND_NAME : searchParams.VND_NM,
    })
  }
}

const onDeptSelected2 = item => {
  searchParams.VND_NM = item.VND_NAME
  searchParams.VND_CD = item.VEND_CD
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    width="1600"
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
      <span>연간 단기공사 현황</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <!-- 조회조건 -->
          <v-sheet class="searchArea d-flex">

            <i-input
              :label="$t('협력회사')"
              v-model="searchParams.VND_NM"
              @update:modelValue="e => {searchParams.VND_CD = null}"
              class="mr-1"
              label-width="80px" 
              width="300px" 
              :readonly="readonly"
            />
            <i-input
              :label="$t('')" 
              v-model="searchParams.VND_CD"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup2()"
              @keydown.enter="e => {openDeptPopup2()}"
              label-width="0px" 
              width="120px"
              readonly
            />

            <i-input
              class="mr-0"
              :label="$t('공사기간')" 
              type="date" 
              v-model="searchParams.FROM_DT"
              label-width="60px" 
              width="230px" 
              :readonly="readonly"
            />
            <span class="d-flex align-center mx-3">~</span>
            <i-input
              :label="$t('')" 
              type="date" 
              v-model="searchParams.TO_DT"
              label-width="0px" 
              width="170px" 
              :readonly="readonly"
            />

            <i-input
              :label="$t('연간 총 공사일수 (누적)')"
              v-model="searchParams.TOT_PERIOD_YEAR1"
              class="mr-1"
              label-width="150px" 
              width="270px" 
              readonly
            />

            <i-input
              :label="$t('연간 총 공사일수 (중복 제외)')"
              v-model="searchParams.TOT_PERIOD_YEAR2"
              class="mr-1"
              label-width="160px" 
              width="270px" 
              readonly
            />

          </v-sheet>
          <!-- /조회조건 -->
          <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <IGridTitle>
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields" 
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <!-- /메인그리드 -->
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <!-- 협력회사 조회 -->
  <SAFJA0040Popup04
    ref="deptPopup2"
    @selected="onDeptSelected2"/> 

</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
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
</style>